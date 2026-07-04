import { useEffect, useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import type {
  DiagnosisIntake,
  GitHubBranchOption,
  GitHubOAuthFlowState,
  GitHubOAuthSession,
  GitHubRepositoryOption,
  RepoInspection,
  SavedProjectProfile,
  SavedWorkbenchPreset,
  WorkbenchIntakeApplyRequest
} from "@arkitect/contracts";
import { suggestProjectProfileNames } from "@arkitect/core";
import { formatShellLabel, type RuntimeShellInfo } from "../../lib/desktop-bridge";

interface RepoConnectionSectionProps {
  draft: DiagnosisIntake;
  inspection?: RepoInspection;
  shellInfo: RuntimeShellInfo | null;
  inspectionBusy: boolean;
  connectionMode: DiagnosisIntake["routeSource"];
  githubOAuthConfigured: boolean;
  githubOAuthFlow: GitHubOAuthFlowState;
  githubOAuthSession: GitHubOAuthSession | null;
  githubRepos: GitHubRepositoryOption[];
  githubReposBusy: boolean;
  githubBranches: GitHubBranchOption[];
  githubBranchesBusy: boolean;
  selectedRepoFullName: string;
  githubBranch: string;
  githubToken: string;
  githubOwner: string;
  githubRepo: string;
  githubConnection: {
    status: "idle" | "connecting" | "success" | "error";
    message: string;
    code?: string;
  };
  projectProfiles: SavedProjectProfile[];
  onConnectionModeChange: (mode: DiagnosisIntake["routeSource"]) => void;
  onStartGitHubOAuth: () => void;
  onCancelGitHubOAuth: () => void;
  onDisconnectGitHubOAuth: () => void;
  onSelectedRepoChange: (fullName: string) => void;
  onGitHubBranchChange: (value: string) => void;
  onConnectGitHub: () => void;
  onGitHubTokenChange: (value: string) => void;
  onGitHubOwnerChange: (value: string) => void;
  onGitHubRepoChange: (value: string) => void;
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
  mcpIntakeMessage?: string;
  pendingMcpIntake?: WorkbenchIntakeApplyRequest | null;
  onApplyPendingMcpIntake?: () => void;
  onDismissPendingMcpIntake?: () => void;
  workbenchPresets?: SavedWorkbenchPreset[];
  onApplyWorkbenchPreset?: (presetId: string) => void;
  onApplyAllTestSources?: () => void;
  onSaveWorkbenchPreset?: (name: string) => void;
}

function getConnectionStatus(
  mode: DiagnosisIntake["routeSource"],
  inspection: RepoInspection | undefined,
  githubConnection: RepoConnectionSectionProps["githubConnection"],
  githubOAuthSession: GitHubOAuthSession | null
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

    if (githubOAuthSession?.connected) {
      return {
        label: "GitHub account connected",
        className: "status-visible"
      };
    }

    return {
      label: "Awaiting GitHub sign-in",
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
  githubOAuthConfigured,
  githubOAuthFlow,
  githubOAuthSession,
  githubRepos,
  githubReposBusy,
  githubBranches,
  githubBranchesBusy,
  selectedRepoFullName,
  githubBranch,
  githubToken,
  githubOwner,
  githubRepo,
  githubConnection,
  projectProfiles,
  onConnectionModeChange,
  onStartGitHubOAuth,
  onCancelGitHubOAuth,
  onDisconnectGitHubOAuth,
  onSelectedRepoChange,
  onGitHubBranchChange,
  onConnectGitHub,
  onGitHubTokenChange,
  onGitHubOwnerChange,
  onGitHubRepoChange,
  onRepoPathChange,
  onRepoNameChange,
  onRepoSummaryChange,
  onRequestedOutcomeChange,
  onBrowse,
  onInspect,
  onSaveProjectProfile,
  onLoadProjectProfile,
  onDuplicateProjectProfile,
  onDeleteProjectProfile,
  mcpIntakeMessage,
  pendingMcpIntake,
  onApplyPendingMcpIntake,
  onDismissPendingMcpIntake,
  workbenchPresets = [],
  onApplyWorkbenchPreset,
  onApplyAllTestSources,
  onSaveWorkbenchPreset
}: RepoConnectionSectionProps) {
  const [profileName, setProfileName] = useState("");
  const [workbenchPresetName, setWorkbenchPresetName] = useState("Testing for ARK");
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [showPatFallback, setShowPatFallback] = useState(false);
  const [repoFilter, setRepoFilter] = useState("");
  const connectionStatus = getConnectionStatus(connectionMode, inspection, githubConnection, githubOAuthSession);

  const filteredRepos = useMemo(() => {
    const query = repoFilter.trim().toLowerCase();

    if (!query) {
      return githubRepos;
    }

    return githubRepos.filter(
      (repo) =>
        repo.fullName.toLowerCase().includes(query) ||
        (repo.description?.toLowerCase().includes(query) ?? false)
    );
  }, [githubRepos, repoFilter]);

  const profileNameSuggestions = useMemo(
    () =>
      suggestProjectProfileNames({
        repoName: draft.repoName,
        repoPath: draft.repoPath,
        routeSource: connectionMode,
        githubRoute: draft.githubRoute,
        pendingGitHub:
          connectionMode === "github-api" && selectedRepoFullName
            ? {
                fullName: selectedRepoFullName,
                branch: githubBranch
              }
            : undefined,
        repoInspection: inspection,
        existingProfileNames: projectProfiles.map((profile) => profile.name)
      }),
    [
      connectionMode,
      draft.githubRoute,
      draft.repoName,
      draft.repoPath,
      githubBranch,
      inspection,
      projectProfiles,
      selectedRepoFullName
    ]
  );

  const selectedRepo = githubRepos.find((repo) => repo.fullName === selectedRepoFullName);
  const oauthConnected = Boolean(githubOAuthSession?.connected);
  const awaitingDeviceAuth = githubOAuthFlow.status === "awaiting_user";
  const [deviceCodeCopied, setDeviceCodeCopied] = useState(false);

  useEffect(() => {
    setDeviceCodeCopied(false);
  }, [githubOAuthFlow.device?.userCode, githubOAuthFlow.status]);

  async function handleCopyDeviceCode(userCode: string) {
    try {
      await navigator.clipboard.writeText(userCode);
      setDeviceCodeCopied(true);
      window.setTimeout(() => setDeviceCodeCopied(false), 2000);
    } catch {
      setDeviceCodeCopied(false);
    }
  }

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
        Use a local filesystem path or sign in with GitHub to browse and select a repository.
      </p>

      {mcpIntakeMessage ? (
        <div className="insight-item">
          <strong>MCP interview applied</strong>
          <p>{mcpIntakeMessage}</p>
        </div>
      ) : null}

      {pendingMcpIntake ? (
        <div className="warning-box">
          <strong>Cursor MCP interview ready</strong>
          <p>
            Intake for {pendingMcpIntake.intake.repoName ?? "your project"} is waiting. Apply it to prefill the
            workbench steps gathered in chat.
          </p>
          <div className="step-actions">
            <button className="primary-button" onClick={onApplyPendingMcpIntake} type="button">
              Apply MCP interview
            </button>
            <button className="ghost-button" onClick={onDismissPendingMcpIntake} type="button">
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

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
              GitHub
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
              {!githubOAuthConfigured ? (
                <div className="warning-box">
                  <strong>GitHub OAuth not configured</strong>
                  <p>
                    Copy <code>apps/desktop/github-oauth.config.example.json</code> to{" "}
                    <code>apps/desktop/github-oauth.config.json</code>, then replace the placeholder with your real GitHub
                    OAuth Client ID from{" "}
                    <a href="https://github.com/settings/developers" rel="noreferrer" target="_blank">
                      github.com/settings/developers
                    </a>
                    .
                  </p>
                  <p className="summary-copy">
                    Then from repo root in PowerShell: <code>cd C:\Dev\Arkitect-mcp.com</code>, then{" "}
                    <code>pnpm dev:desktop</code>. Or{" "}
                    <code>$env:GITHUB_OAUTH_CLIENT_ID=&quot;your_id&quot;; pnpm dev:desktop</code> after the same{" "}
                    <code>cd</code>. Restart the desktop app after saving the config.
                  </p>
                </div>
              ) : null}

              {!oauthConnected ? (
                <div className="form-stack">
                  <div className="step-actions">
                    <button
                      className="primary-button"
                      disabled={!githubOAuthConfigured || awaitingDeviceAuth}
                      onClick={onStartGitHubOAuth}
                      type="button"
                    >
                      {awaitingDeviceAuth ? "Waiting for GitHub..." : "Connect with GitHub"}
                    </button>
                    {awaitingDeviceAuth ? (
                      <button className="secondary-button" onClick={onCancelGitHubOAuth} type="button">
                        Cancel
                      </button>
                    ) : null}
                  </div>

                  {awaitingDeviceAuth && githubOAuthFlow.device ? (
                    <div className="empty-state">
                      <strong>Authorize Arkitect on GitHub</strong>
                      <p>
                        Enter this code at{" "}
                        <a href={githubOAuthFlow.device.verificationUri} rel="noreferrer" target="_blank">
                          {githubOAuthFlow.device.verificationUri}
                        </a>
                      </p>
                      <div className="device-code-row">
                        <button
                          className="device-code-value"
                          onClick={() => void handleCopyDeviceCode(githubOAuthFlow.device!.userCode)}
                          title="Click to copy authorization code"
                          type="button"
                        >
                          <code>{githubOAuthFlow.device.userCode}</code>
                        </button>
                        <button
                          className="ghost-button device-code-copy-button"
                          onClick={() => void handleCopyDeviceCode(githubOAuthFlow.device!.userCode)}
                          type="button"
                        >
                          {deviceCodeCopied ? <Check aria-hidden size={16} /> : <Copy aria-hidden size={16} />}
                          {deviceCodeCopied ? "Copied!" : "Copy code"}
                        </button>
                      </div>
                      <p className="summary-copy">A browser tab should open automatically. Finish sign-in there to continue.</p>
                    </div>
                  ) : (
                    <p className="summary-copy">
                      Sign in with GitHub to browse your repositories and pick a branch — no token paste required.
                    </p>
                  )}
                </div>
              ) : (
                <div className="form-stack">
                  <div className="empty-state">
                    <strong>Signed in as {githubOAuthSession?.login}</strong>
                    <p>{githubOAuthSession?.name ?? "GitHub account connected"}</p>
                  </div>

                  <div className="step-actions">
                    <button className="ghost-button" onClick={onDisconnectGitHubOAuth} type="button">
                      Disconnect GitHub
                    </button>
                  </div>

                  <label>
                    Search repositories
                    <input
                      onChange={(event) => setRepoFilter(event.target.value)}
                      placeholder="Filter by name or description"
                      type="search"
                      value={repoFilter}
                    />
                  </label>

                  <label>
                    Repository
                    <select
                      disabled={githubReposBusy}
                      onChange={(event) => onSelectedRepoChange(event.target.value)}
                      value={selectedRepoFullName}
                    >
                      <option value="">{githubReposBusy ? "Loading repositories..." : "Select a repository"}</option>
                      {filteredRepos.map((repo) => (
                        <option key={repo.id} value={repo.fullName}>
                          {repo.fullName}
                          {repo.private ? " (private)" : ""}
                        </option>
                      ))}
                    </select>
                  </label>

                  {selectedRepo?.description ? <p className="summary-copy">{selectedRepo.description}</p> : null}

                  <label>
                    Branch
                    <select
                      disabled={!selectedRepoFullName || githubBranchesBusy}
                      onChange={(event) => onGitHubBranchChange(event.target.value)}
                      value={githubBranch}
                    >
                      <option value="">
                        {!selectedRepoFullName
                          ? "Select a repository first"
                          : githubBranchesBusy
                            ? "Loading branches..."
                            : "Use default branch"}
                      </option>
                      {githubBranches.map((branch) => (
                        <option key={branch.name} value={branch.name}>
                          {branch.name}
                          {branch.protected ? " (protected)" : ""}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="step-actions">
                    <button
                      className="primary-button"
                      disabled={!selectedRepoFullName || githubConnection.status === "connecting"}
                      onClick={onConnectGitHub}
                      type="button"
                    >
                      {githubConnection.status === "connecting" ? "Connecting..." : "Connect selected repository"}
                    </button>
                  </div>
                </div>
              )}

              {githubOAuthFlow.status === "error" && githubOAuthFlow.message ? (
                <div className="warning-box">
                  <strong>GitHub sign-in error</strong>
                  <p>{githubOAuthFlow.message}</p>
                </div>
              ) : null}

              {githubConnection.message ? (
                <div className={githubConnection.status === "error" ? "warning-box" : "empty-state"}>
                  <strong>{githubConnection.status === "error" ? "GitHub route error" : "GitHub route status"}</strong>
                  <p>
                    {githubConnection.message}
                    {githubConnection.code ? ` (${githubConnection.code})` : ""}
                  </p>
                </div>
              ) : null}

              {draft.routeSource === "github-api" && draft.githubRoute ? (
                <div className="empty-state">
                  <strong>Connected target</strong>
                  <p>
                    {draft.githubRoute.target.fullName} on {draft.githubRoute.target.branch}
                  </p>
                </div>
              ) : null}

              <div className="section-spacer">
                <button className="ghost-button" onClick={() => setShowPatFallback((current) => !current)} type="button">
                  {showPatFallback ? "Hide manual token fallback" : "Use manual token instead"}
                </button>
              </div>

              {showPatFallback ? (
                <div className="form-stack">
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
                      <input
                        onChange={(event) => onGitHubOwnerChange(event.target.value)}
                        placeholder="octocat"
                        type="text"
                        value={githubOwner}
                      />
                    </label>

                    <label>
                      Repo
                      <input
                        onChange={(event) => onGitHubRepoChange(event.target.value)}
                        placeholder="hello-world"
                        type="text"
                        value={githubRepo}
                      />
                    </label>
                  </div>

                  <div className="step-actions">
                    <button
                      className="secondary-button"
                      disabled={githubConnection.status === "connecting"}
                      onClick={onConnectGitHub}
                      type="button"
                    >
                      Connect with token
                    </button>
                  </div>

                  <p className="summary-copy">Manual token mode is session-only and is not saved in presets.</p>
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
              <textarea onChange={(event) => onRepoSummaryChange(event.target.value)} rows={3} value={draft.repoSummary} />
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
              <p>Use Browse folder or connect a GitHub repository to unlock the rest of the flow.</p>
            </div>
          )}
        </article>
      </div>

      <article className="panel-card section-spacer">
        <div className="section-header compact-header">
          <div>
            <span className="metric-label">Workbench presets</span>
            <p className="summary-copy">
              Full automation presets prefill steps 1–6, run diagnosis + verify, and land on Results.
            </p>
          </div>
        </div>

        <div className="step-actions">
          <button className="primary-button" onClick={onApplyAllTestSources} type="button">
            Apply all test sources
          </button>
          {workbenchPresets.map((preset) => (
            <button
              className={preset.name === "Testing for ARK" ? "primary-button" : "secondary-button"}
              key={preset.id}
              onClick={() => onApplyWorkbenchPreset?.(preset.id)}
              type="button"
            >
              Apply {preset.name}
            </button>
          ))}
        </div>

        <div className="preset-form-row section-spacer">
          <input
            onChange={(event) => setWorkbenchPresetName(event.target.value)}
            placeholder="Workbench preset name"
            type="text"
            value={workbenchPresetName}
          />
          <button
            className="secondary-button"
            onClick={() => {
              if (!workbenchPresetName.trim()) {
                return;
              }

              onSaveWorkbenchPreset?.(workbenchPresetName.trim());
            }}
            type="button"
          >
            Save current setup
          </button>
        </div>

        {workbenchPresets.length === 0 ? (
          <p className="summary-copy">No workbench presets saved yet. Use MCP interview or save the current setup.</p>
        ) : (
          <div className="preset-grid">
            {workbenchPresets.map((preset) => (
              <article className="preset-card" key={preset.id}>
                <div className="preset-card-header">
                  <strong>{preset.name}</strong>
                  <span className="soft-pill">automation</span>
                </div>
                <p className="summary-copy">
                  {preset.autoRun.diagnosis ? "Diagnosis" : "No diagnosis"}
                  {preset.autoRun.verify ? " + verify" : ""}
                  {preset.autoRun.advanceToResults ? " → Results" : ""}
                </p>
                <code className="preset-path">{preset.intake.repoPath ?? "No repo path"}</code>
              </article>
            ))}
          </div>
        )}
      </article>

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

        {profileNameSuggestions.length > 0 ? (
          <div className="suggestion-panel section-spacer">
            <span className="metric-label">Suggested preset names</span>
            <div className="chip-cluster">
              {profileNameSuggestions.map((suggestion) => {
                const isSelected = profileName.trim().toLowerCase() === suggestion.name.toLowerCase();

                return (
                  <button
                    className={`suggestion-chip ${isSelected ? "suggestion-chip-applied" : ""}`}
                    key={suggestion.name}
                    onClick={() => setProfileName(suggestion.name)}
                    title={`${suggestion.reason} (${Math.round(suggestion.confidence * 100)}% confidence)`}
                    type="button"
                  >
                    <span>{suggestion.name}</span>
                    <span className="suggestion-chip-meta">{Math.round(suggestion.confidence * 100)}%</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="helper-copy section-spacer">
            Connect and inspect a repo to unlock preset name suggestions.
          </p>
        )}

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
