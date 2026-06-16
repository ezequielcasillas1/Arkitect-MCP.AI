#!/usr/bin/env node
import type { ArkitectMcpToolResult, McpToolContent } from "@arkitect/contracts";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import { createArkitectMcpServer, readArkitectMcpResource } from "./index.js";
import { registerWithDesktopBridge } from "./desktop-bridge-client.js";

function toMcpToolContent(content: McpToolContent) {
  if (content.type === "text") {
    return { type: "text" as const, text: content.text };
  }

  return { type: "text" as const, text: JSON.stringify(content.json, null, 2) };
}

function toMcpToolResult(result: ArkitectMcpToolResult) {
  return {
    content: result.content.map(toMcpToolContent)
  };
}

async function main() {
  const arkitect = createArkitectMcpServer();

  const server = new Server(
    {
      name: arkitect.info.name,
      version: arkitect.info.version
    },
    {
      capabilities: {
        tools: {},
        resources: {}
      }
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: arkitect.tools.map(({ name, description, inputSchema, outputSchema }) => ({
      name,
      description,
      inputSchema,
      outputSchema
    }))
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const tool = arkitect.tools.find((entry) => entry.name === request.params.name);
    if (!tool) {
      throw new Error(`Unknown tool: ${request.params.name}`);
    }

    const result = await tool.execute(request.params.arguments ?? {});
    return toMcpToolResult(result);
  });

  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: arkitect.resources.map(({ uri, name, description }) => ({
      uri,
      name,
      description,
      mimeType: "application/json"
    }))
  }));

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const payload = await readArkitectMcpResource(request.params.uri);

    return {
      contents: [
        {
          uri: request.params.uri,
          mimeType: "application/json",
          text: JSON.stringify(payload, null, 2)
        }
      ]
    };
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  void registerWithDesktopBridge({
    serverName: arkitect.info.name,
    serverVersion: arkitect.info.version,
    tools: arkitect.tools.map(({ name, description }) => ({ name, description })),
    resources: arkitect.resources.map(({ uri, name, description }) => ({ name, description, uri }))
  }).then((registration) => {
    if (registration) {
      console.error(
        `[arkitect-mcp] Registered with desktop bridge (session ${registration.sessionId}).`
      );
    }
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
