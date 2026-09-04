# Refresh Guide

- Track bugs, regressions, and failing behavior only.
- Keep entries short and focused on the broken surface and expected behavior.
- Do not mark anything successful here.
- Report architectural drift as a finding first; refactor only after an explicit command.

{
- Cloudflare Pretty URLs: rewrite to a differently named .html 308s the request (app.html → /app). Cached 308 sent `/` to /app. SPA HTML must sit at the request pretty path (folder/index.html).
- `/architecture` 308s to itself (empty body). `architecture.html` plus rewrite `/architecture → /architecture.html` Pretty-URL loops. Serve `architecture/index.html`; do not rewrite to `architecture.html`.
- Cursor API "Connected" in Vite browser tab was mock-only — real keys need Electron window (fixed in desktop-bridge; verify after user test).
- AI connection state does not auto-restore on reload — user must click Test connection even when session key is restored.
- MCP `structuredContent` fix applied in packages/mcp-server/src/mcp-result-mapper.ts + dist rebuilt, but the live `arkitect-mcp` stdio process still runs the old build — needs a Cursor MCP restart, then re-test `list_design_patterns`/etc. via CallMcpTool before calling this closed.
- Scoring picks one foundation then pays remix 1.8/1.6 for containing it — AI-Native wins on any modular-monolith repo. Score a legal triple (foundation/internal/edge); remix names that triple. relatedArchitectures must fill other roles. Guide rejects are foundation-scoped. Do not use host AI/MCP prose or substring ai/workspace/domain. Platform confirm must use the desktop hint, not auto unknown.
}
