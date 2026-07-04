import type { ReleaseEntry } from "./types";

/** Newest first. Update this file when shipping a release. */
export const releaseFeed: ReleaseEntry[] = [
  {
    version: "0.2.1",
    releaseDate: "2026-07-04",
    status: "upcoming",
    changes: [
      "Fixed ERR_MODULE_NOT_FOUND for zod when Cursor mcp.json launches packaged MCP stdio from Arkitect-Setup.exe (v0.2.1).",
      "Bundled zod and zod-to-json-schema as direct @arkitect/mcp-server deps; electron-builder asarUnpack for node_modules resolution.",
      "NODE_PATH in mcp-runtime-paths.ts so the Windows installer layout resolves SDK peer deps for Cursor stdio spawns."
    ]
  },
  {
    version: "0.2.0",
    releaseDate: "2026-07-04",
    status: "released",
    changes: [
      "Pattern Intelligence MCP: get_pattern_intelligence, list_design_principles, recommend_patterns — relation chains and ADR summaries from repo intake.",
      "22 GoF patterns + 8 SOLID/OO principles, relation graph, and complexity-aware recommender.",
      "Refactoring Guru orchestration plus Cursor workbench auto-fill (apply_workbench_intake)."
    ]
  },
  {
    version: "0.1.1",
    releaseDate: "2026-07-04",
    status: "released",
    changes: [
      "Expanded design pattern catalog across MCP and desktop surfaces.",
      "Mission orchestration for guided architecture workflows.",
      "In-app update check and download button in the desktop app."
    ]
  },
  {
    version: "0.1.0",
    releaseDate: "2026-07-01",
    status: "released",
    changes: [
      "First Windows desktop installer (Arkitect-Setup.exe).",
      "MCP stdio server for Cursor — diagnosis, catalog, and repo guidance tools.",
      "Architecture-first detection: platform, workload, health, and intent signals.",
      "Marketing site with free-spot download counter and public reviews."
    ]
  }
];
