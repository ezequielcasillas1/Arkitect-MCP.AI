import type { ArkitectMcpToolResult, McpJsonContent, McpToolContent } from "@arkitect/contracts";

export function toMcpToolContent(content: McpToolContent) {
  if (content.type === "text") {
    return { type: "text" as const, text: content.text };
  }

  return { type: "text" as const, text: JSON.stringify(content.json, null, 2) };
}

/**
 * Per the MCP spec, a tool result must carry `structuredContent` (a plain object)
 * whenever the tool declares an `outputSchema`. Arkitect tool handlers already
 * produce a single `{ type: "json", json }` content item shaped to match their
 * `outputSchema`, so we lift that object out here rather than requiring every
 * tool to assemble both representations itself.
 */
export function extractStructuredContent(result: ArkitectMcpToolResult): Record<string, unknown> | undefined {
  const jsonContent = result.content.find((item): item is McpJsonContent => item.type === "json");

  if (!jsonContent || typeof jsonContent.json !== "object" || jsonContent.json === null || Array.isArray(jsonContent.json)) {
    return undefined;
  }

  return jsonContent.json as Record<string, unknown>;
}

export function toMcpToolResult(result: ArkitectMcpToolResult) {
  const structuredContent = extractStructuredContent(result);

  return {
    content: result.content.map(toMcpToolContent),
    ...(structuredContent ? { structuredContent } : {})
  };
}
