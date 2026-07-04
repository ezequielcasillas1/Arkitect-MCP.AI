import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { AiDiagnosisEnrichment } from "@arkitect/contracts";
import { resolveMcpNodeCommand, withMcpNodeSpawnEnv } from "./mcp-runtime-paths.js";

const electronDir = dirname(fileURLToPath(import.meta.url));

function resolveCursorSdkWorkerPath() {
  const candidates = [
    join(electronDir, "cursor-sdk-worker.js"),
    join(process.cwd(), "apps/desktop/dist-electron/cursor-sdk-worker.js"),
    join(process.cwd(), "dist-electron/cursor-sdk-worker.js")
  ];

  return candidates.find((candidate) => existsSync(candidate)) ?? candidates[0];
}

export async function runCursorDiagnosisViaWorker(request: {
  facts: unknown;
  credentials: unknown;
  apiKey: string;
  repoPath: string;
}): Promise<AiDiagnosisEnrichment> {
  const workerPath = resolveCursorSdkWorkerPath();
  const command = resolveMcpNodeCommand();
  const env = {
    ...process.env,
    NODE_OPTIONS: [process.env.NODE_OPTIONS, "--use-system-ca"].filter(Boolean).join(" "),
    ...withMcpNodeSpawnEnv({})
  };

  return new Promise((resolve, reject) => {
    const child = spawn(command, [workerPath], {
      env,
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer | string) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer | string) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (!stdout.trim()) {
        reject(new Error(stderr.trim() || `cursor-sdk-worker exited with code ${code ?? "unknown"}`));
        return;
      }

      try {
        resolve(JSON.parse(stdout) as AiDiagnosisEnrichment);
      } catch {
        reject(new Error(stderr.trim() || stdout.trim() || "Invalid cursor-sdk-worker response."));
      }
    });

    child.stdin.write(
      JSON.stringify({
        type: "diagnose",
        ...request
      })
    );
    child.stdin.end();
  });
}
