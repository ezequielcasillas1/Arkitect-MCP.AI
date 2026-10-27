import { BlueskyIcon } from "./BlueskyIcon";
import { BLUESKY_HANDLE, BLUESKY_PROFILE_URL } from "../lib/arkitect-links";

export function ConnectSection() {
  return (
    <section className="panel connect-panel" aria-labelledby="connect-heading">
      <p className="section-label">Stay In Touch</p>
      <h2 id="connect-heading">Connect with me</h2>
      <p>
        Reach out on Bluesky if you need help or have concerns — bugs, feature requests, or feedback.
        Every message gets read.
      </p>
      <ul className="connect-links">
        <li>
          <a
            href={BLUESKY_PROFILE_URL}
            className="connect-link-card"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Bluesky profile ${BLUESKY_HANDLE}`}
          >
            <span className="connect-link-text">
              <strong>Bluesky</strong>
              <span className="bluesky-handle">
                <BlueskyIcon size={14} decorative />
                {BLUESKY_HANDLE}
              </span>
            </span>
          </a>
        </li>
      </ul>
    </section>
  );
}
