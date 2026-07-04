export const ARKITECT_RELEASE_VERSION = "0.2.1";

export const GITHUB_REPO_URL = "https://github.com/ezequielcasillas1/Arkitect-MCP.AI";
export const GITHUB_REPO_BLOB_BASE = `${GITHUB_REPO_URL}/blob/master`;
export const GITHUB_RELEASES_URL = `${GITHUB_REPO_URL}/releases`;

export function githubBlobUrl(repoPath: string): string {
  return `${GITHUB_REPO_BLOB_BASE}/${repoPath.replace(/^\/+/, "")}`;
}

export const GITHUB_INSTALLER_URL = `${GITHUB_REPO_URL}/releases/download/v${ARKITECT_RELEASE_VERSION}/Arkitect-Setup.exe`;
export const SITE_DOWNLOAD_URL = "https://arkitect-mcp.com/#download-counter-heading";
export const SITE_INSTRUCTIONS_URL = "https://arkitect-mcp.com/instructions";
