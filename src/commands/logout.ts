import pc from "picocolors";
import { clearCredentials } from "../lib/credentials.js";

export async function logoutCommand() {
  clearCredentials();
  console.log(pc.green("Logged out"));
}
