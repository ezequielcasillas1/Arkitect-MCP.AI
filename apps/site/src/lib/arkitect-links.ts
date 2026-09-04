export const ARKITECT_RELEASE_VERSION = "2.1.0";

export const GITHUB_REPO_URL = "https://github.com/ezequielcasillas1/Arkitect-MCP.AI";
export const GITHUB_REPO_BLOB_BASE = `${GITHUB_REPO_URL}/blob/master`;
export const GITHUB_RELEASES_URL = `${GITHUB_REPO_URL}/releases`;

export function githubBlobUrl(repoPath: string): string {
  return `${GITHUB_REPO_BLOB_BASE}/${repoPath.replace(/^\/+/, "")}`;
}

export const SITE_DOWNLOAD_URL = "https://arkitect-mcp.com/#install-path";
export const SITE_INSTRUCTIONS_URL = "https://arkitect-mcp.com/instructions";

const BUY_ME_A_COFFEE_HOSTS = new Set(["buymeacoffee.com", "www.buymeacoffee.com"]);

/** Accepts only https Buy Me a Coffee page URLs. Empty string stays unwired. */
export function parseBuyMeACoffeeUrl(raw: string | undefined): string {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) {
    return "";
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:") {
      return "";
    }
    if (!BUY_ME_A_COFFEE_HOSTS.has(parsed.hostname.toLowerCase())) {
      return "";
    }
    if (!parsed.pathname || parsed.pathname === "/") {
      return "";
    }
    return parsed.href;
  } catch {
    return "";
  }
}

const DEFAULT_BUYMEACOFFEE_URL = "https://www.buymeacoffee.com/casiezeq";

export const BUYMEACOFFEE_URL = parseBuyMeACoffeeUrl(
  import.meta.env.VITE_BUY_ME_A_COFFEE_URL || DEFAULT_BUYMEACOFFEE_URL
);
export const isBuyMeACoffeeWired = BUYMEACOFFEE_URL.length > 0;
