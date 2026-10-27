import { NavLink } from "react-router-dom";
import { BlueskyIcon } from "./BlueskyIcon";
import { BLUESKY_HANDLE, BLUESKY_PROFILE_URL } from "../lib/arkitect-links";

export function Footer() {
  return (
    <footer className="site-footer">
      <p>&copy; {new Date().getFullYear()} Arkitect. Diagnosis-first architecture guidance.</p>
      <p className="footer-links">
        <NavLink to="/about" className="footer-link">
          About
        </NavLink>
        {" · "}
        <NavLink to="/instructions" className="footer-link">
          User guide
        </NavLink>
        {" · "}
        <a href="/#install-path" className="footer-link">
          Install
        </a>
        {" · "}
        <NavLink to="/mcp" className="footer-link">
          MCP tools
        </NavLink>
        {" · "}
        <a href="/architecture" className="footer-link">
          Architecture guide
        </a>
        {" · "}
        <NavLink to="/terms" className="footer-link">
          Terms
        </NavLink>
        {" · "}
        <NavLink to="/privacy" className="footer-link">
          Privacy
        </NavLink>
        {" · "}
        <a
          href={BLUESKY_PROFILE_URL}
          className="footer-link bluesky-handle"
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Bluesky profile ${BLUESKY_HANDLE}`}
        >
          <BlueskyIcon size={14} decorative />
          {BLUESKY_HANDLE}
        </a>
      </p>
      <p className="helper-copy">arkitect-mcp.com</p>
    </footer>
  );
}
