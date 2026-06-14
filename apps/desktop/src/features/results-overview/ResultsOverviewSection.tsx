import { useState } from "react";
import type { DiagnosisResult } from "@arkitect/contracts";
import { getArchitectureCatalogEntry, getDesignPatternDisplayName, getRemixProfileCatalogEntry, listDiagnosisStrategies } from "@arkitect/core";

interface ResultsOverviewSectionProps {
  result: DiagnosisResult;
  hasRun: boolean;
  lastRunAt?: string;
  mcpSummary: string;
  cursorGuidance: string[];
  toolNames: string[];
}

export function ResultsOverviewSection({
  result,
  hasRun,
  lastRunAt,
  mcpSummary,
  cursorGuidance,
  toolNames
}: ResultsOverviewSectionProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "architecture" | "patterns" | "risks" | "ai" | "mcp">("overview");
  const selectedArchitecture = result.decision.selectedArchitectureId
    ? getArchitectureCatalogEntry(result.decision.selectedArchitectureId)
    : undefined;
  const selectedRemix = result.decision.selectedRemixId
    ? getRemixProfileCatalogEntry(result.decision.selectedRemixId)
    : undefined;
  const strategyLabels = new Map(listDiagnosisStrategies().map((strategy) => [strategy.id, strategy.label]));
  const payloadPreview = JSON.stringify(
    {
      platformType: result.signals.platformType.final.value,
      currentArchitecture: result.signals.currentArchitecture.final.value,
      repoHealth: result.signals.repoHealth.final.value,
      selectedArchitectureId: result.decision.selectedArchitectureId,
      selectedRemixId: result.decision.selectedRemixId,
      recommendedAction: result.decision.recommendedAction,
      complexityProfile: result.patternGuidance.complexityProfile,
      patternAffinityScore: result.patternGuidance.patternAffinityScore,
      executionPermission: result.intake.executionPermission,
      strategies: result.decision.appliedStrategies
    },
    null,
    2
  );

  return (
    <section className="section-card">
      <div className="section-header">
        <div>
          <p className="section-label">Results</p>
          <h2>Interactive diagnosis output</h2>
        </div>
        <span className="status-pill status-visible">{hasRun ? "Run complete" : "Awaiting run"}</span>
      </div>

      {hasRun ? (
        <>
          <p className="summary-copy">{mcpSummary}</p>
          {lastRunAt ? <p className="run-timestamp">Last run: {new Date(lastRunAt).toLocaleString()}</p> : null}

          <div className="tab-row">
            {["overview", "architecture", "patterns", "risks", "ai", "mcp"].map((tab) => (
              <button
                className={`tab-button ${activeTab === tab ? "tab-button-active" : ""}`}
                key={tab}
                onClick={() => setActiveTab(tab as typeof activeTab)}
                type="button"
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === "overview" ? (
            <div className="metric-grid">
              <article className="metric-card">
                <span className="metric-label">Detected profile</span>
                <strong>{result.signals.currentArchitecture.final.value}</strong>
                <p>
                  {result.signals.platformType.final.value} | {result.signals.workloadType.final.value} |{" "}
                  {result.signals.repoHealth.final.value}
                </p>
              </article>
              <article className="metric-card">
                <span className="metric-label">Recommended action</span>
                <strong>{result.decision.recommendedAction}</strong>
                <p>{result.decision.reason}</p>
              </article>
              <article className="metric-card">
                <span className="metric-label">Execution recommendation</span>
                <strong>{result.decision.requiredPermission}</strong>
                <p>{result.decision.recommendedExecutionMode}</p>
              </article>
              {result.aiEnrichment ? (
                <article className="metric-card metric-card-wide">
                  <span className="metric-label">AI summary ({result.aiEnrichment.status})</span>
                  <p>{result.aiEnrichment.summary}</p>
                </article>
              ) : null}
            </div>
          ) : null}

          {activeTab === "architecture" ? (
            <div className="step-grid">
              <article className="panel-card">
                <span className="metric-label">Detected architecture</span>
                <strong>{selectedArchitecture?.displayName ?? "No stable architecture selected"}</strong>
                <p>{selectedArchitecture?.summary ?? "The current repo needs more structural confirmation."}</p>
                <div className="tag-row">
                  {(selectedArchitecture?.strengths ?? []).slice(0, 3).map((strength) => (
                    <span className="soft-pill" key={strength}>
                      {strength}
                    </span>
                  ))}
                </div>
              </article>
              <article className="panel-card">
                <span className="metric-label">Recommended remix</span>
                <strong>{selectedRemix?.displayName ?? "Auto-ranked only"}</strong>
                <p>{selectedRemix?.summary ?? "Use remix ranking after the architecture direction stabilizes."}</p>
                <div className="tag-row">
                  {result.catalogRecommendation.architectureCandidates.slice(0, 4).map((candidate) => (
                    <span className="soft-pill" key={candidate.id}>
                      {candidate.id} {Math.round(candidate.score * 100)}%
                    </span>
                  ))}
                </div>
              </article>
            </div>
          ) : null}

          {activeTab === "patterns" ? (
            <div className="step-grid">
              <article className="panel-card">
                <span className="metric-label">Recommended design patterns</span>
                <div className="pattern-stack">
                  <div className="pattern-family-group">
                    <strong>Creational</strong>
                    <div className="tag-row">
                      {result.patternGuidance.recommendedPatterns.creational.map((pattern) => (
                        <span className="soft-pill" key={pattern}>
                          {getDesignPatternDisplayName(pattern)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="pattern-family-group">
                    <strong>Structural</strong>
                    <div className="tag-row">
                      {result.patternGuidance.recommendedPatterns.structural.map((pattern) => (
                        <span className="soft-pill" key={pattern}>
                          {getDesignPatternDisplayName(pattern)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="pattern-family-group">
                    <strong>Behavioral</strong>
                    <div className="tag-row">
                      {result.patternGuidance.recommendedPatterns.behavioral.map((pattern) => (
                        <span className="soft-pill" key={pattern}>
                          {getDesignPatternDisplayName(pattern)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
              <article className="panel-card">
                <span className="metric-label">Pattern DNA</span>
                <p>Affinity score: {Math.round(result.patternGuidance.patternAffinityScore * 100)}%</p>
                <p>Over-engineering risk: {result.patternGuidance.overEngineeringRisk}</p>
                <div className="tag-row">
                  {result.patternGuidance.deferredPatterns.map((pattern) => (
                    <span className="soft-pill" key={pattern}>
                      Deferred: {getDesignPatternDisplayName(pattern)}
                    </span>
                  ))}
                </div>
              </article>
            </div>
          ) : null}

          {activeTab === "risks" ? (
            <div className="step-grid">
              <article className="panel-card">
                <span className="metric-label">Warnings and drift</span>
                <ul className="tight-list">
                  {result.decision.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                  {result.patternGuidance.antiPatternWarnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </article>
              <article className="panel-card">
                <span className="metric-label">Next actions</span>
                <ul className="tight-list">
                  {result.decision.nextSteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
                <div className="tag-row">
                  {result.decision.appliedStrategies.map((strategyId) => (
                    <span className="soft-pill" key={strategyId}>
                      {strategyLabels.get(strategyId) ?? strategyId}
                    </span>
                  ))}
                </div>
              </article>
            </div>
          ) : null}

          {activeTab === "ai" ? (
            <div className="step-grid">
              {result.aiEnrichment ? (
                <>
                  <article className="panel-card">
                    <span className="metric-label">AI reasoning</span>
                    <p className="helper-copy">
                      Provider: {result.aiEnrichment.provider} · Model: {result.aiEnrichment.modelName}
                      {result.aiEnrichment.latencyMs ? ` · ${result.aiEnrichment.latencyMs}ms` : ""}
                    </p>
                    <p>{result.aiEnrichment.summary}</p>
                    <ul className="tight-list">
                      {result.aiEnrichment.reasoning.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </article>
                  <article className="panel-card">
                    <span className="metric-label">AI next actions</span>
                    <ul className="tight-list">
                      {result.aiEnrichment.nextActions.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ul>
                    {result.aiEnrichment.error ? (
                      <div className="warning-box">
                        <strong>{result.aiEnrichment.error.code}</strong>
                        <p>{result.aiEnrichment.error.message}</p>
                      </div>
                    ) : null}
                    <p className="helper-copy">
                      Rule-based warnings and next steps remain visible on the Risks tab. AI output enriches — it does not
                      override permission guardrails.
                    </p>
                  </article>
                </>
              ) : (
                <article className="panel-card">
                  <span className="metric-label">No AI enrichment</span>
                  <p>Connect a Cursor API Key on the AI / Execution step and re-run diagnosis for live model reasoning.</p>
                </article>
              )}
            </div>
          ) : null}

          {activeTab === "mcp" ? (
            <div className="step-grid">
              <article className="panel-card">
                <span className="metric-label">MCP tools</span>
                <div className="tag-row">
                  {toolNames.map((toolName) => (
                    <span className="soft-pill" key={toolName}>
                      {toolName}
                    </span>
                  ))}
                </div>
                <span className="metric-label">Cursor guidance</span>
                <ul className="tight-list">
                  {cursorGuidance.map((guidance) => (
                    <li key={guidance}>{guidance}</li>
                  ))}
                </ul>
              </article>
              <article className="panel-card">
                <span className="metric-label">Payload preview</span>
                <pre className="payload-preview">{payloadPreview}</pre>
              </article>
            </div>
          ) : null}
        </>
      ) : (
        <div className="empty-state">
          <strong>No diagnosis run yet</strong>
          <p>Use the Review & Run step to generate a real results screen, tabbed output, and MCP payload preview.</p>
        </div>
      )}
    </section>
  );
}
