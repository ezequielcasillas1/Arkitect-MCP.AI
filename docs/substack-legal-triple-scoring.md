# Arkitect no longer picks a remix champion

**For:** [casiezeq on Substack](https://substack.com/@casiezeq)  
**Date:** 3 September 2026  
**Product:** Arkitect MCP

---

Arkitect used to answer “what architecture is this repo?” with one winner, then look up which remix *contained* that winner. Modular monolith usually won. AI-Native is the remix that already includes modular monolith, hexagonal, and vertical slice — so it won too, even on a Ghost publication theme.

That was circular. The remix was a magnet, not a reading of the project.

## What changed

Arkitect now scores a **legal triple**, then names it.

- **Foundation** — what you deploy
- **Internal** — how the tree is owned (slices live *inside* the foundation)
- **Edge** — replaceable I/O
- **Supporting** — only if a real signal survives (ledger, saga, strangler, and the like)

A remix is the *name* of that triple. If no named profile covers enough of it, Arkitect leaves remix blank. It will not invent AI-Native because the catalog happens to stack those three styles.

Related styles in the catalog now propose the other two roles. A guide reject means “don’t use event sourcing *as the foundation*” — not “delete the whole family.” Udi, Greg, Azure, and Vernon can still appear when the repo actually needs them.

## Why a Ghost theme looked like an AI product

Three false friends did the damage:

1. Host words in the summary — `ai`, `workspace`, `domain` — were treated as architecture signals. `custom-domain` looked like DDD. `workspace` looked like a modular monolith.
2. Confirming “desktop” copied the auto-detect value `unknown`, then the scorer defaulted to modular monolith + hexagonal again.
3. Tags like `ghost-theme` or `handlebars` never entered the scorer. The only tags that moved the needle were host vocabulary (`ai`, `mcp`, `ledger`, `queue`). Adding Ghost tags was not an escape hatch.

Signals now come from this repo’s outcome and files — not leftover marketing prose, and not a substring hunt for `ai` / `workspace` / `domain`.

## What you should expect

- A theme, a CRUD app, or a single-site publication should not come back as AI-Native unless the work is actually about agents, MCP, or replaceable model providers.
- Desktop confirmation stays desktop.
- `recommend_architecture` and diagnosis now report the four roles. Remix is optional.
- You do not need to lock `selectedArchitectureId` just to stop a bad remix. That override still works. It is no longer the product.

This ships in the Arkitect host (local MCP + desktop). The marketing site on Cloudflare Pages does not run the scorer. After you confirm, rebuild the MCP stdio server and restart it in Cursor so the new ranking is what agents see.
