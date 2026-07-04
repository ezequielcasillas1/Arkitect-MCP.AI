import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { Logo } from "./Logo";

const links = [
  { to: "/", label: "Home" },
  { to: "/instructions", label: "Instructions" },
  { to: "/mcp", label: "MCP" },
  { to: "/architecture", label: "Architecture" },
  { to: "/about", label: "About" },
  { to: "/reviews", label: "Reviews" }
];

export function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.classList.toggle("nav-menu-open", menuOpen);
    return () => document.body.classList.remove("nav-menu-open");
  }, [menuOpen]);

  return (
    <header className="site-nav nav-entrance">
      <NavLink to="/" className="brand-link" aria-label="Arkitect home">
        <Logo />
      </NavLink>

      <button
        type="button"
        className="nav-toggle"
        aria-expanded={menuOpen}
        aria-controls="site-primary-nav"
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span className="visually-hidden">{menuOpen ? "Close menu" : "Open menu"}</span>
        {menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
      </button>

      <nav id="site-primary-nav" className={menuOpen ? "site-nav-panel site-nav-panel-open" : "site-nav-panel"} aria-label="Primary">
        <ul className="site-nav-links">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) => (isActive ? "nav-link nav-link-active" : "nav-link")}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
