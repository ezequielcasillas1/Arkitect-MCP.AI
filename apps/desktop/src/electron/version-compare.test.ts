import { describe, expect, it } from "vitest";
import { compareVersions, isUpdateAvailable, normalizeVersionTag } from "./version-compare.js";

describe("normalizeVersionTag", () => {
  it("strips a leading v prefix", () => {
    expect(normalizeVersionTag("v0.1.0")).toBe("0.1.0");
    expect(normalizeVersionTag("V1.2.3")).toBe("1.2.3");
  });
});

describe("compareVersions", () => {
  it("orders semantic versions", () => {
    expect(compareVersions("0.1.0", "0.2.0")).toBe(-1);
    expect(compareVersions("1.0.0", "0.9.9")).toBe(1);
    expect(compareVersions("0.1.0", "0.1.0")).toBe(0);
  });

  it("handles missing patch segments", () => {
    expect(compareVersions("1.0", "1.0.1")).toBe(-1);
    expect(compareVersions("2", "1.9.9")).toBe(1);
  });

  it("ignores pre-release suffixes for ordering", () => {
    expect(compareVersions("1.0.0-beta", "1.0.0")).toBe(0);
    expect(compareVersions("0.1.0-rc.1", "0.2.0")).toBe(-1);
  });
});

describe("isUpdateAvailable", () => {
  it("returns true only when latest is newer", () => {
    expect(isUpdateAvailable("0.1.0", "0.2.0")).toBe(true);
    expect(isUpdateAvailable("0.2.0", "0.1.0")).toBe(false);
    expect(isUpdateAvailable("v0.1.0", "v0.1.0")).toBe(false);
  });
});
