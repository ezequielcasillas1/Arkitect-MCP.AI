import type {
  DiagnosisResult,
  RefactoringAnalysisInput,
  RefactoringAnalysisResult,
  RefactoringOrchestrationPhase,
  RefactoringSmell,
  RefactoringSmellId,
  RefactoringTechniqueRecommendation
} from "@arkitect/contracts";
import { defaultArchitecturePolicy } from "./diagnosis-result.js";
import {
  getRefactoringCategoryLabels,
  listRefactoringTechniques,
  REFACTORING_TECHNIQUES
} from "./refactoring-techniques-catalog.js";

const SMELL_CATALOG: Record<
  RefactoringSmellId,
  { label: string; summary: string }
> = {
  "long-methods": {
    label: "Long methods",
    summary: "Methods likely doing too much and hiding execution logic."
  },
  "duplicate-code": {
    label: "Duplicate code",
    summary: "Repeated logic that should be consolidated or extracted."
  },
  "god-class": {
    label: "God class",
    summary: "A class accumulating unrelated responsibilities."
  },
  "feature-envy": {
    label: "Feature envy",
    summary: "Methods reaching into other objects more than their own data."
  },
  "spaghetti-structure": {
    label: "Spaghetti structure",
    summary: "Uncontrolled coupling and unclear module boundaries."
  },
  "architectural-drift": {
    label: "Architectural drift",
    summary: "Implementation diverging from the intended architecture shape."
  },
  "primitive-obsession": {
    label: "Primitive obsession",
    summary: "Domain concepts modeled as primitives instead of rich types."
  },
  "switch-statements": {
    label: "Switch statements",
    summary: "Type-code branching that resists extension."
  },
  "deep-inheritance": {
    label: "Deep inheritance",
    summary: "Inheritance hierarchies that obscure behavior."
  },
  "tight-coupling": {
    label: "Tight coupling",
    summary: "Classes depending on concrete details they should not know."
  },
  "mixed-responsibilities": {
    label: "Mixed responsibilities",
    summary: "Units combining query, command, and orchestration concerns."
  }
};

function createSmell(
  id: RefactoringSmellId,
  confidence: number,
  rationale: string
): RefactoringSmell {
  const catalog = SMELL_CATALOG[id];
  return {
    id,
    label: catalog.label,
    summary: catalog.summary,
    confidence,
    rationale
  };
}

function detectSmells(
  diagnosis: DiagnosisResult,
  input: RefactoringAnalysisInput
): RefactoringSmell[] {
  const smells: RefactoringSmell[] = [];
  const summary = `${input.repoSummary ?? ""} ${input.requestedOutcome ?? ""}`.toLowerCase();
  const architecture = diagnosis.signals.currentArchitecture.final.value;
  const repoHealth = diagnosis.signals.repoHealth.final.value;
  const intent = diagnosis.signals.likelyDiagnosisIntent.final.value;

  if (repoHealth === "spaghetti" || architecture === "spaghetti" || summary.includes("spaghetti")) {
    smells.push(
      createSmell(
        "spaghetti-structure",
        0.88,
        "Repo health or architecture signals indicate spaghetti structure."
      )
    );
    smells.push(
      createSmell(
        "long-methods",
        0.82,
        "Spaghetti structure usually correlates with long, hard-to-follow methods."
      )
    );
    smells.push(
      createSmell(
        "mixed-responsibilities",
        0.78,
        "Unhealthy structure often mixes query, command, and orchestration in one place."
      )
    );
  }

  if (repoHealth === "drifting" || summary.includes("drift")) {
    smells.push(
      createSmell(
        "architectural-drift",
        0.84,
        "Drift markers suggest the codebase is diverging from its intended shape."
      )
    );
    smells.push(
      createSmell(
        "feature-envy",
        0.68,
        "Drift often appears as features placed in the wrong module or layer."
      )
    );
  }

  if (architecture === "layered" || architecture === "unknown") {
    smells.push(
      createSmell(
        "tight-coupling",
        0.62,
        "Layered or unknown architecture signals may hide concrete cross-layer coupling."
      )
    );
  }

  if (architecture === "layered") {
    smells.push(
      createSmell(
        "switch-statements",
        0.58,
        "Layered codebases often accumulate type-code branching at service boundaries."
      )
    );
  }

  if (intent === "migration" || input.explicitRefactorIntent || summary.includes("refactor")) {
    smells.push(
      createSmell(
        "duplicate-code",
        0.74,
        "Migration and refactor intent usually targets repeated legacy logic."
      )
    );
    smells.push(
      createSmell(
        "god-class",
        0.7,
        "Structural refactors commonly start by splitting overgrown classes."
      )
    );
  }

  if (architecture === "modular-monolith" || architecture === "vertical-slice") {
    smells.push(
      createSmell(
        "architectural-drift",
        0.55,
        "Healthy modular shapes still need boundary checks to prevent slice or package drift."
      )
    );
  }

  if (repoHealth === "healthy" && smells.length === 0) {
    smells.push(
      createSmell(
        "long-methods",
        0.42,
        "Even healthy repos benefit from composing-method reviews before new features land."
      )
    );
  }

  const unique = new Map<RefactoringSmellId, RefactoringSmell>();
  for (const smell of smells) {
    const existing = unique.get(smell.id);
    if (!existing || smell.confidence > existing.confidence) {
      unique.set(smell.id, smell);
    }
  }

  return [...unique.values()].sort((left, right) => right.confidence - left.confidence);
}

function recommendTechniques(
  smells: RefactoringSmell[],
  category?: RefactoringAnalysisInput["category"]
): RefactoringTechniqueRecommendation[] {
  const smellIds = new Set(smells.map((smell) => smell.id));
  const candidates = category ? listRefactoringTechniques(category) : REFACTORING_TECHNIQUES;

  const scored = candidates
    .map((technique) => {
      const triggeredBySmells = technique.addressesSmells.filter((smellId) => smellIds.has(smellId));
      if (triggeredBySmells.length === 0) {
        return null;
      }

      const matchScore = triggeredBySmells.reduce((total, smellId) => {
        const smell = smells.find((entry) => entry.id === smellId);
        return total + (smell?.confidence ?? 0.5);
      }, 0);

      const priority: RefactoringTechniqueRecommendation["priority"] =
        matchScore >= 1.6 ? "high" : matchScore >= 0.9 ? "medium" : "low";

      return {
        technique,
        priority,
        rationale: `${technique.name} addresses ${triggeredBySmells.map((id) => SMELL_CATALOG[id].label.toLowerCase()).join(", ")}.`,
        triggeredBySmells,
        matchScore
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    .sort((left, right) => right.matchScore - left.matchScore);

  return scored.slice(0, 12).map(({ matchScore: _matchScore, ...entry }) => entry);
}

function buildOrchestrationPlan(
  recommendations: RefactoringTechniqueRecommendation[],
  diagnosis: DiagnosisResult,
  explicitRefactorIntent: boolean
): RefactoringOrchestrationPhase[] {
  const techniqueIds = recommendations.map((entry) => entry.technique.id);
  const composing = techniqueIds.filter((id) =>
    recommendations.find((entry) => entry.technique.id === id)?.technique.category === "composing-methods"
  );
  const moving = techniqueIds.filter((id) =>
    recommendations.find((entry) => entry.technique.id === id)?.technique.category === "moving-features"
  );
  const organizing = techniqueIds.filter((id) =>
    ["organizing-data", "simplifying-conditionals", "simplifying-method-calls"].includes(
      recommendations.find((entry) => entry.technique.id === id)?.technique.category ?? ""
    )
  );
  const generalization = techniqueIds.filter((id) =>
    recommendations.find((entry) => entry.technique.id === id)?.technique.category === "dealing-with-generalization"
  );

  const phases: RefactoringOrchestrationPhase[] = [
    {
      id: "assess",
      label: "Assess structure",
      summary: "Confirm diagnosis signals and report smells before changing code.",
      agentActions: [
        "Call diagnose_repository and analyze_refactoring_opportunities before structural edits.",
        "Summarize detected smells, repo health, and recommended action for the user.",
        "Do not apply refactors until explicit migration or refactor intent is confirmed."
      ],
      techniqueIds: []
    },
    {
      id: "compose",
      label: "Compose methods",
      summary: "Streamline long methods and remove duplication at the method level.",
      agentActions: [
        "Start with Extract Method, Extract Variable, and Replace Temp with Query on the hottest paths.",
        "Keep each extraction small and verify behavior after every step."
      ],
      techniqueIds: composing.slice(0, 4)
    },
    {
      id: "move",
      label: "Move features",
      summary: "Relocate behavior to the classes or modules that should own it.",
      agentActions: [
        "Use Move Method and Move Field when feature envy or drift is detected.",
        "Prefer Extract Class over growing god classes."
      ],
      techniqueIds: moving.slice(0, 4)
    },
    {
      id: "organize",
      label: "Organize data and calls",
      summary: "Replace primitives, flatten conditionals, and simplify method interfaces.",
      agentActions: [
        "Apply Encapsulate Field, Introduce Parameter Object, and guard-clause refactors where smells persist.",
        "Replace type-code switches with polymorphism only when behavior varies by type."
      ],
      techniqueIds: organizing.slice(0, 4)
    },
    {
      id: "generalize",
      label: "Adjust generalization",
      summary: "Tune inheritance, interfaces, and shared abstractions last.",
      agentActions: [
        "Prefer Extract Interface and Replace Inheritance with Delegation over deep hierarchies.",
        "Use Pull Up Method or Form Template Method only after duplication is confirmed."
      ],
      techniqueIds: generalization.slice(0, 3)
    },
    {
      id: "verify",
      label: "Verify safely",
      summary: "Run verification after each refactor batch.",
      agentActions: [
        "Run verify_codebase or run_test_suite after each refactor batch.",
        "Stop and report if repo health is unhealthy and the user has not asked for migration work."
      ],
      techniqueIds: []
    }
  ];

  if (!explicitRefactorIntent && diagnosis.signals.repoHealth.final.value !== "healthy") {
    return [phases[0], phases[phases.length - 1]];
  }

  return phases.filter((phase) => phase.techniqueIds.length > 0 || phase.id === "assess" || phase.id === "verify");
}

export function createRefactoringCatalogPayload() {
  const categories = getRefactoringCategoryLabels();
  const items = listRefactoringTechniques();

  return {
    summary: `Arkitect exposes ${items.length} Refactoring Guru techniques across ${categories.length} categories for agent-orchestrated code analysis.`,
    total: items.length,
    categories,
    items
  };
}

export function buildRefactoringAnalysisResult(
  diagnosis: DiagnosisResult,
  input: RefactoringAnalysisInput = {},
  repoPath?: string
): RefactoringAnalysisResult {
  const detectedSmells = detectSmells(diagnosis, input);
  const recommendedTechniques = recommendTechniques(detectedSmells, input.category);
  const explicitRefactorIntent =
    Boolean(input.explicitRefactorIntent) ||
    diagnosis.signals.likelyDiagnosisIntent.final.value === "migration" ||
    (input.requestedOutcome ?? "").toLowerCase().includes("refactor");

  const orchestrationPlan = buildOrchestrationPlan(recommendedTechniques, diagnosis, explicitRefactorIntent);

  return {
    summary: `Detected ${detectedSmells.length} refactor smells and ranked ${recommendedTechniques.length} Refactoring Guru techniques for agent-orchestrated remediation.`,
    repoPath: repoPath ?? diagnosis.intake.repoPath,
    autoRefactorAllowed: false,
    requiresExplicitIntent: true,
    detectedSmells,
    recommendedTechniques,
    orchestrationPlan,
    diagnosisContext: {
      signals: diagnosis.signals,
      decision: diagnosis.decision,
      patternGuidance: diagnosis.patternGuidance
    },
    referenceBaseUrl: "https://refactoring.guru/refactoring/techniques"
  };
}

export function createRefactoringCursorGuidance(result: RefactoringAnalysisResult): string[] {
  const topTechniques = result.recommendedTechniques.slice(0, 5).map((entry) => entry.technique.name);
  const topSmells = result.detectedSmells.slice(0, 4).map((smell) => smell.label);

  return [
    `Refactoring analysis for ${result.repoPath}`,
    `Detected smells: ${topSmells.length > 0 ? topSmells.join(", ") : "none strong enough yet"}`,
    `Top techniques: ${topTechniques.length > 0 ? topTechniques.join(", ") : "run list_refactoring_techniques for the full catalog"}`,
    `Repo health: ${result.diagnosisContext.signals.repoHealth.final.value}`,
    `Architecture: ${result.diagnosisContext.signals.currentArchitecture.final.value}`,
    `Auto-refactor allowed: ${result.autoRefactorAllowed}`,
    "Follow orchestrationPlan phases in order — assess and verify are mandatory bookends.",
    "Use Refactoring Guru referenceUrl on each technique before applying it.",
    "Do not auto-refactor spaghetti structure without explicit migration or refactor intent.",
    defaultArchitecturePolicy.principles.includes("report-structure-before-refactor")
      ? "Report unhealthy structure before proposing code changes."
      : "Honor architecture-first policy before structural edits."
  ];
}
