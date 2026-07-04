import type { DiagnosisField, DiagnosisResult, RepoInspection, UserSignalInputs } from "@arkitect/contracts";
import { InfoHint } from "../../components/InfoHint";

interface FieldPatch {
  hint?: string;
  confirmed?: boolean;
  override?: string;
}

interface ProjectProfileSectionProps {
  result: DiagnosisResult;
  inspection?: RepoInspection;
  userInput: UserSignalInputs;
  onFieldPatch: (field: DiagnosisField, patch: FieldPatch) => void;
}

const fieldConfigs = [
  {
    key: "platformType",
    label: "Platform Type",
    options: ["desktop", "web", "api", "cli", "worker", "hybrid", "unknown"]
  },
  {
    key: "workloadType",
    label: "Workload Type",
    options: ["architecture-foundation", "feature-delivery", "bug-fix", "migration", "repo-recovery", "diagnosis", "unknown"]
  },
  {
    key: "currentArchitecture",
    label: "Current Architecture",
    options: [
      "vertical-slice",
      "clean-architecture",
      "hexagonal",
      "modular-monolith",
      "minimal-api",
      "domain-driven-design",
      "event-driven",
      "microservices",
      "cqrs",
      "screaming-architecture",
      "repository-pattern",
      "layered",
      "event-sourcing",
      "microkernel",
      "onion-architecture",
      "monolithic",
      "soa",
      "unit-of-work",
      "anti-corruption-layer",
      "circuit-breaker",
      "saga",
      "api-gateway",
      "bff",
      "strangler-fig",
      "spaghetti",
      "unknown"
    ]
  },
  {
    key: "repoHealth",
    label: "Repo Health",
    options: ["healthy", "drifting", "spaghetti", "unknown"]
  },
  {
    key: "likelyDiagnosisIntent",
    label: "Likely Diagnosis Intent",
    options: ["review", "feature", "bug-fix", "migration", "architecture-upgrade", "repo-recovery", "unknown"]
  }
] as const satisfies Array<{
  key: DiagnosisField;
  label: string;
  options: string[];
}>;

export function ProjectProfileSection({
  result,
  inspection,
  userInput,
  onFieldPatch
}: ProjectProfileSectionProps) {
  return (
    <section className="section-card">
      <div className="section-header">
        <div>
          <p className="section-label">Auto-Detected Project Profile</p>
          <h2>Review, hint, confirm, or override</h2>
        </div>
        <span className="status-pill status-visible">Detection-first intake</span>
      </div>

      <div className="step-grid">
        <article className="panel-card">
          <span className="metric-label">Detection context</span>
          <div className="insight-list">
            <div className="insight-item">
              <strong>Scans start from the repo itself</strong>
              <p>Auto-detection uses the selected path, manifests, sample paths, and your requested outcome.</p>
            </div>
            <div className="insight-item">
              <strong>User input stays visible</strong>
              <p>Hints nudge weak signals, confirmations lock trusted signals, and overrides replace them outright.</p>
            </div>
            <div className="insight-item">
              <strong>Healthy architecture continues</strong>
              <p>Arkitect keeps strong existing structure when the repo signal is healthy instead of forcing a rewrite.</p>
            </div>
          </div>

          {inspection ? (
            <>
              <span className="metric-label">Observed markers</span>
              <div className="chip-cluster">
                {inspection.detectedMarkers.length > 0 ? (
                  inspection.detectedMarkers.map((marker) => (
                    <span className="catalog-chip" key={marker}>
                      {marker}
                    </span>
                  ))
                ) : (
                  <span className="empty-inline">No strong structural markers captured yet.</span>
                )}
              </div>
            </>
          ) : null}
        </article>

        <article className="panel-card">
          <span className="metric-label">Final detected summary</span>
          <div className="summary-grid">
            {fieldConfigs.map(({ key, label }) => {
              const signal = result.signals[key];

              return (
                <div className="summary-tile" key={key}>
                  <span>{label}</span>
                  <strong>{signal.final.value}</strong>
                  <small>{signal.final.source}</small>
                </div>
              );
            })}
          </div>
        </article>
      </div>

      <div className="profile-grid section-spacer">
        {fieldConfigs.map(({ key, label, options }) => {
          const signal = result.signals[key];
          const fieldState = userInput[key];

          return (
            <article className="profile-card" key={key}>
              <div className="profile-header">
                <strong>{label}</strong>
                <span className={`confidence-pill confidence-${signal.final.level}`}>{signal.final.level}</span>
              </div>

              <div className="signal-badges">
                <span className="soft-pill">Auto</span>
                {fieldState?.hint ? <span className="soft-pill">Hint</span> : null}
                {fieldState?.confirmed ? <span className="soft-pill">Confirmed</span> : null}
                {fieldState?.override ? <span className="soft-pill">Override</span> : null}
              </div>

              <div className="signal-row">
                <div>
                  <span className="metric-label">Auto-detected</span>
                  <strong>{signal.auto.value}</strong>
                </div>
                <span className="soft-pill">{Math.round(signal.auto.confidence * 100)}% confidence</span>
              </div>

              <p className="profile-rationale">{signal.auto.rationale}</p>

              <div className="control-grid">
                <label>
                  User hint
                  <select
                    value={fieldState?.hint ?? ""}
                    onChange={(event) => onFieldPatch(key, { hint: event.target.value })}
                  >
                    <option value="">No hint</option>
                    {options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  User override
                  <select
                    value={fieldState?.override ?? ""}
                    onChange={(event) => onFieldPatch(key, { override: event.target.value })}
                  >
                    <option value="">No override</option>
                    {options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={Boolean(fieldState?.confirmed)}
                  onChange={(event) => onFieldPatch(key, { confirmed: event.target.checked })}
                />
                <span className="checkbox-label-copy">
                  Confirm the auto-detected value
                  <InfoHint label="What does confirming the auto-detected value mean?">
                    {`Check this when Arkitect's auto-detected value looks correct (e.g. "${signal.auto.value}"). Unchecked means you haven't verified it yet. Checked means you accept the detection and want to proceed with it. This is for visibility and control, separate from auto-continue on healthy architecture.`}
                  </InfoHint>
                </span>
              </label>

              <div className="final-row">
                <span className="metric-label">Final value</span>
                <strong>{signal.final.value}</strong>
                <span className="soft-pill">Source: {signal.final.source}</span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
