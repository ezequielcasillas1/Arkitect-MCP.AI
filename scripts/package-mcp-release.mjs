import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const mcpPkgPath = join(rootDir, "packages/mcp-server/package.json");
const version = JSON.parse(readFileSync(mcpPkgPath, "utf8")).version;
const outDir = join(rootDir, "dist-release");
const portableDir = join(outDir, `arkitect-mcp-server-${version}-portable`);
const tgzName = `arkitect-mcp-server-${version}.tgz`;
const zipName = `arkitect-mcp-server-${version}-portable.zip`;

function run(command, options = {}) {
  execSync(command, { stdio: "inherit", cwd: rootDir, ...options });
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

run("pnpm --filter @arkitect/mcp-server... build");
run(`pnpm pack --pack-destination "${outDir}"`, { cwd: join(rootDir, "packages/mcp-server") });
run(`pnpm --filter @arkitect/mcp-server deploy --prod --legacy "${portableDir}"`);

writeFileSync(
  join(portableDir, "README.txt"),
  [
    "Arkitect MCP Server (portable bundle)",
    "",
    "Requires Node.js 18+ on PATH.",
    "",
    "Run:",
    "  Windows: run-mcp.bat",
    "  macOS/Linux: ./run-mcp.sh",
    "",
    "Cursor MCP config (.cursor/mcp.json):",
    '  "command": "node",',
    `  "args": ["<extract-path>/dist/stdio.js"]`
  ].join("\n")
);

writeFileSync(
  join(portableDir, "run-mcp.bat"),
  '@echo off\r\nnode "%~dp0dist\\stdio.js" %*\r\n'
);
writeFileSync(join(portableDir, "run-mcp.sh"), '#!/usr/bin/env sh\nexec node "$(dirname "$0")/dist/stdio.js" "$@"\n');

if (process.platform === "win32") {
  run(
    `powershell -NoProfile -Command "Compress-Archive -Path '${portableDir}' -DestinationPath '${join(outDir, zipName)}' -Force"`
  );
} else {
  run(`zip -r "${join(outDir, zipName)}" "${portableDir}"`);
}

console.log(`\nMCP release artifacts (${version}):`);
console.log(`  ${join(outDir, tgzName)}`);
console.log(`  ${join(outDir, zipName)}`);
