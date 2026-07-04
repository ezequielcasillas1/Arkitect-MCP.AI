export function Logo({ size = 28 }: { size?: number }) {
  return (
    <span className="brand-mark">
      <img
        src="/arkitect-mark-nav.png?v=5"
        width={size}
        height={size}
        alt="Arkitect logo"
        className="brand-mark-icon"
        decoding="async"
      />
      <span className="brand-mark-text">Arkitect</span>
    </span>
  );
}

export function HeroLogo() {
  return (
    <img
      src="/arkitect-mark.png?v=5"
      alt="Arkitect blueprint beaver logo"
      className="hero-brand-logo"
      width={240}
      height={240}
      decoding="async"
    />
  );
}
