export interface McpToolEntry {
  name: string;
  purpose: string;
  usage: string;
  example: string;
}

export interface McpToolGroup {
  id: string;
  label: string;
  title: string;
  intro: string;
  tools: McpToolEntry[];
}

export interface McpVersionEntry {
  version: string;
  releaseDate: string | null;
  status: "released" | "milestone" | "upcoming";
  title: string;
  summary: string;
  highlights: string[];
}
