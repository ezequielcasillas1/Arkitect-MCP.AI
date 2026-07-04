/**
 * NOTE: No beaver logo asset (svg/png) exists anywhere in this repo today —
 * apps/desktop, apps/site, and packages/design-system were all checked.
 * This renders a placeholder mark using the real, existing Arkitect theme
 * tokens (dark background + accent blue) so the site is not left without a
 * mark. Drop a real logo file at `src/assets/logo.svg` and swap the <svg>
 * below for an <img src="/src/assets/logo.svg" /> once it exists.
 */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <span className="brand-mark">
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        role="img"
        aria-label="Arkitect logo"
        className="brand-mark-icon"
      >
        <rect x="1" y="1" width="30" height="30" rx="9" fill="var(--ark-color-accent-soft)" />
        <path
          d="M16 7 L25 24 H19.5 L16 16.5 L12.5 24 H7 Z"
          fill="var(--ark-color-accent)"
        />
      </svg>
      <span className="brand-mark-text">Arkitect</span>
    </span>
  );
}
