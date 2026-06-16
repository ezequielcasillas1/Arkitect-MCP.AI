import type { McpConnectionState, McpServerLaunchConfig } from "@arkitect/contracts";
import { createDefaultMcpConnectionState } from "@arkitect/contracts";
import { hasDesktopBridge } from "./desktop-bridge";

export async function loadMcpConnectionState(): Promise<McpConnectionState> {
  if (hasDesktopBridge() && window.arkitectDesktop?.getMcpConnectionState) {
    return window.arkitectDesktop.getMcpConnectionState();
  }

  return createDefaultMcpConnectionState({
    message: "MCP connection requires the Electron desktop app."
  });
}

export async function loadMcpLaunchConfig(): Promise<McpServerLaunchConfig | null> {
  if (hasDesktopBridge() && window.arkitectDesktop?.getMcpLaunchConfig) {
    return window.arkitectDesktop.getMcpLaunchConfig();
  }

  return null;
}

export async function saveMcpLaunchConfig(config: McpServerLaunchConfig) {
  if (hasDesktopBridge() && window.arkitectDesktop?.saveMcpLaunchConfig) {
    return window.arkitectDesktop.saveMcpLaunchConfig(config);
  }

  return config;
}

export async function connectMcpManual(config: McpServerLaunchConfig) {
  if (hasDesktopBridge() && window.arkitectDesktop?.connectMcpManual) {
    return window.arkitectDesktop.connectMcpManual(config);
  }

  return createDefaultMcpConnectionState({
    status: "error",
    message: "Manual MCP connect requires the Electron desktop app."
  });
}

export async function disconnectMcp() {
  if (hasDesktopBridge() && window.arkitectDesktop?.disconnectMcp) {
    return window.arkitectDesktop.disconnectMcp();
  }

  return createDefaultMcpConnectionState({
    message: "MCP disconnect requires the Electron desktop app."
  });
}

export async function switchMcpToManualMode() {
  if (hasDesktopBridge() && window.arkitectDesktop?.switchMcpToManualMode) {
    return window.arkitectDesktop.switchMcpToManualMode();
  }

  return createDefaultMcpConnectionState({
    message: "Manual mode switch requires the Electron desktop app."
  });
}

export async function pingMcpConnection() {
  if (hasDesktopBridge() && window.arkitectDesktop?.pingMcpConnection) {
    return window.arkitectDesktop.pingMcpConnection();
  }

  return createDefaultMcpConnectionState({
    message: "MCP health check requires the Electron desktop app."
  });
}

export function subscribeMcpConnectionState(onChange: (state: McpConnectionState) => void) {
  if (!hasDesktopBridge() || !window.arkitectDesktop?.onMcpConnectionStateChange) {
    return () => undefined;
  }

  return window.arkitectDesktop.onMcpConnectionStateChange(onChange);
}

export function formatMcpStatusLabel(state: McpConnectionState) {
  if (state.status === "connected") {
    return state.path === "external" ? "Connected via MCP" : "Connected (manual)";
  }

  if (state.status === "connecting") {
    return "Connecting…";
  }

  if (state.status === "error") {
    return "Connection error";
  }

  return "Disconnected";
}

export function formatMcpHealthTimestamp(value?: string) {
  if (!value) {
    return "Never";
  }

  return new Date(value).toLocaleString();
}
