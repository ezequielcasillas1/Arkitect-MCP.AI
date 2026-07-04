import { History } from "lucide-react";
import { RevealSection } from "../../components/RevealSection";
import { mcpVersionHistory } from "./data";
import type { McpVersionEntry } from "./types";

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  } catch {
    return iso;
  }
}

function versionBadge(entry: McpVersionEntry) {
  if (entry.status === "milestone") return "Milestone";
  if (entry.status === "upcoming") return "Coming soon";
  return null;
}

export function McpVersionHistorySection() {
  return (
    <RevealSection
      className="panel panel-card-wide mcp-version-panel"
      delay={220}
      aria-labelledby="mcp-versions-heading"
    >
      <div className="release-feed-header">
        <span className="card-icon release-feed-icon" aria-hidden="true">
          <History size={20} strokeWidth={1.75} />
        </span>
        <div>
          <p className="section-label">Version history</p>
          <h2 id="mcp-versions-heading">Every version of Arkitect MCP</h2>
        </div>
      </div>

      <ol className="mcp-version-list">
        {mcpVersionHistory.map((entry) => {
          const formattedDate = formatDate(entry.releaseDate);
          const badge = versionBadge(entry);
          const versionLabel = `v${entry.version.replace(/^v/i, "")}`;

          return (
            <li key={entry.version} className="mcp-version-item">
              <div className="mcp-version-item-header">
                <span className="release-feed-version">{versionLabel}</span>
                {badge ? (
                  <span className="release-feed-badge release-feed-badge-upcoming">{badge}</span>
                ) : formattedDate ? (
                  <time className="release-feed-date" dateTime={entry.releaseDate ?? undefined}>
                    {formattedDate}
                  </time>
                ) : null}
              </div>
              <h3 className="mcp-version-title">{entry.title}</h3>
              <p className="mcp-version-summary">{entry.summary}</p>
              <ul className="release-feed-changes">
                {entry.highlights.map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
            </li>
          );
        })}
      </ol>
    </RevealSection>
  );
}
