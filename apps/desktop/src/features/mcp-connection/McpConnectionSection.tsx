import { useEffect, useMemo, useState } from "react";
import type { McpConnectionState, McpCursorInstallResult, McpServerLaunchConfig } from "@arkitect/contracts";
import { createDefaultMcpLaunchConfig } from "@arkitect/contracts";
import { InfoHint } from "../../components/InfoHint";
import {
  connectMcpManual,
  disconnectMcp,
  switchMcpToManualMode,
  formatMcpHealthTimestamp,
  formatMcpStatusLabel,
  installMcpInCursor,
  loadMcpConnectionState,
  loadMcpLaunchConfig,
  pingMcpConnection,
  saveMcpLaunchConfig,
  subscribeMcpConnectionState
} from "../../lib/mcp-bridge";
import type { RuntimeShellInfo } from "../../lib/desktop-bridge";

interface McpConnectionSectionProps {
  shellInfo: RuntimeShellInfo | null;
  defaultRepoPath?: string;
}

function parseEnvInput(value: string) {
  const env: Record<string, string> = {};

  for (const line of value.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");

    if (separator <= 0) {
      continue;
    }

    env[trimmed.slice(0, separator).trim()] = trimmed.slice(separator + 1).trim();
  }

  return env;
}

function stringifyEnvInput(env: Record<string, string>) {
  return Object.entries(env)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
}

export function McpConnectionSection({ shellInfo, defaultRepoPath }: McpConnectionSectionProps) {
  const [connectionState, setConnectionState] = useState<McpConnectionState | null>(null);
  const [launchConfig, setLaunchConfig] = useState<McpServerLaunchConfig>(() => createDefaultMcpLaunchConfig());
  const [argsInput, setArgsInput] = useState("packages/mcp-server/dist/stdio.js");
  const [envInput, setEnvInput] = useState("ARKITECT_ANALYZER=mock");
  const [busy, setBusy] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [installResult, setInstallResult] = useState<McpCursorInstallResult | null>(null);

  const isElectron = shellInfo?.runtime === "electron";
  const isExternalSession = connectionState?.path === "external" && connectionState.status === "connected";
  const statusClass =
    connectionState?.status === "connected"
      ? "status-visible"
      : connectionState?.status === "error"
        ? "status-attention"
        : "status-attention";

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const [state, savedConfig] = await Promise.all([loadMcpConnectionState(), loadMcpLaunchConfig()]);
      const config = savedConfig ?? createDefaultMcpLaunchConfig();

      if (cancelled) {
        return;
      }

      setConnectionState(state);
      setLaunchConfig(config);
      setArgsInput(config.args.join(" "));
      setEnvInput(stringifyEnvInput(config.env));
    }

    void hydrate();

    const unsubscribe = subscribeMcpConnectionState((state) => {
      if (!cancelled) {
        setConnectionState(state);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const connectionLabel = useMemo(
    () => (connectionState ? formatMcpStatusLabel(connectionState) : "Loading…"),
    [connectionState]
  );

  async function handleSaveConfig() {
    setBusy(true);
    setSaveMessage("");

    try {
      const nextConfig: McpServerLaunchConfig = {
        ...launchConfig,
        args: argsInput
          .split(/\s+/)
          .map((item) => item.trim())
          .filter(Boolean),
        env: parseEnvInput(envInput)
      };

      const saved = await saveMcpLaunchConfig(nextConfig);
      setLaunchConfig(saved);
      setSaveMessage("Launch settings saved.");
    } finally {
      setBusy(false);
    }
  }

  async function handleConnect() {
    setBusy(true);

    try {
      const config: McpServerLaunchConfig = {
        ...launchConfig,
        args: argsInput
          .split(/\s+/)
          .map((item) => item.trim())
          .filter(Boolean),
        env: {
          ...parseEnvInput(envInput),
          ARKITECT_DEFAULT_REPO_PATH: defaultRepoPath ?? parseEnvInput(envInput).ARKITECT_DEFAULT_REPO_PATH
        }
      };

      const state = await connectMcpManual(config);
      setConnectionState(state);
    } finally {
      setBusy(false);
    }
  }

  async function handleDisconnect() {
    setBusy(true);

    try {
      const state = await disconnectMcp();
      setConnectionState(state);
    } finally {
      setBusy(false);
    }
  }

  async function handleSwitchToManual() {
    setBusy(true);

    try {
      const state = await switchMcpToManualMode();
      setConnectionState(state);
    } finally {
      setBusy(false);
    }
  }

  async function handlePing() {
    setBusy(true);

    try {
      const state = await pingMcpConnection();
      setConnectionState(state);
    } finally {
      setBusy(false);
    }
  }

  async function handleInstallInCursor() {
    setBusy(true);
    setInstallResult(null);

    try {
      const result = await installMcpInCursor({
        repoPath: defaultRepoPath ?? connectionState?.config.defaultRepoPath,
        env: parseEnvInput(envInput)
      });
      setInstallResult(result);
    } finally {
      setBusy(false);
    }
  }

  async function handleCopyInstallLink() {
    if (!installResult?.deeplink) {
      return;
    }

    await navigator.clipboard.writeText(installResult.deeplink);
    setInstallResult((current) =>
      current ? { ...current, message: `${current.message} Link copied to clipboard.` } : current
    );
  }

  return (
    <section className="section-card">
      <div className="section-header">
        <div>
          <p className="section-label">MCP Connection</p>
          <h2>Dual-path MCP bridge</h2>
        </div>
        <span className={`status-pill ${statusClass}`}>{connectionLabel}</span>
      </div>

      <p className="summary-copy">
        Connect manually from this dashboard or let Cursor (or another MCP host) register the stdio server with the
        local bridge while Arkitect Desktop is running.
      </p>

      {!isElectron ? (
        <div className="warning-box">
          <strong>Electron required</strong>
          <p>Run `pnpm dev:desktop` and use the Electron window to manage live MCP connections.</p>
        </div>
      ) : null}

      <div className="metric-grid">
        <article className="metric-card">
          <span className="metric-label">Connection path</span>
          <strong>{connectionState?.path ?? "none"}</strong>
          <p>{connectionState?.message ?? "Waiting for bridge state…"}</p>
        </article>
        <article className="metric-card">
          <span className="metric-label">Server</span>
          <strong>{connectionState?.serverName ?? "Not connected"}</strong>
          <p>
            {connectionState?.serverVersion ? `v${connectionState.serverVersion}` : "—"} ·{" "}
            {connectionState?.toolCount ?? 0} tools · {connectionState?.resourceCount ?? 0} resources
          </p>
        </article>
        <article className="metric-card">
          <span className="metric-label">Bridge / health</span>
          <strong>
            {connectionState?.bridgePort ? `127.0.0.1:${connectionState.bridgePort}` : "Bridge unavailable"}
          </strong>
          <p>
            Last ping: {formatMcpHealthTimestamp(connectionState?.health.lastPingAt)}
            {connectionState?.health.latencyMs != null ? ` · ${connectionState.health.latencyMs}ms` : ""}
          </p>
          {connectionState?.health.lastError ? (
            <p className="helper-copy">{connectionState.health.lastError}</p>
          ) : null}
        </article>
      </div>

      <div className="step-grid">
        <article className="panel-card">
          <div className="section-header">
            <div>
              <span className="metric-label">Manual connect</span>
              <h3>Dashboard launch</h3>
            </div>
            <InfoHint label="Manual MCP launch">
              Spawns the MCP server from Electron and lists tools/resources directly.
            </InfoHint>
          </div>

          <div className="form-stack">
            <label htmlFor="mcp-command">
              <span className="metric-label">Command</span>
              <input
                id="mcp-command"
                onChange={(event) => setLaunchConfig((current) => ({ ...current, command: event.target.value }))}
                type="text"
                value={launchConfig.command}
              />
            </label>

            <label htmlFor="mcp-args">
              <span className="metric-label">Args</span>
              <input id="mcp-args" onChange={(event) => setArgsInput(event.target.value)} type="text" value={argsInput} />
            </label>

            <label htmlFor="mcp-env">
              <span className="metric-label">Env (KEY=value per line)</span>
              <textarea id="mcp-env" onChange={(event) => setEnvInput(event.target.value)} rows={4} value={envInput} />
            </label>

          <label className="checkbox-row">
            <input
              checked={launchConfig.useProjectMcpJson}
              onChange={(event) =>
                setLaunchConfig((current) => ({ ...current, useProjectMcpJson: event.target.checked }))
              }
              type="checkbox"
            />
            <span>Use project `.cursor/mcp.json` when available</span>
          </label>

          <div className="step-actions">
            <button className="ghost-button" disabled={busy || !isElectron} onClick={() => void handleSaveConfig()} type="button">
              Save launch settings
            </button>
            <button
              className="primary-button"
              disabled={busy || !isElectron || connectionState?.status === "connected"}
              onClick={() => void handleConnect()}
              type="button"
            >
              Connect manually
            </button>
            <button
              className="ghost-button"
              disabled={busy || !isElectron || connectionState?.status === "disconnected"}
              onClick={() => void handleDisconnect()}
              type="button"
            >
              Disconnect
            </button>
            <button className="ghost-button" disabled={busy || !isElectron} onClick={() => void handlePing()} type="button">
              Ping health
            </button>
          </div>

          {saveMessage ? <p className="helper-copy">{saveMessage}</p> : null}
          </div>
        </article>

        <article className="panel-card">
          <div className="section-header">
            <div>
              <span className="metric-label">Connect via MCP</span>
              <h3>External registration</h3>
            </div>
            <InfoHint label="External MCP registration">
              When Cursor enables arkitect-mcp, stdio registers with the local bridge automatically.
            </InfoHint>
          </div>

          <p className="helper-copy">
            Keep Arkitect Desktop open. Click <strong>Install in Cursor</strong> to write <code>.cursor/mcp.json</code>{" "}
            and open Cursor&apos;s MCP install prompt. The stdio server reads{" "}
            <code>%LOCALAPPDATA%/arkitect-desktop/mcp-bridge.json</code> and posts register/heartbeat events to the
            bridge on port {connectionState?.bridgePort ?? 47821}.
          </p>

          <div className="step-actions">
            <button
              className="primary-button"
              disabled={busy || !isElectron}
              onClick={() => void handleInstallInCursor()}
              type="button"
            >
              Install in Cursor
            </button>
          </div>

          {installResult ? (
            <div className={installResult.ok ? "panel-card" : "warning-box"}>
              <strong>{installResult.ok ? "Cursor install ready" : "Install blocked"}</strong>
              <p className="helper-copy">{installResult.message}</p>
              {installResult.mcpJsonPath ? (
                <p className="helper-copy">
                  Config: <code>{installResult.mcpJsonPath}</code>
                </p>
              ) : null}
              {!installResult.stdioBuilt ? (
                <p className="helper-copy">
                  Run <code>pnpm --filter @arkitect/mcp-server build</code> before connecting.
                </p>
              ) : null}
              {installResult.deeplink ? (
                <div className="step-actions">
                  <button className="ghost-button" disabled={busy} onClick={() => void handleCopyInstallLink()} type="button">
                    Copy install link
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          {isExternalSession ? (
            <div className="warning-box">
              <strong>External session active</strong>
              <p>
                Session {connectionState.externalSessionId} · connected{" "}
                {connectionState.connectedAt ? formatMcpHealthTimestamp(connectionState.connectedAt) : "recently"}
              </p>
              <p className="helper-copy">
                Cursor registered this MCP session automatically. Switch back to manual mode to launch and control the
                server from this dashboard.
              </p>
              <div className="step-actions">
                <button
                  aria-label="Switch to manual connection mode"
                  className="primary-button"
                  disabled={busy || !isElectron}
                  onClick={() => void handleSwitchToManual()}
                  type="button"
                >
                  Back to manual connection
                </button>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <strong>No external MCP session</strong>
              <p>
                {connectionState?.message?.includes("manual mode")
                  ? connectionState.message
                  : "Start Arkitect Desktop, then reload MCP tools in Cursor."}
              </p>
            </div>
          )}
        </article>
      </div>

      <div className="step-grid">
        <article className="panel-card">
          <span className="metric-label">Available tools</span>
          {connectionState?.tools.length ? (
            <ul className="tight-list">
              {connectionState.tools.map((tool) => (
                <li key={tool.name}>
                  <strong>{tool.name}</strong>
                  {tool.description ? ` — ${tool.description}` : ""}
                </li>
              ))}
            </ul>
          ) : (
            <p className="helper-copy">Connect an MCP server to list tools.</p>
          )}
        </article>

        <article className="panel-card">
          <span className="metric-label">Available resources</span>
          {connectionState?.resources.length ? (
            <ul className="tight-list">
              {connectionState.resources.map((resource) => (
                <li key={resource.uri ?? resource.name}>
                  <strong>{resource.name}</strong>
                  {resource.uri ? ` (${resource.uri})` : ""}
                  {resource.description ? ` — ${resource.description}` : ""}
                </li>
              ))}
            </ul>
          ) : (
            <p className="helper-copy">Connect an MCP server to list resources.</p>
          )}
        </article>
      </div>

      <article className="panel-card">
        <span className="metric-label">Runtime configuration (read-only)</span>
        <div className="dual-form-grid">
          <div>
            <span className="metric-label">Default repo path</span>
            <p>{connectionState?.config.defaultRepoPath ?? defaultRepoPath ?? "Not set"}</p>
          </div>
          <div>
            <span className="metric-label">Analyzer mode</span>
            <p>{connectionState?.config.analyzerMode ?? "mock"}</p>
          </div>
        </div>
        <ul className="tight-list">
          {(connectionState?.config.policyOverridesReadOnly ?? []).map((policy) => (
            <li key={policy}>{policy}</li>
          ))}
        </ul>
      </article>
    </section>
  );
}
