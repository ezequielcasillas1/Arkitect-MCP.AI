# Future: Arkitect Licensing Worker

**When:** After MCP/API community testing is stable. Before or at paid membership launch.

**Why:** Stripe webhooks, license validation, entitlements, and optional GitHub OAuth callback hosting on `arkitect-mcp.com`.

**Worker:** `arkitect-licensing-worker` (`apps/licensing-worker`)

---

## Publish (deploy)

```powershell
cd C:\Dev\Arkitect-mcp.com\apps\licensing-worker
pnpm install
pnpm deploy
```

Routes (from `wrangler.jsonc`):

- `arkitect-mcp.com/oauth/*`
- `arkitect-mcp.com/webhooks/*`
- `arkitect-mcp.com/licenses/*`
- `arkitect-mcp.com/entitlements/*`

---

## Acquire / configure (secrets + vars)

Run from `apps/licensing-worker` after GitHub OAuth app + Stripe are registered.

```powershell
# Stripe (membership phase)
npx wrangler secret put STRIPE_WEBHOOK_SECRET

# GitHub OAuth (when moving off PAT-only flow)
npx wrangler vars set GITHUB_OAUTH_CLIENT_ID "your_client_id"
npx wrangler secret put GITHUB_OAUTH_CLIENT_SECRET

# Redeploy after vars/secrets change
pnpm deploy
```

Local dev secrets: copy `.dev.vars.example` → `.dev.vars` (never commit).

---

## Verify

```powershell
curl https://arkitect-mcp.com/oauth/github/config
curl -X POST https://arkitect-mcp.com/licenses/validate -H "content-type: application/json" -d "{\"licenseKey\":\"ark_test\",\"machineFingerprint\":\"test-machine-01\"}"
```

Expect OAuth config `configured: true` once client ID + secret are set. License route returns placeholder validation until Stripe is wired.

---

## GitHub OAuth app (when enabled)

| Field | Value |
|-------|--------|
| Homepage URL | `https://arkitect-mcp.com` |
| Callback URL | `https://arkitect-mcp.com/oauth/github/callback` |
| Device Flow | Enabled |

---

## Scope note

Defer this worker until membership. Community MCP testing uses desktop + `arkitect-mcp` stdio; PAT-based GitHub connect is enough for early demos.
