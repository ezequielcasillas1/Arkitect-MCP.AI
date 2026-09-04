export interface InstallStep {
  title: string;
  body: string;
  command?: string;
}

export interface McpJsonFactoryInput {
  clientRepoPath?: string;
  hostRepoPath?: string;
  stdioPath?: string;
  analyzer?: "mock" | "real";
}
