import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);

function resolveSqlite3Dir() {
  try {
    return dirname(require.resolve("sqlite3/package.json"));
  } catch {
    return undefined;
  }
}

const sqlite3Dir = resolveSqlite3Dir();

if (!sqlite3Dir) {
  process.exit(0);
}

const binaryPath = join(sqlite3Dir, "build", "Release", "node_sqlite3.node");

if (existsSync(binaryPath)) {
  process.exit(0);
}

const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
const result = spawnSync(npmCmd, ["run", "install"], {
  cwd: sqlite3Dir,
  stdio: "inherit",
  env: {
    ...process.env,
    NODE_OPTIONS: [process.env.NODE_OPTIONS, "--use-system-ca"].filter(Boolean).join(" ")
  }
});

if (result.status !== 0) {
  console.warn("[ensure-sqlite3] sqlite3 native build skipped or failed. Cursor diagnosis worker may fail until rebuilt.");
}
