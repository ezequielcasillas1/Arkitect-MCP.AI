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
  }
};
