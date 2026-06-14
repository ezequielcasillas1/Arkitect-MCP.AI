import type { ArchitectureCatalogEntry, DesignPatternCatalogEntry, RemixProfileCatalogEntry } from "./catalog.js";
import type { DiagnosisResult } from "./diagnosis.js";

export interface McpTextContent {
  type: "text";
  text: string;
}

export interface McpJsonContent {
  type: "json";
  json: unknown;
}

export type McpToolContent = McpTextContent | McpJsonContent;

export interface ArkitectMcpToolResult {
  content: McpToolContent[];
}

export interface ArkitectMcpToolDefinition<TInput = unknown> {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  execute: (input: TInput) => Promise<ArkitectMcpToolResult>;
}

export interface ArkitectMcpResource {
  uri: string;
  name: string;
  description: string;
}

export interface DiagnosisMcpPayload {
  summary: string;
  diagnosis: DiagnosisResult;
  cursorGuidance: string[];
}

export interface CatalogMcpPayload<TEntry> {
  summary: string;
  total: number;
  items: TEntry[];
}

export interface LibraryMcpPayload {
  architectures: CatalogMcpPayload<ArchitectureCatalogEntry>;
  remixProfiles: CatalogMcpPayload<RemixProfileCatalogEntry>;
  designPatterns: CatalogMcpPayload<DesignPatternCatalogEntry>;
}
