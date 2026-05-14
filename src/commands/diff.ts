import pc from "picocolors";
import { get } from "../lib/api.js";

interface Change {
  objectName: string;
  objectType: string;
  changeType: string;
  parentName?: string;
  breaking: boolean;
  summary: string;
  annotation: string | null;
  previousDefinition?: Record<string, unknown>;
  newDefinition?: Record<string, unknown>;
}

interface ChangesResponse {
  changes: Change[];
}

interface DiffOptions {
  format?: string;
  breaking?: boolean;
}

export async function diffCommand(id: string, options: DiffOptions = {}) {
  let response: ChangesResponse;
  try {
    response = (await get(`/api/deploy/changes/${id}`)) as ChangesResponse;
  } catch (err) {
    console.log(
      pc.red(`Failed to fetch changes: ${err instanceof Error ? err.message : err}`)
    );
    process.exit(1);
  }

  let { changes } = response;

  if (options.breaking) {
    changes = changes.filter((c) => c.breaking);
  }

  if (options.format === "json") {
    console.log(JSON.stringify(changes, null, 2));
    return;
  }

  console.log();
  console.log(pc.bold(`Changes in deployment ${id.slice(0, 8)}`));
  console.log();

  if (changes.length === 0) {
    console.log(pc.dim("  No changes recorded."));
    console.log();
    return;
  }

  for (const c of changes) {
    const prefix =
      c.changeType === "added"
        ? pc.green("+")
        : c.changeType === "removed"
          ? pc.red("-")
          : pc.yellow("~");
    const label = `${capitalize(c.changeType)} ${c.objectType}: ${c.objectName}`;
    const breakingTag = c.breaking ? pc.red(" BREAKING") : "";
    console.log(`  ${prefix} ${label}${breakingTag}`);

    // Show detail line with summary and definition changes
    const details: string[] = [];
    if (c.summary) details.push(c.summary);
    if (details.length > 0) {
      console.log(pc.dim(`      ${details.join(" | ")}`));
    }

    // Show old → new for modifications
    if (c.changeType === "modified" && c.previousDefinition && c.newDefinition) {
      for (const key of Object.keys(c.newDefinition)) {
        const oldVal = c.previousDefinition[key];
        const newVal = c.newDefinition[key];
        if (oldVal !== newVal && oldVal !== undefined && newVal !== undefined) {
          console.log(pc.dim(`      ${key}: ${JSON.stringify(oldVal)} -> ${JSON.stringify(newVal)}`));
        }
      }
    }

    // Show annotation if present
    if (c.annotation) {
      console.log(`      ${pc.cyan('"' + c.annotation + '"')}`);
    }

    console.log();
  }

  const added = changes.filter((c) => c.changeType === "added").length;
  const modified = changes.filter((c) => c.changeType === "modified").length;
  const removed = changes.filter((c) => c.changeType === "removed").length;
  const breaking = changes.filter((c) => c.breaking).length;

  const parts = [
    `${added} added`,
    `${modified} modified`,
    `${removed} removed`,
  ];
  if (breaking > 0) {
    parts.push(pc.red(`${breaking} breaking`));
  }

  console.log(pc.dim(`Summary: ${parts.join(", ")}`));
  console.log();
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
