import pc from "picocolors";
import { loadCredentials } from "../lib/credentials.js";
import { get } from "../lib/api.js";

interface WhoamiOptions {
  verify?: boolean;
}

export async function whoamiCommand(options: WhoamiOptions = {}) {
  const credentials = loadCredentials();

  if (!credentials) {
    console.log(pc.yellow("Not logged in."));
    console.log(pc.dim("Run `bon login` to authenticate."));
    process.exit(1);
  }

  if (options.verify) {
    // Verify token is still valid by calling the API
    try {
      const result = (await get("/api/cli/whoami")) as { email: string; orgName?: string };
      console.log(pc.green(`Logged in as ${result.email}`));
      if (result.orgName) {
        console.log(pc.dim(`Organization: ${result.orgName}`));
      }
    } catch (err) {
      console.log(pc.red("Session expired or invalid."));
      console.log(pc.dim("Run `bon login` to re-authenticate."));
      process.exit(1);
    }
  } else {
    // Just show cached credentials (no API call)
    console.log(pc.green(`Logged in as ${credentials.email}`));
    console.log(pc.dim("Use --verify to check if session is still valid."));
  }
}
