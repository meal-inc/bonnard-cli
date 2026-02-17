/**
 * Local datasource types
 */

export type WarehouseType = "snowflake" | "postgres" | "redshift" | "bigquery" | "databricks";

export type DatasourceSource = "manual" | "dbt" | "mcp" | "demo";

export interface LocalDatasource {
  name: string;
  type: WarehouseType;
  source: DatasourceSource;
  dbtProfile?: string;
  dbtTarget?: string;
  config: Record<string, string | number | undefined>;
  credentials: Record<string, string>;
}

export interface DatasourcesFile {
  datasources: LocalDatasource[];
}
