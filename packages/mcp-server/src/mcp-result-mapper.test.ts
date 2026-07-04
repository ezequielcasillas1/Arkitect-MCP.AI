import { describe, expect, it } from "vitest";
import { toMcpToolResult } from "./mcp-result-mapper.js";

describe("toMcpToolResult", () => {
  it("adds structuredContent when the tool result carries a json content item", () => {
    const result = toMcpToolResult({
      content: [{ type: "json", json: { summary: "ok", total: 2 } }]
    });

    expect(result.content).toEqual([{ type: "text", text: JSON.stringify({ summary: "ok", total: 2 }, null, 2) }]);
    expect(result.structuredContent).toEqual({ summary: "ok", total: 2 });
  });

  it("omits structuredContent for text-only results", () => {
    const result = toMcpToolResult({ content: [{ type: "text", text: "hello" }] });

    expect(result.content).toEqual([{ type: "text", text: "hello" }]);
    expect(result).not.toHaveProperty("structuredContent");
  });

  it("omits structuredContent when the json payload is not a plain object", () => {
    const arrayResult = toMcpToolResult({ content: [{ type: "json", json: ["a", "b"] }] });
    const primitiveResult = toMcpToolResult({ content: [{ type: "json", json: "just a string" }] });

    expect(arrayResult).not.toHaveProperty("structuredContent");
    expect(primitiveResult).not.toHaveProperty("structuredContent");
  });
});
