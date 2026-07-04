import type { DiagnosisIntake } from "@arkitect/contracts";
import { createDefaultIntake } from "./diagnosis-result.js";

export function mergeDiagnosisIntake(partial: Partial<DiagnosisIntake>, repoPath?: string): DiagnosisIntake {
  const defaults = createDefaultIntake(partial.repoPath ?? repoPath);

  return {
    ...defaults,
    ...partial,
    ai: partial.ai ? { ...defaults.ai, ...partial.ai } : defaults.ai,
    userInput: partial.userInput ? { ...defaults.userInput, ...partial.userInput } : defaults.userInput,
    catalogPreferences: partial.catalogPreferences
      ? {
          ...defaults.catalogPreferences,
          ...partial.catalogPreferences,
          requirementTags:
            partial.catalogPreferences.requirementTags ?? defaults.catalogPreferences.requirementTags
        }
      : defaults.catalogPreferences
  };
}

export function applyPartialIntakeToDraft(
  current: DiagnosisIntake,
  partial: Partial<DiagnosisIntake>
): DiagnosisIntake {
  return {
    ...current,
    ...partial,
    ai: partial.ai ? { ...current.ai, ...partial.ai } : current.ai,
    userInput: partial.userInput ? { ...current.userInput, ...partial.userInput } : current.userInput,
    catalogPreferences: partial.catalogPreferences
      ? {
          ...current.catalogPreferences,
          ...partial.catalogPreferences,
          requirementTags:
            partial.catalogPreferences.requirementTags ?? current.catalogPreferences.requirementTags
        }
      : current.catalogPreferences,
    githubRoute:
      partial.githubRoute !== undefined
        ? partial.githubRoute
        : partial.routeSource === "local-path"
          ? undefined
          : current.githubRoute,
    repoInspection: partial.repoInspection ?? current.repoInspection
  };
}
