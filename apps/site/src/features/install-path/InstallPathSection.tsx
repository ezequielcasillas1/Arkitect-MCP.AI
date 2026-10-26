import { RevealSection } from "../../components/RevealSection";
import { InstallStepsList } from "./InstallStepsList";
import { McpJsonReveal } from "./McpJsonReveal";

export function InstallPathSection() {
  return (
    <RevealSection className="panel install-panel panel-card-wide" delay={120}>
      <p className="section-label">Get Started</p>
      <h2 id="install-heading">Install Arkitect in five steps</h2>
      <p className="install-lede">
        JSON is the only settings paste. There is no Windows installer. Clone and build the MCP server,
        then paste the <code>mcp.json</code> block into Cursor or any other MCP host.
      </p>

      <InstallStepsList />

      <McpJsonReveal />

      <p className="helper-copy">Use the clone command in step one and build with the steps above.</p>
    </RevealSection>
  );
}
