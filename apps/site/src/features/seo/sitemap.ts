import { toCanonicalUrl } from "./canonical";

export interface SitemapEntry {
  path: string;
  changefreq: "weekly" | "monthly" | "yearly";
  priority: string;
}

export const sitemapEntries: readonly SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/reviews/", changefreq: "weekly", priority: "0.7" },
  { path: "/instructions/", changefreq: "monthly", priority: "0.7" },
  { path: "/mcp/", changefreq: "weekly", priority: "0.9" },
  { path: "/architecture/", changefreq: "monthly", priority: "0.8" },
  { path: "/about/", changefreq: "monthly", priority: "0.6" },
  { path: "/terms/", changefreq: "yearly", priority: "0.3" },
  { path: "/privacy/", changefreq: "yearly", priority: "0.3" }
];

export function renderSitemapXml(
  entries: readonly SitemapEntry[] = sitemapEntries,
  lastmod = "2026-08-16"
): string {
  const urls = entries
    .map(
      (entry) => `  <url>
    <loc>${toCanonicalUrl(entry.path)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}
