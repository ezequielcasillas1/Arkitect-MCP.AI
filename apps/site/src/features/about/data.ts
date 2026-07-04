import type { AboutBlock } from "./types";

export const aboutHero = {
  label: "About",
  title: "Architecture guidance that respects your repo",
  intro:
    "Arkitect helps developers diagnose structure, continue healthy patterns, and orchestrate refactors — locally first, with MCP-native tooling for Cursor and a guided desktop app."
};

export const aboutBlocks: AboutBlock[] = [
  {
    id: "mission",
    label: "Mission",
    title: "Diagnose before you drift",
    paragraphs: [
      "Most architecture pain comes from silent drift — small decisions that compound until the codebase fights you. Arkitect's mission is to surface that drift early, with evidence from your actual repository, before refactors become expensive guesswork.",
      "We believe healthy detected structure should keep flowing automatically, and that refactors should happen only with explicit intent — never by default."
    ]
  },
  {
    id: "product",
    label: "Product",
    title: "Desktop app + MCP server",
    paragraphs: [
      "Arkitect ships as a desktop application and an MCP server you can wire into Cursor. Core tools — diagnosis, catalog recommendations, verification — run locally via @arkitect/core without Arkitect-hosted AI.",
      "Agent orchestration patterns (driving the tool loop, implementing guidance, editing code) require an AI agent — typically Cursor's built-in AI in chat or your own provider API key in the desktop app. Arkitect never supplies managed AI keys; the free tier is product access for the first 1,000 users, not subsidized inference.",
      "Two paths, same core: connect in Cursor chat or follow the desktop wizard — repo, profile, policy, MCP, review — and reach the same diagnosis-backed outcomes."
    ]
  },
  {
    id: "origin",
    label: "Origin",
    title: "Built from real refactor pain",
    paragraphs: [
      "Arkitect started as a practical response to repeating the same architecture conversations in every repo — vertical slices buried under accidental layering, catalogs copied without context, and AI assistants rewriting structure without reading the room first.",
      "The project stays local-repo-first, provider-agnostic, and MCP-native so you keep control of your code, your keys, and your architecture decisions."
    ]
  }
];
