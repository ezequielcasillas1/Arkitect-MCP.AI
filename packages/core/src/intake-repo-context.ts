import type { DiagnosisIntake, RepoInspection } from "@arkitect/contracts";
import { createDefaultIntake } from "./diagnosis-result.js";
import { buildRepoSummaryFromInspection } from "./repo-inspector.js";

function usedHostScaffoldDefaults(partial: Partial<DiagnosisIntake>, intake: DiagnosisIntake): boolean {
  const hostDefaults = createDefaultIntake(intake.repoPath);

  return (
    !partial.repoName &&
    !partial.repoSummary &&
    !partial.requestedOutcome &&
    intake.repoName === hostDefaults.repoName &&
    intake.repoSummary === hostDefaults.repoSummary &&
    intake.requestedOutcome === hostDefaults.requestedOutcome
  );
}

export function enrichIntakeWithRepoInspection(
  intake: DiagnosisIntake,
  inspection: RepoInspection,
  partial: Partial<DiagnosisIntake> = {}
): DiagnosisIntake {
  const hostScaffold = usedHostScaffoldDefaults(partial, intake);

  return {
    ...intake,
    repoInspection: inspection,
    repoName: partial.repoName ?? (hostScaffold ? inspection.repoName : intake.repoName),
    repoSummary: partial.repoSummary ?? (hostScaffold ? buildRepoSummaryFromInspection(inspection) : intake.repoSummary),
    requestedOutcome:
      partial.requestedOutcome ??
      (hostScaffold ? "Review and improve this connected repo using diagnosis-first architecture guidance." : intake.requestedOutcome),
    userInput:
      hostScaffold && !partial.userInput?.platformType
        ? {
            ...intake.userInput,
            platformType: {
              hint: undefined,
              confirmed: false
            }
          }
        : intake.userInput
  };
}
