import { AtSign, MessageCircle } from "lucide-react";

const links = [
  {
    label: "Reddit",
    handle: "u/Ok-Address3409",
    href: "https://www.reddit.com/user/Ok-Address3409/",
    icon: MessageCircle
  },
  {
    label: "X",
    handle: "@casiezeq",
    href: "https://x.com/casiezeq",
    icon: AtSign
  }
];

export function ConnectSection() {
  return (
    <section className="panel connect-panel" aria-labelledby="connect-heading">
      <p className="section-label">Stay In Touch</p>
      <h2 id="connect-heading">Connect with me</h2>
      <p>
        Follow me on Reddit or X if you need help or have concerns — bugs, feature requests, or
        feedback. Every message gets read.
      </p>
      <ul className="connect-links">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <li key={link.label}>
              <a href={link.href} className="connect-link-card" target="_blank" rel="noopener noreferrer">
                <span className="connect-link-icon" aria-hidden="true">
                  <Icon size={22} strokeWidth={1.75} />
                </span>
                <span className="connect-link-text">
                  <strong>{link.label}</strong>
                  <span>{link.handle}</span>
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
