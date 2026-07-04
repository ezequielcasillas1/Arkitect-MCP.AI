export function Logo({ size = 28 }: { size?: number }) {
  return (
    <span className="brand-mark">
      <img
        src="/arkitect-mark-nav.png"
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
