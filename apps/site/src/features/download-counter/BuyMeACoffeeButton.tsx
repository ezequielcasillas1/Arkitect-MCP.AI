import { Coffee } from "lucide-react";
import { BUYMEACOFFEE_URL, isBuyMeACoffeeWired } from "../../lib/arkitect-links";
import { openSourceCta } from "./data";

type BuyMeACoffeeButtonProps = {
  className?: string;
  wide?: boolean;
  showHint?: boolean;
};

export function BuyMeACoffeeButton({
  className = "",
  wide = false,
  showHint = wide
}: BuyMeACoffeeButtonProps) {
  const classes = ["bmc-button", wide ? "action-button-wide" : "", className]
    .filter(Boolean)
    .join(" ");

  if (isBuyMeACoffeeWired) {
    return (
      <a
        className={classes}
        href={BUYMEACOFFEE_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Buy me a coffee (opens Buy Me a Coffee)"
      >
        <Coffee size={18} strokeWidth={1.75} aria-hidden="true" />
        {openSourceCta.donateLabel}
      </a>
    );
  }

  return (
    <span className="bmc-slot">
      <button type="button" className={classes} disabled aria-disabled="true" aria-describedby="bmc-unwired-hint">
        <Coffee size={18} strokeWidth={1.75} aria-hidden="true" />
        {openSourceCta.donateLabel}
      </button>
      {showHint ? (
        <span id="bmc-unwired-hint" className="bmc-unwired-hint">
          {openSourceCta.unwiredHint}
        </span>
      ) : (
        <span id="bmc-unwired-hint" className="visually-hidden">
          {openSourceCta.unwiredHint}
        </span>
      )}
    </span>
  );
}
