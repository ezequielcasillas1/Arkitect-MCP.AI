import userGuideMarkdown from "../../../../docs/USER_GUIDE.md?raw";
import { RevealSection } from "../components/RevealSection";
import { downloadGuideAsText } from "../features/instructions/download-guide";
import { MarkdownContent, useGuideHeadings } from "../features/instructions/MarkdownContent";

export function InstructionsPage() {
  const headings = useGuideHeadings(userGuideMarkdown);

  return (
    <div className="content-grid instructions-grid">
      <RevealSection className="panel hero-entrance instructions-hero" delay={0}>
        <p className="section-label">Instructions</p>
        <h1>Arkitect user guide</h1>
        <p>
          Self-service setup for the MCP server and optional marketing site — use only the pieces
          you need with any hosting, database, and MCP client. Everything runs on your machine and
          your accounts; Arkitect ships modular code and docs, not a locked Cloudflare + Supabase stack.
        </p>
        <div className="instructions-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => downloadGuideAsText(userGuideMarkdown)}
          >
            Download guide (.txt)
          </button>
        </div>
      </RevealSection>

      <RevealSection className="panel instructions-layout" delay={60}>
        <aside className="guide-toc" aria-label="Guide sections">
          <p className="guide-toc-label">On this page</p>
          <nav>
            <ol className="guide-toc-list">
              {headings.map((heading) => (
                <li
                  key={heading.id}
                  className={heading.level === 3 ? "guide-toc-item guide-toc-item-nested" : "guide-toc-item"}
                >
                  <a href={`#${heading.id}`} className="guide-toc-link">
                    {heading.text}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <MarkdownContent markdown={userGuideMarkdown} />
      </RevealSection>
    </div>
  );
}
