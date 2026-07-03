import { describe, expect, it } from "vitest";
import type { CodebaseVerifyStepId } from "./verification.js";

describe("verification contracts", () => {
  it("includes the test step in verify flow ids", () => {
    const steps: CodebaseVerifyStepId[] = ["lint", "build", "typecheck", "test"];

    expect(steps).toHaveLength(4);
    expect(steps.at(-1)).toBe("test");
  });
});
