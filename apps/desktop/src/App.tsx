import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type {
  AiConnectionTestResult,
  AiProviderId,
  CodebaseVerifyResult,
  DashboardStepId,
  DesktopLibraryState,
  DiagnosisField,
  DiagnosisIntake,
  ExecutionPermission,
  GitHubBranchOption,
  GitHubOAuthFlowState,
  GitHubOAuthSession,
  GitHubRepositoryOption,
  RepoInspection,
  SavedArchitectureProfile,
  SavedProjectProfile,
  SavedProviderPreset,
  UserSignalInputs
} from "@arkitect/contracts";
import { buildDiagnosisFactsBundle } from "@arkitect/ai";
import { createDefaultDesktopLibrary, createDefaultIntake, createDiagnosisResult } from "@arkitect/core";
import { arkitectWindowsTheme, buildCssVariables } from "@arkitect/design-system";
import { githubRouteToRepoInspection, validateGitHubTokenFormat } from "@arkitect/github";
import { arkitectMcpServer, toDiagnosisMcpPayload } from "@arkitect/mcp-server";
import { createMockAutoDetections } from "@arkitect/repo-analyzer";
import { AiSettingsSection } from "./features/ai-settings/AiSettingsSection";
import { ArchitecturePolicySection } from "./features/architecture-policy/ArchitecturePolicySection";
import { ProjectProfileSection } from "./features/project-profile/ProjectProfileSection";
import { RepoConnectionSection } from "./features/repo-connection/RepoConnectionSection";
import { ResultsOverviewSection } from "./features/results-overview/ResultsOverviewSection";
import { McpConnectionSection } from "./features/mcp-connection/McpConnectionSection";
import { ReviewRunSection } from "./features/review-run/ReviewRunSection";
import { FlowSidebar, type FlowSidebarStep } from "./features/shell/FlowSidebar";
import {
  cancelGitHubOAuthViaBridge,
  connectGitHubOAuthRoute,
  connectGitHubRoute as connectGitHubRouteViaBridge,
  disconnectGitHubOAuthViaBridge,
  getGitHubConnectBlockedCode,
  getGitHubOAuthConfiguredViaBridge,
  getGitHubOAuthFlowStateViaBridge,
  getGitHubOAuthSessionViaBridge,
  listGitHubOAuthBranchesViaBridge,
  listGitHubOAuthReposViaBridge,
  resolveRuntimeShellInfo,
  runAiDiagnosisViaBridge,
  runCodebaseVerifyViaBridge,
  startGitHubOAuthViaBridge,
  subscribeGitHubOAuthStateViaBridge,
  testAiConnectionViaBridge,
  type RuntimeShellInfo
} from "./lib/desktop-bridge";
import { createLocalId, loadAiSessionCredentials, loadBrowserLibrary, saveAiSessionCredentials, saveBrowserLibrary } from "./lib/library-persistence";

interface FieldPatch {
  hint?: string;
  confirmed?: boolean;
  override?: string;
}

interface GitHubConnectionState {
  status: "idle" | "connecting" | "success" | "error";
  message: string;
  code?: string;
}

interface AiConnectionState {
  status: "idle" | "testing" | "connected" | "disconnected" | "error";
  message: string;
  lastResult?: AiConnectionTestResult;
}

const themeStyle = buildCssVariables(arkitectWindowsTheme) as CSSProperties;
const stepOrder: Array<{ id: DashboardStepId; title: string; description: string }> = [
  {
    id: "repo-connection",
    title: "Connect Repo",
    description: "Select a local path or GitHub API target."
  },
  {
    id: "project-profile",
    title: "Detect Profile",
    description: "Review the auto-detected project signals."
  },
  {
    id: "architecture-policy",
    title: "Architecture Policy",
    description: "Choose the continuation path and remix."
  },
  {
    id: "ai-settings",
    title: "AI / Execution",
    description: "Configure provider behavior and presets."
  },
  {
    id: "mcp-connection",
    title: "MCP Connection",
    description: "Connect manually or via external MCP registration."
  },
  {
    id: "review-and-run",
    title: "Review & Run",
    description: "Approve the current diagnosis setup."
  },
  {
    id: "results-overview",
    title: "Results",
    description: "Explore the structured diagnosis output."
  }
];

function mergeFieldPatch(current: UserSignalInputs, field: DiagnosisField, patch: FieldPatch): UserSignalInputs {
  const nextField = {
    ...current[field],
    ...patch
  } as {
    hint?: string;
    confirmed?: boolean;
    override?: string;
  };

  if (patch.hint === "") {
    nextField.hint = undefined;
  }

  if (patch.override === "") {
    nextField.override = undefined;
  }

  return {
    ...current,
    [field]: nextField
  } as UserSignalInputs;
}

function cloneUserInput(value: UserSignalInputs): UserSignalInputs {
  return JSON.parse(JSON.stringify(value)) as UserSignalInputs;
}

function isRepoReady(routeSource: DiagnosisIntake["routeSource"], inspection?: RepoInspection) {
  return Boolean(
    inspection?.source === routeSource && inspection.exists && inspection.isDirectory && inspection.validationErrors.length === 0
  );
}

function getHighestNavigableIndex(
  repoReady: boolean,
  settingsReviewed: boolean,
  hasResults: boolean
): number {
  if (hasResults) {
    return 6;
  }

  if (settingsReviewed) {
    return 5;
  }

  if (repoReady) {
    return 3;
  }

  return 0;
}

function getStepLockReason(
  stepId: DashboardStepId,
  stepIndex: number,
  highestNavigableIndex: number,
  repoReady: boolean,
  settingsReviewed: boolean,
  hasResults: boolean
): string | undefined {
  if (stepId === "mcp-connection" || stepIndex <= highestNavigableIndex) {
    return undefined;
  }

  if (!repoReady) {
    return "Inspect or browse to a repo folder on Connect Repo first.";
  }

  if (stepId === "review-and-run" && !settingsReviewed) {
    return "Use Next on AI / Execution to unlock Review & Run.";
  }

  if (stepId === "results-overview" && !hasResults) {
    return "Run diagnosis or codebase verify on Review & Run to unlock Results.";
  }

  return "Complete the previous step first.";
}

function formatMissingGitHubFields(token: string, owner: string, repo: string) {
  const missingFields: string[] = [];

  if (!token) {
    missingFields.push("token");
  }

  if (!owner) {
    missingFields.push("owner");
  }

  if (!repo) {
    missingFields.push("repo");
  }

  if (missingFields.length === 0) {
    return undefined;
  }

  if (missingFields.length === 1) {
    return `${missingFields[0][0].toUpperCase()}${missingFields[0].slice(1)} is required.`;
  }

  if (missingFields.length === 2) {
    return `${missingFields[0][0].toUpperCase()}${missingFields[0].slice(1)} and ${missingFields[1]} are required.`;
  }

  return "Token, owner, and repo are required.";
}

export function App() {
  const [shellInfo, setShellInfo] = useState<RuntimeShellInfo | null>(null);
  const [draft, setDraft] = useState<DiagnosisIntake>(() => createDefaultIntake());
  const [library, setLibrary] = useState<DesktopLibraryState>(() => createDefaultDesktopLibrary());
  const [libraryLoaded, setLibraryLoaded] = useState(false);
  const [libraryStatus, setLibraryStatus] = useState<"loading" | "saving" | "saved" | "error">("loading");
  const [inspectionBusy, setInspectionBusy] = useState(false);
  const [activeStep, setActiveStep] = useState<DashboardStepId>("repo-connection");
  const [profileReviewed, setProfileReviewed] = useState(false);
  const [policyReviewed, setPolicyReviewed] = useState(false);
  const [settingsReviewed, setSettingsReviewed] = useState(false);
  const [lastRun, setLastRun] = useState<ReturnType<typeof createDiagnosisResult> | null>(null);
  const [lastRunAt, setLastRunAt] = useState<string | undefined>(undefined);
  const [repoSummaryTouched, setRepoSummaryTouched] = useState(false);
  const [cursorApiKey, setCursorApiKey] = useState(() => loadAiSessionCredentials().cursorApiKey ?? "");
  const [providerKeys, setProviderKeys] = useState<Partial<Record<AiProviderId, string>>>(
    () => loadAiSessionCredentials().providerKeys ?? {}
  );
  const [aiConnection, setAiConnection] = useState<AiConnectionState>({
    status: "idle",
    message: "Enter your Cursor API Key and click Test connection."
  });
  const [diagnosisBusy, setDiagnosisBusy] = useState(false);
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [lastVerifyResult, setLastVerifyResult] = useState<CodebaseVerifyResult | null>(null);
  const [lastVerifyAt, setLastVerifyAt] = useState<string | undefined>(undefined);
  const [repoConnectionMode, setRepoConnectionMode] = useState<DiagnosisIntake["routeSource"]>("local-path");
  const [githubToken, setGithubToken] = useState("");
  const [githubOwner, setGithubOwner] = useState("");
  const [githubRepo, setGithubRepo] = useState("");
  const [githubBranch, setGithubBranch] = useState("");
  const [githubConnection, setGithubConnection] = useState<GitHubConnectionState>({
    status: "idle",
    message: ""
  });
  const [githubOAuthConfigured, setGithubOAuthConfigured] = useState(false);
  const [githubOAuthFlow, setGithubOAuthFlow] = useState<GitHubOAuthFlowState>({ status: "idle" });
  const [githubOAuthSession, setGithubOAuthSession] = useState<GitHubOAuthSession | null>(null);
  const [githubRepos, setGithubRepos] = useState<GitHubRepositoryOption[]>([]);
  const [githubReposBusy, setGithubReposBusy] = useState(false);
  const [githubBranches, setGithubBranches] = useState<GitHubBranchOption[]>([]);
  const [githubBranchesBusy, setGithubBranchesBusy] = useState(false);
  const [selectedRepoFullName, setSelectedRepoFullName] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function hydrateShell() {
      try {
        const [info, storedLibrary] = await Promise.all([
          resolveRuntimeShellInfo(),
          window.arkitectDesktop?.loadLibrary?.() ?? Promise.resolve(loadBrowserLibrary())
        ]);

        if (cancelled) {
          return;
        }

        setShellInfo(info);
        setLibrary(storedLibrary);
        setLibraryLoaded(true);
        setLibraryStatus("saved");
      } catch {
        if (cancelled) {
          return;
        }

        setShellInfo(await resolveRuntimeShellInfo());
        setLibrary(loadBrowserLibrary());
        setLibraryLoaded(true);
        setLibraryStatus("error");
      }
    }

    void hydrateShell();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function hydrateGitHubOAuth() {
      const [configured, session, flowState] = await Promise.all([
        getGitHubOAuthConfiguredViaBridge(),
        getGitHubOAuthSessionViaBridge(),
        getGitHubOAuthFlowStateViaBridge()
      ]);

      if (cancelled) {
        return;
      }

      setGithubOAuthConfigured(configured);
      setGithubOAuthSession(session.connected ? session : null);
      setGithubOAuthFlow(flowState);
    }

    void hydrateGitHubOAuth();

    const unsubscribe = subscribeGitHubOAuthStateViaBridge((state) => {
      setGithubOAuthFlow(state);

      if (state.status === "connected" && state.session?.connected) {
        setGithubOAuthSession(state.session);
      }

      if (state.status === "idle") {
        setGithubOAuthSession(null);
        setGithubRepos([]);
        setGithubBranches([]);
        setSelectedRepoFullName("");
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!githubOAuthSession?.connected) {
      return;
    }

    let cancelled = false;

    async function loadRepos() {
      setGithubReposBusy(true);

      const response = await listGitHubOAuthReposViaBridge();

      if (cancelled) {
        return;
      }

      if (response.ok) {
        setGithubRepos(response.repos);
      } else {
        setGithubConnection({
          status: "error",
          message: response.error.message,
          code: response.error.code
        });
      }

      setGithubReposBusy(false);
    }

    void loadRepos();

    return () => {
      cancelled = true;
    };
  }, [githubOAuthSession?.connected, githubOAuthSession?.login]);

  useEffect(() => {
    if (!libraryLoaded) {
      return;
    }

    let cancelled = false;

    async function persistLibrary() {
      try {
        setLibraryStatus("saving");

        if (window.arkitectDesktop?.saveLibrary) {
          await window.arkitectDesktop.saveLibrary(library);
        } else {
          saveBrowserLibrary(library);
        }

        if (!cancelled) {
          setLibraryStatus("saved");
        }
      } catch {
        if (!cancelled) {
          setLibraryStatus("error");
        }
      }
    }

    void persistLibrary();

    return () => {
      cancelled = true;
    };
  }, [library, libraryLoaded]);

  useEffect(() => {
    saveAiSessionCredentials({
      cursorApiKey: cursorApiKey.trim() || undefined,
      providerKeys
    });
  }, [cursorApiKey, providerKeys]);

  const previewResult = useMemo(() => createDiagnosisResult(draft, createMockAutoDetections(draft)), [draft]);
  const resultForDisplay = lastRun ?? previewResult;
  const mcpPayload = useMemo(() => toDiagnosisMcpPayload(resultForDisplay), [resultForDisplay]);
  const repoReady = isRepoReady(draft.routeSource, draft.repoInspection);
  const aiConnected = aiConnection.status === "connected";
  const localRepoPath =
    draft.routeSource === "local-path" ? draft.repoPath : draft.repoInspection?.path ?? draft.repoPath;
  const canVerify = draft.routeSource === "local-path" && repoReady && Boolean(localRepoPath.trim());
  const hasResults = Boolean(lastRun) || Boolean(lastVerifyResult);
  const highestNavigableIndex = getHighestNavigableIndex(repoReady, settingsReviewed, hasResults);

  useEffect(() => {
    const activeIndex = stepOrder.findIndex((step) => step.id === activeStep);

    if (activeIndex > highestNavigableIndex && activeStep !== "mcp-connection") {
      setActiveStep(stepOrder[highestNavigableIndex].id);
    }
  }, [activeStep, highestNavigableIndex]);

  const sidebarSteps = useMemo<FlowSidebarStep[]>(
    () =>
      stepOrder.map((step, index) => {
        const completed =
          (step.id === "repo-connection" && repoReady) ||
          (step.id === "project-profile" && profileReviewed) ||
          (step.id === "architecture-policy" && policyReviewed) ||
          (step.id === "ai-settings" && settingsReviewed) ||
          (step.id === "review-and-run" && hasResults) ||
          (step.id === "results-overview" && hasResults);

        const unlocked = step.id === "mcp-connection" || index <= highestNavigableIndex;
        const lockReason = getStepLockReason(
          step.id,
          index,
          highestNavigableIndex,
          repoReady,
          settingsReviewed,
          hasResults
        );

        return {
          ...step,
          status: activeStep === step.id ? "current" : completed ? "complete" : unlocked ? "ready" : "locked",
          lockReason
        };
      }),
    [
      activeStep,
      hasResults,
      highestNavigableIndex,
      lastRun,
      policyReviewed,
      profileReviewed,
      repoReady,
      settingsReviewed
    ]
  );

  function resetFromProfile() {
    setProfileReviewed(false);
    setPolicyReviewed(false);
    setSettingsReviewed(false);
    setLastRun(null);
    setLastRunAt(undefined);
  }

  function resetFromPolicy() {
    setPolicyReviewed(false);
    setSettingsReviewed(false);
    setLastRun(null);
    setLastRunAt(undefined);
  }

  function resetFromSettings() {
    setSettingsReviewed(false);
    setLastRun(null);
    setLastRunAt(undefined);
  }

  function resetGitHubFeedback() {
    setGithubConnection({
      status: "idle",
      message: ""
    });
  }

  async function loadGitHubBranchesForSelection(fullName: string, preferredBranch?: string) {
    const [owner, repo] = fullName.split("/");

    if (!owner || !repo) {
      setGithubBranches([]);
      setGithubBranch("");
      return;
    }

    setGithubBranchesBusy(true);
    const response = await listGitHubOAuthBranchesViaBridge(owner, repo);
    setGithubBranchesBusy(false);

    if (!response.ok) {
      setGithubConnection({
        status: "error",
        message: response.error.message,
        code: response.error.code
      });
      setGithubBranches([]);
      return;
    }

    setGithubBranches(response.branches);
    const selectedRepo = githubRepos.find((entry) => entry.fullName === fullName);
    const nextBranch =
      preferredBranch ??
      (response.branches.some((branch) => branch.name === githubBranch) ? githubBranch : selectedRepo?.defaultBranch ?? "");

    setGithubOwner(owner);
    setGithubRepo(repo);
    setGithubBranch(nextBranch);
  }

  async function handleSelectedRepoChange(fullName: string) {
    setSelectedRepoFullName(fullName);

    if (!fullName) {
      setGithubBranches([]);
      setGithubOwner("");
      setGithubRepo("");
      setGithubBranch("");
      return;
    }

    await loadGitHubBranchesForSelection(fullName);
  }

  async function startGitHubOAuth() {
    resetGitHubFeedback();
    const state = await startGitHubOAuthViaBridge();
    setGithubOAuthFlow(state);
  }

  async function cancelGitHubOAuth() {
    await cancelGitHubOAuthViaBridge();
    setGithubOAuthFlow({ status: "idle" });
  }

  async function disconnectGitHubOAuth() {
    await disconnectGitHubOAuthViaBridge();
    setGithubOAuthSession(null);
    setGithubRepos([]);
    setGithubBranches([]);
    setSelectedRepoFullName("");
    resetGitHubFeedback();
  }

  function upsertProjectProfile(name: string, existingId?: string) {
    const now = new Date().toISOString();
    const profile: SavedProjectProfile = {
      id: existingId ?? createLocalId("project"),
      name,
      routeSource: draft.routeSource,
      repoPath: draft.repoPath,
      repoName: draft.repoName,
      githubRoute: draft.githubRoute,
      repoSummary: draft.repoSummary,
      requestedOutcome: draft.requestedOutcome,
      selectedRemixId: draft.catalogPreferences.selectedRemixId,
      complexityProfile: draft.catalogPreferences.complexityProfile,
      executionPermission: draft.executionPermission,
      requirementTags: [...draft.catalogPreferences.requirementTags],
      userInput: cloneUserInput(draft.userInput),
      createdAt:
        library.projectProfiles.find((profileItem) => profileItem.id === existingId)?.createdAt ?? now,
      updatedAt: now
    };

    setLibrary((current) => ({
      ...current,
      lastOpenedRepoPath: draft.repoPath,
      projectProfiles: current.projectProfiles.some((profileItem) => profileItem.id === profile.id)
        ? current.projectProfiles.map((profileItem) => (profileItem.id === profile.id ? profile : profileItem))
        : [profile, ...current.projectProfiles]
    }));
  }

  function upsertArchitectureProfile(name: string, existingId?: string) {
    const now = new Date().toISOString();
    const profile: SavedArchitectureProfile = {
      id: existingId ?? createLocalId("architecture"),
      name,
      preferredArchitectureId: previewResult.decision.selectedArchitectureId,
      selectedRemixId: draft.catalogPreferences.selectedRemixId,
      complexityProfile: draft.catalogPreferences.complexityProfile,
      requirementTags: [...draft.catalogPreferences.requirementTags],
      notes: previewResult.decision.reason,
      createdAt:
        library.architectureProfiles.find((profileItem) => profileItem.id === existingId)?.createdAt ?? now,
      updatedAt: now
    };

    setLibrary((current) => ({
      ...current,
      architectureProfiles: current.architectureProfiles.some((profileItem) => profileItem.id === profile.id)
        ? current.architectureProfiles.map((profileItem) => (profileItem.id === profile.id ? profile : profileItem))
        : [profile, ...current.architectureProfiles]
    }));
  }

  function upsertProviderPreset(name: string, existingId?: string) {
    const now = new Date().toISOString();
    const preset: SavedProviderPreset = {
      id: existingId ?? createLocalId("provider"),
      name,
      preferredProvider: draft.ai.preferredProvider,
      modelName: draft.ai.modelName,
      allowUserSuppliedKeys: draft.ai.allowUserSuppliedKeys,
      fallbackProviders: [...draft.ai.fallbackProviders],
      createdAt:
        library.providerPresets.find((presetItem) => presetItem.id === existingId)?.createdAt ?? now,
      updatedAt: now
    };

    setLibrary((current) => ({
      ...current,
      providerPresets: current.providerPresets.some((presetItem) => presetItem.id === preset.id)
        ? current.providerPresets.map((presetItem) => (presetItem.id === preset.id ? preset : presetItem))
        : [preset, ...current.providerPresets]
    }));
  }

  async function inspectRepoPath(repoPath = draft.repoPath, advanceStep = true, preserveRepoSummary = repoSummaryTouched) {
    setRepoConnectionMode("local-path");
    resetGitHubFeedback();
    setInspectionBusy(true);

    try {
      const inspection =
        (await window.arkitectDesktop?.inspectRepoPath?.(repoPath)) ??
        ({
          source: "local-path",
          path: repoPath,
          repoName: draft.repoName,
          exists: repoPath.trim().length > 0,
          isDirectory: repoPath.trim().length > 0,
          hasGit: false,
          manifestFiles: [],
          topLevelDirectories: [],
          topLevelFiles: [],
          samplePaths: [],
          frameworkHints: [],
          detectedMarkers: [],
          validationErrors: repoPath.trim().length > 0 ? [] : ["Enter a local path to inspect."],
          summary: repoPath.trim().length > 0 ? "Fallback browser inspection only." : "Enter a local path to inspect.",
          inspectedAt: new Date().toISOString()
        } satisfies RepoInspection);

      setDraft((current) => ({
        ...current,
        routeSource: "local-path",
        repoPath: inspection.path,
        repoName: inspection.repoName,
        githubRoute: undefined,
        repoInspection: inspection,
        repoSummary: preserveRepoSummary ? current.repoSummary : inspection.summary
      }));
      setLibrary((current) => ({
        ...current,
        lastOpenedRepoPath: inspection.path
      }));
      resetFromProfile();

      if (advanceStep && isRepoReady("local-path", inspection)) {
        setActiveStep("project-profile");
      }
    } finally {
      setInspectionBusy(false);
    }
  }

  async function browseForRepo() {
    setRepoConnectionMode("local-path");
    resetGitHubFeedback();
    const inspection = await window.arkitectDesktop?.selectRepoFolder?.();

    if (!inspection) {
      return;
    }

    setDraft((current) => ({
      ...current,
      routeSource: "local-path",
      repoPath: inspection.path,
      repoName: inspection.repoName,
      githubRoute: undefined,
      repoInspection: inspection,
      repoSummary: repoSummaryTouched ? current.repoSummary : inspection.summary
    }));
    setLibrary((current) => ({
      ...current,
      lastOpenedRepoPath: inspection.path
    }));
    resetFromProfile();

    if (isRepoReady("local-path", inspection)) {
      setActiveStep("project-profile");
    }
  }

  async function connectGitHubRoute() {
    const token = githubToken.trim();
    const owner = githubOwner.trim();
    const repo = githubRepo.trim();
    const usePatFallback = Boolean(token && owner && repo);
    const oauthTarget = selectedRepoFullName.trim();
    const runtime =
      shellInfo?.runtime ?? (typeof navigator !== "undefined" && /Electron/i.test(navigator.userAgent)
        ? "electron-bridge-missing"
        : "browser");

    if (!usePatFallback) {
      if (!githubOAuthSession?.connected) {
        setGithubConnection({
          status: "error",
          message: "Connect with GitHub and select a repository first."
        });
        return;
      }

      if (!oauthTarget) {
        setGithubConnection({
          status: "error",
          message: "Select a repository from your GitHub account."
        });
        return;
      }

      const [oauthOwner, oauthRepo] = oauthTarget.split("/");

      if (!oauthOwner || !oauthRepo) {
        setGithubConnection({
          status: "error",
          message: "Selected repository is invalid."
        });
        return;
      }

      setRepoConnectionMode("github-api");
      setGithubConnection({
        status: "connecting",
        message: "Connecting to GitHub repository..."
      });

      const response = await connectGitHubOAuthRoute(
        {
          owner: oauthOwner,
          repo: oauthRepo,
          branch: githubBranch.trim() ? githubBranch.trim() : undefined
        },
        runtime
      );

      if (!response.ok) {
        setGithubConnection({
          status: "error",
          message: response.error.message,
          code:
            response.error.code === "network_error" && runtime !== "electron"
              ? getGitHubConnectBlockedCode(runtime)
              : response.error.code
        });
        return;
      }

      const githubPath = `${response.route.target.htmlUrl}#${response.route.target.branch}`;

      setDraft((current) => ({
        ...current,
        routeSource: "github-api",
        repoPath: githubPath,
        repoName: response.route.target.fullName,
        githubRoute: response.route,
        repoInspection: response.inspection,
        repoSummary: repoSummaryTouched ? current.repoSummary : response.route.signals.summary
      }));
      setLibrary((current) => ({
        ...current,
        lastOpenedRepoPath: githubPath
      }));
      setGithubConnection({
        status: "success",
        message: `Connected ${response.route.target.fullName} (${response.route.target.branch}).`
      });
      resetFromProfile();
      setActiveStep("project-profile");
      return;
    }

    const missingFieldsMessage = formatMissingGitHubFields(token, owner, repo);

    if (missingFieldsMessage) {
      setGithubConnection({
        status: "error",
        message: missingFieldsMessage
      });
      return;
    }

    const tokenValidation = validateGitHubTokenFormat(token);
    if (!tokenValidation.valid) {
      setGithubConnection({
        status: "error",
        message: tokenValidation.reason ?? "Invalid GitHub PAT format.",
        code: "invalid_token_format"
      });
      return;
    }

    setRepoConnectionMode("github-api");
    setGithubConnection({
      status: "connecting",
      message: "Connecting to GitHub API..."
    });

    const response = await connectGitHubRouteViaBridge(
      {
        token: tokenValidation.normalizedToken,
        owner,
        repo,
        branch: githubBranch.trim() ? githubBranch.trim() : undefined,
        authMode: "personal-access-token"
      },
      runtime
    );

    if (!response.ok) {
      setGithubConnection({
        status: "error",
        message: response.error.message,
        code:
          response.error.code === "network_error" && runtime !== "electron"
            ? getGitHubConnectBlockedCode(runtime)
            : response.error.code
      });
      return;
    }

    const githubPath = `${response.route.target.htmlUrl}#${response.route.target.branch}`;

    setDraft((current) => ({
      ...current,
      routeSource: "github-api",
      repoPath: githubPath,
      repoName: response.route.target.fullName,
      githubRoute: response.route,
      repoInspection: response.inspection,
      repoSummary: repoSummaryTouched ? current.repoSummary : response.route.signals.summary
    }));
    setLibrary((current) => ({
      ...current,
      lastOpenedRepoPath: githubPath
    }));
    setGithubConnection({
      status: "success",
      message: `Connected ${response.route.target.fullName} (${response.route.target.branch}).`
    });
    resetFromProfile();
    setActiveStep("project-profile");
  }

  function goToNextStep() {
    if (activeStep === "repo-connection" && repoReady) {
      setActiveStep("project-profile");
      return;
    }

    if (activeStep === "project-profile") {
      setProfileReviewed(true);
      setActiveStep("architecture-policy");
      return;
    }

    if (activeStep === "architecture-policy") {
      setPolicyReviewed(true);
      setActiveStep("ai-settings");
      return;
    }

    if (activeStep === "ai-settings") {
      setSettingsReviewed(true);
      setActiveStep("mcp-connection");
      return;
    }

    if (activeStep === "mcp-connection") {
      setActiveStep("review-and-run");
      return;
    }

    if (activeStep === "review-and-run" && lastRun) {
      setActiveStep("results-overview");
    }
  }

  function goToPreviousStep() {
    const currentIndex = stepOrder.findIndex((step) => step.id === activeStep);

    if (currentIndex > 0) {
      setActiveStep(stepOrder[currentIndex - 1].id);
    }
  }

  function buildAiCredentials() {
    return {
      preferredProvider: draft.ai.preferredProvider,
      modelName: draft.ai.modelName,
      cursorApiKey: cursorApiKey.trim() || undefined,
      providerKeys: Object.fromEntries(
        Object.entries(providerKeys).filter(([, value]) => Boolean(value?.trim()))
      ) as Partial<Record<AiProviderId, string>>
    };
  }

  async function testAiConnection() {
    const runtime = shellInfo?.runtime ?? "browser";

    setAiConnection({
      status: "testing",
      message: "Validating provider connection…"
    });

    const result = await testAiConnectionViaBridge(buildAiCredentials(), runtime);

    setAiConnection({
      status: result.connected ? "connected" : "error",
      message: result.message,
      lastResult: result
    });
  }

  async function runDiagnosis() {
    setDiagnosisBusy(true);

    try {
      const baseline = createDiagnosisResult(draft, createMockAutoDetections(draft));
      const runtime = shellInfo?.runtime ?? "browser";
      const credentials = buildAiCredentials();
      const facts = buildDiagnosisFactsBundle(baseline);
      const localRepoPath =
        draft.routeSource === "local-path"
          ? draft.repoPath
          : draft.repoInspection?.path ?? draft.repoPath;

      const aiResult = await runAiDiagnosisViaBridge(
        {
          facts,
          credentials,
          repoPath: localRepoPath
        },
        runtime
      );

      const runResult = {
        ...baseline,
        aiEnrichment: aiResult.enrichment
      };

      setProfileReviewed(true);
      setPolicyReviewed(true);
      setSettingsReviewed(true);
      setLastRun(runResult);
      setLastRunAt(new Date().toISOString());
      setActiveStep("results-overview");

      if (aiResult.enrichment?.status === "success" && aiConnection.status !== "connected") {
        setAiConnection({
          status: "connected",
          message: "Model responded during diagnosis run.",
          lastResult: aiConnection.lastResult
        });
      }
    } finally {
      setDiagnosisBusy(false);
    }
  }

  async function runCodebaseVerify() {
    if (!canVerify) {
      return;
    }

    setVerifyBusy(true);

    try {
      const runtime = shellInfo?.runtime ?? "browser";
      const result = await runCodebaseVerifyViaBridge({ repoPath: localRepoPath }, runtime);

      setLastVerifyResult(result);
      setLastVerifyAt(new Date().toISOString());
      setActiveStep("results-overview");
    } finally {
      setVerifyBusy(false);
    }
  }

  useEffect(() => {
    if (draft.routeSource !== "local-path" || !draft.repoPath.trim()) {
      return;
    }

    void window.arkitectDesktop?.setMcpDefaultRepoPath?.(draft.repoPath);
  }, [draft.repoPath, draft.routeSource]);

  const intake = useMemo<DiagnosisIntake>(
    () => draft,
    [draft]
  );

  return (
    <div className="desktop-shell" style={themeStyle}>
      <div className="app-layout">
        <FlowSidebar
          activeStep={activeStep}
          onStepSelect={(stepId) => {
            const step = sidebarSteps.find((item) => item.id === stepId);

            if (step?.status !== "locked") {
              setActiveStep(stepId);
            }
          }}
          projectLabel={draft.repoInspection?.repoName ?? draft.repoName}
          steps={sidebarSteps}
          storagePath={shellInfo?.storagePath}
        />

        <main className="workbench-content">
          <header className="app-header">
            <div>
              <p className="section-label">Arkitect Desktop</p>
              <h1>{stepOrder.find((step) => step.id === activeStep)?.title}</h1>
              <p className="summary-copy">
                Windows-first diagnosis workbench with local repo testing, saved presets, and a structured results flow.
              </p>
            </div>
            <div className="header-meta">
              <span className="status-pill status-visible">Windows 11 shell</span>
              <span
                className={`status-pill ${
                  shellInfo?.runtime === "electron" ? "status-visible" : "status-attention"
                }`}
              >
                {shellInfo?.runtime === "electron"
                  ? `Electron ${shellInfo.electron}`
                  : shellInfo?.runtime === "browser"
                    ? "Browser preview"
                    : shellInfo?.runtime === "electron-bridge-missing"
                      ? "Electron bridge missing"
                      : "Detecting runtime"}
              </span>
              <span className={`status-pill ${libraryStatus === "error" ? "status-attention" : "status-visible"}`}>
                Library {libraryStatus}
              </span>
            </div>
          </header>

          {activeStep === "repo-connection" ? (
            <RepoConnectionSection
              connectionMode={repoConnectionMode}
              draft={intake}
              githubBranch={githubBranch}
              githubBranches={githubBranches}
              githubBranchesBusy={githubBranchesBusy}
              githubConnection={githubConnection}
              githubOAuthConfigured={githubOAuthConfigured}
              githubOAuthFlow={githubOAuthFlow}
              githubOAuthSession={githubOAuthSession}
              githubOwner={githubOwner}
              githubRepo={githubRepo}
              githubRepos={githubRepos}
              githubReposBusy={githubReposBusy}
              githubToken={githubToken}
              inspection={draft.repoInspection}
              inspectionBusy={inspectionBusy}
              selectedRepoFullName={selectedRepoFullName}
              onBrowse={() => void browseForRepo()}
              onCancelGitHubOAuth={() => void cancelGitHubOAuth()}
              onConnectionModeChange={(mode) => {
                setRepoConnectionMode(mode);
                setDraft((current) => ({
                  ...current,
                  routeSource: mode,
                  githubRoute: mode === "github-api" ? current.githubRoute : undefined,
                  repoInspection: current.repoInspection?.source === mode ? current.repoInspection : undefined
                }));
                resetGitHubFeedback();
                resetFromProfile();
              }}
              onConnectGitHub={() => void connectGitHubRoute()}
              onDisconnectGitHubOAuth={() => void disconnectGitHubOAuth()}
              onDeleteProjectProfile={(id) =>
                setLibrary((current) => ({
                  ...current,
                  projectProfiles: current.projectProfiles.filter((profile) => profile.id !== id)
                }))
              }
              onDuplicateProjectProfile={(id) =>
                setLibrary((current) => {
                  const source = current.projectProfiles.find((profile) => profile.id === id);

                  if (!source) {
                    return current;
                  }

                  const now = new Date().toISOString();
                  const duplicate: SavedProjectProfile = {
                    ...source,
                    id: createLocalId("project"),
                    name: `${source.name} copy`,
                    createdAt: now,
                    updatedAt: now
                  };

                  return {
                    ...current,
                    projectProfiles: [duplicate, ...current.projectProfiles]
                  };
                })
              }
              onGitHubBranchChange={setGithubBranch}
              onGitHubOwnerChange={setGithubOwner}
              onGitHubRepoChange={setGithubRepo}
              onGitHubTokenChange={setGithubToken}
              onInspect={() => void inspectRepoPath()}
              onSelectedRepoChange={(fullName) => void handleSelectedRepoChange(fullName)}
              onStartGitHubOAuth={() => void startGitHubOAuth()}
              onLoadProjectProfile={(id) => {
                const preset = library.projectProfiles.find((profile) => profile.id === id);

                if (!preset) {
                  return;
                }

                setDraft((current) => ({
                  ...current,
                  routeSource: preset.routeSource ?? "local-path",
                  repoPath: preset.repoPath,
                  repoName: preset.repoName,
                  githubRoute: preset.githubRoute,
                  repoSummary: preset.repoSummary,
                  requestedOutcome: preset.requestedOutcome,
                  executionPermission: preset.executionPermission,
                  userInput: cloneUserInput(preset.userInput),
                  catalogPreferences: {
                    ...current.catalogPreferences,
                    selectedRemixId: preset.selectedRemixId,
                    complexityProfile: preset.complexityProfile,
                    requirementTags: [...preset.requirementTags]
                  }
                }));
                setRepoConnectionMode(preset.routeSource ?? "local-path");
                if (preset.routeSource === "github-api" && preset.githubRoute) {
                  setGithubOwner(preset.githubRoute.target.owner);
                  setGithubRepo(preset.githubRoute.target.repo);
                  setGithubBranch(preset.githubRoute.target.branch);
                  setSelectedRepoFullName(preset.githubRoute.target.fullName);
                  void loadGitHubBranchesForSelection(
                    preset.githubRoute.target.fullName,
                    preset.githubRoute.target.branch
                  );
                  setGithubConnection({
                    status: "success",
                    message: `Loaded ${preset.githubRoute.target.fullName} (${preset.githubRoute.target.branch}) from saved profile.`
                  });
                } else {
                  setGithubOwner("");
                  setGithubRepo("");
                  setGithubBranch("");
                  resetGitHubFeedback();
                }
                setRepoSummaryTouched(true);
                setActiveStep("repo-connection");
                if (preset.routeSource === "github-api" && preset.githubRoute) {
                  const loadedRoute = preset.githubRoute;
                  setDraft((current) => ({
                    ...current,
                    repoInspection: githubRouteToRepoInspection(loadedRoute)
                  }));
                  resetFromProfile();
                  return;
                }

                void inspectRepoPath(preset.repoPath, false, true);
              }}
              onRepoNameChange={(value) => {
                setDraft((current) => ({
                  ...current,
                  repoName: value
                }));
                resetFromProfile();
              }}
              onRepoPathChange={(value) => {
                setDraft((current) => ({
                  ...current,
                  routeSource: "local-path",
                  repoPath: value,
                  githubRoute: undefined,
                  repoInspection: undefined
                }));
                setRepoConnectionMode("local-path");
                resetGitHubFeedback();
                resetFromProfile();
              }}
              onRepoSummaryChange={(value) => {
                setRepoSummaryTouched(true);
                setDraft((current) => ({
                  ...current,
                  repoSummary: value
                }));
                resetFromProfile();
              }}
              onRequestedOutcomeChange={(value) => {
                setDraft((current) => ({
                  ...current,
                  requestedOutcome: value
                }));
                resetFromProfile();
              }}
              onSaveProjectProfile={upsertProjectProfile}
              projectProfiles={library.projectProfiles}
              shellInfo={shellInfo}
            />
          ) : null}

          {activeStep === "project-profile" ? (
            <ProjectProfileSection
              inspection={draft.repoInspection}
              onFieldPatch={(field, patch) => {
                setDraft((current) => ({
                  ...current,
                  userInput: mergeFieldPatch(current.userInput, field, patch)
                }));
                resetFromProfile();
              }}
              result={previewResult}
              userInput={draft.userInput}
            />
          ) : null}

          {activeStep === "architecture-policy" ? (
            <ArchitecturePolicySection
              architectureProfiles={library.architectureProfiles}
              complexityProfile={draft.catalogPreferences.complexityProfile}
              onComplexityProfileChange={(value) => {
                setDraft((current) => ({
                  ...current,
                  catalogPreferences: {
                    ...current.catalogPreferences,
                    complexityProfile: value
                  }
                }));
                resetFromPolicy();
              }}
              onDeleteArchitectureProfile={(id) =>
                setLibrary((current) => ({
                  ...current,
                  architectureProfiles: current.architectureProfiles.filter((profile) => profile.id !== id)
                }))
              }
              onDuplicateArchitectureProfile={(id) =>
                setLibrary((current) => {
                  const source = current.architectureProfiles.find((profile) => profile.id === id);

                  if (!source) {
                    return current;
                  }

                  const now = new Date().toISOString();
                  const duplicate: SavedArchitectureProfile = {
                    ...source,
                    id: createLocalId("architecture"),
                    name: `${source.name} copy`,
                    createdAt: now,
                    updatedAt: now
                  };

                  return {
                    ...current,
                    architectureProfiles: [duplicate, ...current.architectureProfiles]
                  };
                })
              }
              onLoadArchitectureProfile={(id) => {
                const profile = library.architectureProfiles.find((item) => item.id === id);

                if (!profile) {
                  return;
                }

                setDraft((current) => ({
                  ...current,
                  userInput: profile.preferredArchitectureId
                    ? mergeFieldPatch(current.userInput, "currentArchitecture", {
                        hint: profile.preferredArchitectureId
                      })
                    : current.userInput,
                  catalogPreferences: {
                    ...current.catalogPreferences,
                    selectedRemixId: profile.selectedRemixId,
                    complexityProfile: profile.complexityProfile,
                    requirementTags: [...profile.requirementTags]
                  }
                }));
                resetFromPolicy();
              }}
              onRemixChange={(value) => {
                setDraft((current) => ({
                  ...current,
                  catalogPreferences: {
                    ...current.catalogPreferences,
                    selectedRemixId: value
                  }
                }));
                resetFromPolicy();
              }}
              onRequirementTagsChange={(tags) => {
                setDraft((current) => ({
                  ...current,
                  catalogPreferences: {
                    ...current.catalogPreferences,
                    requirementTags: tags
                  }
                }));
                resetFromPolicy();
              }}
              onSaveArchitectureProfile={upsertArchitectureProfile}
              requirementTags={draft.catalogPreferences.requirementTags}
              result={previewResult}
              selectedRemixId={draft.catalogPreferences.selectedRemixId}
            />
          ) : null}

          {activeStep === "ai-settings" ? (
            <AiSettingsSection
              allowUserSuppliedKeys={draft.ai.allowUserSuppliedKeys}
              connectionState={aiConnection}
              cursorApiKey={cursorApiKey}
              providerKeys={providerKeys}
              shellInfo={shellInfo}
              fallbackProviders={draft.ai.fallbackProviders}
              modelName={draft.ai.modelName}
              onCursorApiKeyChange={(value) => {
                setCursorApiKey(value);
                setAiConnection({ status: "disconnected", message: "API key changed — test connection again." });
                resetFromSettings();
              }}
              onProviderKeyChange={(provider, value) => {
                setProviderKeys((current) => ({
                  ...current,
                  [provider]: value
                }));
                setAiConnection({ status: "disconnected", message: "Provider key changed — test connection again." });
                resetFromSettings();
              }}
              onTestConnection={() => void testAiConnection()}
              onDeleteProviderPreset={(id) =>
                setLibrary((current) => ({
                  ...current,
                  providerPresets: current.providerPresets.filter((preset) => preset.id !== id)
                }))
              }
              onDuplicateProviderPreset={(id) =>
                setLibrary((current) => {
                  const source = current.providerPresets.find((preset) => preset.id === id);

                  if (!source) {
                    return current;
                  }

                  const now = new Date().toISOString();
                  const duplicate: SavedProviderPreset = {
                    ...source,
                    id: createLocalId("provider"),
                    name: `${source.name} copy`,
                    createdAt: now,
                    updatedAt: now
                  };

                  return {
                    ...current,
                    providerPresets: [duplicate, ...current.providerPresets]
                  };
                })
              }
              onFallbackProviderToggle={(provider) => {
                setDraft((current) => ({
                  ...current,
                  ai: {
                    ...current.ai,
                    fallbackProviders: current.ai.fallbackProviders.includes(provider)
                      ? current.ai.fallbackProviders.filter((item) => item !== provider)
                      : [...current.ai.fallbackProviders, provider]
                  }
                }));
                resetFromSettings();
              }}
              onKeyModeChange={(allow) => {
                setDraft((current) => ({
                  ...current,
                  ai: {
                    ...current.ai,
                    allowUserSuppliedKeys: allow
                  }
                }));
                resetFromSettings();
              }}
              onLoadProviderPreset={(id) => {
                const preset = library.providerPresets.find((item) => item.id === id);

                if (!preset) {
                  return;
                }

                setDraft((current) => ({
                  ...current,
                  ai: {
                    ...current.ai,
                    preferredProvider: preset.preferredProvider,
                    modelName: preset.modelName,
                    allowUserSuppliedKeys: preset.allowUserSuppliedKeys,
                    fallbackProviders: [...preset.fallbackProviders]
                  }
                }));
                resetFromSettings();
              }}
              onModelNameChange={(modelName) => {
                setDraft((current) => ({
                  ...current,
                  ai: {
                    ...current.ai,
                    modelName
                  }
                }));
                resetFromSettings();
              }}
              onProviderChange={(provider) => {
                setDraft((current) => ({
                  ...current,
                  ai: {
                    ...current.ai,
                    preferredProvider: provider,
                    modelName: provider === "composer-2.5" ? "composer-2.5" : current.ai.modelName || "user-selected-provider"
                  }
                }));
                resetFromSettings();
              }}
              onSaveProviderPreset={upsertProviderPreset}
              preferredProvider={draft.ai.preferredProvider}
              providerPresets={library.providerPresets}
            />
          ) : null}

          {activeStep === "mcp-connection" ? (
            <McpConnectionSection
              defaultRepoPath={draft.routeSource === "local-path" ? draft.repoPath : undefined}
              shellInfo={shellInfo}
            />
          ) : null}

          {activeStep === "review-and-run" ? (
            <ReviewRunSection
              aiConnected={aiConnected}
              canRun={repoReady && profileReviewed && policyReviewed && settingsReviewed}
              canVerify={canVerify}
              diagnosisBusy={diagnosisBusy}
              executionPermission={draft.executionPermission}
              hasRun={Boolean(lastRun)}
              lastVerifyResult={lastVerifyResult ?? undefined}
              onPermissionChange={(permission: ExecutionPermission) => {
                setDraft((current) => ({
                  ...current,
                  executionPermission: permission
                }));
                resetFromSettings();
              }}
              onRun={() => void runDiagnosis()}
              onVerify={() => void runCodebaseVerify()}
              result={previewResult}
              verifyBusy={verifyBusy}
            />
          ) : null}

          {activeStep === "results-overview" ? (
            <ResultsOverviewSection
              cursorGuidance={mcpPayload.cursorGuidance}
              hasRun={Boolean(lastRun)}
              lastRunAt={lastRunAt}
              lastVerifyAt={lastVerifyAt}
              lastVerifyResult={lastVerifyResult ?? undefined}
              mcpSummary={mcpPayload.summary}
              result={resultForDisplay}
              toolNames={arkitectMcpServer.tools.map((tool) => tool.name)}
            />
          ) : null}

          <footer className="step-footer">
            <div className="step-footer-copy">
              <strong>{stepOrder.find((step) => step.id === activeStep)?.title}</strong>
              <span>{stepOrder.find((step) => step.id === activeStep)?.description}</span>
            </div>

            <div className="step-footer-actions">
              <button className="ghost-button" disabled={activeStep === "repo-connection"} onClick={goToPreviousStep} type="button">
                Back
              </button>
              {activeStep !== "review-and-run" && activeStep !== "results-overview" ? (
                <button
                  className="primary-button"
                  disabled={
                    (activeStep === "repo-connection" && !repoReady) ||
                    (activeStep === "project-profile" && !repoReady)
                  }
                  onClick={goToNextStep}
                  type="button"
                >
                  Next
                </button>
              ) : null}
              {activeStep === "review-and-run" && lastRun ? (
                <button className="primary-button" onClick={goToNextStep} type="button">
                  Open results
                </button>
              ) : null}
              {activeStep === "review-and-run" && !lastRun && lastVerifyResult ? (
                <button className="primary-button" onClick={goToNextStep} type="button">
                  Open verify results
                </button>
              ) : null}
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
