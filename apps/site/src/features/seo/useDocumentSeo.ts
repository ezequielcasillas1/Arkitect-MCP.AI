import { useEffect } from "react";
import { siteOrigin } from "./data";
import type { SeoMeta } from "./types";

type Selector = { name?: string; property?: string };

function upsertMeta(selector: Selector, content: string): void {
  const attr = selector.property ? "property" : "name";
  const key = selector.property ?? selector.name ?? "";
  if (!key) return;

  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertCanonical(href: string): void {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function useDocumentSeo(meta: SeoMeta): void {
  useEffect(() => {
    const canonicalUrl = `${siteOrigin}${meta.canonicalPath}`;
    const ogImage = meta.ogImage
      ? meta.ogImage.startsWith("http")
        ? meta.ogImage
        : `${siteOrigin}${meta.ogImage}`
      : undefined;

    document.title = meta.title;

    upsertMeta({ name: "description" }, meta.description);
    if (meta.keywords) {
      upsertMeta({ name: "keywords" }, meta.keywords);
    }
    upsertCanonical(canonicalUrl);

    upsertMeta({ property: "og:title" }, meta.title);
    upsertMeta({ property: "og:description" }, meta.description);
    upsertMeta({ property: "og:url" }, canonicalUrl);
    if (ogImage) {
      upsertMeta({ property: "og:image" }, ogImage);
    }

    upsertMeta({ name: "twitter:title" }, meta.title);
    upsertMeta({ name: "twitter:description" }, meta.description);
    if (ogImage) {
      upsertMeta({ name: "twitter:image" }, ogImage);
    }
  }, [meta.title, meta.description, meta.canonicalPath, meta.ogImage, meta.keywords]);
}
