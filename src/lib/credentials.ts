import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const CREDENTIALS_DIR = path.join(os.homedir(), ".config", "bon");
const CREDENTIALS_FILE = path.join(CREDENTIALS_DIR, "credentials.json");

export interface Credentials {
  token: string;
  email: string;
}

export function saveCredentials(credentials: Credentials): void {
  fs.mkdirSync(CREDENTIALS_DIR, { recursive: true, mode: 0o700 });
  fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(credentials, null, 2), {
    mode: 0o600,
  });
}

export function loadCredentials(): Credentials | null {
  try {
    const raw = fs.readFileSync(CREDENTIALS_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed.token && parsed.email) {
      return parsed as Credentials;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearCredentials(): void {
  try {
    fs.unlinkSync(CREDENTIALS_FILE);
  } catch {
    // File doesn't exist — nothing to do
  }
}
