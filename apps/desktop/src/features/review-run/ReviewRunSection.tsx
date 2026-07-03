import type {
  CodebaseVerifyResult,
  DiagnosisResult,
  ExecutionPermission,
  TestOverrideCapability,
  TestOverrideCatalog,
  TestOverrideKind,
  TestOverrideRunResult
} from "@arkitect/contracts";
import { InfoHint } from "../../components/InfoHint";

interface ReviewRunSectionProps {
  executionPermission: ExecutionPermission;
  result: DiagnosisResult;
  canRun: boolean;
  canVerify: boolean;
  hasRun: boolean;
  diagnosisBusy: boolean;
  verifyBusy: boolean;
  testOverrideBusy: boolean;
  aiConnected: boolean;
  lastVerifyResult?: CodebaseVerifyResult;
  lastTestOverrideResult?: TestOverrideRunResult;
  testCatalog?: TestOverrideCatalog;
  onPermissionChange: (permission: ExecutionPermission) => void;
  onRun: () => void;
  onVerify: () => void;
  onDiscoverTests: () => void;
  onRunTestOverride: (kind: TestOverrideKind) => void;
}

const permissionOrder: ExecutionPermission[] = [
  "read-only",
  "generate-plan",
  "propose-changes",
  "apply-safe-changes",
  "apply-structural-changes"
];

const permissionDescriptions: Record<ExecutionPermission, string> = {
  "read-only": "Show findings only with no file changes.",
  "generate-plan": "Allow planning artifacts and structured recommendations.",
  "propose-changes": "Allow generated code proposals without applying them.",
  "apply-safe-changes": "Allow implementation changes that stay inside the current structure.",
  "apply-structural-changes": "Allow structural migration or refactor work when explicitly requested."
};

export function ReviewRunSection({
  executionPermission,
  result,
  canRun,
  canVerify,
  hasRun,
  diagnosisBusy,
  verifyBusy,
  testOverrideBusy,
  aiConnected,
  lastVerifyResult,
  lastTestOverrideResult,
  testCatalog,
  onPermissionChange,
  onRun,
  onVerify,
  onDiscoverTests,
  onRunTestOverride
}: ReviewRunSectionProps) {
  const { decision } = result;
  const permissionBlocked =
    permissionOrder.indexOf(executionPermission) < permissionOrder.indexOf(decision.requiredPermission);
  const runnableCapabilities = (testCatalog?.capabilities ?? []).filter((cap) => cap.available);
  const testCapabilities = runnableCapabilities.filter((cap) => cap.category === "test");
  const qualityCapabilities = runnableCapabilities.filter((cap) => cap.category === "quality");
  const verifyCapability = runnableCapabilities.find((cap) => cap.id === "verify");

  function renderCapabilityButton(capability: TestOverrideCapability) {
    return (
      <button
        className="secondary-button test-override-button"
        disabled={!canVerify || testOverrideBusy || diagnosisBusy || verifyBusy}
        key={capability.id}
        onClick={() => onRunTestOverride(capability.id)}
        type="button"
      >
        {testOverrideBusy && lastTestOverrideResult?.kind === capability.id
          ? `Running ${capability.label}…`
          : capability.label}
      </button>
    );
  }

  return (
    <section className="section-card">
      <div className="section-header">
        <div>
          <p className="section-label">Review And Run</p>
          <h2>Execution permission boundary</h2>
        </div>
        <span className={`status-pill ${permissionBlocked ? "status-attention" : "status-visible"}`}>
          {executionPermission}
        </span>
      </div>

      <div className="metric-grid">
        <article className="metric-card">
          <div className="metric-label-row">
            <span className="metric-label">Current permission</span>
            <InfoHint label="How to choose an execution permission" wide>
              <p className="permission-guide-copy">
                Pick the highest level you&apos;re comfortable with. Diagnosis is blocked if your choice is below what
                this setup requires.
              </p>
              <ul className="permission-guide-list">
                {permissionOrder.map((permission) => (
                  <li
                    key={permission}
                    className={permission === decision.requiredPermission ? "permission-guide-required" : undefined}
                  >
                    <strong>{permission}</strong>
                    <span>{permissionDescriptions[permission]}</span>
                    {permission === decision.requiredPermission ? <em>Minimum for this setup</em> : null}
                  </li>
                ))}
              </ul>
            </InfoHint>
          </div>
          <select value={executionPermission} onChange={(event) => onPermissionChange(event.target.value as ExecutionPermission)}>
            {permissionOrder.map((permission) => (
              <option key={permission} value={permission}>
                {permission}
              </option>
            ))}
          </select>
          <p>{permissionDescriptions[executionPermission]}</p>
        </article>

        <article className="metric-card">
          <div className="metric-label-row">
            <span className="metric-label">Decision requirements</span>
            <InfoHint label="What decision requirements mean">
              The rule engine sets the minimum permission for this diagnosis path. Match or exceed it in Current
              permission, or stay read-only if you only want findings.
            </InfoHint>
          </div>
          <strong>{decision.requiredPermission}</strong>
          <p>Minimum permission for this setup. Raise Current permission to at least this level to run diagnosis.</p>
        </article>

        <article className="metric-card">
          <span className="metric-label">Execution mode</span>
          <strong>{decision.recommendedExecutionMode}</strong>
          <p>Recommended action: {decision.recommendedAction}</p>
        </article>
      </div>

      <div className="step-grid section-spacer">
        <article className="panel-card">
          <span className="metric-label">Run checklist</span>
          <ul className="tight-list">
            <li>Repo path: {result.intake.repoPath}</li>
            <li>Detected architecture: {result.signals.currentArchitecture.final.value}</li>
            <li>Repo health: {result.signals.repoHealth.final.value}</li>
            <li>Selected remix: {result.decision.selectedRemixId ?? "auto-ranked only"}</li>
            <li>Provider: {result.intake.ai.preferredProvider}</li>
            <li>Model: {result.intake.ai.modelName}</li>
            <li>AI connection: {aiConnected ? "connected" : "not connected / skipped"}</li>
          </ul>
        </article>

        <article className="panel-card">
          <span className="metric-label">Run diagnosis</span>
          <p className="summary-copy">
            Runs the rule-based engine first, then calls your connected model with a structured facts bundle (repo
            inspection, detections, policy, catalog). AI enriches summary, reasoning, and next actions — it does not
            replace safety guardrails.
          </p>
          <button
            className="primary-button action-button-wide"
            disabled={!canRun || permissionBlocked || diagnosisBusy}
            onClick={onRun}
            type="button"
          >
            {diagnosisBusy ? "Running diagnosis…" : hasRun ? "Run diagnosis again" : "Run diagnosis"}
          </button>
        </article>

        <article className="panel-card">
          <div className="metric-label-row">
            <span className="metric-label">Run codebase verify</span>
            <InfoHint label="How codebase verify works" wide>
              <p className="permission-guide-copy">
                Runs pnpm lint, pnpm build, pnpm typecheck, then pnpm test from the connected local repo root — the same
                as <strong>pnpm verify</strong>.
              </p>
              <p className="permission-guide-copy">
                Always run from the project folder that contains package.json. Running from C:\Windows\System32 will fail
                with a permissions error.
              </p>
            </InfoHint>
          </div>
          <p className="summary-copy">
            Self-check the whole monorepo before or after diagnosis. GitHub-only routes must use a local library path or
            terminal verify.
          </p>
          <button
            className="secondary-button action-button-wide"
            disabled={!canVerify || verifyBusy || diagnosisBusy}
            onClick={onVerify}
            type="button"
          >
            {verifyBusy ? "Running verify…" : lastVerifyResult ? "Run verify again" : "Run codebase verify"}
          </button>
          {lastVerifyResult ? (
            <p className={`verify-summary ${lastVerifyResult.ok ? "verify-summary-ok" : "verify-summary-fail"}`}>
              {lastVerifyResult.summary}
            </p>
          ) : null}
        </article>

        <article className="panel-card panel-card-wide">
          <div className="metric-label-row">
            <span className="metric-label">Test override (replaces Cursor AI test runs)</span>
            <InfoHint label="How test override works" wide>
              <p className="permission-guide-copy">
                Arkitect runs lint, build, typecheck, and test scripts from your connected repo root — the same commands
                Cursor AI would run in chat, but controlled here.
              </p>
              <p className="permission-guide-copy">
                Use <strong>Full verify</strong> for the complete pipeline, or pick individual suites (unit, integration,
                all tests).
              </p>
            </InfoHint>
          </div>
          <p className="summary-copy">
            {testCatalog?.summary ?? "Connect a local repo path to discover runnable test commands."}
          </p>
          <div className="test-override-actions">
            <button
              className="ghost-button"
              disabled={!canVerify || testOverrideBusy}
              onClick={onDiscoverTests}
              type="button"
            >
              Refresh commands
            </button>
            {verifyCapability ? renderCapabilityButton(verifyCapability) : null}
          </div>
          {qualityCapabilities.length > 0 ? (
            <div className="test-override-group">
              <span className="metric-label">Quality checks</span>
              <div className="test-override-button-row">{qualityCapabilities.map(renderCapabilityButton)}</div>
            </div>
          ) : null}
          {testCapabilities.length > 0 ? (
            <div className="test-override-group">
              <span className="metric-label">Test suites</span>
              <div className="test-override-button-row">{testCapabilities.map(renderCapabilityButton)}</div>
            </div>
          ) : null}
          {lastTestOverrideResult ? (
            <p
              className={`verify-summary ${lastTestOverrideResult.ok ? "verify-summary-ok" : "verify-summary-fail"}`}
            >
              {lastTestOverrideResult.summary}
            </p>
          ) : null}
        </article>
      </div>

      {permissionBlocked ? (
        <div className="warning-box">
          <strong>Permission mismatch</strong>
          <p>The selected permission is below the level required by the current architecture decision.</p>
        </div>
      ) : null}
    </section>
  );
}
