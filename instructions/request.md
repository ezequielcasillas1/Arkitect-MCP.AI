# Request Guide

1. Continue inside a healthy detected architecture automatically and surface that decision in results.
2. Report drift or spaghetti structure without refactoring or migration unless the user explicitly asks.
3. Keep Arkitect local-repo-first, provider-agnostic, Cloudflare-first, and Stripe-backed for licensing.
4. Prefer vertical slices and modular package boundaries for new implementation work.
5. Keep implementation notes concise in `implementations.md`.
6. Keep the encoded architecture, remix, and pattern catalog shared across contracts, core, MCP, and desktop.

7. Chat-driven MCP auto-configuration — user describes MCP servers in chat; Arkitect parses intent and writes/updates MCP launch config.
- Detect stdio vs remote transport, command, args, env from natural language.
- Preview config diff before apply; require explicit confirm in desktop UI.
- Reuse MCP Connection step state; do not mix with Cursor API key (AI / Execution) flow.
- Fall back to manual edit when parsing is ambiguous.

8. Dual-path UX — equivalent routes through Cursor chat or Arkitect desktop; flexible A→B→C routing, not one rigid funnel.
- Chat path: user drives in Cursor chat; Arkitect MCP returns decisions; Cursor AI implements.
- Desktop path: guided wizard (repo → profile → policy → AI/MCP → review → results) with manual MCP connection UI.
- Shared core (contracts, catalog, diagnosis) across MCP, desktop, and chat; either path reaches same outcomes.
- Allow path mixing (connect in desktop, decide in chat) without forcing linear wizard completion.
- Connection layer built (stdio + `.cursor/mcp.json` + desktop bridge); full chat orchestration loop and cross-path parity pending.

9. Licensing worker (deferred) — deploy after MCP/community testing; Stripe + entitlements on Cloudflare.
- See `instructions/future-licensing-worker.md` for deploy, secrets, and verify commands.
- Desktop GitHub OAuth (device flow + repo/branch picker) lives in Electron; Cloudflare worker deferred.

10. Scope-based requirement tag suggestions — derive tags from repo inspection + diagnosis signals.
- Core `suggestRequirementTags` API; included in diagnosis payload and MCP `suggest_requirement_tags` tool.
- Desktop Architecture Policy shows suggested chips with apply-one / apply-all actions.
- AI enrichment of tag suggestions deferred until provider flow is wired.

11. Marketing site: download counter + reviews — extend `apps/site` with pricing/CTA and feedback.
- Two vertical slices (`features/download-counter`, `features/reviews`), own types/data-access/UI.
- Counter: "free for first 1,000" claim, Supabase-backed, capped + dedup'd, milestone progress bar.
- Reviews: public submit + list, Supabase RLS, per-visitor rate-limit trigger, "connect with me" links.
- Data-access gateways swap mock/Supabase by env config; Cloudflare Pages build/deploy readiness added.
- Needs real beaver logo asset and real contact links from Ezequiel (placeholders used for now).
