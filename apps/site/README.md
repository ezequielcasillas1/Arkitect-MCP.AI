# @arkitect/site

Marketing/SaaS site for Arkitect: landing page (pricing, free-for-first-1000 download counter) and a
Reviews page (visitor feedback CRUD). See `supabase/README.md` for the data layer status.

**Full tutorial:** [docs/USER_GUIDE.md](../../docs/USER_GUIDE.md)

## Local dev

```powershell
pnpm dev:site
```

## Cloudflare Pages deployment readiness

- Static Vite build output: `apps/site/dist` (`pnpm --filter @arkitect/site build`).
- SPA client-side routing fallback: `public/_redirects` (`/* /index.html 200`).
- `wrangler.jsonc` sets `pages_build_output_dir` for `wrangler pages deploy`.
- Cloudflare Pages dashboard project settings (if using Git integration instead of the CLI):
  root directory `apps/site`, build command `pnpm install --frozen-lockfile && pnpm --filter @arkitect/site build`
  (run from repo root), output directory `dist`.
- Set `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` as Pages environment variables (values are
  publishable, safe to set in the dashboard).
- Set `VITE_DOWNLOAD_URL` to the public GitHub release asset URL after publishing
  `Arkitect-Setup.exe`. Committed default: `apps/site/.env.production` (v0.2.0 until v0.2.1 is on GitHub).
  For Cloudflare Pages Git integration, mirror the same value in dashboard → Environment variables.
- **Custom domain** (`arkitect-mcp.com`): attach in Cloudflare dashboard → Pages → `arkitect-site` →
  Custom domains, or after first deploy via dashboard. `apps/licensing-worker` reserves
  `/oauth/*`, `/webhooks/*`, `/licenses/*`, `/entitlements/*` as Worker routes — no conflict with Pages
  on the root domain.
- **Auth/deploy (local, off VPN):** `npx wrangler login` then `pnpm deploy:production` from this
  package (or `pnpm deploy:site` from repo root). Set `VITE_SUPABASE_*` in Pages env vars first.
