export const DEFAULT_UPDATE_REPO_OWNER = "ezequielcasillas1";
export const DEFAULT_UPDATE_REPO_NAME = "Arkitect-MCP.AI";

export interface UpdateRepoConfig {
  owner: string;
  repo: string;
}

export function resolveUpdateRepoConfig(): UpdateRepoConfig {
  return {
    owner: process.env.ARKITECT_UPDATE_REPO_OWNER ?? DEFAULT_UPDATE_REPO_OWNER,
    repo: process.env.ARKITECT_UPDATE_REPO_NAME ?? DEFAULT_UPDATE_REPO_NAME
  };
}
