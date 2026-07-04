import type { CSSProperties } from "react";
import { Download, Plug, ScanSearch, Terminal } from "lucide-react";
import { GITHUB_RELEASES_URL } from "../lib/arkitect-links";
import { RevealSection } from "./RevealSection";

const steps = [
  {
    icon: Download,
    title: "Claim your free spot",
    body: "Lock in free access while spots remain — no credit card, one claim per visitor."
  },
  {
    icon: Terminal,
    title: "Add the MCP server",
    body: "Point Cursor at the Arkitect stdio server so your AI client can call diagnosis tools directly."
  },
  {
    icon: Plug,
    title: "Connect in Cursor",
    body: "Drop the config into your MCP settings and restart the client to load Arkitect tools."
  },
  {
    icon: ScanSearch,
    title: "Run your first diagnosis",
    body: "Ask your agent to scan repo structure, health, and intent before any refactor happens."
  }
];

const mcpConfig = `{
  "mcpServers": {
    "arkitect-mcp": {
      "command": "node",
      "args": ["packages/mcp-server/dist/stdio.js"]
    }
  }
}`;

export function InstallSection() {
  return (
    <RevealSection className="panel install-panel panel-card-wide" delay={120}>
      <p className="section-label">Get Started</p>
      <h2 id="install-heading">Install Arkitect in four steps</h2>
      <p className="install-lede">
        Desktop-first architecture reasoning with an MCP server your Cursor agent can call — diagnosis,
        catalog recommendations, and guidance grounded in your repo.
      </p>

      <ol className="install-steps">
        {steps.map((step, index) => {
          const Icon = step.icon;
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

      <div className="install-config-block">
        <div className="install-config-header">
          <Terminal size={18} strokeWidth={1.75} aria-hidden="true" />
          <span>Cursor MCP config</span>
        </div>
        <pre className="install-config-code">
          <code>{mcpConfig}</code>
        </pre>
      </div>

      <p className="helper-copy">
        Prefer GitHub? Clone the repo or download from{" "}
        <a href={GITHUB_RELEASES_URL} target="_blank" rel="noopener noreferrer">
          GitHub Releases
        </a>
        , then build with the steps in the user guide.
      </p>
    </RevealSection>
  );
}
