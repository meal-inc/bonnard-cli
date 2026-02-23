import pc from "picocolors";
import { get } from "../lib/api.js";
import { loadCredentials } from "../lib/credentials.js";

interface SchemaOptions {
  views?: boolean;
  cubes?: boolean;
  format?: string;
}

interface MetaMember {
  name: string;
  type: string;
  title?: string;
  shortTitle?: string;
  description?: string;
}

interface MetaSegment {
  name: string;
  title?: string;
  shortTitle?: string;
  description?: string;
}

interface MetaItem {
  name: string;
  title?: string;
  description?: string;
  type?: string;
  measures: MetaMember[];
  dimensions: MetaMember[];
  segments: MetaSegment[];
}

interface MetaResponse {
  cubes: MetaItem[];
}

function printSummaryTable(label: string, items: MetaItem[]): void {
  if (items.length === 0) return;

  console.log(pc.bold(label));
  console.log();

  const maxNameLen = Math.max(...items.map((i) => i.name.length), 4);
  const hasDescriptions = items.some((i) => i.description);

  let header = `  ${"NAME".padEnd(maxNameLen)}  ${"MEASURES".padEnd(8)}  ${"DIMENSIONS".padEnd(10)}  SEGMENTS`;
  if (hasDescriptions) header += "  DESCRIPTION";

  console.log(pc.dim(header));
  console.log(pc.dim("  " + "─".repeat(header.length - 2)));

  for (const item of items) {
    const name = item.name.padEnd(maxNameLen);
    const measures = String(item.measures.length).padEnd(8);
    const dimensions = String(item.dimensions.length).padEnd(10);
    const segments = String(item.segments.length).padEnd(8);
    let line = `  ${pc.bold(name)}  ${measures}  ${dimensions}  ${segments}`;
    if (hasDescriptions) {
      const desc = item.description || "";
      line += `  ${pc.dim(desc.length > 50 ? desc.slice(0, 47) + "..." : desc)}`;
    }
    console.log(line);
  }
}

function printDetail(item: MetaItem): void {
  const kind = item.type === "view" ? "view" : "cube";
  console.log(`${pc.bold(item.name)} ${pc.dim(`(${kind})`)}`);
  if (item.description) {
    console.log(`  ${item.description}`);
  }

  if (item.measures.length > 0) {
    console.log();
    console.log(`  ${pc.bold("Measures")}`);

    const maxNameLen = Math.max(...item.measures.map((m) => m.name.length));
    const maxTypeLen = Math.max(...item.measures.map((m) => m.type.length));

    for (const m of item.measures) {
      const name = m.name.padEnd(maxNameLen);
      const type = pc.dim(m.type.padEnd(maxTypeLen));
      const desc = m.description ? `  ${pc.dim(m.description)}` : "";
      console.log(`    ${name}  ${type}${desc}`);
    }
  }

  if (item.dimensions.length > 0) {
    console.log();
    console.log(`  ${pc.bold("Dimensions")}`);

    const maxNameLen = Math.max(...item.dimensions.map((d) => d.name.length));
    const maxTypeLen = Math.max(...item.dimensions.map((d) => d.type.length));

    for (const d of item.dimensions) {
      const name = d.name.padEnd(maxNameLen);
      const type = pc.dim(d.type.padEnd(maxTypeLen));
      const desc = d.description ? `  ${pc.dim(d.description)}` : "";
      console.log(`    ${name}  ${type}${desc}`);
    }
  }

  if (item.segments.length > 0) {
    console.log();
    console.log(`  ${pc.bold("Segments")}`);

    const maxNameLen = Math.max(...item.segments.map((s) => s.name.length));

    for (const s of item.segments) {
      const name = s.name.padEnd(maxNameLen);
      const desc = s.description ? `  ${pc.dim(s.description)}` : "";
      console.log(`    ${name}${desc}`);
    }
  }
}

export async function schemaCommand(
  name: string | undefined,
  options: SchemaOptions = {}
): Promise<void> {
  const creds = loadCredentials();
  if (!creds) {
    console.error(pc.red("Not logged in. Run `bon login` first."));
    process.exit(1);
  }

  try {
    const result = (await get("/api/cube/meta")) as MetaResponse;
    const allItems = result.cubes || [];

    const views = allItems.filter((c) => c.type === "view");
    const cubes = allItems.filter((c) => c.type !== "view");

    // Detail view for a specific item
    if (name) {
      const match = allItems.find(
        (c) => c.name === name || c.name.toLowerCase() === name.toLowerCase()
      );
      if (!match) {
        console.error(pc.red(`"${name}" not found.`));
        console.log();
        const names = allItems.map((c) => c.name);
        if (names.length > 0) {
          console.log(pc.dim("Available:"));
          for (const n of names) {
            console.log(pc.dim(`  ${n}`));
          }
        }
        process.exit(1);
      }

      if (options.format === "json") {
        console.log(JSON.stringify(match, null, 2));
      } else {
        printDetail(match);
      }
      return;
    }

    // Summary view
    const showViews = options.views || (!options.views && !options.cubes);
    const showCubes = options.cubes || (!options.views && !options.cubes);

    if (options.format === "json") {
      const filtered: MetaItem[] = [];
      if (showViews) filtered.push(...views);
      if (showCubes) filtered.push(...cubes);
      console.log(JSON.stringify(filtered, null, 2));
      return;
    }

    if (showViews) {
      printSummaryTable("Views", views);
    }
    if (showViews && showCubes && views.length > 0 && cubes.length > 0) {
      console.log();
    }
    if (showCubes) {
      printSummaryTable("Cubes", cubes);
    }

    const parts: string[] = [];
    if (showViews) parts.push(`${views.length} view${views.length !== 1 ? "s" : ""}`);
    if (showCubes) parts.push(`${cubes.length} cube${cubes.length !== 1 ? "s" : ""}`);

    if (parts.length > 0) {
      console.log();
      console.log(pc.dim(parts.join(", ")));
    }
  } catch (err) {
    console.error(pc.red(`Failed to fetch schema: ${(err as Error).message}`));
    process.exit(1);
  }
}
