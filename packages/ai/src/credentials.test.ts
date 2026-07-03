import { describe, expect, it } from "vitest";
import { validateCredentialsForProvider } from "./credentials.js";

describe("validateCredentialsForProvider", () => {
  it("accepts a sufficiently long Cursor API key for Composer", () => {
    const result = validateCredentialsForProvider({
      preferredProvider: "composer-2.5",
      modelName: "composer-2.5",
      cursorApiKey: "cursor-test-key-1234567890"
    });

    expect(result.ok).toBe(true);
  });

  it("requires a Cursor API key for Composer", () => {
    const result = validateCredentialsForProvider({
      preferredProvider: "composer-2.5",
      modelName: "composer-2.5"
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("missing_key");
    }
  });
});
