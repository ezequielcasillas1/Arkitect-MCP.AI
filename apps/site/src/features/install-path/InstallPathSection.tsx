import type { CSSProperties } from "react";
import { FileJson, Plug, RotateCw, ScanSearch } from "lucide-react";
import { GITHUB_REPO_URL } from "../../lib/arkitect-links";
import { RevealSection } from "../../components/RevealSection";
import { installSteps } from "./data";
import { McpJsonReveal } from "./McpJsonReveal";

const stepIcons = [FileJson, Plug, RotateCw, ScanSearch];

export function InstallPathSection() {
  return (
    <RevealSection className="panel install-panel panel-card-wide" delay={120}>
      <p className="section-label">Get Started</p>
      <h2 id="install-heading">Install Arkitect in four steps</h2>
      <p className="install-lede">
        No Windows app download. Reveal the client-repo <code>mcp.json</code> path, paste it into Cursor, then
        restart MCP.
      </p>

      <ol className="install-steps">
        {installSteps.map((step, index) => {
          const Icon = stepIcons[index] ?? FileJson;
          return (
            <li key={step.title} className="install-step" style={{ "--step-index": index } as CSSProperties}>
              <span className="install-step-icon" aria-hidden="true">
                <Icon size={22} strokeWidth={1.75} />
              </span>
              <div>
                <strong>{step.title}</strong>
                <p>{step.body}</p>
              </div>
            </li>
          );
        })}
      </ol>

      <McpJsonReveal />

      <p className="helper-copy">
        Need the source? Clone{" "}
        <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer">
          the GitHub repo
        </a>{" "}
        and build with the steps in the user guide.
      </p>
    </RevealSection>
  );
}
