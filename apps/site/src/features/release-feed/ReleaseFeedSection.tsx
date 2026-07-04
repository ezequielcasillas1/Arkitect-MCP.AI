import { History } from "lucide-react";
import { releaseFeed } from "./data";
import type { ReleaseEntry } from "./types";

function formatReleaseDate(iso: string): string {
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

function ReleaseFeedItem({ entry }: { entry: ReleaseEntry }) {
  const isUpcoming = entry.status === "upcoming";
  const versionLabel = `v${entry.version.replace(/^v/i, "")}`;

  return (
    <li className="release-feed-item">
      <div className="release-feed-item-header">
        <span className="release-feed-version">{versionLabel}</span>
        {isUpcoming ? (
          <span className="release-feed-badge release-feed-badge-upcoming">Coming soon</span>
        ) : entry.releaseDate ? (
          <time className="release-feed-date" dateTime={entry.releaseDate}>
            {formatReleaseDate(entry.releaseDate)}
          </time>
        ) : null}
      </div>
      <ul className="release-feed-changes">
        {entry.changes.map((change) => (
          <li key={change}>{change}</li>
        ))}
      </ul>
    </li>
  );
}

export function ReleaseFeedSection() {
  return (
    <div className="release-feed" aria-labelledby="release-feed-heading">
      <div className="release-feed-header">
        <span className="card-icon release-feed-icon" aria-hidden="true">
          <History size={20} strokeWidth={1.75} />
        </span>
        <div>
          <p className="section-label">Release notes</p>
          <h3 id="release-feed-heading">Version history</h3>
        </div>
      </div>
      <ol className="release-feed-list">
        {releaseFeed.map((entry) => (
          <ReleaseFeedItem key={entry.version} entry={entry} />
        ))}
      </ol>
    </div>
  );
}
