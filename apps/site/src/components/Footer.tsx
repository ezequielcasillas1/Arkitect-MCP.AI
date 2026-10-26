import { NavLink } from "react-router-dom";

const footerLinks = [
  { to: "/about", label: "About", router: true },
  { to: "/instructions", label: "User guide", router: true },
  { to: "/#install-path", label: "Install", router: false },
  { to: "/mcp", label: "MCP tools", router: true },
  { to: "/architecture", label: "Architecture guide", router: false },
  { to: "/terms", label: "Terms", router: true },
  { to: "/privacy", label: "Privacy", router: true }
] as const;

export function Footer() {
  return (
    <footer className="site-footer">
      <p>&copy; {new Date().getFullYear()} Arkitect. Diagnosis-first architecture guidance.</p>
      <nav className="footer-links" aria-label="Footer">
        <ul className="footer-link-list">
          {footerLinks.map((link) => (
            <li key={link.label}>
              {link.router ? (
                <NavLink to={link.to} className="footer-link">
                  {link.label}
                </NavLink>
              ) : (
                <a href={link.to} className="footer-link">
                  {link.label}
                </a>
              )}
            </li>
          ))}
        </ul>
      </nav>
      <p className="helper-copy">arkitect-mcp.com</p>
    </footer>
  );
}
