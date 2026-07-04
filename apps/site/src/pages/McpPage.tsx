import { RevealSection } from "../components/RevealSection";
import {
  AutoFillCallout,
  McpToolsSection,
  McpVersionHistorySection,
  mcpHero,
  mcpToolGroups
} from "../features/mcp-page";
import { SeoHead } from "../features/seo";

export function McpPage() {
  return (
    <div className="content-grid instructions-grid">
      <SeoHead route="/mcp" />
      <RevealSection className="panel hero-entrance instructions-hero" delay={0}>
        <p className="section-label">{mcpHero.label}</p>
        <h1>{mcpHero.title}</h1>
        <p>{mcpHero.intro}</p>
      </RevealSection>

      <AutoFillCallout />

      <RevealSection className="panel panel-card-wide" delay={60} aria-labelledby="mcp-tools-toc">
        <p className="section-label">On this page</p>
        <h2 id="mcp-tools-toc">Tools by category</h2>
        <ol className="guide-toc-list mcp-tools-toc">
          {mcpToolGroups.map((group) => (
            <li key={group.id} className="guide-toc-item">
              <a href={`#${group.id}`} className="guide-toc-link">
                {group.title}
              </a>
            </li>
          ))}
          <li className="guide-toc-item">
            <a href="#mcp-versions-heading" className="guide-toc-link">
              Version history
            </a>
          </li>
        </ol>
      </RevealSection>

      <McpToolsSection />

      <McpVersionHistorySection />
    </div>
  );
}
