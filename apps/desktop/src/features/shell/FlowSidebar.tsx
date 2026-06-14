import type { DashboardStepId } from "@arkitect/contracts";

export interface FlowSidebarStep {
  id: DashboardStepId;
  title: string;
  description: string;
  status: "current" | "complete" | "ready" | "locked";
}

interface FlowSidebarProps {
  projectLabel: string;
  storagePath?: string;
  activeStep: DashboardStepId;
  steps: FlowSidebarStep[];
  onStepSelect: (stepId: DashboardStepId) => void;
}

export function FlowSidebar({
  projectLabel,
  storagePath,
  activeStep,
  steps,
  onStepSelect
}: FlowSidebarProps) {
  return (
    <aside className="flow-sidebar">
      <div className="sidebar-brand panel-surface">
        <p className="section-label">Arkitect Desktop</p>
        <h1>Interactive workbench</h1>
        <p className="sidebar-copy">
          Test Arkitect against another local project, review detections, and move through the diagnosis flow like a
          real desktop product.
        </p>
      </div>

      <div className="sidebar-project panel-surface">
        <span className="metric-label">Active project</span>
        <strong>{projectLabel}</strong>
        <p className="sidebar-copy">Use the repo connection step to browse to any local codebase without the Windows Store.</p>
      </div>

      <nav aria-label="Diagnosis flow" className="sidebar-nav panel-surface">
        {steps.map((step, index) => (
          <button
            className={`sidebar-step ${
              activeStep === step.id ? "sidebar-step-active" : ""
            } sidebar-step-${step.status}`}
            key={step.id}
            onClick={() => onStepSelect(step.id)}
            type="button"
          >
            <span className="sidebar-step-index">{index + 1}</span>
            <span className="sidebar-step-content">
              <strong>{step.title}</strong>
              <span>{step.description}</span>
            </span>
            <span className={`status-dot status-dot-${step.status}`} />
          </button>
        ))}
      </nav>

      <div className="sidebar-help panel-surface">
        <span className="metric-label">Local testing</span>
        <p className="sidebar-copy">Run `pnpm dev:desktop`, browse to a repo folder, then step through review and run.</p>
        {storagePath ? (
          <>
            <span className="metric-label">Local library path</span>
            <code className="sidebar-path">{storagePath}</code>
          </>
        ) : null}
      </div>
    </aside>
  );
}
