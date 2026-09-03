import type { CursorMcpJson, CursorMcpServerEntry } from "@arkitect/contracts";

export function mergeCursorMcpServers(
  existing: CursorMcpJson | null | undefined,
  serverName: string,
  entry: CursorMcpServerEntry
): CursorMcpJson {
  return {
    mcpServers: {
      ...(existing?.mcpServers ?? {}),
      [serverName]: entry
    }
  };
}
