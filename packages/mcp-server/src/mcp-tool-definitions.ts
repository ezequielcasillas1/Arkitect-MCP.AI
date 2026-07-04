import type { ArkitectMcpResource, ArkitectMcpToolDefinition } from "@arkitect/contracts";

interface CatalogCounts {
  architectures: number;
  remixProfiles: number;
  designPatterns: number;
  refactoringTechniques: number;
}

export interface ArkitectMcpServer {
  info: {
    name: string;
    version: string;
    description: string;
  };
  tools: ArkitectMcpToolDefinition[];
  resources: ArkitectMcpResource[];
}

export const MCP_SERVER_INFO = {
  name: "arkitect-mcp",
  version: "0.1.1",
  description: "Scaffolded Arkitect MCP surface for diagnosis-first architecture context."
} as const;

export const diagnosisToolInputSchema = {
  type: "object",
  properties: {
    repoPath: { type: "string" },
    repoName: { type: "string" },
    repoSummary: { type: "string" },
    requestedOutcome: { type: "string" },
    catalogPreferences: {
      type: "object",
      properties: {
        selectedRemixId: { type: "string" },
        complexityProfile: { type: "string" },
        requirementTags: { type: "array", items: { type: "string" } }
      }
    }
  }
};

export const diagnosisToolOutputSchema = {
  type: "object",
  properties: {
    summary: { type: "string" },
    diagnosis: { type: "object" },
    cursorGuidance: { type: "array", items: { type: "string" } }
  }
};

export const catalogToolOutputSchema = {
  type: "object",
  properties: {
    summary: { type: "string" },
    total: { type: "number" },
    items: { type: "array", items: { type: "object" } }
  }
};

export const verifyToolInputSchema = {
  type: "object",
  properties: {
    repoPath: { type: "string" }
  }
};

export const verifyToolOutputSchema = {
  type: "object",
  properties: {
    ok: { type: "boolean" },
    repoPath: { type: "string" },
    command: { type: "string" },
    summary: { type: "string" },
    steps: { type: "array", items: { type: "object" } },
    hint: { type: "string" }
  }
};

export const testToolInputSchema = {
  type: "object",
  properties: {
    repoPath: { type: "string" }
  }
};

export const testSuiteToolInputSchema = {
  type: "object",
  properties: {
    repoPath: { type: "string" },
    suite: { type: "string", enum: ["unit", "integration", "all"] }
  }
};

export const testToolOutputSchema = {
  type: "object",
  properties: {
    ok: { type: "boolean" },
    repoPath: { type: "string" },
    suite: { type: "string" },
    command: { type: "string" },
    summary: { type: "string" },
    steps: { type: "array", items: { type: "object" } },
    hint: { type: "string" }
  }
};

export const refactoringAnalysisInputSchema = {
  type: "object",
  properties: {
    repoPath: { type: "string" },
    repoName: { type: "string" },
    repoSummary: { type: "string" },
    requestedOutcome: { type: "string" },
    category: {
      type: "string",
      enum: [
        "composing-methods",
        "moving-features",
        "organizing-data",
        "simplifying-conditionals",
        "simplifying-method-calls",
        "dealing-with-generalization"
      ]
    },
    explicitRefactorIntent: { type: "boolean" }
  }
};

export const refactoringAnalysisOutputSchema = {
  type: "object",
  properties: {
    summary: { type: "string" },
    analysis: { type: "object" },
    cursorGuidance: { type: "array", items: { type: "string" } }
  }
};

export const workbenchIntakeInputSchema = {
  type: "object",
  properties: {
    intake: {
      type: "object",
      properties: diagnosisToolInputSchema.properties
    },
    repoPath: { type: "string" },
    repoName: { type: "string" },
    repoSummary: { type: "string" },
    requestedOutcome: { type: "string" },
    routeSource: { type: "string", enum: ["local-path", "github-api"] },
    executionMode: {
      type: "string",
      enum: ["dry-run", "advisory", "guided", "approved-change", "approved-refactor"]
    },
    executionPermission: {
      type: "string",
      enum: ["read-only", "generate-plan", "propose-changes", "apply-safe-changes", "apply-structural-changes"]
    },
    catalogPreferences: {
      type: "object",
      properties: {
        selectedRemixId: { type: "string" },
        complexityProfile: { type: "string" },
        requirementTags: { type: "array", items: { type: "string" } }
      }
    },
    userInput: { type: "object" },
    markStepsReviewed: {
      type: "object",
      properties: {
        profile: { type: "boolean" },
        policy: { type: "boolean" },
        settings: { type: "boolean" },
        mcp: { type: "boolean" }
      }
    },
    autoRun: {
      type: "object",
      properties: {
        diagnosis: { type: "boolean" },
        verify: { type: "boolean" },
        advanceToResults: { type: "boolean" }
      }
    },
    saveAsPreset: { type: "string" },
    applyAllTestSources: {
      type: "boolean",
      description: "Merge the canonical Testing for ARK full automation config (prefill + diagnosis + verify + Results)."
    },
    advanceToStep: {
      type: "string",
      enum: [
        "repo-connection",
        "project-profile",
        "architecture-policy",
        "ai-settings",
        "mcp-connection",
        "review-and-run",
        "results-overview"
      ]
    }
  }
};

export const workbenchIntakeOutputSchema = {
  type: "object",
  properties: {
    summary: { type: "string" },
    desktopApplied: { type: "boolean" },
    appliedAt: { type: "string" },
    intake: { type: "object" },
    cursorGuidance: { type: "array", items: { type: "string" } }
  }
};

export const refactoringCatalogOutputSchema = {
  type: "object",
  properties: {
    summary: { type: "string" },
    total: { type: "number" },
    categories: { type: "array", items: { type: "object" } },
    items: { type: "array", items: { type: "object" } }
  }
};

export function createMcpResources(counts: CatalogCounts): ArkitectMcpResource[] {
  return [
    {
      uri: "arkitect://diagnosis/latest",
      name: "Latest Diagnosis Result",
      description: "Last diagnosis result payload exposed for MCP-aware clients like Cursor."
    },
    {
      uri: "arkitect://policy/default",
      name: "Default Architecture Policy",
      description: "The default architecture-first Arkitect policy for healthy and unhealthy repos."
    },
    {
      uri: "arkitect://catalog/architectures",
      name: "Architecture Catalog",
      description: `The ${counts.architectures}-entry Arkitect architecture library.`
    },
    {
      uri: "arkitect://catalog/remixes",
      name: "Remix Profile Catalog",
      description: `The ${counts.remixProfiles}-entry Arkitect remix profile library.`
    },
    {
      uri: "arkitect://catalog/patterns",
      name: "Design Pattern Catalog",
      description: `The ${counts.designPatterns}-entry Arkitect design pattern library.`
    },
    {
      uri: "arkitect://catalog/refactoring",
      name: "Refactoring Technique Catalog",
      description: `The ${counts.refactoringTechniques}-entry Refactoring Guru technique library for agent-orchestrated analysis.`
    }
  ];
}

export function createMcpToolTemplates(): Array<Omit<ArkitectMcpToolDefinition, "execute">> {
  return [
    {
      name: "diagnose_repository",
      description: "Analyze intake signals, apply Arkitect policy, and expose an MCP-friendly diagnosis payload.",
      inputSchema: diagnosisToolInputSchema,
      outputSchema: diagnosisToolOutputSchema
    },
    {
      name: "get_last_diagnosis",
      description: "Return the most recent diagnosis payload that Arkitect exposed to MCP clients.",
      inputSchema: { type: "object", properties: {} },
      outputSchema: diagnosisToolOutputSchema
    },
    {
      name: "list_architecture_catalog",
      description: "Return the encoded Arkitect architecture catalog with metadata and affinity fields.",
      inputSchema: { type: "object", properties: {} },
      outputSchema: catalogToolOutputSchema
    },
    {
      name: "list_remix_profiles",
      description: "Return Arkitect remix profiles with composed architectures, patterns, and rationale.",
      inputSchema: { type: "object", properties: {} },
      outputSchema: catalogToolOutputSchema
    },
    {
      name: "list_design_patterns",
      description: "Return Arkitect's design pattern catalog grouped by family with fit metadata.",
      inputSchema: { type: "object", properties: {} },
      outputSchema: catalogToolOutputSchema
    },
    {
      name: "suggest_requirement_tags",
      description: "Suggest requirement tags from repo inspection, intake scope, and diagnosis signals.",
      inputSchema: diagnosisToolInputSchema,
      outputSchema: {
        type: "object",
        properties: {
          summary: { type: "string" },
          suggestions: { type: "array", items: { type: "object" } },
          appliedTags: { type: "array", items: { type: "string" } }
        }
      }
    },
    {
      name: "list_diagnosis_strategies",
      description: "Return the diagnosis and continuation strategies Arkitect applies during recommendation.",
      inputSchema: { type: "object", properties: {} },
      outputSchema: {
        type: "object",
        properties: {
          summary: { type: "string" },
          total: { type: "number" },
          items: { type: "array", items: { type: "object" } }
        }
      }
    },
    {
      name: "verify_codebase",
      description:
        "Run the full verify pipeline: pnpm lint, build, typecheck, and test from a repo root. Use the connected local path — not a system folder like C:\\Windows\\System32.",
      inputSchema: verifyToolInputSchema,
      outputSchema: verifyToolOutputSchema
    },
    {
      name: "run_tests",
      description:
        "Run unit and integration tests only (pnpm test) from a repo root. Returns structured pass/fail, step output tails, and summary.",
      inputSchema: testToolInputSchema,
      outputSchema: testToolOutputSchema
    },
    {
      name: "run_test_suite",
      description:
        "Run a specific test suite from a repo root: unit (test:unit), integration (test:integration), or all (test). Returns structured JSON with steps and output tails.",
      inputSchema: testSuiteToolInputSchema,
      outputSchema: testToolOutputSchema
    },
    {
      name: "list_refactoring_techniques",
      description:
        "Return the Refactoring Guru technique catalog grouped by category with reference URLs for agent-orchestrated code analysis.",
      inputSchema: {
        type: "object",
        properties: {
          category: refactoringAnalysisInputSchema.properties.category
        }
      },
      outputSchema: refactoringCatalogOutputSchema
    },
    {
      name: "analyze_refactoring_opportunities",
      description:
        "Analyze structural smells, rank Refactoring Guru techniques, and return an orchestration plan for Cursor agents. Reports only — does not auto-refactor.",
      inputSchema: refactoringAnalysisInputSchema,
      outputSchema: refactoringAnalysisOutputSchema
    },
    {
      name: "apply_workbench_intake",
      description:
        "Push interview-gathered diagnosis intake into the Arkitect Desktop workbench. Supports autoRun (diagnosis, verify, results) and saveAsPreset. Requires Arkitect Desktop running with the local bridge active.",
      inputSchema: workbenchIntakeInputSchema,
      outputSchema: workbenchIntakeOutputSchema
    }
  ];
}

export function assembleMcpServer(
  tools: ArkitectMcpToolDefinition[],
  resources: ArkitectMcpResource[]
): ArkitectMcpServer {
  return {
    info: MCP_SERVER_INFO,
    tools,
    resources
  };
}
