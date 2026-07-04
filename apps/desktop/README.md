# @arkitect/desktop

Electron wizard for Arkitect: repo connection, architecture policy, AI/MCP settings, and results.

## Local dev

```powershell
pnpm dev:desktop
```

## Build Windows installer (Arkitect-Setup.exe)

From repo root (Git Bash or PowerShell):

```bash
pnpm install
pnpm build:desktop:installer
```

Output: `apps/desktop/release/Arkitect-Setup.exe`

### Prerequisites

- Windows x64
- Node 22+ and pnpm 11+
- First run downloads Electron binaries via electron-builder (network required)

### Code signing

The default config produces an **unsigned** installer. Windows SmartScreen may warn until you sign with an Authenticode certificate (`CSC_LINK` / `CSC_KEY_PASSWORD` env vars for electron-builder).

## Protection (anti-tamper)

Packaged builds enable integrity checks by default. Dev mode skips them unless you opt in.

| Variable | Default (dev) | Default (packaged) | Effect |
|----------|---------------|--------------------|--------|
| `ARKITECT_PROTECTION_ENABLED` | `false` | `true` | Master switch |
| `ARKITECT_PROTECTION_INTEGRITY` | off | on | SHA-256 manifest check on startup; exits if files were altered |
| `ARKITECT_PROTECTION_DEVTOOLS` | off | on | Blocks DevTools / inspect shortcuts |
| `ARKITECT_PROTECTION_LICENSE` | `false` | `false` | Require valid license from licensing worker |
| `ARKITECT_PROTECTION_MACHINE_BIND` | follows license | follows license | Sends machine fingerprint with license validation |
| `ARKITECT_LICENSING_WORKER_URL` | — | — | e.g. `https://licensing.example.workers.dev` |
| `ARKITECT_LICENSE_KEY` | — | — | License key (`ark_…`); or stored in userData |
| `ARKITECT_PROTECTION_TAMPER_MESSAGE` | built-in | built-in | Dialog shown before exit |

`build:installer` runs `generate:integrity` to hash `dist/` + `dist-electron/` into `integrity-manifest.json` before electron-builder packages the app.

**Limitations:** Electron apps can be reverse-engineered. This raises the bar against casual tampering and repackaging; it is not unbreakable DRM.

## Check for updates (in-app)

The desktop sidebar includes **Check for updates**. It queries GitHub Releases for `ezequielcasillas1/Arkitect-MCP.AI`, compares against `app.getVersion()`, and opens `Arkitect-Setup.exe` in the default browser when a newer release is available.

Override repo or asset name at build/runtime:

| Variable | Default |
|----------|---------|
| `ARKITECT_UPDATE_REPO_OWNER` | `ezequielcasillas1` |
| `ARKITECT_UPDATE_REPO_NAME` | `Arkitect-MCP.AI` |
| `ARKITECT_UPDATE_ASSET_NAME` | `Arkitect-Setup.exe` |

This is a manual download flow (no `electron-updater`). Users run the NSIS installer after download.

## GitHub release v0.2.0

After the installer builds locally:

```bash
gh release create v0.2.0 \
  apps/desktop/release/Arkitect-Setup.exe \
  --title "Arkitect v0.2.0" \
  --notes "Pattern Intelligence MCP tools, refactoring Guru slice, workbench auto-fill."
```

Asset URL format (use in Cloudflare Pages):

```
https://github.com/ezequielcasillas1/Arkitect-MCP.AI/releases/download/v0.2.0/Arkitect-Setup.exe
```

## Cloudflare Pages: VITE_DOWNLOAD_URL

In Cloudflare dashboard → Pages → `arkitect-site` → Settings → Environment variables (Production):

| Variable | Value |
|----------|-------|
| `VITE_DOWNLOAD_URL` | `https://github.com/ezequielcasillas1/Arkitect-MCP.AI/releases/download/v0.2.0/Arkitect-Setup.exe` |

Redeploy the site after setting the variable (`pnpm deploy:site` from repo root, or trigger a Pages rebuild).
