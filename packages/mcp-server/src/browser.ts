import { getCatalogCounts, createRefactoringCatalogPayload } from "@arkitect/core";
import {
  assembleMcpServer,
  createMcpResources,
  createMcpToolTemplates,
  type ArkitectMcpServer
} from "./mcp-tool-definitions.js";

const stubExecute = async () => ({
  content: [{ type: "json" as const, json: {} }]
});

export type { ArkitectMcpServer };

export function createArkitectMcpServer(): ArkitectMcpServer {
  const counts = {
    ...getCatalogCounts(),
    refactoringTechniques: createRefactoringCatalogPayload().total
  };
  const tools = createMcpToolTemplates().map((template) => ({
    ...template,
    execute: stubExecute
  }));

  return assembleMcpServer(tools, createMcpResources(counts));
}

export const arkitectMcpServer = createArkitectMcpServer();

export { toDiagnosisMcpPayload } from "./diagnosis-payload.js";
export { toRefactoringMcpPayload } from "./refactoring-payload.js";
