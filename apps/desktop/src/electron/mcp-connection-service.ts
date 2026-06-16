import type { BrowserWindow } from "electron";
import type { McpConnectionState, McpServerLaunchConfig } from "@arkitect/contracts";
import { createDefaultMcpConnectionState } from "@arkitect/contracts";
import { McpBridgeServer } from "./mcp-bridge-server.js";
import { McpClientManager } from "./mcp-client-manager.js";
import { loadMcpLaunchConfig, saveMcpLaunchConfig } from "./mcp-config-store.js";

export class McpConnectionService {
  private bridge = new McpBridgeServer({
    onStateChange: (state) => this.handleBridgeExternalState(state),
    getBaseState: () => this.getState()
  });
  private manualClient = new McpClientManager();
  private state = createDefaultMcpConnectionState();
  private mainWindow: BrowserWindow | null = null;
  private defaultRepoPath?: string;
  private preferManualMode = false;

  async start() {
    this.manualClient.setOnStateChange((state) => this.handleManualState(state));

    await this.bridge.start();
    this.state = createDefaultMcpConnectionState({
      bridgePort: this.bridge.manifest.port,
      message: `Bridge listening on 127.0.0.1:${this.bridge.manifest.port}.`
    });
    this.emitState();
  }

  async stop() {
    await this.manualClient.disconnect(false);
    await this.bridge.stop();
  }

  attachWindow(window: BrowserWindow | null) {
    this.mainWindow = window;
    this.emitState();
  }

  setDefaultRepoPath(repoPath?: string) {
    this.defaultRepoPath = repoPath;
  }

  getState(): McpConnectionState {
    return this.state;
  }

  async getLaunchConfig() {
    return loadMcpLaunchConfig();
  }

  async saveLaunchConfig(config: McpServerLaunchConfig) {
    const saved = await saveMcpLaunchConfig(config);
    this.state = {
      ...this.state,
      launchConfig: saved
    };
    this.emitState();
    return saved;
  }

  async connectManual(config: McpServerLaunchConfig) {
    this.preferManualMode = false;
    this.bridge.clearExternalSession();
    await this.manualClient.connect(config, this.defaultRepoPath, this.bridge.manifest.port);
    return this.getState();
  }

  async switchToManualMode() {
    this.preferManualMode = true;
    const launchConfig = this.state.launchConfig;

    await this.manualClient.disconnect(false);
    this.bridge.clearExternalSession();

    this.state = createDefaultMcpConnectionState({
      bridgePort: this.bridge.manifest.port,
      launchConfig,
      message: "Switched to manual mode. Configure launch settings and connect manually."
    });
    this.emitState();

    return this.getState();
  }

  async disconnect() {
    const wasExternal = this.state.path === "external";

    await this.manualClient.disconnect(!wasExternal);
    this.bridge.clearExternalSession();
    this.preferManualMode = false;

    if (wasExternal) {
      this.state = createDefaultMcpConnectionState({
        bridgePort: this.bridge.manifest.port,
        launchConfig: this.state.launchConfig,
        message: "MCP disconnected."
      });
      this.emitState();
    }

    return this.getState();
  }

  async ping() {
    if (this.state.path === "manual") {
      return this.manualClient.ping();
    }

    if (this.state.path === "external" && this.state.health.lastPingAt) {
      this.state = {
        ...this.state,
        health: {
          ...this.state.health,
          lastPingAt: new Date().toISOString()
        }
      };
      this.emitState();
    }

    return this.getState();
  }

  getBridgeManifest() {
    return this.bridge.manifest;
  }

  private handleManualState(state: McpConnectionState) {
    this.state = {
      ...state,
      bridgePort: this.bridge.manifest.port,
      launchConfig: state.launchConfig ?? this.state.launchConfig
    };
    this.emitState();
  }

  private handleBridgeExternalState(state: McpConnectionState) {
    if (this.preferManualMode) {
      return;
    }

    if (this.state.path === "manual" && this.state.status === "connected") {
      return;
    }

    this.state = {
      ...state,
      bridgePort: this.bridge.manifest.port,
      launchConfig: this.state.launchConfig
    };
    this.emitState();
  }

  private emitState() {
    this.mainWindow?.webContents.send("arkitect:mcp-state-changed", this.state);
  }
}

let service: McpConnectionService | null = null;

export function getMcpConnectionService() {
  if (!service) {
    service = new McpConnectionService();
  }

  return service;
}
