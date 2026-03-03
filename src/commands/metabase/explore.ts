import pc from "picocolors";
import {
  loadMetabaseConfig,
  createMetabaseClient,
  MetabaseApiError,
  type MetabaseClient,
  type MetabaseCard,
  type MetabaseCollectionTreeNode,
  type MetabaseFieldMeta,
} from "../../lib/metabase/index.js";

function requireConfig(): ReturnType<typeof createMetabaseClient> {
  const config = loadMetabaseConfig();
  if (!config) {
    console.error(pc.red("Metabase is not configured."));
    console.log(pc.dim("Run: bon metabase connect"));
    process.exit(1);
  }
  return createMetabaseClient(config);
}

function getCardType(card: MetabaseCard): "model" | "metric" | "question" {
  if (card.type === "model" || card.dataset) return "model";
  if (card.type === "metric") return "metric";
  return "question";
}

function padColumn(value: string, width: number): string {
  return value.padEnd(width);
}

// ── Activity helpers ──

const INACTIVE_MONTHS = 3;

function isCardActive(card: MetabaseCard): boolean {
  if (!card.last_used_at) return false;
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - INACTIVE_MONTHS);
  return new Date(card.last_used_at) >= cutoff;
}

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

// ── Overview ──

async function showOverview(client: MetabaseClient): Promise<void> {
  const [databases, collections, cards, dashboards] = await Promise.all([
    client.getDatabases(),
    client.getCollections(),
    client.getCards(),
    client.getDashboards(),
  ]);

  const activeCards = cards.filter((c) => !c.archived);
  const models = activeCards.filter((c) => getCardType(c) === "model");
  const metrics = activeCards.filter((c) => getCardType(c) === "metric");
  const questions = activeCards.filter((c) => getCardType(c) === "question");
  const activeCollections = collections.filter(
    (c) => !c.archived && c.personal_owner_id === null,
  );
  const activeDashboards = dashboards.filter((d) => !d.archived);

  const recentlyActive = activeCards.filter(isCardActive).length;
  const inactive = activeCards.length - recentlyActive;

  console.log();
  console.log(pc.bold("Metabase Overview"));
  console.log();
  console.log(`  Databases:    ${databases.length}`);
  console.log(`  Collections:  ${activeCollections.length}`);
  console.log(`  Models:       ${models.length}`);
  console.log(`  Metrics:      ${metrics.length}`);
  console.log(`  Questions:    ${questions.length}`);
  console.log(`  Dashboards:   ${activeDashboards.length}`);
  console.log();
  console.log(`  Active (last ${INACTIVE_MONTHS}mo):  ${pc.green(String(recentlyActive))}`);
  console.log(`  Inactive:     ${pc.dim(String(inactive))}`);
  console.log();
  console.log(pc.dim("Explore further:"));
  console.log(pc.dim("  bon metabase explore databases"));
  console.log(pc.dim("  bon metabase explore collections"));
  console.log(pc.dim("  bon metabase explore cards"));
  console.log(pc.dim("  bon metabase explore dashboards"));
  console.log(pc.dim("  bon metabase explore card <id-or-name>"));
  console.log(pc.dim("  bon metabase explore dashboard <id-or-name>"));
  console.log(pc.dim("  bon metabase explore database <id-or-name>"));
  console.log(pc.dim("  bon metabase explore table <id-or-name>"));
  console.log(pc.dim("  bon metabase explore collection <id-or-name>"));
}

// ── Databases ──

async function showDatabases(client: MetabaseClient): Promise<void> {
  const databases = await client.getDatabases();

  console.log();
  console.log(pc.bold("Databases"));
  console.log();

  if (databases.length === 0) {
    console.log(pc.dim("  No databases found."));
    return;
  }

  // Header
  console.log(
    `  ${pc.dim(padColumn("ID", 6))}${pc.dim(padColumn("NAME", 30))}${pc.dim(padColumn("ENGINE", 16))}${pc.dim("SAMPLE")}`,
  );

  for (const db of databases) {
    console.log(
      `  ${padColumn(String(db.id), 6)}${padColumn(db.name, 30)}${padColumn(db.engine, 16)}${db.is_sample ? "Yes" : ""}`,
    );
  }
}

// ── Collections ──

function printTree(
  nodes: MetabaseCollectionTreeNode[],
  indent: number = 0,
): void {
  for (const node of nodes) {
    // Skip personal collections
    if (node.personal_owner_id !== null) continue;

    const prefix = indent === 0 ? "  " : "  " + "  ".repeat(indent);
    const icon = node.children.length > 0 ? "+" : "-";
    console.log(`${prefix}${pc.dim(icon)} ${node.name} ${pc.dim(`(${node.id})`)}`);

    if (node.children.length > 0) {
      printTree(node.children, indent + 1);
    }
  }
}

async function showCollections(client: MetabaseClient): Promise<void> {
  const tree = await client.getCollectionTree();

  console.log();
  console.log(pc.bold("Collections"));
  console.log();

  const filtered = tree.filter((n) => n.personal_owner_id === null);
  if (filtered.length === 0) {
    console.log(pc.dim("  No collections found."));
    return;
  }

  printTree(filtered);
}

// ── Cards ──

async function showCards(client: MetabaseClient): Promise<void> {
  const cards = await client.getCards();
  const active = cards.filter((c) => !c.archived);

  const models = active.filter((c) => getCardType(c) === "model");
  const metrics = active.filter((c) => getCardType(c) === "metric");
  const questions = active.filter((c) => getCardType(c) === "question");

  const CAP = 50;

  console.log();

  const groups: Array<{ label: string; items: MetabaseCard[] }> = [
    { label: "Models", items: models },
    { label: "Metrics", items: metrics },
    { label: "Questions", items: questions },
  ];

  for (const group of groups) {
    if (group.items.length === 0) continue;

    const groupActive = group.items.filter(isCardActive).length;
    const groupInactive = group.items.length - groupActive;
    const sorted = [...group.items].sort((a, b) => activityScore(b) - activityScore(a));

    console.log(pc.bold(`${group.label} (${group.items.length})`) + pc.dim(` — ${groupActive} active, ${groupInactive} inactive`));
    console.log();
    console.log(
      `  ${pc.dim(padColumn("ID", 6))}${pc.dim(padColumn("NAME", 36))}${pc.dim(padColumn("DISPLAY", 14))}${pc.dim(padColumn("LAST USED", 12))}${pc.dim("VIEWS")}`,
    );

    const display = sorted.slice(0, CAP);
    for (const card of display) {
      const lastUsed = formatLastUsed(card);
      const active = isCardActive(card);
      const name = card.name.slice(0, 34);
      const line = `  ${padColumn(String(card.id), 6)}${padColumn(name, 36)}${padColumn(card.display, 14)}${padColumn(lastUsed, 12)}${card.view_count || 0}`;
      console.log(active ? line : pc.dim(line));
    }

    if (group.items.length > CAP) {
      console.log(pc.dim(`  ... and ${group.items.length - CAP} more`));
    }
    console.log();
  }

  if (models.length === 0 && metrics.length === 0 && questions.length === 0) {
    console.log(pc.dim("  No cards found."));
  }

  console.log(pc.dim("View details: bon metabase explore card <id-or-name>"));
}

// ── Card detail ──

async function showCardDetail(
  client: MetabaseClient,
  id: number,
): Promise<void> {
  const card = await client.getCard(id);
  const cardType = getCardType(card);

  console.log();
  console.log(pc.bold(card.name));
  if (card.description) {
    console.log(pc.dim(card.description));
  }
  console.log();

  const active = isCardActive(card);
  const lastUsed = formatLastUsed(card);
  const activityLabel = active ? pc.green("active") : pc.dim("inactive");

  console.log(`  Type:       ${cardType}`);
  console.log(`  Display:    ${card.display}`);
  console.log(`  Database:   ${card.database_id}`);
  console.log(`  Views:      ${card.view_count || 0}`);
  console.log(`  Last used:  ${lastUsed} (${activityLabel})`);
  console.log();

  // Show SQL — handle both legacy and pMBQL (stages) formats
  let sql: string | null = null;
  const dq = card.dataset_query;

  // Legacy format: dataset_query.type === "native"
  if (dq.type === "native" && dq.native?.query) {
    sql = dq.native.query;
  }
  // pMBQL format (Metabase 50+): stages[0].native is the SQL string
  else if (dq.stages?.[0]?.["lib/type"] === "mbql.stage/native" && typeof dq.stages[0].native === "string") {
    sql = dq.stages[0].native;
  }
  // Legacy MBQL: dataset_query.type === "query"
  else if (dq.type === "query") {
    try {
      sql = await client.convertToNativeSQL(dq);
    } catch (err) {
      if (err instanceof MetabaseApiError) {
        console.log(pc.dim(`  Could not convert MBQL to SQL: ${err.message}`));
      }
    }
  }
  // pMBQL query-builder stage
  else if (dq.stages?.[0]?.["lib/type"] === "mbql.stage/mbql") {
    try {
      sql = await client.convertToNativeSQL(dq);
    } catch (err) {
      if (err instanceof MetabaseApiError) {
        console.log(pc.dim(`  Could not convert MBQL to SQL: ${err.message}`));
      }
    }
  }

  if (sql) {
    console.log(pc.bold("SQL"));
    console.log();
    for (const line of sql.trim().split("\n")) {
      console.log(`  ${line}`);
    }
    console.log();
  }

  // Show columns
  if (card.result_metadata && card.result_metadata.length > 0) {
    console.log(pc.bold("Columns"));
    console.log();
    console.log(
      `  ${pc.dim(padColumn("NAME", 30))}${pc.dim(padColumn("DISPLAY NAME", 30))}${pc.dim("TYPE")}`,
    );

    for (const col of card.result_metadata) {
      console.log(
        `  ${padColumn(col.name, 30)}${padColumn(col.display_name, 30)}${col.base_type}`,
      );
    }
  }
}

// ── Dashboards ──

async function showDashboards(client: MetabaseClient): Promise<void> {
  const dashboards = await client.getDashboards();
  const active = dashboards.filter((d) => !d.archived);

  console.log();
  console.log(pc.bold(`Dashboards (${active.length})`));
  console.log();

  if (active.length === 0) {
    console.log(pc.dim("  No dashboards found."));
    return;
  }

  console.log(`  ${pc.dim(padColumn("ID", 6))}${pc.dim("NAME")}`);

  for (const d of active) {
    console.log(`  ${padColumn(String(d.id), 6)}${d.name}`);
  }
  console.log();
  console.log(pc.dim("View details: bon metabase explore dashboard <id-or-name>"));
}

// ── Dashboard detail ──

async function showDashboardDetail(
  client: MetabaseClient,
  id: number,
): Promise<void> {
  // Fetch dashboard and all cards in parallel to get activity data
  const [dashboard, allCards] = await Promise.all([
    client.getDashboard(id),
    client.getCards(),
  ]);

  // Build lookup for last_used_at from full card data
  const cardActivityMap = new Map<number, MetabaseCard>();
  for (const c of allCards) {
    cardActivityMap.set(c.id, c);
  }

  console.log();
  console.log(pc.bold(dashboard.name));
  if (dashboard.description) {
    console.log(pc.dim(dashboard.description));
  }
  console.log();

  // Parameters
  if (dashboard.parameters.length > 0) {
    console.log(pc.bold("Parameters"));
    console.log();
    console.log(
      `  ${pc.dim(padColumn("NAME", 25))}${pc.dim(padColumn("TYPE", 20))}${pc.dim("SLUG")}`,
    );
    for (const p of dashboard.parameters) {
      console.log(
        `  ${padColumn(p.name, 25)}${padColumn(p.type, 20)}${p.slug}`,
      );
    }
    console.log();
  }

  // Cards
  const cardsOnDashboard = dashboard.dashcards.filter((dc) => dc.card?.id != null);
  if (cardsOnDashboard.length > 0) {
    const inactiveOnDash = cardsOnDashboard.filter((dc) => {
      const full = cardActivityMap.get(dc.card!.id!);
      return full ? !isCardActive(full) : true;
    });

    const activeLabel = cardsOnDashboard.length - inactiveOnDash.length;
    console.log(pc.bold(`Cards (${cardsOnDashboard.length})`) + pc.dim(` — ${activeLabel} active, ${inactiveOnDash.length} inactive`));
    console.log();
    console.log(
      `  ${pc.dim(padColumn("ID", 6))}${pc.dim(padColumn("NAME", 31))}${pc.dim(padColumn("DISPLAY", 14))}${pc.dim(padColumn("LAST USED", 12))}${pc.dim("POSITION")}`,
    );
    for (const dc of cardsOnDashboard) {
      const card = dc.card!;
      const name = (card.name ?? "(untitled)").slice(0, 29);
      const pos = `(${dc.col},${dc.row}) ${dc.size_x}x${dc.size_y}`;
      const full = cardActivityMap.get(card.id!);
      const lastUsed = full ? formatLastUsed(full) : "?";
      const active = full ? isCardActive(full) : false;
      const line = `  ${padColumn(String(card.id), 6)}${padColumn(name, 31)}${padColumn(card.display ?? "", 14)}${padColumn(lastUsed, 12)}${pos}`;
      console.log(active ? line : pc.dim(line));
    }
  } else {
    console.log(pc.dim("  No cards on this dashboard."));
  }
}

// ── Database detail (schemas + tables) ──

async function showDatabaseDetail(
  client: MetabaseClient,
  id: number,
): Promise<void> {
  const meta = await client.getDatabaseMetadata(id);

  console.log();
  console.log(pc.bold(`${meta.name} (${meta.engine})`));
  console.log();

  // Group tables by schema
  const bySchema = new Map<string, typeof meta.tables>();
  for (const t of meta.tables) {
    if (t.visibility_type === "hidden" || t.visibility_type === "retired") continue;
    if (!bySchema.has(t.schema)) bySchema.set(t.schema, []);
    bySchema.get(t.schema)!.push(t);
  }

  for (const [schema, tables] of Array.from(bySchema.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
    console.log(pc.bold(`  ${schema}`) + pc.dim(` (${tables.length} tables)`));

    const sorted = [...tables].sort((a, b) => a.name.localeCompare(b.name));
    for (const t of sorted) {
      const fieldCount = t.fields.length;
      const desc = t.description ? pc.dim(` — ${t.description.slice(0, 50)}`) : "";
      console.log(`    ${padColumn(String(t.id), 8)}${padColumn(t.name, 40)}${fieldCount} fields${desc}`);
    }
    console.log();
  }

  console.log(pc.dim("View table fields: bon metabase explore table <id-or-name>"));
}

// ── Table detail (fields) ──

function classifyFieldType(field: MetabaseFieldMeta): string {
  const bt = field.base_type || "";
  const st = field.semantic_type || "";

  if (bt.includes("Date") || bt.includes("Time") || st.includes("Timestamp") || st === "type/DateTime" || st === "type/Date") return "time";
  if (st === "type/PK") return "pk";
  if (st === "type/FK") return "fk";
  if (["type/Currency", "type/Percentage", "type/Quantity", "type/Score"].includes(st)) return "measure";
  if (["type/Category", "type/Source", "type/City", "type/Country", "type/State", "type/Name", "type/Email", "type/URL"].includes(st)) return "dim";
  if (bt.includes("Integer") || bt.includes("Float") || bt.includes("Decimal") || bt.includes("Number") || bt.includes("BigInteger")) return "numeric";
  if (bt.includes("Text") || bt.includes("String")) return "text";
  if (bt.includes("Boolean")) return "bool";
  return "";
}

async function showTableDetail(
  client: MetabaseClient,
  tableId: number,
): Promise<void> {
  // We need to find the table in database metadata
  const databases = await client.getDatabases();
  type DbMeta = Awaited<ReturnType<typeof client.getDatabaseMetadata>>;
  let foundTable: DbMeta["tables"][0] | null = null;
  let dbName = "";
  let meta: DbMeta | null = null;

  for (const db of databases) {
    meta = await client.getDatabaseMetadata(db.id);
    const table = meta.tables.find((t) => t.id === tableId);
    if (table) {
      foundTable = table;
      dbName = db.name;
      break;
    }
  }

  if (!foundTable || !meta) {
    console.error(pc.red(`Table ${tableId} not found.`));
    process.exit(1);
  }

  // Build field ID lookup for FK resolution
  const fieldIdLookup = new Map<number, { table: string; field: string }>();
  for (const t of meta.tables) {
    for (const f of t.fields) {
      fieldIdLookup.set(f.id, { table: t.name, field: f.name });
    }
  }

  console.log();
  console.log(pc.bold(`${foundTable.name}`) + pc.dim(` (${dbName} / ${foundTable.schema})`));
  if (foundTable.description) {
    console.log(pc.dim(foundTable.description));
  }
  console.log();

  // Filter visible fields
  const fields = foundTable.fields.filter(
    (f) => f.visibility_type !== "hidden" && f.visibility_type !== "retired",
  );

  console.log(
    `  ${pc.dim(padColumn("FIELD", 30))}${pc.dim(padColumn("TYPE", 22))}${pc.dim(padColumn("SEMANTIC", 18))}${pc.dim(padColumn("CLASS", 8))}${pc.dim(padColumn("DISTINCT", 10))}${pc.dim(padColumn("NULL%", 8))}${pc.dim("FK TARGET")}`,
  );

  for (const f of fields) {
    const cls = classifyFieldType(f);
    const distinct = f.fingerprint?.global?.["distinct-count"];
    const nilPct = f.fingerprint?.global?.["nil%"];
    const fkTarget = f.fk_target_field_id
      ? (() => {
          const target = fieldIdLookup.get(f.fk_target_field_id);
          return target ? `${target.table}.${target.field}` : `field:${f.fk_target_field_id}`;
        })()
      : "";

    console.log(
      `  ${padColumn(f.name, 30)}${padColumn(f.base_type.replace("type/", ""), 22)}${padColumn(f.semantic_type?.replace("type/", "") || "", 18)}${padColumn(cls, 8)}${padColumn(distinct !== undefined ? String(distinct) : "", 10)}${padColumn(nilPct !== undefined ? `${Math.round(nilPct * 100)}%` : "", 8)}${fkTarget}`,
    );
  }

  console.log();
  console.log(pc.dim(`${fields.length} fields (${fields.filter((f) => classifyFieldType(f) === "pk" || classifyFieldType(f) === "fk").length} keys, ${fields.filter((f) => classifyFieldType(f) === "time").length} time, ${fields.filter((f) => classifyFieldType(f) === "measure").length} measures)`));
}

// ── Collection detail (cards in collection) ──

async function showCollectionDetail(
  client: MetabaseClient,
  id: number,
): Promise<void> {
  const [items, allCards] = await Promise.all([
    client.getCollectionItems(id),
    client.getCards(),
  ]);

  // Build card activity lookup
  const cardMap = new Map<number, MetabaseCard>();
  for (const c of allCards) {
    cardMap.set(c.id, c);
  }

  // Separate cards and dashboards
  const cardItems = items.filter((i) => i.model === "card" || i.model === "dataset" || i.model === "metric");
  const dashboardItems = items.filter((i) => i.model === "dashboard");

  console.log();
  console.log(pc.bold(`Collection ${id}`));
  console.log();

  if (cardItems.length > 0) {
    // Sort by activity score
    const sorted = cardItems.sort((a, b) => {
      const ca = cardMap.get(a.id);
      const cb = cardMap.get(b.id);
      return (cb ? activityScore(cb) : 0) - (ca ? activityScore(ca) : 0);
    });

    const activeCount = sorted.filter((i) => {
      const c = cardMap.get(i.id);
      return c ? isCardActive(c) : false;
    }).length;

    console.log(pc.bold(`Cards (${sorted.length})`) + pc.dim(` — ${activeCount} active, ${sorted.length - activeCount} inactive`));
    console.log();
    console.log(
      `  ${pc.dim(padColumn("ID", 6))}${pc.dim(padColumn("NAME", 40))}${pc.dim(padColumn("TYPE", 10))}${pc.dim(padColumn("DISPLAY", 14))}${pc.dim(padColumn("LAST USED", 12))}${pc.dim("VIEWS")}`,
    );

    for (const item of sorted) {
      const full = cardMap.get(item.id);
      const lastUsed = full ? formatLastUsed(full) : "?";
      const views = full ? (full.view_count || 0) : 0;
      const active = full ? isCardActive(full) : false;
      const itemType = item.model === "dataset" ? "model" : item.model;
      const name = item.name.slice(0, 38);
      const line = `  ${padColumn(String(item.id), 6)}${padColumn(name, 40)}${padColumn(itemType, 10)}${padColumn(item.display || "", 14)}${padColumn(lastUsed, 12)}${views}`;
      console.log(active ? line : pc.dim(line));
    }
    console.log();
  }

  if (dashboardItems.length > 0) {
    console.log(pc.bold(`Dashboards (${dashboardItems.length})`));
    console.log();
    console.log(`  ${pc.dim(padColumn("ID", 6))}${pc.dim("NAME")}`);
    for (const d of dashboardItems) {
      console.log(`  ${padColumn(String(d.id), 6)}${d.name}`);
    }
    console.log();
  }

  if (cardItems.length === 0 && dashboardItems.length === 0) {
    console.log(pc.dim("  No items in this collection."));
  }

  console.log(pc.dim("View card SQL: bon metabase explore card <id-or-name>"));
  console.log(pc.dim("View dashboard: bon metabase explore dashboard <id-or-name>"));
}

// ── Name-based resolution helpers ──

function isNumericId(value: string): boolean {
  return /^\d+$/.test(value);
}

function showDisambiguation(resource: string, matches: Array<{ id: number; label: string }>): never {
  console.error(pc.yellow(`Multiple ${resource}s match that name:\n`));
  for (const m of matches) {
    console.log(`  ${padColumn(String(m.id), 8)}${m.label}`);
  }
  console.log();
  console.log(pc.dim(`Use the numeric ID to be specific: bon metabase explore ${resource} <id>`));
  process.exit(1);
}

async function resolveCardId(client: MetabaseClient, input: string): Promise<number> {
  if (isNumericId(input)) return parseInt(input, 10);
  const cards = await client.getCards();
  const needle = input.toLowerCase();
  const matches = cards.filter((c) => c.name?.toLowerCase().includes(needle));
  if (matches.length === 0) {
    console.error(pc.red(`No card found matching "${input}"`));
    process.exit(1);
  }
  if (matches.length === 1) return matches[0].id;
  showDisambiguation("card", matches.map((c) => ({
    id: c.id, label: c.name,
  })));
}

async function resolveDashboardId(client: MetabaseClient, input: string): Promise<number> {
  if (isNumericId(input)) return parseInt(input, 10);
  const dashboards = await client.getDashboards();
  const needle = input.toLowerCase();
  const matches = dashboards.filter((d) => d.name?.toLowerCase().includes(needle));
  if (matches.length === 0) {
    console.error(pc.red(`No dashboard found matching "${input}"`));
    process.exit(1);
  }
  if (matches.length === 1) return matches[0].id;
  showDisambiguation("dashboard", matches.map((d) => ({
    id: d.id, label: d.name,
  })));
}

async function resolveDatabaseId(client: MetabaseClient, input: string): Promise<number> {
  if (isNumericId(input)) return parseInt(input, 10);
  const databases = await client.getDatabases();
  const needle = input.toLowerCase();
  const matches = databases.filter((d) => d.name?.toLowerCase().includes(needle));
  if (matches.length === 0) {
    console.error(pc.red(`No database found matching "${input}"`));
    process.exit(1);
  }
  if (matches.length === 1) return matches[0].id;
  showDisambiguation("database", matches.map((d) => ({
    id: d.id, label: `${d.name} (${d.engine})`,
  })));
}

async function resolveTableId(client: MetabaseClient, input: string): Promise<number> {
  if (isNumericId(input)) return parseInt(input, 10);
  const databases = await client.getDatabases();
  const needle = input.toLowerCase();
  const matches: Array<{ id: number; name: string; schema: string; dbName: string }> = [];
  for (const db of databases) {
    const meta = await client.getDatabaseMetadata(db.id);
    for (const t of meta.tables) {
      if (t.visibility_type === "hidden" || t.visibility_type === "retired") continue;
      if (t.name.toLowerCase().includes(needle)) {
        matches.push({ id: t.id, name: t.name, schema: t.schema, dbName: db.name });
      }
    }
  }
  if (matches.length === 0) {
    console.error(pc.red(`No table found matching "${input}"`));
    process.exit(1);
  }
  if (matches.length === 1) return matches[0].id;
  showDisambiguation("table", matches.map((m) => ({
    id: m.id, label: `${m.dbName} / ${m.schema}.${m.name}`,
  })));
}

async function resolveCollectionId(client: MetabaseClient, input: string): Promise<number> {
  if (isNumericId(input)) return parseInt(input, 10);
  const collections = await client.getCollections();
  const needle = input.toLowerCase();
  const matches = collections.filter((c) => typeof c.id === "number" && c.name?.toLowerCase().includes(needle));
  if (matches.length === 0) {
    console.error(pc.red(`No collection found matching "${input}"`));
    process.exit(1);
  }
  if (matches.length === 1) return matches[0].id as number;
  showDisambiguation("collection", matches.map((c) => ({
    id: c.id as number, label: c.name,
  })));
}

// ── Main command ──

const RESOURCES = ["databases", "collections", "cards", "dashboards", "card", "dashboard", "database", "table", "collection"];

export async function metabaseExploreCommand(
  resource?: string,
  id?: string,
): Promise<void> {
  const client = requireConfig();

  try {
    if (!resource) {
      await showOverview(client);
      return;
    }

    if (!RESOURCES.includes(resource)) {
      console.error(pc.red(`Unknown resource: ${resource}`));
      console.log(pc.dim(`Valid resources: ${RESOURCES.join(", ")}`));
      process.exit(1);
    }

    switch (resource) {
      case "databases":
        await showDatabases(client);
        break;
      case "collections":
        await showCollections(client);
        break;
      case "cards":
        await showCards(client);
        break;
      case "dashboards":
        await showDashboards(client);
        break;
      case "card": {
        if (!id) {
          console.error(pc.red("Usage: bon metabase explore card <id-or-name>"));
          process.exit(1);
        }
        const cardId = await resolveCardId(client, id);
        await showCardDetail(client, cardId);
        break;
      }
      case "dashboard": {
        if (!id) {
          console.error(pc.red("Usage: bon metabase explore dashboard <id-or-name>"));
          process.exit(1);
        }
        const dashId = await resolveDashboardId(client, id);
        await showDashboardDetail(client, dashId);
        break;
      }
      case "database": {
        if (!id) {
          console.error(pc.red("Usage: bon metabase explore database <id-or-name>"));
          process.exit(1);
        }
        const dbId = await resolveDatabaseId(client, id);
        await showDatabaseDetail(client, dbId);
        break;
      }
      case "table": {
        if (!id) {
          console.error(pc.red("Usage: bon metabase explore table <id-or-name>"));
          process.exit(1);
        }
        const tableId = await resolveTableId(client, id);
        await showTableDetail(client, tableId);
        break;
      }
      case "collection": {
        if (!id) {
          console.error(pc.red("Usage: bon metabase explore collection <id-or-name>"));
          process.exit(1);
        }
        const colId = await resolveCollectionId(client, id);
        await showCollectionDetail(client, colId);
        break;
      }
    }
  } catch (err) {
    if (err instanceof MetabaseApiError) {
      if (err.status === 401 || err.status === 403) {
        console.error(pc.red("Authentication failed. Re-run: bon metabase connect"));
      } else if (err.status === 404) {
        console.error(pc.red(`Not found: ${err.endpoint}`));
      } else {
        console.error(pc.red(`Metabase API error (${err.status}): ${err.message}`));
      }
      process.exit(1);
    }
    throw err;
  }
}
