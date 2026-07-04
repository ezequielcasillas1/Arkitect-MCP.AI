import { useState } from "react";
import type { CodebaseVerifyResult, DiagnosisResult, RefactoringMcpPayload, TestOverrideRunResult } from "@arkitect/contracts";
import { getArchitectureCatalogEntry, getDesignPatternDisplayName, getRemixProfileCatalogEntry, listDiagnosisStrategies } from "@arkitect/core";

interface ResultsOverviewSectionProps {
  result: DiagnosisResult;
  hasRun: boolean;
  lastRunAt?: string;
  lastVerifyResult?: CodebaseVerifyResult;
  lastVerifyAt?: string;
  lastTestOverrideResult?: TestOverrideRunResult;
  lastTestOverrideAt?: string;
  mcpSummary: string;
  cursorGuidance: string[];
  refactoringPayload?: RefactoringMcpPayload;
  toolNames: string[];
}

type ResultsTab = "overview" | "architecture" | "patterns" | "risks" | "ai" | "mcp" | "refactoring" | "verify" | "tests";

export function ResultsOverviewSection({
  result,
  hasRun,
  lastRunAt,
  lastVerifyResult,
  lastVerifyAt,
  lastTestOverrideResult,
  lastTestOverrideAt,
  mcpSummary,
  cursorGuidance,
  refactoringPayload,
  toolNames
}: ResultsOverviewSectionProps) {
  const [activeTab, setActiveTab] = useState<ResultsTab>("overview");
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
        <span className="status-pill status-visible">
          {hasRun ? "Run complete" : lastVerifyResult || lastTestOverrideResult ? "Verify complete" : "Awaiting run"}
        </span>
      </div>

      {hasRun || lastVerifyResult || lastTestOverrideResult ? (
        <>
          {hasRun ? <p className="summary-copy">{mcpSummary}</p> : null}
          {lastRunAt ? <p className="run-timestamp">Last diagnosis: {new Date(lastRunAt).toLocaleString()}</p> : null}
          {lastVerifyAt ? <p className="run-timestamp">Last verify: {new Date(lastVerifyAt).toLocaleString()}</p> : null}
          {lastTestOverrideAt ? (
            <p className="run-timestamp">Last test run: {new Date(lastTestOverrideAt).toLocaleString()}</p>
          ) : null}

          <div className="tab-row">
            {(
              ["overview", "architecture", "patterns", "risks", "ai", "mcp", "refactoring", "verify", "tests"] as ResultsTab[]
            ).map((tab) => (
              <button
                className={`tab-button ${activeTab === tab ? "tab-button-active" : ""}`}
                key={tab}
                onClick={() => setActiveTab(tab)}
                type="button"
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === "overview" && hasRun ? (
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

          {activeTab === "architecture" && hasRun ? (
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

          {activeTab === "patterns" && hasRun ? (
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

          {activeTab === "risks" && hasRun ? (
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

          {activeTab === "ai" && hasRun ? (
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

          {activeTab === "mcp" && (hasRun || lastVerifyResult || lastTestOverrideResult) ? (
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
                <p className="helper-copy">
                  MCP tools include analyze_refactoring_opportunities and list_refactoring_techniques for Refactoring
                  Guru–guided agent orchestration. Test tools: verify_codebase, run_tests, run_test_suite.
                </p>
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

          {activeTab === "refactoring" && hasRun && refactoringPayload ? (
            <div className="step-grid">
              <article className="panel-card">
                <span className="metric-label">Refactoring analysis</span>
                <p>{refactoringPayload.summary}</p>
                <ul className="tight-list">
                  {refactoringPayload.cursorGuidance.map((guidance) => (
                    <li key={guidance}>{guidance}</li>
                  ))}
                </ul>
              </article>
              <article className="panel-card">
                <span className="metric-label">Detected smells</span>
                <ul className="tight-list">
                  {refactoringPayload.analysis.detectedSmells.map((smell) => (
                    <li key={smell.id}>
                      <strong>{smell.label}</strong> ({Math.round(smell.confidence * 100)}%) — {smell.rationale}
                    </li>
                  ))}
                </ul>
              </article>
              <article className="panel-card">
                <span className="metric-label">Recommended techniques</span>
                <ul className="tight-list">
                  {refactoringPayload.analysis.recommendedTechniques.map((entry) => (
                    <li key={entry.technique.id}>
                      <strong>{entry.technique.name}</strong> ({entry.priority}) — {entry.rationale}
                    </li>
                  ))}
                </ul>
              </article>
              <article className="panel-card">
                <span className="metric-label">Orchestration plan</span>
                <ul className="tight-list">
                  {refactoringPayload.analysis.orchestrationPlan.map((phase) => (
                    <li key={phase.id}>
                      <strong>{phase.label}</strong> — {phase.summary}
                      <ul className="tight-list">
                        {phase.agentActions.map((action) => (
                          <li key={action}>{action}</li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          ) : null}

          {activeTab === "tests" ? (
            <div className="step-grid">
              {lastTestOverrideResult ? (
                <>
                  <article className="panel-card">
                    <span className="metric-label">Test override summary</span>
                    <strong className={lastTestOverrideResult.ok ? "verify-summary-ok" : "verify-summary-fail"}>
                      {lastTestOverrideResult.ok ? "Passed" : "Failed"}
                    </strong>
                    <p>{lastTestOverrideResult.summary}</p>
                    <ul className="tight-list">
                      <li>Kind: {lastTestOverrideResult.kind}</li>
                      <li>Repo: {lastTestOverrideResult.repoPath}</li>
                      <li>Command: {lastTestOverrideResult.command}</li>
                      <li>Duration: {Math.round(lastTestOverrideResult.durationMs / 1000)}s</li>
                    </ul>
                    {lastTestOverrideResult.hint ? (
                      <p className="helper-copy">{lastTestOverrideResult.hint}</p>
                    ) : null}
                  </article>
                  <article className="panel-card">
                    <span className="metric-label">Test steps</span>
                    <ul className="verify-step-list">
                      {lastTestOverrideResult.steps.map((step) => (
                        <li className={`verify-step verify-step-${step.status}`} key={step.id}>
                          <div className="verify-step-header">
                            <strong>{step.label}</strong>
                            <span className="soft-pill">{step.status}</span>
                          </div>
                          {step.outputTail ? <pre className="verify-step-output">{step.outputTail}</pre> : null}
                        </li>
                      ))}
                    </ul>
                  </article>
                </>
              ) : (
                <article className="panel-card">
                  <span className="metric-label">No test override run yet</span>
                  <p>
                    Use Review &amp; Run → Test override to run lint, build, typecheck, unit, integration, or full verify
                    without asking Cursor AI.
                  </p>
                </article>
              )}
            </div>
          ) : null}

          {activeTab === "verify" ? (
            <div className="step-grid">
              {lastVerifyResult ? (
                <>
                  <article className="panel-card">
                    <span className="metric-label">Verify summary</span>
                    <strong className={lastVerifyResult.ok ? "verify-summary-ok" : "verify-summary-fail"}>
                      {lastVerifyResult.ok ? "Passed" : "Failed"}
                    </strong>
                    <p>{lastVerifyResult.summary}</p>
                    <ul className="tight-list">
                      <li>Repo: {lastVerifyResult.repoPath}</li>
                      <li>Command: {lastVerifyResult.command}</li>
                      <li>Duration: {Math.round(lastVerifyResult.durationMs / 1000)}s</li>
                    </ul>
                    {lastVerifyResult.hint ? <p className="helper-copy">{lastVerifyResult.hint}</p> : null}
                  </article>
                  <article className="panel-card">
                    <span className="metric-label">Verify steps</span>
                    <ul className="verify-step-list">
                      {lastVerifyResult.steps.map((step) => (
                        <li className={`verify-step verify-step-${step.status}`} key={step.id}>
                          <div className="verify-step-header">
                            <strong>{step.label}</strong>
                            <span className="soft-pill">{step.status}</span>
                          </div>
                          {step.outputTail ? <pre className="verify-step-output">{step.outputTail}</pre> : null}
                        </li>
                      ))}
                    </ul>
                  </article>
                </>
              ) : (
                <article className="panel-card">
                  <span className="metric-label">No verify run yet</span>
                  <p>
                    Use Review &amp; Run → Run codebase verify, or call MCP tools from Cursor: verify_codebase,
                    run_tests, run_test_suite.
                  </p>
                </article>
              )}
            </div>
          ) : null}

          {activeTab === "overview" && !hasRun ? (
            <div className="empty-state">
              <strong>No diagnosis run yet</strong>
              <p>Run diagnosis on Review &amp; Run, or open the verify tab for codebase verification results.</p>
            </div>
          ) : null}
        </>
      ) : (
        <div className="empty-state">
          <strong>No results yet</strong>
          <p>Use Review &amp; Run to run diagnosis or codebase verify.</p>
        </div>
      )}
    </section>
  );
}
