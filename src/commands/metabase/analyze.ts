import fs from "node:fs";
import path from "node:path";
import pc from "picocolors";
import {
  loadMetabaseConfig,
  createMetabaseClient,
  MetabaseApiError,
  type MetabaseClient,
  type MetabaseCard,
  type MetabaseCollectionTreeNode,
  type MetabaseDatabaseMeta,
  type MetabaseTableMeta,
  type MetabaseFieldMeta,
  type MetabaseDashboardDetail,
  type MetabasePermissionGroup,
  type MetabasePermissionsGraph,
  type MetabaseDashboardSummary,
} from "../../lib/metabase/index.js";
import { ensureBonDir } from "../../lib/local/datasources.js";

const OUTPUT_FILE = ".bon/metabase-analysis.md";
const TOP_CARDS_LIMIT = 50;
const TOP_DASHBOARDS_LIMIT = 10;

interface AnalyzeOptions {
  output?: string;
  topCards?: string;
}

// ── Field classification ──

type FieldClass = "dimension" | "measure" | "time" | "other";

function classifyField(field: MetabaseFieldMeta): FieldClass {
  const bt = field.base_type || "";
  const st = field.semantic_type || "";

  // Time dimensions
  if (
    bt.includes("Date") ||
    bt.includes("Time") ||
    st.includes("Timestamp") ||
    st === "type/DateTime" ||
    st === "type/Date" ||
    st === "type/Time"
  ) {
    return "time";
  }

  // Explicit measure semantic types
  if (["type/Currency", "type/Percentage", "type/Quantity", "type/Score"].includes(st)) {
    return "measure";
  }

  // PKs and FKs are dimensions
  if (st === "type/PK" || st === "type/FK") {
    return "dimension";
  }

  // Explicit dimension semantic types
  if (
    [
      "type/Category", "type/Source", "type/City", "type/Country",
      "type/State", "type/Name", "type/Title", "type/Email", "type/URL",
      "type/ZipCode",
    ].includes(st)
  ) {
    return "dimension";
  }

  // Numeric without semantic type - likely measure
  if (
    bt.includes("Integer") || bt.includes("Float") ||
    bt.includes("Decimal") || bt.includes("Number") || bt.includes("BigInteger")
  ) {
    // Low cardinality numeric = dimension (e.g., status codes)
    const distinct = field.fingerprint?.global?.["distinct-count"];
    if (distinct !== undefined && distinct < 20) {
      return "dimension";
    }
    return "measure";
  }

  // Text/String = dimension
  if (bt.includes("Text") || bt.includes("String")) {
    return "dimension";
  }

  // Boolean = dimension
  if (bt.includes("Boolean")) {
    return "dimension";
  }

  return "other";
}

// ── SQL extraction ──

function extractSQL(card: MetabaseCard): string | null {
  const dq = card.dataset_query;

  // Legacy native
  if (dq.type === "native" && dq.native?.query) {
    return dq.native.query;
  }
  // pMBQL native
  if (dq.stages?.[0]?.["lib/type"] === "mbql.stage/native" && typeof dq.stages[0].native === "string") {
    return dq.stages[0].native;
  }
  return null;
}

/**
 * Returns true if the card uses MBQL (query builder) rather than native SQL.
 */
function isMbqlCard(card: MetabaseCard): boolean {
  const dq = card.dataset_query;
  if (dq.type === "query") return true;
  if (dq.stages?.[0]?.["lib/type"] === "mbql.stage/mbql") return true;
  return false;
}

// ── Table reference extraction from SQL ──

/**
 * Extracts table references from SQL (FROM and JOIN clauses).
 * Returns a map of table name -> reference count.
 * Excludes CTE names so only real tables are counted.
 */
function extractTableReferences(sql: string): Map<string, number> {
  const refs = new Map<string, number>();

  // Extract CTE names to exclude them
  const cteNames = new Set<string>();
  const ctePattern = /\bWITH\b[\s\S]*?(?=\bSELECT\b(?![\s\S]*\bWITH\b))/gi;
  const cteMatch = sql.match(ctePattern);
  if (cteMatch) {
    const cteDefPattern = /\b(\w+)\s+AS\s*\(/gi;
    for (const block of cteMatch) {
      let m: RegExpExecArray | null;
      while ((m = cteDefPattern.exec(block)) !== null) {
        cteNames.add(m[1].toLowerCase());
      }
    }
  }

  // Match FROM and JOIN table references
  const tableRefPattern = /(?:FROM|JOIN)\s+("?\w+"?\s*\.\s*"?\w+"?|"?\w+"?)(?:\s+(?:AS\s+)?\w+)?/gi;
  let match: RegExpExecArray | null;
  while ((match = tableRefPattern.exec(sql)) !== null) {
    let tableName = match[1].replace(/"/g, "").replace(/\s/g, "").toLowerCase();
    const baseName = tableName.includes(".") ? tableName.split(".").pop()! : tableName;
    if (cteNames.has(baseName)) continue;
    if ([
      "select", "where", "group", "order", "having", "limit", "union", "values",
      "set", "update", "insert", "delete", "into", "table", "create", "alter",
      "drop", "index", "view", "as", "on", "and", "or", "not", "in", "is",
      "null", "true", "false", "case", "when", "then", "else", "end", "with",
      "the", "lateral", "generate_series", "unnest",
    ].includes(baseName)) continue;

    if (!refs.has(tableName)) refs.set(tableName, 0);
    refs.set(tableName, refs.get(tableName)! + 1);
  }

  return refs;
}

// ── Card pattern classification ──

type CardPattern = "analytical" | "lookup" | "display" | "unknown";

/**
 * Classifies a card's SQL pattern:
 * - analytical: GROUP BY + aggregation (core semantic layer candidates)
 * - lookup: Single-row lookup (WHERE email={{x}}, no GROUP BY) — CRM/operational
 * - display: UNION-based formatting/layout without aggregation
 * - unknown: non-native or unclassifiable
 */
function classifyCardPattern(card: MetabaseCard, sqlOverride?: string | null): CardPattern {
  const sql = sqlOverride ?? extractSQL(card);
  if (!sql) return "unknown";

  const upper = sql.toUpperCase();
  const hasGroupBy = /\bGROUP\s+BY\b/.test(upper);
  const hasAgg = /\b(COUNT|SUM|AVG|MIN|MAX|PERCENTILE)\s*\(/.test(upper);
  const hasUnion = /\bUNION\b/.test(upper);
  const hasTemplateVar = /\{\{[^}]+\}\}/.test(sql);
  const hasLookupVar = /\{\{(email|primary_mail|user|customer|name|phone|id)\}\}/i.test(sql);

  if (hasGroupBy && hasAgg) return "analytical";
  if (hasLookupVar && !hasGroupBy && !hasAgg) return "lookup";
  if (hasUnion && !hasGroupBy && !hasAgg) return "display";
  if (hasAgg && !hasGroupBy) return "analytical";
  if (hasTemplateVar && hasAgg) return "analytical";

  return "unknown";
}

// ── Template variable extraction ──

/**
 * Extracts Metabase template variable names ({{var}}) from SQL.
 */
function extractTemplateVars(sql: string): Set<string> {
  const vars = new Set<string>();
  const pattern = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(sql)) !== null) {
    vars.add(m[1].toLowerCase());
  }
  return vars;
}

// ── Activity scoring ──

const INACTIVE_MONTHS = 3;

function isCardActive(card: MetabaseCard): boolean {
  if (!card.last_used_at) return false;
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - INACTIVE_MONTHS);
  return new Date(card.last_used_at) >= cutoff;
}

/**
 * Score that weights view_count by recency.
 * Active cards (used in last 3 months) keep full view_count.
 * Inactive cards are penalized by 90%.
 */
function activityScore(card: MetabaseCard): number {
  const views = card.view_count || 0;
  return isCardActive(card) ? views : Math.round(views * 0.1);
}

function formatLastUsed(card: MetabaseCard): string {
  if (!card.last_used_at) return "never";
  const d = new Date(card.last_used_at);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 30) return `${diffDays}d ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

// ── Card type detection ──

function getCardType(card: MetabaseCard): "model" | "metric" | "question" {
  if (card.type === "model" || card.dataset) return "model";
  if (card.type === "metric") return "metric";
  return "question";
}

// ── Schema access from permissions graph ──

interface SchemaAccess {
  schema: string;
  groups: string[]; // group names that can query this schema
}

function extractSchemaAccess(
  graph: MetabasePermissionsGraph,
  groups: MetabasePermissionGroup[],
  dbId: number,
): SchemaAccess[] {
  const groupMap = new Map(groups.map((g) => [String(g.id), g.name]));
  const schemaAccessMap = new Map<string, string[]>();

  for (const [groupId, dbPerms] of Object.entries(graph.groups)) {
    const groupName = groupMap.get(groupId) || `Group ${groupId}`;
    const perms = dbPerms[String(dbId)] as Record<string, unknown> | undefined;
    if (!perms) continue;

    const createQueries = perms["create-queries"] as Record<string, string> | string | undefined;
    if (!createQueries) continue;

    if (typeof createQueries === "string") {
      // Database-level permission like "query-builder-and-native"
      if (createQueries !== "no") {
        // Has access to all schemas — mark as "*"
        if (!schemaAccessMap.has("*")) schemaAccessMap.set("*", []);
        schemaAccessMap.get("*")!.push(groupName);
      }
      continue;
    }

    // Per-schema permissions
    for (const [schema, perm] of Object.entries(createQueries)) {
      if (perm !== "no") {
        if (!schemaAccessMap.has(schema)) schemaAccessMap.set(schema, []);
        schemaAccessMap.get(schema)!.push(groupName);
      }
    }
  }

  return Array.from(schemaAccessMap.entries())
    .map(([schema, grps]) => ({ schema, groups: grps }))
    .sort((a, b) => a.schema.localeCompare(b.schema));
}

/**
 * Returns the set of schemas accessible to non-admin groups for a given database.
 * Returns null if a non-admin group has wildcard access (all schemas are user-facing),
 * or if no explicit schema permissions are found.
 */
function getUserFacingSchemas(
  graph: MetabasePermissionsGraph,
  groups: MetabasePermissionGroup[],
  dbId: number,
): Set<string> | null {
  const adminGroupIds = new Set(
    groups.filter((g) => g.name === "Administrators").map((g) => String(g.id)),
  );
  const schemas = new Set<string>();

  for (const [groupId, dbPerms] of Object.entries(graph.groups)) {
    if (adminGroupIds.has(groupId)) continue;

    const perms = dbPerms[String(dbId)] as Record<string, unknown> | undefined;
    if (!perms) continue;

    const createQueries = perms["create-queries"] as Record<string, string> | string | undefined;
    if (!createQueries) continue;

    if (typeof createQueries === "string") {
      if (createQueries !== "no") return null; // non-admin has wildcard access
      continue;
    }

    for (const [schema, perm] of Object.entries(createQueries)) {
      if (perm !== "no") schemas.add(schema);
    }
  }

  return schemas.size > 0 ? schemas : null;
}

// ── Collection tree helpers ──

function flattenCollections(
  nodes: MetabaseCollectionTreeNode[],
  parentPath: string = "",
): Array<{ id: number; path: string }> {
  const result: Array<{ id: number; path: string }> = [];
  for (const node of nodes) {
    if (node.personal_owner_id !== null) continue;
    const p = parentPath ? `${parentPath}/${node.name}` : node.name;
    result.push({ id: node.id, path: p });
    if (node.children.length > 0) {
      result.push(...flattenCollections(node.children, p));
    }
  }
  return result;
}

const MAX_TREE_DEPTH = 2;

function renderTree(
  nodes: MetabaseCollectionTreeNode[],
  indent: number = 0,
): string {
  let out = "";
  for (const node of nodes) {
    if (node.personal_owner_id !== null) continue;
    const prefix = "  ".repeat(indent);
    const icon = node.children.length > 0 ? "+" : "-";
    out += `${prefix}${icon} ${node.name} (${node.id})\n`;
    if (node.children.length > 0 && indent < MAX_TREE_DEPTH - 1) {
      out += renderTree(node.children, indent + 1);
    } else if (node.children.length > 0) {
      const childCount = node.children.filter((c) => c.personal_owner_id === null).length;
      if (childCount > 0) {
        out += `${prefix}  ... ${childCount} sub-collections\n`;
      }
    }
  }
  return out;
}

// ── Dashboard parameter aggregation ──

interface ParamSummary {
  name: string;
  type: string;
  slug: string;
  dashboardCount: number;
  dashboards: string[];
}

function aggregateParameters(
  dashboards: MetabaseDashboardDetail[],
): ParamSummary[] {
  const paramMap = new Map<string, ParamSummary>();

  for (const d of dashboards) {
    for (const p of d.parameters) {
      const key = `${p.type}:${p.slug}`;
      if (!paramMap.has(key)) {
        paramMap.set(key, {
          name: p.name,
          type: p.type,
          slug: p.slug,
          dashboardCount: 0,
          dashboards: [],
        });
      }
      const entry = paramMap.get(key)!;
      entry.dashboardCount++;
      entry.dashboards.push(d.name);
    }
  }

  return Array.from(paramMap.values()).sort((a, b) => b.dashboardCount - a.dashboardCount);
}

// ── Table summary ──

interface TableSummary {
  id: number;
  name: string;
  schema: string;
  description: string | null;
  fieldCount: number;
  dimensions: number;
  measures: number;
  timeDimensions: number;
  hasDescription: boolean;
}

function summarizeTable(table: MetabaseTableMeta): TableSummary {
  let dimensions = 0, measures = 0, timeDimensions = 0;
  for (const f of table.fields) {
    if (f.visibility_type === "hidden" || f.visibility_type === "retired") continue;
    const cls = classifyField(f);
    if (cls === "dimension") dimensions++;
    else if (cls === "measure") measures++;
    else if (cls === "time") timeDimensions++;
  }
  return {
    id: table.id,
    name: table.name,
    schema: table.schema,
    description: table.description,
    fieldCount: table.fields.length,
    dimensions,
    measures,
    timeDimensions,
    hasDescription: !!table.description,
  };
}

// ── Report generation ──

function buildReport(data: {
  instanceUrl: string;
  user: { name: string; email: string; admin: boolean };
  databases: MetabaseDatabaseMeta[];
  cards: MetabaseCard[];
  dashboardList: MetabaseDashboardSummary[];
  dashboardDetails: MetabaseDashboardDetail[];
  collectionTree: MetabaseCollectionTreeNode[];
  collectionMap: Map<number, string>;
  permissionGroups: MetabasePermissionGroup[] | null;
  permissionsGraph: MetabasePermissionsGraph | null;
  topCardsLimit: number;
  convertedSqlMap: Map<number, string>;
}): string {
  const {
    instanceUrl, user, databases, cards, dashboardList,
    dashboardDetails, collectionTree, collectionMap,
    permissionGroups, permissionsGraph, topCardsLimit,
    convertedSqlMap,
  } = data;

  /** Get SQL for a card — native extraction first, then converted MBQL fallback. */
  function getCardSQL(card: MetabaseCard): string | null {
    return extractSQL(card) || convertedSqlMap.get(card.id) || null;
  }

  const activeCards = cards.filter((c) => !c.archived);
  const activeDashboards = dashboardList.filter((d) => !d.archived);
  const models = activeCards.filter((c) => getCardType(c) === "model");
  const metrics = activeCards.filter((c) => getCardType(c) === "metric");
  const questions = activeCards.filter((c) => getCardType(c) === "question");

  const sorted = [...activeCards].sort((a, b) => activityScore(b) - activityScore(a));
  const topCards = sorted.slice(0, topCardsLimit);
  const activeCount = activeCards.filter(isCardActive).length;
  const inactiveCount = activeCards.length - activeCount;

  // Determine user-facing schemas per database
  const userFacingSchemasMap = new Map<number, Set<string> | null>();
  if (permissionGroups && permissionsGraph) {
    for (const db of databases) {
      userFacingSchemasMap.set(db.id, getUserFacingSchemas(permissionsGraph, permissionGroups, db.id));
    }
  }

  let report = "";

  // ── Header ──

  report += `# Metabase Analysis Report\n\n`;
  report += `Generated: ${new Date().toISOString().split("T")[0]}\n`;
  report += `Instance: ${instanceUrl}\n`;
  report += `User: ${user.name} (${user.email})\n\n`;

  // ── How to Use This Report ──

  report += `## How to Use This Report\n\n`;
  report += `This report maps your Metabase instance to inform semantic layer design:\n\n`;
  report += `1. **Most Referenced Tables** → Create cubes for these tables first\n`;
  report += `2. **Top Cards by Activity** → Replicate aggregations (GROUP BY + SUM/COUNT/AVG) as cube measures\n`;
  report += `3. **Common Filter Variables** → Ensure these are dimensions on relevant cubes\n`;
  report += `4. **Foreign Key Relationships** → Define joins between cubes\n`;
  report += `5. **Collection Structure** → Map collections to views (one view per business domain)\n`;
  report += `6. **Table Inventory** → Use field classification (dims/measures/time) to build each cube\n\n`;
  report += `Drill deeper with:\n`;
  report += `- \`bon metabase explore table <id-or-name>\` — field types and classification\n`;
  report += `- \`bon metabase explore card <id-or-name>\` — SQL and columns\n`;
  report += `- \`bon metabase explore collection <id-or-name>\` — cards in a collection\n`;
  report += `- \`bon metabase explore database <id-or-name>\` — schemas and tables\n\n`;

  // ── Summary ──

  report += `## Summary\n\n`;
  report += `| Metric | Count |\n|--------|-------|\n`;
  report += `| Databases | ${databases.length} |\n`;
  for (const db of databases) {
    const visibleTables = db.tables.filter(
      (t) => t.visibility_type !== "hidden" && t.visibility_type !== "retired",
    );
    report += `| Tables (${db.name}) | ${visibleTables.length} |\n`;
  }
  report += `| Models | ${models.length} |\n`;
  report += `| Metrics | ${metrics.length} |\n`;
  report += `| Questions | ${questions.length} |\n`;
  report += `| Dashboards | ${activeDashboards.length} |\n`;
  report += `| Collections | ${collectionMap.size} |\n`;
  report += `| Active cards (used in last ${INACTIVE_MONTHS}mo) | ${activeCount} |\n`;
  report += `| Inactive cards | ${inactiveCount} |\n`;
  report += `\n`;

  // ── Schema Access ──

  if (permissionGroups && permissionsGraph) {
    report += `## Schema Access\n\n`;
    report += `Schemas accessible to non-admin groups are user-facing and should be prioritized for modeling.\n\n`;

    for (const db of databases) {
      const access = extractSchemaAccess(permissionsGraph, permissionGroups, db.id);

      report += `### ${db.name} (${db.engine})\n\n`;
      report += `| Schema | Accessible To |\n|--------|---------------|\n`;
      for (const a of access) {
        report += `| ${a.schema} | ${a.groups.join(", ")} |\n`;
      }
      report += `\n`;
    }

    report += `### Permission Groups\n\n`;
    report += `| Group | Members |\n|-------|---------|\n`;
    for (const g of permissionGroups) {
      report += `| ${g.name} | ${g.member_count} |\n`;
    }
    report += `\n`;
  }

  // ── Collection Structure ──

  report += `## Collection Structure (Business Domains)\n\n`;
  report += `Collections represent how users organize content by business area.\n`;
  report += `Map these to views in the semantic layer.\n\n`;
  report += "```\n";
  const filtered = collectionTree.filter((n) => n.personal_owner_id === null);
  report += renderTree(filtered);
  report += "```\n\n";

  // ── Top Cards by Activity ──

  report += `## Top ${topCards.length} Cards by Activity\n\n`;
  report += `Ranked by view count, weighted by recency. Cards not used in the last ${INACTIVE_MONTHS} months are penalized 90%.\n`;
  report += `Use \`bon metabase explore card <id-or-name>\` to view SQL and column details for any card.\n\n`;
  report += `| Rank | ID | Views | Last Used | Active | Pattern | Type | Display | Collection | Name |\n`;
  report += `|------|----|-------|-----------|--------|---------|------|---------|------------|------|\n`;

  for (let i = 0; i < topCards.length; i++) {
    const c = topCards[i];
    const ct = getCardType(c);
    const col = c.collection_id ? (collectionMap.get(c.collection_id) || "?") : "Root";
    const active = isCardActive(c) ? "Yes" : "No";
    const lastUsed = formatLastUsed(c);
    const pattern = classifyCardPattern(c, getCardSQL(c));
    report += `| ${i + 1} | ${c.id} | ${c.view_count || 0} | ${lastUsed} | ${active} | ${pattern} | ${ct} | ${c.display} | ${col} | ${c.name} |\n`;
  }
  report += `\n`;

  // ── Dashboard Parameters ──

  if (dashboardDetails.length > 0) {
    const params = aggregateParameters(dashboardDetails);

    report += `## Dashboard Filter Parameters\n\n`;
    report += `Parameters used across dashboards. These represent the most important filter dimensions.\n\n`;

    if (params.length > 0) {
      report += `| Parameter | Type | Used In (dashboards) | Dashboard Names |\n`;
      report += `|-----------|------|----------------------|-----------------|\n`;
      for (const p of params) {
        const names = p.dashboards.slice(0, 3).join(", ");
        const more = p.dashboards.length > 3 ? ` +${p.dashboards.length - 3} more` : "";
        report += `| ${p.name} | ${p.type} | ${p.dashboardCount} | ${names}${more} |\n`;
      }
      report += `\n`;
    } else {
      report += `No parameters found across analyzed dashboards.\n\n`;
    }
  }

  // ── Template Variables (from SQL) ──

  const templateVarCounts = new Map<string, number>();
  for (const c of activeCards) {
    const sql = getCardSQL(c);
    if (!sql) continue;
    const vars = extractTemplateVars(sql);
    for (const v of vars) {
      templateVarCounts.set(v, (templateVarCounts.get(v) || 0) + 1);
    }
  }

  if (templateVarCounts.size > 0) {
    const sortedVars = Array.from(templateVarCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .filter(([, count]) => count >= 3);
    if (sortedVars.length > 0) {
      const totalVars = templateVarCounts.size;
      report += `## Common Filter Variables (from SQL)\n\n`;
      report += `Template variables (\`{{var}}\`) used in 3+ cards. These represent key filter dimensions.\n`;
      report += `${totalVars} unique variables found; showing ${sortedVars.length} most common.\n\n`;
      report += `| Variable | Used In (cards) |\n|----------|-----------------|\n`;
      for (const [varName, count] of sortedVars) {
        report += `| ${varName} | ${count} |\n`;
      }
      report += `\n`;
    }
  }

  // ── Most Referenced Tables (from SQL) ──

  const globalTableRefs = new Map<string, number>();
  for (const c of activeCards) {
    const sql = getCardSQL(c);
    if (!sql) continue;
    const refs = extractTableReferences(sql);
    for (const [table, count] of refs) {
      globalTableRefs.set(table, (globalTableRefs.get(table) || 0) + count);
    }
  }

  if (globalTableRefs.size > 0) {
    const sortedRefs = Array.from(globalTableRefs.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);
    report += `## Most Referenced Tables (from SQL)\n\n`;
    report += `Tables most frequently referenced in FROM/JOIN clauses across all cards.\n\n`;
    // Build lookup from SQL table name → Metabase table ID
    const tableIdByRef = new Map<string, number>();
    for (const db of databases) {
      for (const t of db.tables) {
        const qualified = `${t.schema}.${t.name}`.toLowerCase();
        const unqualified = t.name.toLowerCase();
        if (!tableIdByRef.has(qualified)) tableIdByRef.set(qualified, t.id);
        if (!tableIdByRef.has(unqualified)) tableIdByRef.set(unqualified, t.id);
      }
    }

    report += `| ID | Table | References |\n|------|-------|------------|\n`;
    for (const [table, count] of sortedRefs) {
      const tid = tableIdByRef.get(table);
      report += `| ${tid ?? "—"} | ${table} | ${count} |\n`;
    }
    report += `\n`;
  }

  // ── Foreign Key Relationships ──

  // Build field ID → schema.table.field lookup
  const fieldIdLookup = new Map<number, { schema: string; table: string; field: string }>();
  for (const db of databases) {
    for (const t of db.tables) {
      for (const f of t.fields) {
        fieldIdLookup.set(f.id, { schema: t.schema, table: t.name, field: f.name });
      }
    }
  }

  // Extract FK relationships
  const fkRelationships: Array<{
    fromSchema: string; fromTable: string; fromField: string;
    toSchema: string; toTable: string; toField: string;
  }> = [];
  for (const db of databases) {
    const userFacingSchemas = userFacingSchemasMap.get(db.id) ?? null;
    for (const t of db.tables) {
      // Only include FKs involving user-facing schemas
      if (userFacingSchemas !== null && !userFacingSchemas.has(t.schema)) continue;
      for (const f of t.fields) {
        if (!f.fk_target_field_id) continue;
        const target = fieldIdLookup.get(f.fk_target_field_id);
        if (!target) continue;
        // Skip if target is in a non-user-facing schema
        if (userFacingSchemas !== null && !userFacingSchemas.has(target.schema)) continue;
        fkRelationships.push({
          fromSchema: t.schema, fromTable: t.name, fromField: f.name,
          toSchema: target.schema, toTable: target.table, toField: target.field,
        });
      }
    }
  }

  if (fkRelationships.length > 0) {
    // Only show FKs where at least one side is referenced by cards
    const referencedFKs = fkRelationships.filter((fk) => {
      const fromKey = `${fk.fromSchema}.${fk.fromTable}`.toLowerCase();
      const toKey = `${fk.toSchema}.${fk.toTable}`.toLowerCase();
      return globalTableRefs.has(fromKey) || globalTableRefs.has(toKey);
    });

    if (referencedFKs.length > 0) {
      report += `## Foreign Key Relationships\n\n`;
      report += `FK relationships involving tables referenced by cards. Use these to define cube joins.\n`;
      if (referencedFKs.length < fkRelationships.length) {
        report += `${fkRelationships.length - referencedFKs.length} unreferenced FKs omitted.\n`;
      }
      report += `\n`;
      report += `| From | Field | To | Field |\n`;
      report += `|------|-------|----|-------|\n`;
      for (const fk of referencedFKs) {
        const from = fk.fromSchema === fk.toSchema ? fk.fromTable : `${fk.fromSchema}.${fk.fromTable}`;
        const to = fk.fromSchema === fk.toSchema ? fk.toTable : `${fk.toSchema}.${fk.toTable}`;
        report += `| ${from} | ${fk.fromField} | ${to} | ${fk.toField} |\n`;
      }
      report += `\n`;
    }
  }

  // ── Table Inventory (user-facing schemas only, skip staging/intermediate) ──

  report += `## Table Inventory\n\n`;

  const hasPermissions = permissionGroups && permissionsGraph;
  if (hasPermissions) {
    report += `Showing tables from user-facing schemas only (accessible to non-admin groups).\n`;
    report += `Staging (\`stg_\`) and intermediate (\`int_\`) tables are excluded.\n`;
  } else {
    report += `Permissions data unavailable — showing all schemas.\n`;
    report += `Staging (\`stg_\`) and intermediate (\`int_\`) tables are excluded.\n`;
  }
  report += `Use \`bon metabase explore databases\` for full database details.\n\n`;
  report += `Field classification: **Dims** = categorical/text/PKs/FKs, **Measures** = numeric, **Time** = date/datetime\n\n`;

  let skippedSchemas = 0;
  let skippedTables = 0;

  for (const db of databases) {
    const userFacingSchemas = userFacingSchemasMap.get(db.id) ?? null;

    // Group tables by schema
    const bySchema = new Map<string, MetabaseTableMeta[]>();
    for (const t of db.tables) {
      if (t.visibility_type === "hidden" || t.visibility_type === "retired") continue;
      if (!bySchema.has(t.schema)) bySchema.set(t.schema, []);
      bySchema.get(t.schema)!.push(t);
    }

    for (const [schema, tables] of Array.from(bySchema.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
      // Filter to user-facing schemas if permissions data available
      if (userFacingSchemas !== null && !userFacingSchemas.has(schema)) {
        skippedSchemas++;
        skippedTables += tables.length;
        continue;
      }

      // Filter out staging and intermediate tables
      const filteredTables = tables.filter(
        (t) => !t.name.startsWith("stg_") && !t.name.startsWith("int_"),
      );
      skippedTables += tables.length - filteredTables.length;

      if (filteredTables.length === 0) continue;

      // Compute ref counts and sort by refs descending
      const summaries = filteredTables.map((t) => {
        const s = summarizeTable(t);
        const refKey1 = `${s.schema}.${s.name}`.toLowerCase();
        const refKey2 = s.name.toLowerCase();
        const refCount = globalTableRefs.get(refKey1) || globalTableRefs.get(refKey2) || 0;
        return { ...s, refCount };
      }).sort((a, b) => b.refCount - a.refCount || a.name.localeCompare(b.name));

      // Skip schemas where no table is referenced by any card
      const schemaHasRefs = summaries.some((s) => s.refCount > 0);
      if (!schemaHasRefs) {
        skippedSchemas++;
        skippedTables += filteredTables.length;
        continue;
      }

      // Only show referenced tables; summarize the rest
      const referenced = summaries.filter((s) => s.refCount > 0);
      const unreferenced = summaries.length - referenced.length;

      report += `### ${db.name} / ${schema} (${referenced.length} referenced`;
      if (unreferenced > 0) report += `, ${unreferenced} unreferenced`;
      report += `)\n\n`;
      report += `| ID | Table | Fields | Dims | Measures | Time | Refs |\n`;
      report += `|------|-------|--------|------|----------|------|------|\n`;
      for (const s of referenced) {
        report += `| ${s.id} | ${s.name} | ${s.fieldCount} | ${s.dimensions} | ${s.measures} | ${s.timeDimensions} | ${s.refCount} |\n`;
      }
      if (unreferenced > 0) {
        skippedTables += unreferenced;
      }
      report += `\n`;
    }
  }

  if (skippedSchemas > 0 || skippedTables > 0) {
    report += `*${skippedSchemas} admin-only schemas and ${skippedTables} staging/intermediate tables omitted.*\n\n`;
  }

  // ── Cards by Domain (compact) ──

  report += `## Cards by Domain\n\n`;
  report += `Card counts and top questions per collection (by view count).\n\n`;

  const cardsByCollection = new Map<string, MetabaseCard[]>();
  for (const c of activeCards) {
    const col = c.collection_id ? (collectionMap.get(c.collection_id) || "Uncategorized") : "Root";
    if (!cardsByCollection.has(col)) cardsByCollection.set(col, []);
    cardsByCollection.get(col)!.push(c);
  }

  const sortedCollections = Array.from(cardsByCollection.entries())
    .map(([col, colCards]) => ({
      col,
      colCards,
      activeCount: colCards.filter(isCardActive).length,
    }))
    .filter((c) => c.activeCount > 0)
    .sort((a, b) => b.activeCount - a.activeCount);

  for (const { col, colCards, activeCount } of sortedCollections) {
    const top3 = [...colCards].sort((a, b) => activityScore(b) - activityScore(a)).slice(0, 3);
    const topNames = top3.map((c) => c.name).join(", ");
    report += `- **${col}** (${colCards.length} cards, ${activeCount} active): ${topNames}\n`;
  }
  const inactiveCollections = cardsByCollection.size - sortedCollections.length;
  if (inactiveCollections > 0) {
    report += `\n*${inactiveCollections} collections with no active cards omitted.*\n`;
  }
  report += `\n`;

  return report;
}

// ── Main command ──

export async function metabaseAnalyzeCommand(options: AnalyzeOptions): Promise<void> {
  const config = loadMetabaseConfig();
  if (!config) {
    console.error(pc.red("Metabase is not configured."));
    console.log(pc.dim("Run: bon metabase connect"));
    process.exit(1);
  }

  const client = createMetabaseClient(config);
  const outputPath = options.output || OUTPUT_FILE;
  const topCardsLimit = options.topCards ? parseInt(options.topCards, 10) : TOP_CARDS_LIMIT;

  console.log();
  console.log(pc.dim("Fetching data from Metabase..."));

  // Phase 1: Parallel fetch of all list endpoints
  const [user, cards, databases, collectionTree, dashboardList] = await Promise.all([
    client.getCurrentUser(),
    client.getCards(),
    client.getDatabases(),
    client.getCollectionTree(),
    client.getDashboards(),
  ]);

  console.log(pc.dim(`  ${cards.length} cards, ${databases.length} databases, ${dashboardList.filter((d) => !d.archived).length} dashboards`));

  // Permissions - may fail for non-admin keys
  let permissionGroups: MetabasePermissionGroup[] | null = null;
  let permissionsGraph: MetabasePermissionsGraph | null = null;
  try {
    [permissionGroups, permissionsGraph] = await Promise.all([
      client.getPermissionGroups(),
      client.getPermissionsGraph(),
    ]);
    console.log(pc.dim(`  ${permissionGroups.length} permission groups`));
  } catch (err) {
    if (err instanceof MetabaseApiError && (err.status === 401 || err.status === 403)) {
      console.log(pc.dim("  Permissions: skipped (requires admin API key)"));
    } else {
      throw err;
    }
  }

  // Phase 2: Database metadata (1 call per DB)
  console.log(pc.dim("Fetching database metadata..."));
  const dbMetadata: MetabaseDatabaseMeta[] = [];
  for (const db of databases) {
    const meta = await client.getDatabaseMetadata(db.id);
    const visibleTables = meta.tables.filter(
      (t) => t.visibility_type !== "hidden" && t.visibility_type !== "retired",
    );
    console.log(pc.dim(`  ${db.name}: ${visibleTables.length} tables`));
    dbMetadata.push(meta);
  }

  // Phase 3: Top dashboard details (for parameters)
  // Score dashboards by total view_count of cards they might contain.
  // We don't know which cards are on which dashboard without fetching details,
  // so use collection overlap with top cards as a proxy, plus popular_items.
  console.log(pc.dim("Fetching top dashboard details..."));
  const activeDashboards = dashboardList.filter((d) => !d.archived);

  // Fetch popular items to boost those dashboards
  let popularDashboardIds: Set<number> = new Set();
  try {
    const popular = await client.getPopularItems();
    for (const item of popular) {
      if (item.model === "dashboard") popularDashboardIds.add(item.model_id);
    }
  } catch {
    // Not critical
  }

  // Sort: popular first, then the rest
  const sortedDashboards = [...activeDashboards].sort((a, b) => {
    const aPopular = popularDashboardIds.has(a.id) ? 1 : 0;
    const bPopular = popularDashboardIds.has(b.id) ? 1 : 0;
    return bPopular - aPopular;
  });

  const dashboardsToFetch = sortedDashboards.slice(0, TOP_DASHBOARDS_LIMIT);
  const dashboardDetails: MetabaseDashboardDetail[] = [];
  for (const d of dashboardsToFetch) {
    try {
      const detail = await client.getDashboard(d.id);
      dashboardDetails.push(detail);
    } catch {
      // Skip dashboards that fail (e.g., permission issues)
    }
  }
  console.log(pc.dim(`  ${dashboardDetails.length} dashboards analyzed`));

  // Phase 4: Convert top MBQL cards to SQL (capped to limit API calls)
  const MBQL_CONVERT_LIMIT = 100;
  const activeCards = cards.filter((c) => !c.archived);
  const mbqlCards = activeCards
    .filter(isMbqlCard)
    .sort((a, b) => activityScore(b) - activityScore(a))
    .slice(0, MBQL_CONVERT_LIMIT);
  const convertedSqlMap = new Map<number, string>();

  if (mbqlCards.length > 0) {
    const totalMbql = activeCards.filter(isMbqlCard).length;
    console.log(pc.dim(`Converting top ${mbqlCards.length} query-builder cards to SQL (${totalMbql} total, capped at ${MBQL_CONVERT_LIMIT})...`));
    const BATCH_SIZE = 10;
    for (let i = 0; i < mbqlCards.length; i += BATCH_SIZE) {
      const batch = mbqlCards.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(async (c) => {
          const sql = await client.convertToNativeSQL(c.dataset_query);
          return { id: c.id, sql };
        }),
      );
      for (const r of results) {
        if (r.status === "fulfilled") {
          convertedSqlMap.set(r.value.id, r.value.sql);
        }
      }
    }
    console.log(pc.dim(`  ${convertedSqlMap.size}/${mbqlCards.length} converted successfully`));
  }

  // Build collection ID -> path map
  const flatCollections = flattenCollections(
    collectionTree.filter((n) => n.personal_owner_id === null),
  );
  const collectionMap = new Map(flatCollections.map((c) => [c.id, c.path]));

  // Generate report
  console.log(pc.dim("Building report..."));
  const report = buildReport({
    instanceUrl: config.url,
    user: {
      name: `${user.first_name} ${user.last_name}`.trim(),
      email: user.email,
      admin: user.is_superuser,
    },
    databases: dbMetadata,
    cards,
    dashboardList,
    dashboardDetails,
    collectionTree,
    collectionMap,
    permissionGroups,
    permissionsGraph,
    topCardsLimit,
    convertedSqlMap,
  });

  // Write report
  ensureBonDir();
  const fullPath = path.resolve(outputPath);
  fs.writeFileSync(fullPath, report, "utf-8");

  // Summary to stdout
  const allActive = cards.filter((c) => !c.archived);
  const recentlyUsed = allActive.filter(isCardActive);
  const topCards = allActive
    .sort((a, b) => activityScore(b) - activityScore(a))
    .slice(0, 5);

  console.log();
  console.log(pc.green(`✓ Analysis written to ${outputPath}`));
  console.log();
  console.log(pc.bold("Key findings:"));
  console.log();
  console.log(`  ${databases.length} database(s), ${dbMetadata.reduce((sum, db) => sum + db.tables.filter((t) => t.visibility_type !== "hidden" && t.visibility_type !== "retired").length, 0)} tables`);
  console.log(`  ${allActive.length} cards (${recentlyUsed.length} active in last ${INACTIVE_MONTHS}mo, ${allActive.length - recentlyUsed.length} inactive)`);
  console.log(`  ${activeDashboards.length} dashboards across ${collectionMap.size} collections`);

  if (permissionGroups) {
    // Find user-facing schemas (non-admin groups with query access)
    const nonAdminGroups = permissionGroups.filter((g) => g.name !== "Administrators");
    if (permissionsGraph) {
      for (const db of databases) {
        const access = extractSchemaAccess(permissionsGraph, nonAdminGroups, db.id);
        const userSchemas = access.filter((a) => a.schema !== "*");
        if (userSchemas.length > 0) {
          console.log(`  User-facing schemas: ${userSchemas.map((s) => s.schema).join(", ")}`);
        }
      }
    }
  }

  console.log();
  console.log(pc.bold("Top cards (by activity):"));
  for (const c of topCards) {
    const lastUsed = formatLastUsed(c);
    const flag = isCardActive(c) ? "" : pc.dim(" (inactive)");
    console.log(`  ${String(c.view_count || 0).padStart(6)} views  ${lastUsed.padEnd(12)} ${c.name}${flag}`);
  }
  console.log();
  console.log(pc.dim(`Full report: ${outputPath}`));
}
