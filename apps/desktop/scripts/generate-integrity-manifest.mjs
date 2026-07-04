import { createHash } from "node:crypto";
import { createReadStream, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const desktopRoot = join(fileURLToPath(import.meta.url), "..", "..");
const roots = ["dist-electron", "dist"];
const skipExtensions = new Set([".map"]);

function hashFile(filePath) {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
}

function walkFiles(rootDir) {
  const files = [];

  function walk(currentDir) {
    for (const entry of readdirSync(currentDir)) {
      const fullPath = join(currentDir, entry);
      const stats = statSync(fullPath);

      if (stats.isDirectory()) {
        walk(fullPath);
        continue;
      }

      if (entry === "integrity-manifest.json") {
        continue;
      }

      const ext = entry.slice(entry.lastIndexOf("."));
      if (skipExtensions.has(ext)) {
        continue;
      }

      files.push(fullPath);
    }
  }

  walk(rootDir);
  return files;
}

const manifestFiles = {};

for (const root of roots) {
  const absoluteRoot = join(desktopRoot, root);

  for (const filePath of walkFiles(absoluteRoot)) {
    const relativePath = relative(desktopRoot, filePath).split(sep).join("/");
    manifestFiles[relativePath] = await hashFile(filePath);
  }
}

const manifest = {
  version: 1,
  generatedAt: new Date().toISOString(),
  files: manifestFiles
};

const outputPath = join(desktopRoot, "dist-electron", "integrity-manifest.json");
writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`[arkitect-desktop] Wrote integrity manifest (${Object.keys(manifestFiles).length} files) -> ${outputPath}`);
