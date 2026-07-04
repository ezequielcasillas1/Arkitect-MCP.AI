import { createHash } from "node:crypto";
import { createReadStream, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { app } from "electron";

export interface IntegrityManifest {
  version: number;
  generatedAt: string;
  files: Record<string, string>;
}

function hashFile(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
}

export async function verifyIntegrity(): Promise<{ ok: true } | { ok: false; reason: string }> {
  const appPath = app.getAppPath();
  const manifestPath = join(appPath, "dist-electron", "integrity-manifest.json");

  if (!existsSync(manifestPath)) {
    return { ok: false, reason: "Integrity manifest missing." };
  }

  let manifest: IntegrityManifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as IntegrityManifest;
  } catch {
    return { ok: false, reason: "Integrity manifest is unreadable." };
  }

  if (!manifest.files || typeof manifest.files !== "object") {
    return { ok: false, reason: "Integrity manifest is invalid." };
  }

  for (const [relativePath, expectedHash] of Object.entries(manifest.files)) {
    const fullPath = join(appPath, relativePath);

    if (!existsSync(fullPath)) {
      return { ok: false, reason: `Missing protected file: ${relativePath}` };
    }

    const actualHash = await hashFile(fullPath);
    if (actualHash !== expectedHash) {
      return { ok: false, reason: `Integrity check failed for ${relativePath}` };
    }
  }

  return { ok: true };
}
