// Cube configuration for self-hosted Bonnard.
// Model files are loaded from the shared Docker volume.
const fs = require("fs");
const path = require("path");

const MODEL_DIR = process.env.CUBEJS_SCHEMA_PATH || "/cube/conf/model";
const VERSION_FILE = path.join(MODEL_DIR, ".version");

module.exports = {
  // Check for model changes every 30 seconds.
  // When schemaVersion changes, Cube recompiles all models.
  scheduledRefreshTimer: 30,

  schemaVersion: () => {
    try {
      return fs.readFileSync(VERSION_FILE, "utf-8").trim();
    } catch {
      return "initial";
    }
  },
};
