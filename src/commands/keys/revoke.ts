import pc from "picocolors";
import { get, del } from "../../lib/api.js";

interface ApiKey {
  id: string;
  key_prefix: string;
  name: string;
  last_used_at: string | null;
  created_at: string;
}

export async function keysRevokeCommand(nameOrPrefix: string) {
  try {
    // Fetch all keys to find the match
    const result = (await get("/api/web/keys")) as {
      publishableKeys: ApiKey[];
      secretKeys: ApiKey[];
    };

    // Search by name or prefix across both types
    let match: ApiKey | undefined;
    let type: "publishable" | "secret" | undefined;

    for (const k of result.publishableKeys) {
      if (k.name === nameOrPrefix || k.key_prefix.startsWith(nameOrPrefix)) {
        match = k;
        type = "publishable";
        break;
      }
    }

    if (!match) {
      for (const k of result.secretKeys) {
        if (k.name === nameOrPrefix || k.key_prefix.startsWith(nameOrPrefix)) {
          match = k;
          type = "secret";
          break;
        }
      }
    }

    if (!match || !type) {
      console.error(pc.red(`No key found matching "${nameOrPrefix}".`));
      console.error(pc.dim("Use `bon keys list` to see available keys."));
      process.exit(1);
    }

    await del(`/api/web/keys/${match.id}?type=${type}`);

    console.log(
      pc.green(`Revoked ${type} key "${match.name}" (${match.key_prefix}...).`)
    );
  } catch (err) {
    console.error(pc.red(`Error: ${(err as Error).message}`));
    process.exit(1);
  }
}
