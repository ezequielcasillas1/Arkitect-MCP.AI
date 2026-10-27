import { Coffee } from "lucide-react";
import { GITHUB_REPO_URL } from "../../lib/arkitect-links";
import { ReleaseFeedSection } from "../release-feed";
import { BuyMeACoffeeButton } from "./BuyMeACoffeeButton";
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
        <BuyMeACoffeeButton wide />
      </div>

      <ReleaseFeedSection />

      <p className="helper-copy">
        {openSourceCta.helperPrefix}{" "}
        <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
        .
      </p>
    </section>
  );
}
