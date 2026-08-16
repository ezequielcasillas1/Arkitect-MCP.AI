export const CANONICAL_HOST = "arkitect-mcp.com";
export const WWW_HOST = `www.${CANONICAL_HOST}`;
export const siteOrigin = `https://${CANONICAL_HOST}`;

export function isWwwHost(hostname: string): boolean {
  return hostname === WWW_HOST;
}

/** Cloudflare Pretty URLs 308 no-slash → slash. Canonical is the 200 destination. */
export function toCanonicalPath(path: string): string {
  if (!path || path === "/") {
    return "/";
  }
  const withLeading = path.startsWith("/") ? path : `/${path}`;
  return `${withLeading.replace(/\/+$/, "")}/`;
}

export function toCanonicalUrl(path: string): string {
  const canonicalPath = toCanonicalPath(path);
  return `${siteOrigin}${canonicalPath === "/" ? "/" : canonicalPath}`;
}
