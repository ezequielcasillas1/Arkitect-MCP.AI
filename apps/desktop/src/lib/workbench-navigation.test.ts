import { describe, expect, it } from "vitest";
import { getHighestNavigableIndex, shouldClampActiveStep } from "./workbench-navigation.js";

describe("getHighestNavigableIndex", () => {
  it("unlocks results after run output exists", () => {
    expect(getHighestNavigableIndex(true, true, true)).toBe(6);
  });

  it("unlocks review-and-run after settings are reviewed", () => {
    expect(getHighestNavigableIndex(true, true, false)).toBe(5);
  });

  it("keeps user on connect repo until inspection passes", () => {
    expect(getHighestNavigableIndex(false, false, false)).toBe(0);
  });
});

describe("shouldClampActiveStep", () => {
  it("does not clamp results during automation completion", () => {
    expect(
      shouldClampActiveStep({
        activeStep: "results-overview",
        activeIndex: 6,
        highestNavigableIndex: 5,
        automationPhase: "complete",
        hasRunOutput: false
      })
    ).toBe(false);
  });

  it("clamps results before automation produces output", () => {
    expect(
      shouldClampActiveStep({
        activeStep: "results-overview",
        activeIndex: 6,
        highestNavigableIndex: 5,
        automationPhase: "idle",
        hasRunOutput: false
      })
    ).toBe(true);
  });
});
