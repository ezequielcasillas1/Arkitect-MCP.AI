import { NavLink } from "react-router-dom";

export function Footer() {
  return (
    <footer className="site-footer">
      <p>&copy; {new Date().getFullYear()} Arkitect. Diagnosis-first architecture guidance.</p>
      <p className="footer-links">
        <NavLink to="/instructions" className="footer-link">
          User guide
        </NavLink>
      </p>
      <p className="helper-copy">arkitect-mcp.com</p>
    </footer>
  );
}
