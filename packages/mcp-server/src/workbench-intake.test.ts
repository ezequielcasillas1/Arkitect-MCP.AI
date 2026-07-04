import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { resolveWorkbenchApplyRequest } from "@arkitect/core";
import { createArkitectMcpServer } from "./index.js";
import * as bridgeClient from "./desktop-bridge-client.js";

describe("apply_workbench_intake tool", () => {
  beforeEach(() => {
    vi.spyOn(bridgeClient, "postWorkbenchIntake").mockResolvedValue({
      ok: true,
      appliedAt: "2026-07-04T00:00:00.000Z",
      message: "Workbench intake queued for Arkitect Desktop."
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("forwards autoRun and saveAsPreset to the desktop bridge", async () => {
    const server = createArkitectMcpServer();
    const tool = server.tools.find((entry) => entry.name === "apply_workbench_intake");

    expect(tool).toBeDefined();

    const result = await tool!.execute({
      repoPath: "C:\\Dev\\Arkitect-mcp.com",
      repoName: "Arkitect",
      autoRun: { diagnosis: true, verify: true, advanceToResults: true },
      saveAsPreset: "Testing for ARK",
      markStepsReviewed: { profile: true, policy: true, settings: true, mcp: true }
    });

    expect(bridgeClient.postWorkbenchIntake).toHaveBeenCalledOnce();
    const payload = vi.mocked(bridgeClient.postWorkbenchIntake).mock.calls[0]?.[0];

    expect(payload?.autoRun?.diagnosis).toBe(true);
    expect(payload?.autoRun?.advanceToResults).toBe(true);
    expect(payload?.saveAsPreset).toBe("Testing for ARK");
    expect(payload?.intake.repoName).toBe("Arkitect");

    const json = result.content[0]?.json as { desktopApplied?: boolean; autoRun?: { diagnosis?: boolean } };
    expect(json.desktopApplied).toBe(true);
    expect(json.autoRun?.diagnosis).toBe(true);
  });

  it("resolves applyAllTestSources into full automation before bridge post", async () => {
    const server = createArkitectMcpServer();
    const tool = server.tools.find((entry) => entry.name === "apply_workbench_intake");

    await tool!.execute({
      applyAllTestSources: true,
      intake: { requestedOutcome: "Run every auto-fill source" }
    });

    const payload = vi.mocked(bridgeClient.postWorkbenchIntake).mock.calls.at(-1)?.[0];
    const resolved = resolveWorkbenchApplyRequest(payload!);

    expect(resolved.autoRun?.diagnosis).toBe(true);
    expect(resolved.autoRun?.verify).toBe(true);
    expect(resolved.autoRun?.advanceToResults).toBe(true);
    expect(resolved.intake.requestedOutcome).toBe("Run every auto-fill source");
  });
});
