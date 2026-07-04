import { describe, expect, it } from "vitest";
import { inferReviewFlagsFromIntake, resolveWorkbenchAdvanceStep } from "./workbench-intake-bridge.js";

describe("resolveWorkbenchAdvanceStep", () => {
  it("lands on review-and-run when all review gates are satisfied", () => {
    expect(
      resolveWorkbenchAdvanceStep({
        repoReady: true,
        profileReviewed: true,
        policyReviewed: true,
        settingsReviewed: true
      })
    ).toBe("review-and-run");
  });

  it("respects explicit advanceToStep overrides", () => {
    expect(
      resolveWorkbenchAdvanceStep({
        advanceToStep: "architecture-policy",
        repoReady: true,
        profileReviewed: true,
        policyReviewed: true,
        settingsReviewed: true
      })
    ).toBe("architecture-policy");
  });

  it("stops at the first incomplete gate", () => {
    expect(
      resolveWorkbenchAdvanceStep({
        repoReady: true,
        profileReviewed: true,
        policyReviewed: false,
        settingsReviewed: false
      })
    ).toBe("architecture-policy");
  });
});

describe("inferReviewFlagsFromIntake", () => {
  it("uses explicit markStepsReviewed when provided", () => {
    expect(
      inferReviewFlagsFromIntake(
        { repoName: "Arkitect" },
        { profile: true, policy: false, settings: false, mcp: true },
        true
      )
    ).toEqual({
      profile: true,
      policy: false,
      settings: false,
      mcp: true
    });
  });

  it("infers profile and policy from intake signals", () => {
    expect(
      inferReviewFlagsFromIntake({
        userInput: { platformType: { hint: "desktop", confirmed: true } },
        catalogPreferences: { requirementTags: ["mcp"] },
        ai: { preferredProvider: "composer-2.5", modelName: "composer-2.5", allowUserSuppliedKeys: true, fallbackProviders: [] }
      })
    ).toEqual({
      profile: true,
      policy: true,
      settings: true,
      mcp: false
    });
  });
});
