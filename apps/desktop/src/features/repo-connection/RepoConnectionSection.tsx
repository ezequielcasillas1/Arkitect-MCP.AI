import { useState } from "react";
import type { DiagnosisIntake, RepoInspection, SavedProjectProfile } from "@arkitect/contracts";
import { formatShellLabel, type RuntimeShellInfo } from "../../lib/desktop-bridge";

interface RepoConnectionSectionProps {
  draft: DiagnosisIntake;
  inspection?: RepoInspection;
  shellInfo: RuntimeShellInfo | null;
  inspectionBusy: boolean;
  connectionMode: DiagnosisIntake["routeSource"];
  githubToken: string;
  githubOwner: string;
  githubRepo: string;
  githubBranch: string;
  githubConnection: {
    status: "idle" | "connecting" | "success" | "error";
    message: string;
    code?: string;
  };
  projectProfiles: SavedProjectProfile[];
  onConnectionModeChange: (mode: DiagnosisIntake["routeSource"]) => void;
  onGitHubTokenChange: (value: string) => void;
  onGitHubOwnerChange: (value: string) => void;
  onGitHubRepoChange: (value: string) => void;
  onGitHubBranchChange: (value: string) => void;
  onConnectGitHub: () => void;
  onRepoPathChange: (value: string) => void;
  onRepoNameChange: (value: string) => void;
  onRepoSummaryChange: (value: string) => void;
  onRequestedOutcomeChange: (value: string) => void;
  onBrowse: () => void;
  onInspect: () => void;
  onSaveProjectProfile: (name: string, existingId?: string) => void;
  onLoadProjectProfile: (id: string) => void;
  onDuplicateProjectProfile: (id: string) => void;
  onDeleteProjectProfile: (id: string) => void;
}

function getConnectionStatus(
  mode: DiagnosisIntake["routeSource"],
  inspection: RepoInspection | undefined,
  githubConnection: RepoConnectionSectionProps["githubConnection"]
) {
  if (mode === "github-api") {
    if (githubConnection.status === "connecting") {
      return {
        label: "Connecting to GitHub",
        className: "status-attention"
      };
    }

    if (githubConnection.status === "success" && inspection?.source === "github-api") {
      return {
        label: "GitHub route ready",
        className: "status-visible"
      };
    }

    if (githubConnection.status === "error") {
      return {
        label: "GitHub connection failed",
        className: "status-attention"
      };
    }

    return {
      label: "Awaiting GitHub target",
      className: "status-attention"
    };
  }

  if (!inspection) {
    return {
      label: "Awaiting inspection",
      className: "status-attention"
    };
  }

  if (
    inspection.source === "local-path" &&
    inspection.exists &&
    inspection.isDirectory &&
    inspection.validationErrors.length === 0
  ) {
    return {
      label: "Repo ready to test",
      className: "status-visible"
    };
  }

  return {
    label: "Needs attention",
    className: "status-attention"
  };
}

export function RepoConnectionSection({
  draft,
  inspection,
  shellInfo,
  inspectionBusy,
  connectionMode,
  githubToken,
  githubOwner,
  githubRepo,
  githubBranch,
  githubConnection,
  projectProfiles,
  onConnectionModeChange,
  onGitHubTokenChange,
  onGitHubOwnerChange,
  onGitHubRepoChange,
  onGitHubBranchChange,
  onConnectGitHub,
  onRepoPathChange,
  onRepoNameChange,
  onRepoSummaryChange,
  onRequestedOutcomeChange,
  onBrowse,
  onInspect,
  onSaveProjectProfile,
  onLoadProjectProfile,
  onDuplicateProjectProfile,
  onDeleteProjectProfile
}: RepoConnectionSectionProps) {
  const [profileName, setProfileName] = useState("");
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const connectionStatus = getConnectionStatus(connectionMode, inspection, githubConnection);

  return (
    <section className="section-card">
      <div className="section-header">
        <div>
          <p className="section-label">Connect Repo</p>
          <h2>Choose a repo connection route</h2>
        </div>
        <span className={`status-pill ${connectionStatus.className}`}>{connectionStatus.label}</span>
      </div>

      <p className="summary-copy">
        Use a local filesystem path or GitHub API target. Once connected, Arkitect uses the same detection flow for both routes.
      </p>

      <div className="step-grid">
        <article className="panel-card">
          <div className="tab-row">
            <button
              className={`tab-button ${connectionMode === "local-path" ? "tab-button-active" : ""}`}
              onClick={() => onConnectionModeChange("local-path")}
              type="button"
            >
              Local Path
            </button>
            <button
              className={`tab-button ${connectionMode === "github-api" ? "tab-button-active" : ""}`}
              onClick={() => onConnectionModeChange("github-api")}
              type="button"
            >
              GitHub API
            </button>
          </div>

          {connectionMode === "local-path" ? (
            <div className="form-stack">
              <div className="step-actions">
                <button className="primary-button" onClick={onBrowse} type="button">
                  Browse folder
                </button>
                <button className="secondary-button" onClick={onInspect} type="button">
                  {inspectionBusy ? "Inspecting..." : "Inspect path"}
                </button>
              </div>

              <label>
                Local repo path
                <input
                  onChange={(event) => onRepoPathChange(event.target.value)}
                  placeholder="C:\\Dev\\another-project"
                  type="text"
                  value={draft.repoPath}
                />
              </label>
            </div>
          ) : (
            <div className="form-stack">
              <div className="step-actions">
                <button
                  className="primary-button"
                  disabled={githubConnection.status === "connecting"}
                  onClick={onConnectGitHub}
                  type="button"
                >
                  {githubConnection.status === "connecting" ? "Connecting..." : "Connect GitHub repo"}
                </button>
              </div>

              <label>
                GitHub Personal Access Token
                <input
                  autoComplete="off"
                  onChange={(event) => onGitHubTokenChange(event.target.value)}
                  placeholder="ghp_... or github_pat_..."
                  type="password"
                  value={githubToken}
                />
              </label>

              <div className="dual-form-grid">
                <label>
                  Owner
                  <input onChange={(event) => onGitHubOwnerChange(event.target.value)} placeholder="octocat" type="text" value={githubOwner} />
                </label>

                <label>
                  Repo
                  <input onChange={(event) => onGitHubRepoChange(event.target.value)} placeholder="hello-world" type="text" value={githubRepo} />
                </label>
              </div>

              <label>
                Branch (optional)
                <input onChange={(event) => onGitHubBranchChange(event.target.value)} placeholder="main" type="text" value={githubBranch} />
              </label>

              {githubConnection.message ? (
                <div className={githubConnection.status === "error" ? "warning-box" : "empty-state"}>
                  <strong>{githubConnection.status === "error" ? "GitHub route error" : "GitHub route status"}</strong>
                  <p>
                    {githubConnection.message}
                    {githubConnection.code ? ` (${githubConnection.code})` : ""}
                  </p>
                </div>
              ) : (
                <p className="summary-copy">Token is used for this desktop session only and is not saved in presets.</p>
              )}

              {draft.routeSource === "github-api" && draft.githubRoute ? (
                <div className="empty-state">
                  <strong>Connected target</strong>
                  <p>
                    {draft.githubRoute.target.fullName} on {draft.githubRoute.target.branch}
                  </p>
                </div>
              ) : null}
            </div>
          )}

          <div className="form-stack section-spacer">
            <div className="dual-form-grid">
              <label>
                Project label
                <input onChange={(event) => onRepoNameChange(event.target.value)} type="text" value={draft.repoName} />
              </label>

              <label>
                Desktop shell
                <input disabled type="text" value={formatShellLabel(shellInfo)} />
              </label>
            </div>

            <label>
              Repo context summary
              <textarea
                onChange={(event) => onRepoSummaryChange(event.target.value)}
                rows={3}
                value={draft.repoSummary}
              />
            </label>

            <label>
              Requested outcome
              <textarea
                onChange={(event) => onRequestedOutcomeChange(event.target.value)}
                rows={3}
                value={draft.requestedOutcome}
              />
            </label>
          </div>
        </article>

        <article className="panel-card">
          <span className="metric-label">Inspection snapshot</span>
          {inspection ? (
            <div className="inspection-grid">
              <div className="inspection-summary">
                <strong>{inspection.repoName}</strong>
                <p>{inspection.summary}</p>
              </div>

              <div className="tag-row">
                <span className="soft-pill">{inspection.hasGit ? "git detected" : "git missing"}</span>
                {inspection.frameworkHints.map((hint) => (
                  <span className="soft-pill" key={hint}>
                    {hint}
                  </span>
                ))}
              </div>

              <div className="chip-cluster">
                {inspection.manifestFiles.map((fileName) => (
                  <span className="catalog-chip" key={fileName}>
                    {fileName}
                  </span>
                ))}
              </div>

              <div>
                <span className="metric-label">Sample paths</span>
                <div className="chip-cluster">
                  {inspection.samplePaths.length > 0 ? (
                    inspection.samplePaths.map((samplePath) => (
                      <span className="catalog-chip" key={samplePath}>
                        {samplePath}
                      </span>
                    ))
                  ) : (
                    <span className="empty-inline">No sample paths captured yet.</span>
                  )}
                </div>
              </div>

              {inspection.validationErrors.length > 0 ? (
                <div className="warning-box">
                  <strong>Validation issues</strong>
                  <ul className="tight-list">
                    {inspection.validationErrors.map((message) => (
                      <li key={message}>{message}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="empty-state">
              <strong>No project inspected yet</strong>
              <p>Use Browse folder or paste a local path, then inspect it to unlock the rest of the flow.</p>
            </div>
          )}
        </article>
      </div>

      <article className="panel-card section-spacer">
        <div className="section-header compact-header">
          <div>
            <span className="metric-label">Saved project profiles</span>
            <p className="summary-copy">Create, update, duplicate, and delete reusable diagnosis presets for local repos.</p>
          </div>
        </div>

        <div className="preset-form-row">
          <input
            onChange={(event) => setProfileName(event.target.value)}
            placeholder="Preset name"
            type="text"
            value={profileName}
          />
          <button
            className="secondary-button"
            onClick={() => {
              if (!profileName.trim()) {
                return;
              }

              onSaveProjectProfile(profileName.trim(), editingId);
              setProfileName("");
              setEditingId(undefined);
            }}
            type="button"
          >
            {editingId ? "Update preset" : "Save preset"}
          </button>
        </div>

        <div className="preset-grid">
          {projectProfiles.length > 0 ? (
            projectProfiles.map((profile) => (
              <article className="preset-card" key={profile.id}>
                <div className="preset-card-header">
                  <strong>{profile.name}</strong>
                  <span className="soft-pill">{profile.complexityProfile}</span>
                </div>
                <p>{profile.repoName}</p>
                <code className="preset-path">{profile.repoPath}</code>
                <p className="summary-copy">{profile.routeSource === "github-api" ? "GitHub API route" : "Local path route"}</p>
                <div className="preset-actions">
                  <button className="ghost-button" onClick={() => onLoadProjectProfile(profile.id)} type="button">
                    Load
                  </button>
                  <button
                    className="ghost-button"
                    onClick={() => {
                      setEditingId(profile.id);
                      setProfileName(profile.name);
                      onLoadProjectProfile(profile.id);
                    }}
                    type="button"
                  >
                    Load for update
                  </button>
                  <button className="ghost-button" onClick={() => onDuplicateProjectProfile(profile.id)} type="button">
                    Duplicate
                  </button>
                  <button className="ghost-button ghost-button-danger" onClick={() => onDeleteProjectProfile(profile.id)} type="button">
                    Delete
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="empty-state">
              <strong>No saved project profiles yet</strong>
              <p>Save the current repo setup once you have a good local testing preset.</p>
            </div>
          )}
        </div>
      </article>
    </section>
  );
}
