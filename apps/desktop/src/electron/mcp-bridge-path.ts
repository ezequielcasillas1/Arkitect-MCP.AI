import { homedir } from "node:os";
import { join } from "node:path";

export function getBridgeManifestPath() {
  if (process.platform === "win32") {
    return join(
      process.env.LOCALAPPDATA || join(homedir(), "AppData", "Local"),
      "arkitect-desktop",
      "mcp-bridge.json"
    );
  }

  return join(process.env.XDG_CONFIG_HOME || join(homedir(), ".config"), "arkitect-desktop", "mcp-bridge.json");
}
