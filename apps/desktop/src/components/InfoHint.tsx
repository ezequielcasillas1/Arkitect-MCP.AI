import { useId, useState, type ReactNode } from "react";
import { Info } from "lucide-react";

interface InfoHintProps {
  label: string;
  children: ReactNode;
  wide?: boolean;
}

export function InfoHint({ label, children, wide = false }: InfoHintProps) {
  const tooltipId = useId();
  const [open, setOpen] = useState(false);

  return (
    <span className={`info-hint${open ? " info-hint-open" : ""}`}>
      <button
        type="button"
        className="info-hint-button"
        aria-label={label}
        aria-describedby={tooltipId}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        onBlur={(event) => {
          if (!event.currentTarget.parentElement?.contains(event.relatedTarget as Node | null)) {
            setOpen(false);
          }
        }}
      >
        <Info aria-hidden="true" size={14} strokeWidth={2.25} />
      </button>
      <span className={`info-hint-tooltip${wide ? " info-hint-tooltip-wide" : ""}`} id={tooltipId} role="tooltip">
        {children}
      </span>
    </span>
  );
}
