import type { McpToolGroup, McpVersionEntry } from "./types";

export const mcpHero = {
  label: "MCP",
  title: "Arkitect MCP tools reference",
  intro:
    "Arkitect MCP is a local stdio server that gives Cursor and other MCP hosts architecture-first tools: repo diagnosis, catalog lookups, pattern intelligence, refactoring analysis, verification, and desktop workbench auto-fill — all grounded in your actual repository."
};

export const mcpAutoFillCallout = {
  label: "Latest update",
  title: "Auto-fill the Arkitect Desktop workbench from Cursor agent chat",
  lede:
    "The newest MCP tool — apply_workbench_intake — lets the Cursor AI agent (or any MCP client) push a full workbench intake into Arkitect Desktop over a local bridge. Ask in chat, review, and land on Results without touching the wizard.",
  steps: [
    "Open Arkitect Desktop so the local MCP bridge is listening.",
    "In Cursor agent chat, describe the repo you want to analyze — path, name, requested outcome.",
    "The agent calls apply_workbench_intake with your repoPath, catalog preferences, and autoRun options (diagnosis, verify, advance to Results).",
    "Desktop prefills every step (repo, profile, policy, AI settings, MCP), runs diagnosis + verify, and lands on Results.",
    "Optionally save the intake as a preset (for example \"Testing for ARK\") so future runs are a one-liner in chat."
  ],
  note:
    "API keys are always read from Desktop session storage — never sent through MCP. If the bridge is offline the tool returns the intake JSON for the manual Import from MCP panel."
};

export const mcpToolGroups: McpToolGroup[] = [
  {
    id: "diagnosis",
    label: "Diagnosis",
    title: "Diagnosis & intake signals",
    intro:
      "Diagnosis is the entry point for every Arkitect flow. These tools inspect intake signals, apply the default architecture policy, and expose an MCP-friendly payload for Cursor.",
    tools: [
      {
        name: "diagnose_repository",
        purpose:
          "Analyze intake signals, apply Arkitect policy, and expose an MCP-friendly diagnosis payload (summary, diagnosis object, cursorGuidance).",
        usage:
          "Pass repoPath, repoName, repoSummary, requestedOutcome, and optional catalogPreferences (selectedRemixId, complexityProfile, requirementTags).",
        example:
          "Run diagnose_repository on C:\\Dev\\Pastecraft — requestedOutcome is \"stabilize architecture before onboarding\"."
      },
      {
        name: "get_last_diagnosis",
        purpose:
          "Return the most recent diagnosis payload Arkitect exposed to MCP clients — useful for follow-up questions without re-running diagnosis.",
        usage: "Takes no arguments. Auto-runs a default diagnosis if none has been produced this session.",
        example: "Show me the last diagnosis result."
      },
      {
        name: "list_diagnosis_strategies",
        purpose:
          "Return the diagnosis and continuation strategies Arkitect applies during recommendation (healthy continuation, guardrails, deferral).",
        usage: "Takes no arguments. Returns a summary plus the encoded strategy list.",
        example: "What diagnosis strategies does Arkitect apply?"
      },
      {
        name: "suggest_requirement_tags",
        purpose:
          "Suggest requirement tags from repo inspection, intake scope, and diagnosis signals. Returns suggestions and any already-applied tags.",
        usage:
          "Accepts the same input as diagnose_repository. Chain into diagnose_repository or apply_workbench_intake with the accepted tags.",
        example: "Suggest requirement tags for C:\\Dev\\Pastecraft."
      }
    ]
  },
  {
    id: "catalogs",
    label: "Catalogs",
    title: "Architecture, remix, and pattern catalogs",
    intro:
      "Read-only catalog tools that expose Arkitect's encoded architecture library, remix profiles, and design pattern index — ideal for grounding agent recommendations.",
    tools: [
      {
        name: "list_architecture_catalog",
        purpose:
          "Return the encoded Arkitect architecture catalog with metadata and affinity fields (layered, hexagonal, vertical-slice, microservices, and more).",
        usage: "Takes no arguments. Response includes a summary, total count, and item list.",
        example: "List the Arkitect architecture catalog."
      },
      {
        name: "list_remix_profiles",
        purpose:
          "Return Arkitect remix profiles with composed architectures, patterns, and rationale — pre-built combinations for common product shapes.",
        usage: "Takes no arguments. Use the selectedRemixId in catalogPreferences to bias diagnosis or recommendations.",
        example: "List remix profiles I can start from."
      },
      {
        name: "list_design_patterns",
        purpose:
          "Return Arkitect's design pattern catalog grouped by family (creational, structural, behavioral) with fit metadata.",
        usage: "Takes no arguments. Pair with get_pattern_intelligence for deep pattern data.",
        example: "List design patterns available in the Arkitect catalog."
      }
    ]
  },
  {
    id: "pattern-intelligence",
    label: "Pattern intelligence",
    title: "Design principles & pattern recommendation",
    intro:
      "The pattern intelligence slice encodes 22 GoF patterns, SOLID plus general OO principles, a relation graph, and a complexity-aware recommender sourced from Refactoring Guru.",
    tools: [
      {
        name: "get_pattern_intelligence",
        purpose:
          "Return deep design pattern intelligence — intent, applicability, implementation steps, pros/cons, and relations. Optionally filter by patternId, family, or principleId.",
        usage:
          "Filter with { patternId: \"observer\" }, { family: \"behavioral\" }, or { principleId: \"single-responsibility\" }. Omit to return the full catalog.",
        example: "Get pattern intelligence for observer."
      },
      {
        name: "list_design_principles",
        purpose:
          "Return the encoded design principle catalog (SOLID plus general OO principles) with related patterns for orchestration.",
        usage: "Takes no arguments. Use principle ids in get_pattern_intelligence for cross-references.",
        example: "List the design principles Arkitect uses."
      },
      {
        name: "recommend_patterns",
        purpose:
          "Recommend design patterns for the given intake using requirement signals, complexity profile, and Refactoring Guru relations. Returns recommended, deferred, relation chains, anti-pattern warnings, over-engineering risk, and an ADR summary.",
        usage:
          "Provide repoPath, repoSummary, requestedOutcome, requirementTags, complexityProfile (minimal | balanced | structured | enterprise) and optional seedPatternIds.",
        example:
          "Recommend patterns for C:\\Dev\\Pastecraft with complexityProfile balanced and requirementTags queue,retry,idempotency."
      }
    ]
  },
  {
    id: "refactoring",
    label: "Refactoring",
    title: "Refactoring Guru orchestration",
    intro:
      "Report-only orchestration aligned with Refactoring Guru categories — ranks techniques against structural smells so Cursor can plan explicit refactor work.",
    tools: [
      {
        name: "list_refactoring_techniques",
        purpose:
          "Return the Refactoring Guru technique catalog grouped by category with reference URLs for agent-orchestrated code analysis.",
        usage:
          "Optional category filter: composing-methods, moving-features, organizing-data, simplifying-conditionals, simplifying-method-calls, dealing-with-generalization.",
        example: "List refactoring techniques for simplifying-conditionals."
      },
      {
        name: "analyze_refactoring_opportunities",
        purpose:
          "Analyze structural smells, rank Refactoring Guru techniques, and return an orchestration plan for Cursor agents. Reports only — does not auto-refactor.",
        usage:
          "Requires repoPath and requestedOutcome. Set explicitRefactorIntent to true to signal the user asked for refactor work.",
        example:
          "Analyze refactoring opportunities in C:\\Dev\\Pastecraft with category moving-features and explicit refactor intent."
      }
    ]
  },
  {
    id: "verification",
    label: "Verification",
    title: "Verify & test runners",
    intro:
      "Wrap common pnpm scripts so the agent can verify a repo, run tests, or scope a specific suite — with structured pass/fail, step tails, and next-step hints.",
    tools: [
      {
        name: "verify_codebase",
        purpose:
          "Run the full verify pipeline (pnpm lint, build, typecheck, test) from a repo root. Use the connected local path — not a system folder like C:\\Windows\\System32.",
        usage: "Pass repoPath. Response includes ok, command, summary, step output tails, and a hint.",
        example: "Verify the codebase at C:\\Dev\\Pastecraft."
      },
      {
        name: "run_tests",
        purpose:
          "Run unit and integration tests only (pnpm test) from a repo root. Returns structured pass/fail, step output tails, and summary.",
        usage: "Pass repoPath. Lighter than verify_codebase — skips lint/build/typecheck.",
        example: "Run tests in C:\\Dev\\Pastecraft."
      },
      {
        name: "run_test_suite",
        purpose:
          "Run a specific test suite from a repo root: unit (test:unit), integration (test:integration), or all (test). Returns structured JSON with steps and output tails.",
        usage: "Pass repoPath and suite: unit | integration | all.",
        example: "Run the integration test suite in C:\\Dev\\Pastecraft."
      }
    ]
  },
  {
    id: "workbench-intake",
    label: "Workbench intake",
    title: "Desktop workbench auto-fill",
    intro:
      "The workbench intake tool bridges Cursor chat and the Arkitect Desktop wizard. Push intake, mark steps reviewed, autorun diagnosis + verify, land on Results, and optionally save as a reusable preset.",
    tools: [
      {
        name: "apply_workbench_intake",
        purpose:
          "Push interview-gathered diagnosis intake into the Arkitect Desktop workbench. Supports autoRun (diagnosis, verify, advanceToResults) and saveAsPreset. Requires Arkitect Desktop running with the local bridge active.",
        usage:
          "Provide repoPath, repoName, requestedOutcome, routeSource (local-path | github-api), executionMode, executionPermission, catalogPreferences, and optional autoRun / markStepsReviewed / applyAllTestSources / advanceToStep / saveAsPreset.",
        example:
          "Apply workbench intake for C:\\Dev\\Pastecraft — autoRun diagnosis and verify, advance to results-overview, save as preset \"Pastecraft baseline\"."
      }
    ]
  }
];

export const mcpVersionHistory: McpVersionEntry[] = [
  {
    version: "2.1.0",
    releaseDate: "2026-07-04",
    status: "released",
    title: "Installer MCP packaging fix — zod + ajv resolution for Cursor stdio",
    summary:
      "Patch release fixing packaged desktop MCP stdio when Cursor mcp.json points at Arkitect-Setup.exe bundled stdio.js — SDK validation deps now resolve under app.asar.unpacked.",
    highlights: [
      "Fixed ERR_MODULE_NOT_FOUND for zod, ajv, and ajv-formats when Cursor mcp.json launches packaged MCP stdio from Arkitect-Setup.exe.",
      "Expanded electron-builder asarUnpack so @modelcontextprotocol/sdk and its full transitive runtime graph physically exist under app.asar.unpacked/node_modules.",
      "Packaged MCP stdio smoke-tested: initialize + tools/list return all 16 tools without Connection closed (-32000)."
    ]
  },
  {
    version: "0.2.0",
    releaseDate: "2026-07-04",
    status: "released",
    title: "Pattern intelligence — design-pattern orchestration for Cursor",
    summary:
      "Premium pattern intelligence in MCP: deep GoF + principle catalogs, relation chains, complexity-aware recommend_patterns with ADR summaries — plus workbench auto-fill and refactoring reports.",
    highlights: [
      "Pattern intelligence slice: 22 GoF patterns, 8 principles, relation graph; recommend_patterns returns chains, warnings, and ADR summaries.",
      "MCP tools added: get_pattern_intelligence, list_design_principles, recommend_patterns.",
      "Refactoring Guru tools: list_refactoring_techniques and analyze_refactoring_opportunities, plus arkitect://catalog/refactoring resource and a Desktop Refactoring results tab.",
      "apply_workbench_intake tool + desktop bridge POST /intake for MCP → Desktop auto-fill with autoRun (diagnosis, verify, results) and saveAsPreset (\"Testing for ARK\" starter preset).",
      "In-app update check and Download button in the desktop app; installer released as Arkitect-Setup.exe (v0.2.0)."
    ]
  },
  {
    version: "0.1.1",
    releaseDate: "2026-07-04",
    status: "released",
    title: "Expanded catalog, mission orchestration, in-app updates",
    summary:
      "Broader design pattern catalog, mission orchestration workflows, and desktop in-app update check + download.",
    highlights: [
      "Expanded design pattern catalog across MCP and desktop surfaces.",
      "Mission orchestration for guided architecture workflows.",
      "In-app update check and Download button in the desktop app; installer released as Arkitect-Setup.exe (v0.1.1)."
    ]
  },
  {
    version: "0.1.0",
    releaseDate: "2026-07-01",
    status: "released",
    title: "First public release — desktop installer + MCP stdio",
    summary:
      "First Windows desktop installer and the initial MCP stdio surface for Cursor — diagnosis, catalog lookups, verify, and repo guidance.",
    highlights: [
      "Arkitect-Setup.exe (Windows) with electron-builder NSIS pipeline and packaged MCP stdio path resolution.",
      "MCP stdio server for Cursor: diagnose_repository, get_last_diagnosis, list_architecture_catalog, list_remix_profiles, list_design_patterns, suggest_requirement_tags, list_diagnosis_strategies, verify_codebase, run_tests, run_test_suite.",
      "Architecture-first detection: platform, workload, health, and intent signals (via @arkitect/core).",
      "Marketing site with free-spot download counter and public reviews; Cloudflare Pages deploy.",
      "Install in Cursor button — writes .cursor/mcp.json, opens Cursor deeplink, copy-link fallback."
    ]
  },
  {
    version: "0.0.x",
    releaseDate: "2026-06-16",
    status: "milestone",
    title: "MCP stdio transport wiring (dogfood)",
    summary:
      "Initial MCP SDK stdio wiring, five arkitect:// resources, bin arkitect-mcp, and Cursor smoke test — the foundation the 0.1 release builds on.",
    highlights: [
      "MCP SDK stdio entrypoint and resource readers for arkitect://diagnosis/latest, policy/default, catalog/architectures, catalog/remixes, catalog/patterns.",
      "Bin script arkitect-mcp and .cursor/mcp.json config so Cursor can spawn the server from the repo root.",
      "MCP Connection dashboard step in Desktop, localhost bridge for external stdio registration, and real-time IPC state updates.",
      "Cursor dogfood smoke test: initialize / tools / resources all respond; diagnose_repository returns payload via MockRepositoryAnalyzer heuristics."
    ]
  }
];
