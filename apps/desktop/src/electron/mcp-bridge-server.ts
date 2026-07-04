import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { mkdir, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { dirname } from "node:path";
import type {
  McpBridgeManifest,
  McpConnectionState,
  McpExternalHeartbeat,
  McpExternalRegistration,
  WorkbenchIntakeApplyRequest,
  WorkbenchIntakeApplyResponse
} from "@arkitect/contracts";
import { createDefaultMcpConnectionState, DEFAULT_MCP_BRIDGE_PORT } from "@arkitect/contracts";
import { getBridgeManifestPath } from "./mcp-bridge-path.js";

const externalStaleMs = 45_000;

interface BridgeServerOptions {
  port?: number;
  onStateChange: (state: McpConnectionState) => void;
  getBaseState: () => McpConnectionState;
  onIntakeReceived?: (payload: WorkbenchIntakeApplyRequest) => void;
}

function sendJson(response: ServerResponse, statusCode: number, body: unknown) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "http://127.0.0.1:5173",
    "Access-Control-Allow-Headers": "Content-Type, X-Arkitect-Bridge-Token"
  });
  response.end(JSON.stringify(body));
}

function readBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    request.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    request.on("error", reject);
  });
}

export class McpBridgeServer {
  private server: Server | null = null;
  private token = "";
  private port = DEFAULT_MCP_BRIDGE_PORT;
  private externalSession: McpExternalRegistration | null = null;
  private externalLastSeen = 0;
  private staleTimer: NodeJS.Timeout | null = null;
  private pendingIntake: WorkbenchIntakeApplyRequest | null = null;
  private pendingIntakeReceivedAt?: string;
  private readonly onStateChange: (state: McpConnectionState) => void;
  private readonly getBaseState: () => McpConnectionState;
  private readonly onIntakeReceived?: (payload: WorkbenchIntakeApplyRequest) => void;

  constructor(options: BridgeServerOptions) {
    this.onStateChange = options.onStateChange;
    this.getBaseState = options.getBaseState;
    this.onIntakeReceived = options.onIntakeReceived;
    this.port = options.port ?? DEFAULT_MCP_BRIDGE_PORT;
  }

  get manifest(): McpBridgeManifest {
    return {
      port: this.port,
      token: this.token,
      updatedAt: new Date().toISOString()
    };
  }

  async start() {
    this.token = randomBytes(24).toString("hex");

    this.server = createServer((request, response) => {
      void this.handleRequest(request, response);
    });

    await this.bindListenPort();
    await this.persistManifest();

    this.staleTimer = setInterval(() => this.evictStaleExternalSession(), 10_000);
  }

  private bindListenPort(): Promise<void> {
    const preferredPort = this.port;
    const candidates = [preferredPort];

    for (let offset = 1; offset <= 10; offset += 1) {
      candidates.push(preferredPort + offset);
    }

    candidates.push(0);

    return new Promise((resolve, reject) => {
      const attempt = (index: number) => {
        if (index >= candidates.length) {
          reject(new Error(`Unable to bind MCP bridge after ${candidates.length} attempts.`));
          return;
        }

        const port = candidates[index];

        const onError = (error: NodeJS.ErrnoException) => {
          if (error.code === "EADDRINUSE") {
            attempt(index + 1);
            return;
          }

          reject(error);
        };

        this.server?.once("error", onError);
        this.server?.listen(port, "127.0.0.1", () => {
          this.server?.removeListener("error", onError);
          const address = this.server?.address();

          if (address && typeof address === "object") {
            this.port = address.port;
          }

          resolve();
        });
      };

      attempt(0);
    });
  }

  async stop() {
    if (this.staleTimer) {
      clearInterval(this.staleTimer);
      this.staleTimer = null;
    }

    this.externalSession = null;

    await new Promise<void>((resolve) => {
      if (!this.server) {
        resolve();
        return;
      }

      this.server.close(() => resolve());
    });

    this.server = null;
  }

  clearExternalSession() {
    this.externalSession = null;
    this.externalLastSeen = 0;
  }

  getPendingIntake() {
    return {
      pending: this.pendingIntake,
      receivedAt: this.pendingIntakeReceivedAt
    };
  }

  clearPendingIntake() {
    this.pendingIntake = null;
    this.pendingIntakeReceivedAt = undefined;
  }

  private async persistManifest() {
    const manifestPath = getBridgeManifestPath();
    await mkdir(dirname(manifestPath), { recursive: true });
    await writeFile(manifestPath, JSON.stringify(this.manifest, null, 2), "utf8");
  }

  private isAuthorized(request: IncomingMessage) {
    const header = request.headers["x-arkitect-bridge-token"];
    const token = Array.isArray(header) ? header[0] : header;
    return token === this.token;
  }

  private evictStaleExternalSession() {
    if (!this.externalSession) {
      return;
    }

    if (Date.now() - this.externalLastSeen <= externalStaleMs) {
      return;
    }

    this.externalSession = null;
    const base = this.getBaseState();

    if (base.path === "external") {
      this.onStateChange(
        createDefaultMcpConnectionState({
          bridgePort: this.port,
          message: "External MCP session timed out."
        })
      );
    }
  }

  private publishExternalState(message: string) {
    if (!this.externalSession) {
      return;
    }

    const now = new Date().toISOString();

    this.onStateChange({
      status: "connected",
      path: "external",
      message,
      serverName: this.externalSession.serverName,
      serverVersion: this.externalSession.serverVersion,
      toolCount: this.externalSession.tools.length,
      resourceCount: this.externalSession.resources.length,
      tools: this.externalSession.tools,
      resources: this.externalSession.resources,
      health: {
        lastPingAt: now
      },
      config: {
        analyzerMode: this.externalSession.config?.analyzerMode ?? "mock",
        defaultRepoPath: this.externalSession.config?.defaultRepoPath,
        policyOverridesReadOnly: this.externalSession.config?.policyOverridesReadOnly ?? [
          "Honor user overrides before structural changes.",
          "Do not auto-refactor without explicit migration intent.",
          "Continue inside detected architecture when repo health is stable."
        ]
      },
      bridgePort: this.port,
      externalSessionId: this.externalSession.sessionId,
      connectedAt: now
    });
  }

  private async handleRequest(request: IncomingMessage, response: ServerResponse) {
    if (request.method === "OPTIONS") {
      response.writeHead(204, {
        "Access-Control-Allow-Origin": "http://127.0.0.1:5173",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Arkitect-Bridge-Token"
      });
      response.end();
      return;
    }

    const url = new URL(request.url ?? "/", `http://127.0.0.1:${this.port}`);

    if (url.pathname === "/health") {
      sendJson(response, 200, { ok: true, port: this.port });
      return;
    }

    if (url.pathname === "/state") {
      sendJson(response, 200, this.getBaseState());
      return;
    }

    if (url.pathname === "/intake/pending" && this.isAuthorized(request)) {
      sendJson(response, 200, this.getPendingIntake());
      return;
    }

    if (request.method !== "POST" || !this.isAuthorized(request)) {
      sendJson(response, request.method === "POST" ? 401 : 404, { ok: false });
      return;
    }

    const rawBody = await readBody(request);

    try {
      if (url.pathname === "/register") {
        const body = JSON.parse(rawBody) as McpExternalRegistration;
        this.externalSession = body;
        this.externalLastSeen = Date.now();
        this.publishExternalState(`External MCP registered (${body.serverName}).`);
        sendJson(response, 200, { ok: true });
        return;
      }

      if (url.pathname === "/heartbeat") {
        const body = JSON.parse(rawBody) as McpExternalHeartbeat;

        if (!this.externalSession || this.externalSession.sessionId !== body.sessionId) {
          sendJson(response, 404, { ok: false });
          return;
        }

        this.externalLastSeen = Date.now();
        this.publishExternalState(`External MCP heartbeat (${body.toolCount} tools).`);
        sendJson(response, 200, { ok: true });
        return;
      }

      if (url.pathname === "/intake") {
        const body = JSON.parse(rawBody) as WorkbenchIntakeApplyRequest;

        if (!body.intake || typeof body.intake !== "object") {
          sendJson(response, 400, {
            ok: false,
            appliedAt: new Date().toISOString(),
            message: "Workbench intake payload requires an intake object."
          } satisfies WorkbenchIntakeApplyResponse);
          return;
        }

        const payload: WorkbenchIntakeApplyRequest = {
          ...body,
          source: body.source ?? "cursor-interview",
          intake: body.intake
        };
        this.pendingIntake = payload;
        this.pendingIntakeReceivedAt = new Date().toISOString();
        this.onIntakeReceived?.(payload);

        sendJson(response, 200, {
          ok: true,
          appliedAt: this.pendingIntakeReceivedAt,
          message: "Workbench intake queued for Arkitect Desktop."
        } satisfies WorkbenchIntakeApplyResponse);
        return;
      }

      if (url.pathname === "/intake/clear") {
        this.clearPendingIntake();
        sendJson(response, 200, { ok: true });
        return;
      }

      if (url.pathname === "/disconnect") {
        const body = JSON.parse(rawBody) as { sessionId: string };

        if (this.externalSession?.sessionId === body.sessionId) {
          this.externalSession = null;
          const base = this.getBaseState();

          if (base.path === "external") {
            this.onStateChange(
              createDefaultMcpConnectionState({
                bridgePort: this.port,
                message: "External MCP disconnected."
              })
            );
          }
        }

        sendJson(response, 200, { ok: true });
        return;
      }
    } catch {
      sendJson(response, 400, { ok: false });
      return;
    }

    sendJson(response, 404, { ok: false });
  }
}
