import type { ReactNode } from "react";

type InlinePart =
  | { kind: "text"; value: string }
  | { kind: "strong"; value: string }
  | { kind: "code"; value: string }
  | { kind: "link"; label: string; href: string };

function tokenizeInline(text: string): InlinePart[] {
  const parts: InlinePart[] = [];
  const pattern = /(\*\*.+?\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ kind: "text", value: text.slice(lastIndex, match.index) });
    }

    const token = match[0];
    if (token.startsWith("**")) {
      parts.push({ kind: "strong", value: token.slice(2, -2) });
    } else if (token.startsWith("`")) {
      parts.push({ kind: "code", value: token.slice(1, -1) });
    } else {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        parts.push({ kind: "link", label: linkMatch[1], href: linkMatch[2] });
      } else {
        parts.push({ kind: "text", value: token });
      }
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push({ kind: "text", value: text.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ kind: "text", value: text }];
}

export function renderInline(text: string, keyPrefix: string): ReactNode[] {
  return tokenizeInline(text).map((part, index) => {
    const key = `${keyPrefix}-${index}`;

    switch (part.kind) {
      case "strong":
        return <strong key={key}>{renderInline(part.value, `${key}-s`)}</strong>;
      case "code":
        return (
          <code key={key} className="guide-inline-code">
            {part.value}
          </code>
        );
      case "link": {
        const isExternal = /^https?:\/\//.test(part.href);
        return (
          <a
            key={key}
            href={part.href}
            className="guide-link"
            {...(isExternal ? { target: "_blank", rel: "noreferrer" } : {})}
          >
            {part.label}
          </a>
        );
      }
      default:
        return <span key={key}>{part.value}</span>;
    }
  });
}
