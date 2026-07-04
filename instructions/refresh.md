# Refresh Guide

- Track bugs, regressions, and failing behavior only.
- Keep entries short and focused on the broken surface and expected behavior.
- Do not mark anything successful here.
- Report architectural drift as a finding first; refactor only after an explicit command.

{
- Cursor API "Connected" in Vite browser tab was mock-only — real keys need Electron window (fixed in desktop-bridge; verify after user test).
- AI connection state does not auto-restore on reload — user must click Test connection even when session key is restored.
- MCP `structuredContent` fix applied in packages/mcp-server/src/mcp-result-mapper.ts + dist rebuilt, but the live `arkitect-mcp` stdio process still runs the old build — needs a Cursor MCP restart, then re-test `list_design_patterns`/etc. via CallMcpTool before calling this closed.
}
