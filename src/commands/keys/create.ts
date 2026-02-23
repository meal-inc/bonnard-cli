import pc from "picocolors";
import { post } from "../../lib/api.js";

interface CreateOptions {
  name: string;
  type: string;
}

export async function keysCreateCommand(options: CreateOptions) {
  const { name, type } = options;

  if (type !== "publishable" && type !== "secret") {
    console.error(pc.red("Error: --type must be 'publishable' or 'secret'"));
    process.exit(1);
  }

  try {
    const result = (await post("/api/web/keys", { name, type })) as {
      key: string;
      id: string;
      keyPrefix: string;
      name: string;
      createdAt: string;
    };

    console.log(pc.green("Key created successfully."));
    console.log();
    console.log(pc.bold("  Name:  ") + result.name);
    console.log(pc.bold("  Type:  ") + type);
    console.log(pc.bold("  Key:   ") + result.key);
    console.log();
    console.log(
      pc.yellow("⚠ Save this key now — it won't be shown again.")
    );
  } catch (err) {
    console.error(pc.red(`Error: ${(err as Error).message}`));
    process.exit(1);
  }
}
