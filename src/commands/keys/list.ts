import pc from "picocolors";
import { get } from "../../lib/api.js";

interface ApiKey {
  id: string;
  key_prefix: string;
  name: string;
  last_used_at: string | null;
  created_at: string;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function printKeyTable(keys: ApiKey[], title: string, description: string) {
  console.log(pc.bold(title));
  console.log(pc.dim(description));
  console.log();

  if (keys.length === 0) {
    console.log(pc.dim("  No keys."));
    return;
  }

  const maxNameLen = Math.max(...keys.map((k) => k.name.length), 4);
  const maxPrefixLen = Math.max(...keys.map((k) => k.key_prefix.length + 3), 3);

  const header = `  ${"NAME".padEnd(maxNameLen)}  ${"KEY".padEnd(maxPrefixLen)}  ${"CREATED".padEnd(14)}  LAST USED`;
  console.log(pc.dim(header));
  console.log(pc.dim("  " + "─".repeat(header.length - 2)));

  for (const k of keys) {
    const name = k.name.padEnd(maxNameLen);
    const prefix = (k.key_prefix + "...").padEnd(maxPrefixLen);
    const created = formatDate(k.created_at).padEnd(14);
    const lastUsed = formatDate(k.last_used_at);
    console.log(`  ${pc.bold(name)}  ${pc.dim(prefix)}  ${created}  ${lastUsed}`);
  }
}

export async function keysListCommand() {
  try {
    const result = (await get("/api/web/keys")) as {
      publishableKeys: ApiKey[];
      secretKeys: ApiKey[];
    };

    printKeyTable(
      result.publishableKeys,
      "Publishable Keys",
      "Client-side, read-only access"
    );

    console.log();

    printKeyTable(
      result.secretKeys,
      "Secret Keys",
      "Server-side, full access"
    );

    const total = result.publishableKeys.length + result.secretKeys.length;
    console.log();
    console.log(pc.dim(`${total} key${total !== 1 ? "s" : ""} total`));
  } catch (err) {
    console.error(pc.red(`Error: ${(err as Error).message}`));
    process.exit(1);
  }
}
