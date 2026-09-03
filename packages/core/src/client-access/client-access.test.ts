import { describe, expect, it } from "vitest";
import {
  applyClientSessionToIntake,
  buildClientMcpEnv,
  buildClientSessionGuidance,
  guardHostArchitectureWrite,
  mergeCursorMcpServers,
  resolveClientSession,
  sanitizeArchitectureRecommendationRequest
} from "./index.js";
import { createDefaultIntake } from "../diagnosis-result.js";

const HOST_PATH = "C:\\Dev\\Occuring Projects\\Arkitect-mcp.com";
const CLIENT_PATH = "C:\\Dev\\PasteCraft";

describe("resolveClientSession", () => {
  it("treats the host repo root as a host session with architecture write", () => {
    const session = resolveClientSession({
      repoPath: HOST_PATH,
      defaultRepoPath: HOST_PATH,
      hostRepoPath: HOST_PATH
    });

    expect(session.role).toBe("host");
    expect(session.toolsUnlocked).toBe(true);
    expect(session.allowHostArchitectureRedesign).toBe(true);
    expect(session.writeScope).toBe("host-architecture");
    expect(session.targetIsHost).toBe(true);
  });

  it("unlocks client-tree read/write for a connected client repo", () => {
    const session = resolveClientSession({
      repoPath: CLIENT_PATH,
      defaultRepoPath: CLIENT_PATH,
      hostRepoPath: HOST_PATH
    });

    expect(session.role).toBe("client");
    expect(session.toolsUnlocked).toBe(true);
    expect(session.allowLocalOverrides).toBe(true);
    expect(session.allowHostArchitectureRedesign).toBe(false);
    expect(session.writeScope).toBe("client-tree");
    expect(session.executionPermissionFloor).toBe("apply-safe-changes");
    expect(session.targetIsHost).toBe(false);
  });

  it("denies host architecture redesign when a client session targets the host path", () => {
    const session = resolveClientSession({
      repoPath: HOST_PATH,
      defaultRepoPath: CLIENT_PATH,
      hostRepoPath: HOST_PATH
    });

    expect(session.role).toBe("client");
    expect(session.targetIsHost).toBe(true);
    expect(session.allowHostArchitectureRedesign).toBe(false);
    expect(session.blockedReason).toMatch(/Arkitect-mcp.com repo root/);
    expect(guardHostArchitectureWrite(session, "lock").allowed).toBe(false);
  });
});

describe("applyClientSessionToIntake", () => {
  it("raises client permission to apply-safe-changes", () => {
    const session = resolveClientSession({
      repoPath: CLIENT_PATH,
      defaultRepoPath: CLIENT_PATH,
      hostRepoPath: HOST_PATH
    });
    const intake = createDefaultIntake(CLIENT_PATH);
    intake.executionPermission = "read-only";

    const next = applyClientSessionToIntake(intake, session);

    expect(next.executionPermission).toBe("apply-safe-changes");
  });

  it("caps host-target client sessions to generate-plan and clears architecture lock", () => {
    const session = resolveClientSession({
      repoPath: HOST_PATH,
      defaultRepoPath: CLIENT_PATH,
      hostRepoPath: HOST_PATH
    });
    const intake = createDefaultIntake(HOST_PATH);
    intake.executionPermission = "apply-structural-changes";
    intake.catalogPreferences.lockCurrentArchitecture = true;

    const next = applyClientSessionToIntake(intake, session);

    expect(next.executionPermission).toBe("generate-plan");
    expect(next.catalogPreferences.lockCurrentArchitecture).toBe(false);
  });
});

describe("sanitizeArchitectureRecommendationRequest", () => {
  it("allows a client to lock its own architecture", () => {
    const session = resolveClientSession({
      repoPath: CLIENT_PATH,
      defaultRepoPath: CLIENT_PATH,
      hostRepoPath: HOST_PATH
    });

    const sanitized = sanitizeArchitectureRecommendationRequest(
      { lockCurrentArchitecture: true, selectedArchitectureId: "hexagonal" },
      session
    );

    expect(sanitized.lockDenied).toBe(false);
    expect(sanitized.request.lockCurrentArchitecture).toBe(true);
    expect(sanitized.request.selectedArchitectureId).toBe("hexagonal");
  });

  it("strips host architecture lock from a foreign client session", () => {
    const session = resolveClientSession({
      repoPath: HOST_PATH,
      defaultRepoPath: CLIENT_PATH,
      hostRepoPath: HOST_PATH
    });

    const sanitized = sanitizeArchitectureRecommendationRequest(
      { lockCurrentArchitecture: true, selectedArchitectureId: "hexagonal" },
      session
    );

    expect(sanitized.lockDenied).toBe(true);
    expect(sanitized.request.lockCurrentArchitecture).toBe(false);
    expect(sanitized.request.selectedArchitectureId).toBeUndefined();
  });
});

describe("client MCP install helpers", () => {
  it("writes client default path and host path without dropping extra env", () => {
    const env = buildClientMcpEnv({
      clientRepoPath: CLIENT_PATH,
      hostRepoPath: HOST_PATH,
      extraEnv: { ARKITECT_SKIP_DESKTOP_BRIDGE: "1", ARKITECT_DEFAULT_REPO_PATH: HOST_PATH }
    });

    expect(env.ARKITECT_DEFAULT_REPO_PATH).toBe(CLIENT_PATH);
    expect(env.ARKITECT_HOST_REPO_PATH).toBe(HOST_PATH);
    expect(env.ARKITECT_SKIP_DESKTOP_BRIDGE).toBe("1");
  });

  it("merges arkitect-mcp without wiping other servers", () => {
    const merged = mergeCursorMcpServers(
      {
        mcpServers: {
          github: { command: "npx", args: ["-y", "@github/mcp"] }
        }
      },
      "arkitect-mcp",
      { command: "node", args: ["packages/mcp-server/dist/stdio.js"] }
    );

    expect(merged.mcpServers?.github?.command).toBe("npx");
    expect(merged.mcpServers?.["arkitect-mcp"]?.command).toBe("node");
  });
});

describe("buildClientSessionGuidance", () => {
  it("tells client sessions that read/write is unlocked", () => {
    const session = resolveClientSession({
      repoPath: CLIENT_PATH,
      defaultRepoPath: CLIENT_PATH,
      hostRepoPath: HOST_PATH
    });

    expect(buildClientSessionGuidance(session).some((line) => line.includes("Read/write unlocked"))).toBe(true);
  });
});
