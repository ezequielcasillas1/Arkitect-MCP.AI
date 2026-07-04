import { Download, Gift, Loader2, Users } from "lucide-react";
import { downloadUrl, isDownloadUrlConfigured } from "../../lib/env";
import { useDownloadCounter } from "./useDownloadCounter";

const MILESTONE_STEP = 100;

export function DownloadCounterSection() {
  const { status, stats, hasClaimed, errorMessage, claim } = useDownloadCounter();

  const claimedCount = stats?.claimedCount ?? 0;
  const spotLimit = stats?.spotLimit ?? 1000;
  const remaining = Math.max(spotLimit - claimedCount, 0);
  const percent = Math.min(100, Math.round((claimedCount / spotLimit) * 100));
  const milestoneCount = Math.round(spotLimit / MILESTONE_STEP);
  const isFull = remaining === 0 && status !== "loading";
  const isBusy = status === "loading" || status === "claiming";

  let ctaLabel = "Claim your free spot";
  if (isFull && !hasClaimed) {
    ctaLabel = "All free spots claimed";
  } else if (hasClaimed) {
    ctaLabel = "You're on the list";
  } else if (status === "claiming") {
    ctaLabel = "Claiming…";
  }

  return (
    <section className="panel" aria-labelledby="download-counter-heading">
      <div className="counter-header">
        <span className="card-icon counter-icon" aria-hidden="true">
          <Gift size={22} strokeWidth={1.75} />
        </span>
        <div>
          <p className="section-label">Free For The First 1,000</p>
          <h2 id="download-counter-heading">Claim a free spot before they run out.</h2>
        </div>
      </div>
      <p>
        Arkitect is free for the first 1,000 people who claim a spot. After that, membership pricing
        takes over — claim yours now to lock in free access.
      </p>

      <div className="counter-live-region" role="status" aria-live="polite">
        {status === "loading" ? (
          <span className="counter-loading">
            <Loader2 size={16} className="spin-icon" aria-hidden="true" />
            Loading live claim count…
          </span>
        ) : (
          `${claimedCount} of ${spotLimit} free spots claimed`
        )}
      </div>

      <div
        className="counter-progress-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={spotLimit}
        aria-valuenow={claimedCount}
        aria-valuetext={`${claimedCount} of ${spotLimit} free spots claimed`}
      >
        <div className="counter-progress-fill" style={{ width: `${percent}%` }} />
        <div className="counter-progress-milestones" aria-hidden="true">
          {Array.from({ length: milestoneCount - 1 }, (_, index) => (
            <span key={index} className="counter-progress-milestone" style={{ left: `${((index + 1) / milestoneCount) * 100}%` }} />
          ))}
        </div>
      </div>

      <div className="counter-stats-row">
        <span className="counter-stat">
          <Users size={16} aria-hidden="true" />
          <strong>{claimedCount}</strong> claimed
        </span>
        <span className="counter-stat">
          <Gift size={16} aria-hidden="true" />
          <strong>{remaining}</strong> spots left
        </span>
      </div>

      {hasClaimed ? (
        <div className="counter-claim-success">
          <p className="counter-claim-success-text">You&apos;re on the list — grab your download below.</p>
          {isDownloadUrlConfigured ? (
            <a
              href={downloadUrl}
              className="primary-button action-button-wide"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download size={18} aria-hidden="true" />
              Download Arkitect
            </a>
          ) : (
            <>
              <p className="helper-copy">
                Download link is not configured yet. Continue with the install steps below.
              </p>
              <a href="#install-heading" className="secondary-button action-button-wide">
                See install steps
              </a>
            </>
          )}
        </div>
      ) : (
        <button
          type="button"
          className="primary-button action-button-wide"
          onClick={claim}
          disabled={isBusy || isFull}
          aria-describedby={errorMessage ? "download-counter-error" : undefined}
        >
          {status === "claiming" ? (
            <>
              <Loader2 size={18} className="spin-icon" aria-hidden="true" />
              {ctaLabel}
            </>
          ) : (
            ctaLabel
          )}
        </button>
      )}

      {errorMessage ? (
        <p id="download-counter-error" role="alert" className="counter-error">
          {errorMessage}
        </p>
      ) : null}

      <p className="helper-copy">No credit card required. One free spot per visitor.</p>
    </section>
  );
}
