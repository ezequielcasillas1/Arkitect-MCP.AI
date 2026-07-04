import type { ReleaseEntry } from "./types";

/** Newest first. Update this file when shipping a release. */
export const releaseFeed: ReleaseEntry[] = [
  {
    version: "0.1.1",
    releaseDate: null,
    status: "upcoming",
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
