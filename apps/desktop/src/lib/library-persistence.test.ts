import { describe, expect, it } from "vitest";
import { createDefaultIntake } from "@arkitect/core";
import { resolveAiCredentials } from "./library-persistence.js";

describe("resolveAiCredentials", () => {
  it("uses applied intake provider settings instead of stale draft defaults", () => {
    const intake = {
      ...createDefaultIntake(),
      ai: {
        ...createDefaultIntake().ai,
        preferredProvider: "composer-2.5" as const,
        modelName: "composer-2.5"
      }
    };

    const credentials = resolveAiCredentials({
      intake,
      cursorApiKey: "cursor-key-from-session",
      providerKeys: { anthropic: "other-provider-key" }
    });

    expect(credentials.preferredProvider).toBe("composer-2.5");
    expect(credentials.cursorApiKey).toBe("cursor-key-from-session");
  });
});
