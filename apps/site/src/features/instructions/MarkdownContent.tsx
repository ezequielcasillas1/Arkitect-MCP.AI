import type { ReactNode } from "react";
import { extractHeadings } from "./parse-headings";
import { renderInline } from "./render-inline";
import { slugify } from "./slugify";

type MarkdownBlock =
  | { type: "heading"; level: number; text: string; id: string }
  | { type: "paragraph"; text: string }
  | { type: "code"; language?: string; code: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "blockquote"; text: string }
  | { type: "hr" };

function parseTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isTableDivider(line: string): boolean {
  return /^\|?[\s:-]+\|[\s|:-]+\|?$/.test(line.trim());
}

function parseBlocks(markdown: string): MarkdownBlock[] {
  const lines = markdown.split("\n");
  const blocks: MarkdownBlock[] = [];
  const slugCounts = new Map<string, number>();
  let index = 0;
  let skipTableOfContents = false;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (trimmed === "---") {
      blocks.push({ type: "hr" });
      index += 1;
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();

      if (text === "Table of Contents") {
        skipTableOfContents = true;
        index += 1;
        while (index < lines.length) {
          const next = lines[index].trim();
          if (next.startsWith("## ") && !next.includes("Table of Contents")) {
            break;
          }
          index += 1;
        }
        skipTableOfContents = false;
        continue;
      }

      if (skipTableOfContents) {
        index += 1;
        continue;
      }

      if (level === 1) {
        index += 1;
        continue;
      }

      const baseId = slugify(text.replace(/\*\*/g, "").replace(/`/g, ""));
      const seen = slugCounts.get(baseId) ?? 0;
      slugCounts.set(baseId, seen + 1);
      const id = seen === 0 ? baseId : `${baseId}-${seen}`;

      blocks.push({ type: "heading", level, text, id });
      index += 1;
      continue;
    }

    if (trimmed.startsWith("```")) {
      const language = trimmed.slice(3).trim() || undefined;
      index += 1;
      const codeLines: string[] = [];

      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }

      blocks.push({ type: "code", language, code: codeLines.join("\n") });
      index += 1;
      continue;
    }

    if (trimmed.startsWith("|") && index + 1 < lines.length && isTableDivider(lines[index + 1])) {
      const headers = parseTableRow(trimmed);
      index += 2;
      const rows: string[][] = [];

      while (index < lines.length && lines[index].trim().startsWith("|")) {
        rows.push(parseTableRow(lines[index]));
        index += 1;
      }

      blocks.push({ type: "table", headers, rows });
      continue;
    }

    if (/^>\s?/.test(trimmed)) {
      const quoteLines: string[] = [];
      while (index < lines.length && /^>\s?/.test(lines[index].trim())) {
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ""));
        index += 1;
      }
      blocks.push({ type: "blockquote", text: quoteLines.join(" ") });
      continue;
    }

    if (/^[-*]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
      const ordered = /^\d+\.\s+/.test(trimmed);
      const items: string[] = [];

      while (index < lines.length) {
        const current = lines[index].trim();
        const itemMatch = ordered
          ? current.match(/^\d+\.\s+(.+)$/)
          : current.match(/^[-*]\s+(.+)$/);

        if (!itemMatch) {
          break;
        }

        items.push(itemMatch[1]);
        index += 1;
      }

      blocks.push({ type: "list", ordered, items });
      continue;
    }

    const paragraphLines: string[] = [trimmed];
    index += 1;

    while (index < lines.length) {
      const next = lines[index].trim();
      if (
        !next ||
        next.startsWith("#") ||
        next.startsWith("```") ||
        next.startsWith("|") ||
        next.startsWith(">") ||
        /^[-*]\s+/.test(next) ||
        /^\d+\.\s+/.test(next) ||
        next === "---"
      ) {
        break;
      }

      paragraphLines.push(next);
      index += 1;
    }

    blocks.push({ type: "paragraph", text: paragraphLines.join(" ") });
  }

  return blocks;
}

function renderBlock(block: MarkdownBlock, index: number): ReactNode {
  switch (block.type) {
    case "heading": {
      const Tag = (`h${block.level}` as "h1" | "h2" | "h3");
      return (
        <Tag key={`heading-${index}`} id={block.id} className={`guide-heading guide-h${block.level}`}>
          {renderInline(block.text, `heading-${index}`)}
        </Tag>
      );
    }
    case "paragraph":
      return (
        <p key={`paragraph-${index}`} className="guide-paragraph">
          {renderInline(block.text, `paragraph-${index}`)}
        </p>
      );
    case "code":
      return (
        <pre key={`code-${index}`} className="guide-code-block">
          <code data-language={block.language}>{block.code}</code>
        </pre>
      );
    case "table":
      return (
        <div key={`table-${index}`} className="guide-table-wrap">
          <table className="guide-table">
            <thead>
              <tr>
                {block.headers.map((header, headerIndex) => (
                  <th key={`header-${index}-${headerIndex}`}>{renderInline(header, `th-${index}-${headerIndex}`)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={`row-${index}-${rowIndex}`}>
                  {row.map((cell, cellIndex) => (
                    <td key={`cell-${index}-${rowIndex}-${cellIndex}`}>
                      {renderInline(cell, `td-${index}-${rowIndex}-${cellIndex}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "list": {
      const ListTag = block.ordered ? "ol" : "ul";
      return (
        <ListTag key={`list-${index}`} className={block.ordered ? "guide-ol" : "guide-ul"}>
          {block.items.map((item, itemIndex) => (
            <li key={`item-${index}-${itemIndex}`}>{renderInline(item, `li-${index}-${itemIndex}`)}</li>
          ))}
        </ListTag>
      );
    }
    case "blockquote":
      return (
        <blockquote key={`quote-${index}`} className="guide-blockquote">
          {renderInline(block.text, `quote-${index}`)}
        </blockquote>
      );
    case "hr":
      return <hr key={`hr-${index}`} className="guide-hr" />;
    default:
      return null;
  }
}

type MarkdownContentProps = {
  markdown: string;
};

export function MarkdownContent({ markdown }: MarkdownContentProps) {
  const blocks = parseBlocks(markdown);

  return <article className="guide-content">{blocks.map(renderBlock)}</article>;
}

export function useGuideHeadings(markdown: string) {
  return extractHeadings(markdown);
}
