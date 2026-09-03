import type {
  ArchitectureCatalogId,
  ArchitectureDecisionGuide,
  ArchitectureDecisionGuideStep,
  ArchitectureDecisionGuideStepId,
  ArchitectureDecisionLens,
  ArchitectureGuideStepResult,
  ArchitectureRejection,
  CatalogRecommendationInput
} from "@arkitect/contracts";

export interface DecisionGuideAdjustment {
  architectureId: ArchitectureCatalogId;
  weight: number;
  reason: string;
  stepId: ArchitectureDecisionGuideStepId;
}

export interface DecisionGuideEvaluation {
  lens: ArchitectureDecisionLens;
  steps: ArchitectureGuideStepResult[];
  rejected: ArchitectureRejection[];
  boosts: DecisionGuideAdjustment[];
  penalties: DecisionGuideAdjustment[];
}

const STEPS: ArchitectureDecisionGuideStep[] = [
  {
    id: "deploy-units",
    question: "Is this one deployable unit, or independently deployed services?",
    architectNote: "Do not split into microservices until team and operational ownership exist.",
    developerNote: "A single deployable with module boundaries is cheaper to ship and debug.",
    keywords: ["microservice", "microservices", "independent deploy", "distributed service", "multi-team"],
    boost: ["microservices", "soa"],
    reject: [],
    weight: 1.6
  },
  {
    id: "domain-complexity",
    question: "Is the domain rich with ubiquitous language, or mostly CRUD?",
    architectNote: "Reserve DDD and event sourcing for genuine domain complexity.",
    developerNote: "Simple CRUD should stay low-ceremony; heavy aggregates slow delivery.",
    keywords: ["bounded context", "ubiquitous language", "complex domain", "ddd", "aggregate"],
    boost: ["domain-driven-design", "clean-architecture", "onion-architecture", "hexagonal"],
    reject: [],
    weight: 1.5
  },
  {
    id: "consistency-model",
    question: "Do workflows require eventual consistency, queues, or request/response?",
    architectNote: "Events are a consistency choice, not a default style.",
    developerNote: "Synchronous request/response stays easier to test until async is required.",
    keywords: ["eventual", "queue", "pubsub", "pub/sub", "async", "message bus", "event bus"],
    boost: ["event-driven", "cqrs", "saga"],
    reject: [],
    weight: 1.4
  },
  {
    id: "provider-integration",
    question: "Are providers, payments, or MCP tools replaceable at the edge?",
    architectNote: "Protect the core with ports and adapters when vendors will change.",
    developerNote: "Keep Stripe, AI, and MCP behind adapters so feature code stays stable.",
    keywords: ["provider", "stripe", "payment", "mcp", "adapter", "byok", "cloudflare"],
    boost: ["hexagonal", "modular-monolith"],
    reject: [],
    weight: 1.7
  },
  {
    id: "audit-history",
    question: "Is immutable history or a ledger a real requirement?",
    architectNote: "Event sourcing without an audit/history need is accidental complexity.",
    developerNote: "Skip event stores unless replay and compliance are explicit.",
    keywords: ["audit", "ledger", "event sourcing", "compliance", "immutable history"],
    boost: ["event-sourcing", "cqrs"],
    reject: [],
    weight: 1.8
  },
  {
    id: "extensibility",
    question: "Does the product need a stable kernel with plugins or capability packs?",
    architectNote: "Keep the kernel small; plugins need stable contracts.",
    developerNote: "Optional packs belong behind extension points, not scattered if/else.",
    keywords: ["plugin", "extension", "marketplace", "microkernel", "capability pack"],
    boost: ["microkernel", "modular-monolith"],
    reject: [],
    weight: 1.5
  },
  {
    id: "migration-path",
    question: "Is this a greenfield foundation or a phased legacy replacement?",
    architectNote: "Prefer strangler routes and anti-corruption layers over a big-bang rewrite.",
    developerNote: "Ship behind a facade and retire the old path with an exit criterion.",
    keywords: ["legacy", "strangler", "migrate", "modernization", "rewrite"],
    boost: ["strangler-fig", "anti-corruption-layer", "modular-monolith"],
    reject: [],
    weight: 1.6
  },
  {
    id: "platform-fit",
    question: "What runtime surface must the foundation serve?",
    architectNote: "Match deploy topology to the platform, then pick supporting styles.",
    developerNote: "Desktop and hybrid products usually stay one process with module seams.",
    keywords: [],
    boost: [],
    reject: [],
    weight: 1.3
  },
  {
    id: "complexity-budget",
    question: "What ceremony budget does the team actually have?",
    architectNote: "Enterprise patterns without an enterprise budget become shelfware.",
    developerNote: "Minimal and balanced profiles should reject heavy distributed machinery.",
    keywords: [],
    boost: [],
    reject: [],
    weight: 1.4
  },
  {
    id: "team-and-ownership",
    question: "Are features owned as slices, or is the repo already a modular workspace?",
    architectNote: "A monorepo with package boundaries is a modular monolith, not a forced slice tree.",
    developerNote: "Use slices inside modules when feature ownership helps; do not lock the whole system to slices.",
    keywords: ["workspace", "monorepo", "module boundary", "feature folder", "vertical slice", "slice"],
    boost: ["modular-monolith", "vertical-slice"],
    reject: [],
    weight: 1.4
  }
];

export const ARCHITECTURE_DECISION_GUIDE: ArchitectureDecisionGuide = {
  id: "master-architecture-decision",
  displayName: "Master Architecture Decision Guide",
  summary:
    "Senior-architect and senior-developer lenses that eliminate unfit styles, then rank foundations from platform, domain, and operational signals.",
  lenses: ["software-architect", "senior-developer"],
  steps: STEPS
};

export function listArchitectureDecisionGuide(): ArchitectureDecisionGuide {
  return ARCHITECTURE_DECISION_GUIDE;
}

function combineGuideText(input: CatalogRecommendationInput): string {
  return [
    input.repoSummary ?? "",
    input.requestedOutcome ?? "",
    input.requirementTags.join(" "),
    input.platformType,
    input.workloadType,
    input.likelyDiagnosisIntent
  ]
    .join(" ")
    .toLowerCase();
}

function matchKeywords(text: string, keywords: string[]): string[] {
  return keywords.filter((keyword) => text.includes(keyword.toLowerCase()));
}

function lensWeight(base: number, lens: ArchitectureDecisionLens, stepId: ArchitectureDecisionGuideStepId): number {
  if (lens === "senior-developer") {
    if (stepId === "complexity-budget" || stepId === "team-and-ownership") {
      return base + 0.2;
    }
    if (stepId === "domain-complexity" || stepId === "audit-history") {
      return base - 0.1;
    }
  }

  if (lens === "software-architect") {
    if (stepId === "provider-integration" || stepId === "platform-fit" || stepId === "deploy-units") {
      return base + 0.2;
    }
  }

  return base;
}

function uniqueIds(ids: ArchitectureCatalogId[]): ArchitectureCatalogId[] {
  return [...new Set(ids)];
}

export function evaluateArchitectureDecisionGuide(
  input: CatalogRecommendationInput
): DecisionGuideEvaluation {
  const lens: ArchitectureDecisionLens = input.decisionLens ?? "software-architect";
  const text = combineGuideText(input);
  const simpleCrud = /\b(crud|mvp|simple|small team)\b/.test(text);
  const distributedIntent = matchKeywords(text, [
    "microservice",
    "microservices",
    "independent deploy",
    "distributed service",
    "multi-team"
  ]);
  const auditIntent = matchKeywords(text, [
    "audit",
    "ledger",
    "event sourcing",
    "compliance",
    "immutable history"
  ]);
  const asyncIntent = matchKeywords(text, [
    "eventual",
    "queue",
    "pubsub",
    "pub/sub",
    "async",
    "message bus",
    "event bus"
  ]);
  const complexDomain = matchKeywords(text, [
    "bounded context",
    "ubiquitous language",
    "complex domain",
    "ddd",
    "aggregate"
  ]);
  const migrationIntent =
    input.workloadType === "migration" ||
    input.likelyDiagnosisIntent === "migration" ||
    matchKeywords(text, ["legacy", "strangler", "migrate", "modernization", "rewrite"]).length > 0;

  const boosts: DecisionGuideAdjustment[] = [];
  const penalties: DecisionGuideAdjustment[] = [];
  const rejected: ArchitectureRejection[] = [];
  const steps: ArchitectureGuideStepResult[] = [];

  const addBoost = (
    stepId: ArchitectureDecisionGuideStepId,
    architectureId: ArchitectureCatalogId,
    weight: number,
    reason: string
  ) => {
    boosts.push({ architectureId, weight, reason, stepId });
  };

  const addReject = (
    stepId: ArchitectureDecisionGuideStepId,
    architectureId: ArchitectureCatalogId,
    reason: string
  ) => {
    penalties.push({ architectureId, weight: -3, reason, stepId });
    if (!rejected.some((entry) => entry.architectureId === architectureId && entry.stepId === stepId)) {
      rejected.push({ architectureId, reason, stepId });
    }
  };

  for (const step of STEPS) {
    const matchedKeywords = matchKeywords(text, step.keywords);
    let applied = false;
    let boosted: ArchitectureCatalogId[] = [];
    let rejectedIds: ArchitectureCatalogId[] = [];
    let reason = step.architectNote;

    if (step.id === "deploy-units") {
      if (distributedIntent.length > 0) {
        applied = true;
        boosted = ["microservices", "soa", "api-gateway"];
        reason = "Independent deploy signals justify service boundaries.";
      } else {
        applied = true;
        rejectedIds = ["microservices", "soa"];
        reason =
          lens === "software-architect"
            ? "One operational unit should stay a modular monolith until ownership forces a split."
            : "Avoid distributed services until delivery and ops are ready.";
      }
    } else if (step.id === "domain-complexity") {
      if (complexDomain.length > 0) {
        applied = true;
        boosted = step.boost;
        reason = "Rich domain language supports DDD with clean/hexagonal edges.";
      } else if (simpleCrud || input.complexityProfile === "minimal") {
        applied = true;
        rejectedIds = ["domain-driven-design", "event-sourcing", "saga"];
        boosted = ["monolithic", "minimal-api", "layered"];
        reason = "CRUD or a small complexity budget should not carry DDD or event machinery.";
      }
    } else if (step.id === "consistency-model") {
      if (asyncIntent.length > 0) {
        applied = true;
        boosted = step.boost;
        reason = "Async and queue signals support event-driven coordination.";
      } else if (auditIntent.length === 0) {
        applied = true;
        rejectedIds = ["event-sourcing"];
        reason = "Request/response systems should not adopt event sourcing by default.";
      }
    } else if (step.id === "provider-integration") {
      if (matchedKeywords.length > 0) {
        applied = true;
        boosted = step.boost;
        if (lens === "software-architect") {
          boosted = uniqueIds([...boosted, "hexagonal"]);
        }
        reason = "Replaceable providers and MCP/payment edges need ports and module seams.";
      }
    } else if (step.id === "audit-history") {
      if (auditIntent.length > 0) {
        applied = true;
        boosted = step.boost;
        reason = "Explicit audit/history need supports event sourcing and CQRS.";
      } else {
        applied = true;
        rejectedIds = ["event-sourcing"];
        reason = "No ledger or compliance signal — reject event sourcing.";
      }
    } else if (step.id === "extensibility") {
      if (matchedKeywords.length > 0) {
        applied = true;
        boosted = step.boost;
        reason = "Plugin and product-line needs point to a microkernel inside a modular monolith.";
      }
    } else if (step.id === "migration-path") {
      if (migrationIntent) {
        applied = true;
        boosted = step.boost;
        reason = "Phased replacement should use strangler routes and an anti-corruption layer.";
      }
    } else if (step.id === "platform-fit") {
      applied = true;
      if (input.platformType === "desktop" || input.platformType === "hybrid") {
        boosted = ["modular-monolith", "microkernel", "hexagonal"];
        reason = "Desktop/hybrid products fit a modular monolith with hexagonal edges.";
      } else if (input.platformType === "api" || input.platformType === "worker") {
        boosted = ["hexagonal", "minimal-api", "clean-architecture"];
        reason = "API/worker surfaces favor hexagonal adapters and thin endpoints.";
      } else if (input.platformType === "web") {
        boosted = ["modular-monolith", "bff", "layered"];
        reason = "Web products usually stay one deployable with optional BFF shaping.";
      } else {
        boosted = ["modular-monolith", "hexagonal"];
        reason = "Default to modular boundaries with replaceable adapters.";
      }
      if (lens === "senior-developer" && (input.platformType === "web" || input.platformType === "api")) {
        boosted = uniqueIds([...boosted, "vertical-slice", "minimal-api"]);
      }
    } else if (step.id === "complexity-budget") {
      applied = true;
      const sagaIntent = matchKeywords(text, ["saga", "distributed transaction", "compensating"]).length > 0;
      if (input.complexityProfile === "minimal" || input.complexityProfile === "balanced") {
        rejectedIds = uniqueIds([
          "event-sourcing",
          ...(sagaIntent ? [] : (["saga"] as ArchitectureCatalogId[])),
          ...(distributedIntent.length === 0 ? (["microservices"] as ArchitectureCatalogId[]) : [])
        ]);
        boosted = input.complexityProfile === "minimal" ? ["monolithic", "minimal-api", "layered"] : ["modular-monolith", "hexagonal"];
        reason = `${input.complexityProfile} complexity budget suppresses heavy distributed and sourcing styles.`;
      } else {
        boosted = ["clean-architecture", "hexagonal", "modular-monolith"];
        reason = `${input.complexityProfile} complexity budget can carry stronger boundaries.`;
      }
    } else if (step.id === "team-and-ownership") {
      const workspaceHit = matchKeywords(text, ["workspace", "monorepo", "module boundary", "package"]);
      const sliceHit = matchKeywords(text, ["feature folder", "vertical slice", "slice"]);
      if (workspaceHit.length > 0 || sliceHit.length > 0 || input.platformType === "desktop") {
        applied = true;
        boosted = workspaceHit.length > 0 || input.platformType === "desktop" ? ["modular-monolith"] : [];
        if (sliceHit.length > 0 && lens === "senior-developer") {
          boosted = uniqueIds([...boosted, "vertical-slice"]);
        }
        if (workspaceHit.length > 0 && lens === "software-architect") {
          boosted = uniqueIds([...boosted, "modular-monolith", "hexagonal"]);
        }
        reason =
          workspaceHit.length > 0
            ? "Workspace/monorepo markers recommend a modular monolith foundation."
            : "Feature-slice markers can shape delivery inside modules, not lock the foundation.";
        matchedKeywords.push(...workspaceHit, ...sliceHit);
      }
    }

    const weight = lensWeight(step.weight, lens, step.id);
    if (applied) {
      for (const architectureId of uniqueIds(boosted)) {
        addBoost(step.id, architectureId, weight, reason);
      }
      for (const architectureId of uniqueIds(rejectedIds)) {
        addReject(step.id, architectureId, reason);
      }
    }

    steps.push({
      id: step.id,
      applied,
      matchedKeywords: [...new Set(matchedKeywords)],
      boosted: uniqueIds(boosted),
      rejected: uniqueIds(rejectedIds),
      reason
    });
  }

  return {
    lens,
    steps,
    rejected,
    boosts,
    penalties
  };
}
