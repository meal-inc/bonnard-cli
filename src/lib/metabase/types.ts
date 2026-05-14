/**
 * Lightweight Metabase API response types for CLI display.
 */

export interface MetabaseConfig {
  url: string;
  apiKey: string;
}

export interface MetabaseUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_superuser: boolean;
}

export interface MetabaseDatabase {
  id: number;
  name: string;
  engine: string;
  is_sample: boolean;
}

export interface MetabaseCollection {
  id: number | "root";
  name: string;
  description: string | null;
  archived: boolean;
  personal_owner_id: number | null;
  location: string;
}

export interface MetabaseCollectionTreeNode {
  id: number;
  name: string;
  children: MetabaseCollectionTreeNode[];
  personal_owner_id: number | null;
}

export interface MetabaseCard {
  id: number;
  name: string;
  description: string | null;
  display: string;
  type: string; // "question" | "model" | "metric"
  archived: boolean;
  dataset: boolean;
  view_count: number;
  last_used_at: string | null;
  collection_id: number | null;
  dataset_query: {
    // Legacy format
    type?: string; // "native" | "query"
    native?: { query: string };
    database?: number;
    query?: Record<string, unknown>;
    // Newer pMBQL format (Metabase 50+)
    "lib/type"?: string; // "mbql/query"
    stages?: Array<{
      "lib/type"?: string; // "mbql.stage/native" | "mbql.stage/mbql"
      native?: string; // SQL string directly
      [key: string]: unknown;
    }>;
  };
  result_metadata: Array<{
    name: string;
    display_name: string;
    base_type: string;
    semantic_type?: string | null;
  }> | null;
  database_id: number;
}

// ── Database metadata types (from GET /api/database/:id/metadata) ──

export interface MetabaseFieldFingerprint {
  global?: {
    "distinct-count"?: number;
    "nil%"?: number;
  };
  type?: Record<string, Record<string, unknown>>;
}

export interface MetabaseFieldMeta {
  id: number;
  name: string;
  display_name: string;
  description: string | null;
  base_type: string;
  effective_type?: string;
  semantic_type: string | null;
  visibility_type: string | null;
  has_field_values: string | null; // "list" | "search" | "none" | "auto-list"
  fk_target_field_id: number | null;
  fingerprint: MetabaseFieldFingerprint | null;
  table_id: number;
}

export interface MetabaseTableMeta {
  id: number;
  name: string;
  display_name: string;
  description: string | null;
  schema: string;
  entity_type: string | null;
  visibility_type: string | null;
  fields: MetabaseFieldMeta[];
}

export interface MetabaseDatabaseMeta {
  id: number;
  name: string;
  engine: string;
  tables: MetabaseTableMeta[];
}

// ── Permissions types ──

export interface MetabasePermissionGroup {
  id: number;
  name: string;
  member_count: number;
}

export interface MetabasePermissionsGraph {
  revision: number;
  groups: Record<string, Record<string, unknown>>;
}

export interface MetabasePopularItem {
  model: string; // "dashboard" | "card" | "table"
  model_id: number;
  model_object: {
    id: number;
    name: string;
    description?: string | null;
  };
}

export interface MetabaseCollectionItem {
  id: number;
  name: string;
  description: string | null;
  model: string; // "card" | "dashboard" | "collection" | "dataset" | "metric"
  display?: string;
  collection_id?: number;
}

export interface MetabaseDashboardSummary {
  id: number;
  name: string;
  description: string | null;
  archived: boolean;
}

export interface MetabaseDashboardDetail extends MetabaseDashboardSummary {
  parameters: Array<{
    id: string;
    name: string;
    type: string;
    slug: string;
  }>;
  dashcards: Array<{
    id: number;
    card: {
      id: number;
      name: string;
      display: string;
    } | null;
    row: number;
    col: number;
    size_x: number;
    size_y: number;
  }>;
}
