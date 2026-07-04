import { NavLink } from "react-router-dom";
import { Logo } from "./Logo";

const links = [
  { to: "/", label: "Home" },
  { to: "/instructions", label: "Instructions" },
  { to: "/reviews", label: "Reviews" }
];

export function NavBar() {
  return (
    <header className="site-nav nav-entrance">
      <NavLink to="/" className="brand-link" aria-label="Arkitect home">
        <Logo />
      </NavLink>
      <nav aria-label="Primary">
        <ul className="site-nav-links">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) => (isActive ? "nav-link nav-link-active" : "nav-link")}
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
