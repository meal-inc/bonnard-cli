import pc from "picocolors";
import { get, post } from "../lib/api.js";

interface AnnotationEntry {
  objectName: string;
  annotation: string;
}

interface AnnotatePayload {
  annotations: AnnotationEntry[];
}

interface Change {
  objectName: string;
  objectType: string;
  changeType: string;
  parentName?: string;
  breaking: boolean;
  summary: string;
  annotation: string | null;
}

interface ChangesResponse {
  changes: Change[];
}

interface AnnotateResponse {
  updated: number;
  total: number;
}

interface AnnotateOptions {
  data?: string;
}

function readStdin(): Promise<string | null> {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) {
      resolve(null);
      return;
    }
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data.trim() || null));
    // Timeout after 100ms if no data
    setTimeout(() => resolve(data.trim() || null), 100);
  });
}

function parseAnnotations(raw: string): AnnotatePayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Invalid JSON. Expected: {\"annotations\": [{\"objectName\": \"...\", \"annotation\": \"...\"}]}");
  }

  const obj = parsed as { annotations?: unknown };
  if (!obj.annotations || !Array.isArray(obj.annotations) || obj.annotations.length === 0) {
    throw new Error("JSON must contain a non-empty \"annotations\" array");
  }

  for (const entry of obj.annotations) {
    const e = entry as AnnotationEntry;
    if (!e.objectName || typeof e.objectName !== "string") {
      throw new Error("Each annotation must have a string \"objectName\"");
    }
    if (!e.annotation || typeof e.annotation !== "string") {
      throw new Error(`Missing \"annotation\" text for \"${e.objectName}\"`);
    }
    if (e.annotation.length > 1000) {
      throw new Error(`Annotation for \"${e.objectName}\" exceeds 1000 chars`);
    }
  }

  return { annotations: obj.annotations as AnnotationEntry[] };
}

export async function annotateCommand(id: string, options: AnnotateOptions = {}) {
  // Get annotation data from --data flag or stdin
  const raw = options.data || (await readStdin());

  if (!raw) {
    // No data provided — show current changes as guidance
    try {
      const response = (await get(`/api/deploy/changes/${id}`)) as ChangesResponse;
      const { changes } = response;

      if (changes.length === 0) {
        console.log(pc.dim("No changes recorded for this deployment."));
        return;
      }

      console.log();
      console.log(pc.bold(`Changes in deployment ${id.slice(0, 8)}`));
      console.log();

      for (const c of changes) {
        const prefix = c.changeType === "added" ? pc.green("+") : c.changeType === "removed" ? pc.red("-") : pc.yellow("~");
        const label = `${c.changeType} ${c.objectType}: ${c.objectName}`;
        const breakingTag = c.breaking ? pc.red(" BREAKING") : "";
        console.log(`  ${prefix} ${label}${breakingTag}`);
        if (c.annotation) {
          console.log(pc.dim(`      "${c.annotation}"`));
        }
      }

      console.log();
      console.log(pc.dim("To annotate, provide JSON via --data or stdin:"));
      console.log(pc.dim(`  bon annotate ${id.slice(0, 8)} --data '{"annotations":[{"objectName":"...","annotation":"..."}]}'`));
      console.log();
    } catch (err) {
      console.log(pc.red(`Failed to fetch changes: ${err instanceof Error ? err.message : err}`));
      process.exit(1);
    }
    return;
  }

  // Parse and validate
  let payload: AnnotatePayload;
  try {
    payload = parseAnnotations(raw);
  } catch (err) {
    console.log(pc.red(err instanceof Error ? err.message : String(err)));
    process.exit(1);
  }

  // Submit
  try {
    const response = (await post(`/api/deploy/annotate/${id}`, payload)) as AnnotateResponse;
    console.log(pc.green(`Annotated ${response.updated}/${response.total} changes.`));
  } catch (err) {
    console.log(pc.red(`Failed to submit annotations: ${err instanceof Error ? err.message : err}`));
    process.exit(1);
  }
}
