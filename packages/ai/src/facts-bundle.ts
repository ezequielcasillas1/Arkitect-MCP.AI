import type { AiDiagnosisFactsBundle, DiagnosisResult } from "@arkitect/contracts";

function topReason(reasons: Array<{ summary: string }> | undefined): string {
  return reasons?.[0]?.summary ?? "Ranked by rule engine context.";
}

export function buildDiagnosisFactsBundle(result: DiagnosisResult): AiDiagnosisFactsBundle {
  const inspection = result.intake.repoInspection;
  const github = result.intake.githubRoute?.target;

  return {
    repo: {
      routeSource: result.intake.routeSource,
      path: result.intake.repoPath,
      name: result.intake.repoName,
      summary: result.intake.repoSummary,
      inspection: inspection
        ? {
            manifestFiles: inspection.manifestFiles.slice(0, 12),
            topLevelDirectories: inspection.topLevelDirectories.slice(0, 16),
            frameworkHints: inspection.frameworkHints.slice(0, 8),
            detectedMarkers: inspection.detectedMarkers.slice(0, 12)
          }
        : undefined,
      github: github
        ? {
            owner: github.owner,
            repo: github.repo,
            branch: github.branch,
            defaultBranch: github.defaultBranch
          }
        : undefined
    },
    detections: {
      platformType: result.signals.platformType.final.value,
      workloadType: result.signals.workloadType.final.value,
      currentArchitecture: result.signals.currentArchitecture.final.value,
      repoHealth: result.signals.repoHealth.final.value,
      likelyDiagnosisIntent: result.signals.likelyDiagnosisIntent.final.value
    },
    architecturePolicy: {
      principles: result.architecturePolicy.principles,
      continueHealthyArchitecture: result.architecturePolicy.continueHealthyArchitecture,
      requiresExplicitMigrationIntent: result.architecturePolicy.requiresExplicitMigrationIntent
    },
    ruleDecision: {
      recommendedAction: result.decision.recommendedAction,
      recommendedExecutionMode: result.decision.recommendedExecutionMode,
      requiredPermission: result.decision.requiredPermission,
      reason: result.decision.reason,
      warnings: result.decision.warnings,
      nextSteps: result.decision.nextSteps,
      selectedArchitectureId: result.decision.selectedArchitectureId,
      selectedRemixId: result.decision.selectedRemixId,
      appliedStrategies: result.decision.appliedStrategies
    },
    catalog: {
      architectureCandidates: result.catalogRecommendation.architectureCandidates.slice(0, 5).map((candidate) => ({
        id: candidate.id,
        score: candidate.score,
        topReason: topReason(candidate.reasons)
      })),
      remixCandidates: result.catalogRecommendation.remixCandidates.slice(0, 5).map((candidate) => ({
        id: candidate.id,
        score: candidate.score,
        topReason: topReason(candidate.reasons)
      })),
      recommendedPatterns: result.patternGuidance.recommendedPatterns,
      overEngineeringRisk: result.patternGuidance.overEngineeringRisk
    },
    requestedOutcome: result.intake.requestedOutcome,
    executionPermission: result.intake.executionPermission
  };
}
