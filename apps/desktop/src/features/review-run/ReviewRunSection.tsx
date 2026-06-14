import type { DiagnosisResult, ExecutionPermission } from "@arkitect/contracts";

interface ReviewRunSectionProps {
  executionPermission: ExecutionPermission;
  result: DiagnosisResult;
  canRun: boolean;
  hasRun: boolean;
  onPermissionChange: (permission: ExecutionPermission) => void;
  onRun: () => void;
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
  hasRun,
  onPermissionChange,
  onRun
}: ReviewRunSectionProps) {
  const { decision } = result;
  const permissionBlocked =
    permissionOrder.indexOf(executionPermission) < permissionOrder.indexOf(decision.requiredPermission);

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
          <span className="metric-label">Current permission</span>
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
          <span className="metric-label">Decision requirements</span>
          <strong>{decision.requiredPermission}</strong>
          <p>Arkitect surfaces the required permission before it runs so users can approve or keep the flow read-only.</p>
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
          </ul>
        </article>

        <article className="panel-card">
          <span className="metric-label">Run diagnosis</span>
          <p className="summary-copy">
            Running the diagnosis captures the current repo selection, policy direction, AI settings, and the
            MCP-exposed payload for the results screen.
          </p>
          <button
            className="primary-button action-button-wide"
            disabled={!canRun || permissionBlocked}
            onClick={onRun}
            type="button"
          >
            {hasRun ? "Run diagnosis again" : "Run diagnosis"}
          </button>
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
