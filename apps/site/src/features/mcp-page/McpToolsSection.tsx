import { RevealSection } from "../../components/RevealSection";
import { mcpToolGroups } from "./data";

export function McpToolsSection() {
  return (
    <>
      {mcpToolGroups.map((group, index) => (
        <RevealSection
          key={group.id}
          className="panel panel-card-wide mcp-tool-group"
          delay={80 + index * 40}
          aria-labelledby={`${group.id}-heading`}
        >
          <section id={group.id}>
            <p className="section-label">{group.label}</p>
            <h2 id={`${group.id}-heading`}>{group.title}</h2>
            <p className="guide-paragraph">{group.intro}</p>

            <div className="mcp-tool-grid">
              {group.tools.map((tool) => (
                <article key={tool.name} className="mcp-tool-card">
                  <h3 className="mcp-tool-name">
                    <code className="guide-inline-code">{tool.name}</code>
                  </h3>
                  <p className="mcp-tool-purpose">{tool.purpose}</p>
                  <p className="mcp-tool-usage">
                    <strong>How to use:</strong> {tool.usage}
                  </p>
                  <p className="mcp-tool-example">
                    <strong>Example prompt:</strong> <em>&ldquo;{tool.example}&rdquo;</em>
                  </p>
                </article>
              ))}
            </div>
          </section>
        </RevealSection>
      ))}
    </>
  );
}
