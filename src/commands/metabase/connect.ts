import pc from "picocolors";
import {
  loadMetabaseConfig,
  saveMetabaseConfig,
  createMetabaseClient,
  MetabaseApiError,
} from "../../lib/metabase/index.js";

async function prompts() {
  return import("@inquirer/prompts");
}

interface ConnectOptions {
  url?: string;
  apiKey?: string;
  force?: boolean;
}

export async function metabaseConnectCommand(options: ConnectOptions): Promise<void> {
  const nonInteractive = !!(options.url && options.apiKey);

  // Check for existing config
  const existing = loadMetabaseConfig();
  if (existing) {
    if (options.force) {
      console.log(pc.dim("Overwriting existing Metabase configuration"));
    } else if (nonInteractive) {
      console.error(pc.red("Metabase is already configured. Use --force to overwrite."));
      process.exit(1);
    } else {
      const { confirm } = await prompts();
      const overwrite = await confirm({
        message: "Metabase is already configured. Overwrite?",
        default: false,
      });
      if (!overwrite) {
        console.log(pc.yellow("Cancelled."));
        return;
      }
    }
  }

  let url = options.url;
  let apiKey = options.apiKey;

  if (!nonInteractive) {
    const { input, password } = await prompts();

    if (!url) {
      url = await input({
        message: "Metabase URL (e.g. https://metabase.example.com):",
        validate: (v) => {
          try {
            const u = new URL(v);
            if (u.protocol !== "https:" && u.protocol !== "http:") {
              return "URL must use http or https";
            }
            return true;
          } catch {
            return "Enter a valid URL";
          }
        },
      });
    }

    if (!apiKey) {
      apiKey = await password({
        message: "API key:",
      });
    }
  }

  if (!url || !apiKey) {
    console.error(pc.red("Both --url and --api-key are required in non-interactive mode."));
    process.exit(1);
  }

  // Validate URL
  try {
    new URL(url);
  } catch {
    console.error(pc.red(`Invalid URL: ${url}`));
    process.exit(1);
  }

  // Normalize URL (strip trailing slash)
  url = url.replace(/\/+$/, "");

  // Test connectivity
  console.log();
  console.log(pc.dim("Testing connection..."));

  const client = createMetabaseClient({ url, apiKey });

  try {
    const user = await client.getCurrentUser();

    console.log(pc.green("✓ Connected to Metabase"));
    console.log();
    console.log(`  URL:    ${url}`);
    console.log(`  User:   ${user.first_name} ${user.last_name} (${user.email})`);
    console.log(`  Admin:  ${user.is_superuser ? "Yes" : "No"}`);
    console.log();

    // Save config
    saveMetabaseConfig({ url, apiKey });
    console.log(pc.green("✓ Configuration saved to .bon/metabase.yaml"));
    console.log();
    console.log(pc.dim("Explore your Metabase content: bon metabase explore"));
  } catch (err) {
    if (err instanceof MetabaseApiError) {
      if (err.status === 401 || err.status === 403) {
        console.error(pc.red("Authentication failed. Check your API key."));
        console.log();
        console.log(pc.dim("Generate an API key in Metabase:"));
        console.log(pc.dim("  Admin > Settings > Authentication > API Keys"));
      } else {
        console.error(pc.red(`Metabase API error (${err.status}): ${err.message}`));
      }
    } else if (
      err instanceof TypeError &&
      (err.message.includes("fetch") || err.message.includes("ECONNREFUSED"))
    ) {
      console.error(pc.red(`Could not connect to ${url}`));
      console.log(pc.dim("Check the URL and ensure Metabase is running."));
    } else {
      console.error(pc.red(`Connection failed: ${(err as Error).message}`));
    }
    process.exit(1);
  }
}
