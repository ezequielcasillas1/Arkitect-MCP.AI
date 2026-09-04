export interface InstallStep {
  title: string;
  body: string;
}

export interface McpJsonFactoryInput {
  clientRepoPath?: string;
  hostRepoPath?: string;
  analyzer?: "mock" | "real";
}
