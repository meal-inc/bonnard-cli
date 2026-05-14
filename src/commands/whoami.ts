import pc from "picocolors";
import { loadCredentials } from "../lib/credentials.js";
import { get } from "../lib/api.js";

interface WhoamiOptions {
  verify?: boolean;
}

export async function whoamiCommand(options: WhoamiOptions = {}) {
  const credentials = loadCredentials();
  const hasEnvToken = !!process.env.BON_TOKEN;

  if (!credentials && !hasEnvToken) {
    console.log(pc.yellow("Not logged in."));
    console.log(pc.dim("Run `bon login` or set BON_TOKEN."));
    process.exit(1);
  }

  if (options.verify || hasEnvToken) {
    try {
      const result = (await get("/api/cli/whoami")) as { email: string; orgName?: string };
      console.log(pc.green(`Logged in as ${result.email}`));
      if (hasEnvToken && !credentials) {
        console.log(pc.dim("(via BON_TOKEN)"));
      }
      if (result.orgName) {
        console.log(pc.dim(`Organization: ${result.orgName}`));
      }
    } catch {
      console.log(pc.red("Session expired or invalid."));
      console.log(pc.dim("Run `bon login` to re-authenticate."));
      process.exit(1);
    }
  } else {
    console.log(pc.green(`Logged in as ${credentials!.email}`));
    console.log(pc.dim("Use --verify to check if session is still valid."));
  }
}
