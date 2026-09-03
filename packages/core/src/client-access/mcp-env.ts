export function buildClientMcpEnv(input: {
  clientRepoPath: string;
  hostRepoPath?: string;
  extraEnv?: Record<string, string>;
  analyzer?: "mock" | "real";
}): Record<string, string> {
  const extra = input.extraEnv ?? {};
  const reserved = new Set(["ARKITECT_ANALYZER", "ARKITECT_DEFAULT_REPO_PATH", "ARKITECT_HOST_REPO_PATH"]);

  return {
    ARKITECT_ANALYZER: input.analyzer === "real" || extra.ARKITECT_ANALYZER === "real" ? "real" : "mock",
    ...(input.clientRepoPath ? { ARKITECT_DEFAULT_REPO_PATH: input.clientRepoPath } : {}),
    ...(input.hostRepoPath ? { ARKITECT_HOST_REPO_PATH: input.hostRepoPath } : {}),
    ...Object.fromEntries(Object.entries(extra).filter(([key]) => !reserved.has(key)))
  };
}
