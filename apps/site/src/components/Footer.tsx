import { NavLink } from "react-router-dom";

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
        <NavLink to="/architecture" className="footer-link">
          Architecture guide
        </NavLink>
        {" · "}
        <NavLink to="/terms" className="footer-link">
          Terms
        </NavLink>
        {" · "}
        <NavLink to="/privacy" className="footer-link">
          Privacy
        </NavLink>
      </p>
      <p className="helper-copy">arkitect-mcp.com</p>
    </footer>
  );
}
