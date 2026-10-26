export const ARKITECT_RELEASE_VERSION = "2.1.0";

export const GITHUB_REPO_URL = "https://github.com/ezequielcasillas1/Arkitect-MCP.AI";
export const GITHUB_REPO_BLOB_BASE = `${GITHUB_REPO_URL}/blob/master`;
export const GITHUB_RELEASES_URL = `${GITHUB_REPO_URL}/releases`;

export function githubBlobUrl(repoPath: string): string {
  return `${GITHUB_REPO_BLOB_BASE}/${repoPath.replace(/^\/+/, "")}`;
}

export const SITE_DOWNLOAD_URL = "https://arkitect-mcp.com/#install-path";
export const SITE_INSTRUCTIONS_URL = "https://arkitect-mcp.com/instructions";

export const BLUESKY_PROFILE_URL = "https://bsky.app/profile/casiezeq.bsky.social";
export const BLUESKY_HANDLE = "@casiezeq";
