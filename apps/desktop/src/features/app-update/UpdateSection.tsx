import { useState } from "react";
import type { AppUpdateCheckResult } from "../../lib/app-update-types";
import { checkForAppUpdateViaBridge, openAppUpdateDownloadViaBridge } from "../../lib/desktop-bridge";

interface UpdateSectionProps {
  isElectron: boolean;
}

type UpdateUiStatus = "idle" | "checking" | "ready" | "error";

function formatVersionLabel(version: string | undefined): string {
  return version ? `v${version.replace(/^v/i, "")}` : "unknown";
}

export function UpdateSection({ isElectron }: UpdateSectionProps) {
  const [status, setStatus] = useState<UpdateUiStatus>("idle");
  const [result, setResult] = useState<AppUpdateCheckResult | null>(null);
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  async function handleCheckForUpdates() {
    if (!isElectron) {
      return;
    }

    setStatus("checking");
    setActionMessage("");

    const response = await checkForAppUpdateViaBridge();
    setResult(response);
    setStatus(response.ok ? "ready" : "error");
  }

  async function handleDownloadUpdate() {
    if (!result?.ok) {
      return;
    }

    const targetUrl = result.downloadUrl ?? result.releaseUrl;

    if (!targetUrl) {
      setActionMessage("No download URL is available for this release.");
      return;
    }

    setDownloadBusy(true);
    setActionMessage("");

    const openResult = await openAppUpdateDownloadViaBridge(targetUrl);
    setActionMessage(
      openResult.ok
        ? "Opened the GitHub release page. Install is clone, build, and mcp.json — not a Windows installer."
        : openResult.message ?? "Failed to open the release page."
    );
    setDownloadBusy(false);
  }

  const currentVersion = result?.currentVersion;
  const latestVersion = result?.ok ? result.latestVersion : undefined;
  const updateAvailable = result?.ok ? result.updateAvailable : false;

  return (
    <div className="sidebar-update panel-surface">
      <span className="metric-label">Software updates</span>
      <p className="sidebar-copy">
        {isElectron
          ? "Check GitHub Releases for a newer source build. There is no Windows installer."
          : "Updates are git pull plus a local MCP rebuild."}
      </p>

      {currentVersion ? (
        <p className="sidebar-copy">
          Installed: <strong>{formatVersionLabel(currentVersion)}</strong>
          {latestVersion ? (
            <>
              {" "}
              · Latest: <strong>{formatVersionLabel(latestVersion)}</strong>
            </>
          ) : null}
        </p>
      ) : null}

      {status === "ready" && result?.ok && !result.updateAvailable ? (
        <p className="sidebar-copy update-status-ok">You are on the latest version.</p>
      ) : null}

      {status === "ready" && updateAvailable ? (
        <p className="sidebar-copy update-status-available">A newer source build is available.</p>
      ) : null}

      {status === "error" && result && !result.ok ? (
        <p className="sidebar-copy update-status-error">{result.error.message}</p>
      ) : null}

      {actionMessage ? <p className="sidebar-copy">{actionMessage}</p> : null}

      <div className="sidebar-update-actions">
        <button
          className="ghost-button"
          disabled={!isElectron || status === "checking"}
          onClick={() => void handleCheckForUpdates()}
          type="button"
        >
          {status === "checking" ? "Checking…" : "Check for updates"}
        </button>

        {status === "ready" && updateAvailable ? (
          <button
            className="primary-button"
            disabled={downloadBusy}
            onClick={() => void handleDownloadUpdate()}
            type="button"
          >
            {downloadBusy ? "Opening GitHub…" : "Open GitHub"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
