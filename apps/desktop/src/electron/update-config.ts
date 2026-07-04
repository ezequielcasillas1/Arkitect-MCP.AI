export const DEFAULT_UPDATE_REPO_OWNER = "ezequielcasillas1";
export const DEFAULT_UPDATE_REPO_NAME = "Arkitect-MCP.AI";
export const UPDATE_INSTALLER_ASSET_NAME = "Arkitect-Setup.exe";

export interface UpdateRepoConfig {
  owner: string;
  repo: string;
  installerAssetName: string;
}

export function resolveUpdateRepoConfig(): UpdateRepoConfig {
  return {
    owner: process.env.ARKITECT_UPDATE_REPO_OWNER ?? DEFAULT_UPDATE_REPO_OWNER,
    repo: process.env.ARKITECT_UPDATE_REPO_NAME ?? DEFAULT_UPDATE_REPO_NAME,
    installerAssetName: process.env.ARKITECT_UPDATE_ASSET_NAME ?? UPDATE_INSTALLER_ASSET_NAME
  };
}
