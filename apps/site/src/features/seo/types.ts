export interface SeoMeta {
  title: string;
  description: string;
  canonicalPath: string;
  ogImage?: string;
  keywords?: string;
}

export type RouteSeoKey = "/" | "/reviews" | "/instructions" | "/architecture";
