import { Coffee } from "lucide-react";
import { ReleaseFeedSection } from "../release-feed";
import { openSourceCta } from "./data";

export function DownloadCounterSection() {
  return (
    <section className="panel" id="open-source" aria-labelledby="download-counter-heading">
      <div className="counter-header">
        <span className="card-icon counter-icon" aria-hidden="true">
          <Coffee size={22} strokeWidth={1.75} />
        </span>
        <div>
          <p className="section-label">{openSourceCta.label}</p>
          <h2 id="download-counter-heading">{openSourceCta.heading}</h2>
        </div>
      </div>
      <p>{openSourceCta.body}</p>

      <div className="support-actions">
        <a href="#install-path" className="primary-button action-button-wide">
          {openSourceCta.installLabel}
        </a>
      </div>

      <ReleaseFeedSection />

      <p className="helper-copy">{openSourceCta.helperCopy}</p>
    </section>
  );
}
