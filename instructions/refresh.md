# Refresh Guide

- Track bugs, regressions, and failing behavior only.
- Keep entries short and focused on the broken surface and expected behavior.
- Do not mark anything successful here.
- Report architectural drift as a finding first; refactor only after an explicit command.

{
- Cursor API "Connected" in Vite browser tab was mock-only — real keys need Electron window (fixed in desktop-bridge; verify after user test).
- AI connection state does not auto-restore on reload — user must click Test connection even when session key is restored.
}
