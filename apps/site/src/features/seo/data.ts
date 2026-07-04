import type { RouteSeoKey, SeoMeta } from "./types";

export const siteOrigin = "https://arkitect-mcp.com";

export const defaultOgImage = "/apple-touch-icon.svg";

export const routeSeo: Record<RouteSeoKey, SeoMeta> = {
  "/": {
    title: "Arkitect MCP — Architecture-first AI for Cursor & desktop repos",
    description:
      "Arkitect MCP is an architecture reasoning server for Cursor. Diagnose repo health, guide refactors, and orchestrate any AI provider. Free for the first 1,000 users.",
    canonicalPath: "/",
    ogImage: defaultOgImage,
    keywords:
      "MCP server, Cursor MCP, architecture AI, repo diagnosis, code architecture tool, arkitect, vertical slice architecture"
  },
  "/reviews": {
    title: "Reviews — Arkitect MCP",
    description:
      "See what developers are saying about Arkitect MCP, or share your own review of the architecture reasoning server for Cursor.",
    canonicalPath: "/reviews",
    ogImage: defaultOgImage,
    keywords: "Arkitect reviews, Cursor MCP reviews, developer feedback, MCP server ratings"
  },
  "/instructions": {
    title: "User Guide — Arkitect MCP",
    description:
      "Install and orchestrate the Arkitect MCP server in Cursor: local stdio setup, diagnosis, catalogs, and verification — all on your machine.",
    canonicalPath: "/instructions",
    ogImage: defaultOgImage,
    keywords: "Arkitect user guide, install MCP server, Cursor MCP setup, architecture reasoning, MCP orchestration"
  },
  "/architecture": {
    title: "Architecture & Design Patterns — Arkitect MCP",
    description:
      "Learn core software architecture styles and design patterns — Factory, Observer, Adapter, hexagonal, MVC, microservices — with links to trusted references.",
    canonicalPath: "/architecture",
    ogImage: defaultOgImage,
    keywords:
      "software architecture, design patterns, SOLID, hexagonal architecture, MVC, microservices, creational patterns, behavioral patterns"
  },
  "/about": {
    title: "About — Arkitect MCP",
    description:
      "Learn about Arkitect's mission, local-first MCP diagnosis, desktop app, and free tier for the first 1,000 users.",
    canonicalPath: "/about",
    ogImage: defaultOgImage,
    keywords: "About Arkitect, architecture tool, MCP server, local repo diagnosis, Cursor MCP"
  },
  "/terms": {
    title: "Terms of Use — Arkitect MCP",
    description:
      "Terms for using the Arkitect desktop app, MCP server, and marketing site — including free product tier, bring-your-own AI keys, and acceptable use.",
    canonicalPath: "/terms",
    ogImage: defaultOgImage,
    keywords: "Arkitect terms of use, MCP terms, free tier, bring your own key, acceptable use"
  },
  "/privacy": {
    title: "Privacy Policy — Arkitect MCP",
    description:
      "How Arkitect handles reviews, download tracking, local MCP analysis, and third-party AI keys stored on your device.",
    canonicalPath: "/privacy",
    ogImage: defaultOgImage,
    keywords: "Arkitect privacy policy, Supabase, local MCP, AI API keys, Cloudflare"
  }
};
