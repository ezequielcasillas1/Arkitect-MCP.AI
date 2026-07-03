import { discoverTestCapabilities, runTestOverride } from "@arkitect/core";
import type { TestOverrideCatalog, TestOverrideKind, TestOverrideRunResult } from "@arkitect/contracts";

export async function getTestOverrideCatalog(input: { repoPath: string }): Promise<TestOverrideCatalog> {
  return discoverTestCapabilities(input);
}

export async function runTestOverrideCommand(input: {
  repoPath: string;
  kind: TestOverrideKind;
}): Promise<TestOverrideRunResult> {
  return runTestOverride(input);
}
