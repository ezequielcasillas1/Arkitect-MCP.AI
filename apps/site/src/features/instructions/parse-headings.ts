import { slugify } from "./slugify";

export type GuideHeading = {
  id: string;
  text: string;
  level: number;
};

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}

export function extractHeadings(markdown: string): GuideHeading[] {
  const slugCounts = new Map<string, number>();
  const headings: GuideHeading[] = [];

  for (const line of markdown.split("\n")) {
    const match = line.match(/^(#{2,3})\s+(.+)$/);
    if (!match) {
      continue;
    }

    const level = match[1].length;
    const text = stripMarkdown(match[2].trim());
    if (text === "Table of Contents") {
      continue;
    }

    const baseId = slugify(text);
    const seen = slugCounts.get(baseId) ?? 0;
    slugCounts.set(baseId, seen + 1);
    const id = seen === 0 ? baseId : `${baseId}-${seen}`;

    headings.push({ id, text, level });
  }

  return headings;
}
