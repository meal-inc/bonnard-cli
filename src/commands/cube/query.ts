import pc from "picocolors";
import { encode } from "@toon-format/toon";
import { post } from "../../lib/api.js";
import { loadCredentials } from "../../lib/credentials.js";

interface CubeQueryOptions {
  sql?: boolean;
  limit?: string;
  format?: string;
}

interface CubeQueryResult {
  data?: Record<string, unknown>[];
  error?: string;
  // REST API response shape
  results?: Array<{
    data: Record<string, unknown>[];
  }>;
  // SQL API response shape
  sql?: {
    sql: string[];
  };
}

/**
 * Query the deployed semantic layer
 *
 * Supports two formats:
 * - JSON (default): bon query '{"measures": ["orders.count"]}'
 * - SQL: bon query --sql "SELECT MEASURE(count) FROM orders"
 */
export async function cubeQueryCommand(
  queryInput: string,
  options: CubeQueryOptions = {}
): Promise<void> {
  // Check login
  const creds = loadCredentials();
  if (!creds) {
    console.error(pc.red("Not logged in. Run `bon login` first."));
    process.exit(1);
  }

  const format = options.format ?? "toon";
  const limit = options.limit ? parseInt(options.limit, 10) : undefined;

  try {
    let payload: { query?: unknown; sql?: string };

    if (options.sql) {
      // SQL format
      payload = { sql: queryInput };
    } else {
      // JSON format - parse the input
      let query: Record<string, unknown>;
      try {
        query = JSON.parse(queryInput);
      } catch {
        console.error(pc.red("Invalid JSON query. Use --sql for SQL queries."));
        console.log(pc.dim('Example: bon query \'{"measures": ["orders.count"]}\''));
        process.exit(1);
      }

      // Add limit if specified
      if (limit && !query.limit) {
        query.limit = limit;
      }

      payload = { query };
    }

    // The web app handles Cube "Continue wait" retries server-side, so this
    // is a single request that may take up to ~55s for slow warehouse queries.
    const result = (await post("/api/cube/query", payload)) as CubeQueryResult;

    if (result.error) {
      console.error(pc.red(`Query error: ${result.error}`));
      process.exit(1);
    }

    // Handle SQL API response (returns SQL, not data)
    if (result.sql) {
      console.log(pc.dim("Generated SQL:"));
      console.log(result.sql.sql.join("\n"));
      return;
    }

    // Handle REST API response
    const data = result.results?.[0]?.data ?? result.data ?? [];

    if (data.length === 0) {
      console.log("No rows returned.");
      return;
    }

    if (format === "json") {
      console.log(JSON.stringify(data, null, 2));
    } else {
      // TOON tabular format
      const toon = encode({ results: data });
      console.log(toon);
    }

    if (limit && data.length >= limit) {
      console.log(pc.dim(`(limited to ${limit} rows)`));
    }
  } catch (err) {
    console.error(pc.red(`Query failed: ${(err as Error).message}`));
    process.exit(1);
  }
}
