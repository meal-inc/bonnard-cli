import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pc from "picocolors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Docs directory is copied to dist/docs during build
const DOCS_DIR = path.join(__dirname, "..", "docs");

interface DocsOptions {
  recursive?: boolean;
  search?: string;
  format?: "markdown" | "json";
}

/**
 * Get list of all available topics by scanning the topics directory
 */
function getAvailableTopics(): string[] {
  const topicsDir = path.join(DOCS_DIR, "topics");
  if (!fs.existsSync(topicsDir)) {
    return [];
  }

  return fs
    .readdirSync(topicsDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(".md", ""))
    .sort();
}

/**
 * Load the index file
 */
function loadIndex(): string | null {
  const indexPath = path.join(DOCS_DIR, "_index.md");
  if (!fs.existsSync(indexPath)) {
    return null;
  }
  return fs.readFileSync(indexPath, "utf-8");
}

/**
 * Load a specific topic
 */
function loadTopic(topicId: string): string | null {
  const topicPath = path.join(DOCS_DIR, "topics", `${topicId}.md`);
  if (!fs.existsSync(topicPath)) {
    return null;
  }
  return fs.readFileSync(topicPath, "utf-8");
}

/**
 * Load a JSON schema
 */
function loadSchema(schemaName: string): object | null {
  const schemaPath = path.join(DOCS_DIR, "schemas", `${schemaName}.schema.json`);
  if (!fs.existsSync(schemaPath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(schemaPath, "utf-8"));
}

/**
 * Get child topics for a given topic
 */
function getChildTopics(topicId: string): string[] {
  const allTopics = getAvailableTopics();
  const prefix = topicId + ".";
  return allTopics.filter((t) => t.startsWith(prefix) && !t.slice(prefix.length).includes("."));
}

/**
 * Search topics for a query string
 */
function searchTopics(query: string): Array<{ topic: string; matches: string[] }> {
  const results: Array<{ topic: string; matches: string[] }> = [];
  const queryLower = query.toLowerCase();

  // Search the index file too
  const index = loadIndex();
  if (index) {
    const indexMatches: string[] = [];
    for (const line of index.split("\n")) {
      if (line.toLowerCase().includes(queryLower)) {
        indexMatches.push(line.trim());
      }
    }
    if (indexMatches.length > 0) {
      results.push({ topic: "(index)", matches: indexMatches.slice(0, 3) });
    }
  }

  for (const topic of getAvailableTopics()) {
    const content = loadTopic(topic);
    if (!content) continue;

    const lines = content.split("\n");
    const matches: string[] = [];

    for (const line of lines) {
      if (line.toLowerCase().includes(queryLower)) {
        matches.push(line.trim());
      }
    }

    if (matches.length > 0) {
      results.push({ topic, matches: matches.slice(0, 3) }); // Max 3 matches per topic
    }
  }

  return results;
}

/**
 * Format topic as JSON
 */
function formatAsJson(topicId: string, content: string): string {
  const lines = content.split("\n");
  const title = lines.find((l) => l.startsWith("# "))?.replace("# ", "") || topicId;
  const description = lines.find((l) => l.startsWith("> "))?.replace("> ", "") || "";
  const children = getChildTopics(topicId);

  // Extract "See Also" links
  const seeAlsoIndex = lines.findIndex((l) => l.includes("## See Also"));
  const seeAlso: string[] = [];
  if (seeAlsoIndex !== -1) {
    for (let i = seeAlsoIndex + 1; i < lines.length; i++) {
      const match = lines[i].match(/^- (.+)$/);
      if (match) {
        seeAlso.push(match[1]);
      } else if (lines[i].startsWith("##")) {
        break;
      }
    }
  }

  // Extract "More Information" URL
  const moreInfoIndex = lines.findIndex((l) => l.includes("## More Information"));
  let reference: string | undefined;
  if (moreInfoIndex !== -1 && lines[moreInfoIndex + 2]) {
    const url = lines[moreInfoIndex + 2].trim();
    if (url.startsWith("http")) {
      reference = url;
    }
  }

  return JSON.stringify(
    {
      topic: topicId,
      title,
      description,
      children,
      seeAlso,
      reference,
    },
    null,
    2
  );
}

/**
 * Main docs command
 */
export async function docsCommand(topic?: string, options: DocsOptions = {}): Promise<void> {
  // Handle search
  if (options.search) {
    const results = searchTopics(options.search);

    if (results.length === 0) {
      console.log(pc.yellow(`No topics found matching "${options.search}"`));
      return;
    }

    console.log(pc.bold(`Found ${results.length} topic(s) matching "${options.search}":\n`));
    for (const result of results) {
      console.log(pc.cyan(`  ${result.topic}`));
      for (const match of result.matches) {
        console.log(pc.dim(`    ${match.slice(0, 80)}${match.length > 80 ? "..." : ""}`));
      }
      console.log();
    }
    return;
  }

  // No topic specified - show index
  if (!topic) {
    const index = loadIndex();
    if (!index) {
      console.log(pc.red("Documentation index not found."));
      console.log(pc.dim("Expected at: " + path.join(DOCS_DIR, "_index.md")));
      process.exit(1);
    }
    console.log(index);
    return;
  }

  // Load specific topic
  const content = loadTopic(topic);
  if (!content) {
    const available = getAvailableTopics();
    console.log(pc.red(`Topic "${topic}" not found.`));
    console.log();

    // Suggest similar topics
    const similar = available.filter(
      (t) => t.includes(topic) || topic.includes(t) || t.split(".").some((part) => topic.includes(part))
    );

    if (similar.length > 0) {
      console.log(pc.dim("Similar topics:"));
      for (const s of similar.slice(0, 5)) {
        console.log(pc.dim(`  - ${s}`));
      }
    } else {
      console.log(pc.dim("Run `bon docs` to see available topics."));
    }
    process.exit(1);
  }

  // Output format
  if (options.format === "json") {
    console.log(formatAsJson(topic, content));
  } else {
    console.log(content);
  }

  // Recursive: show children too
  if (options.recursive) {
    const children = getChildTopics(topic);
    for (const child of children) {
      const childContent = loadTopic(child);
      if (childContent) {
        console.log("\n" + "─".repeat(60) + "\n");
        if (options.format === "json") {
          console.log(formatAsJson(child, childContent));
        } else {
          console.log(childContent);
        }
      }
    }
  }
}

/**
 * Schema subcommand
 */
export async function docsSchemaCommand(schemaName: string): Promise<void> {
  const schema = loadSchema(schemaName);
  if (!schema) {
    const schemasDir = path.join(DOCS_DIR, "schemas");
    const available = fs.existsSync(schemasDir)
      ? fs
          .readdirSync(schemasDir)
          .filter((f) => f.endsWith(".schema.json"))
          .map((f) => f.replace(".schema.json", ""))
      : [];

    console.log(pc.red(`Schema "${schemaName}" not found.`));
    if (available.length > 0) {
      console.log(pc.dim("\nAvailable schemas:"));
      for (const s of available) {
        console.log(pc.dim(`  - ${s}`));
      }
    }
    process.exit(1);
  }

  console.log(JSON.stringify(schema, null, 2));
}
