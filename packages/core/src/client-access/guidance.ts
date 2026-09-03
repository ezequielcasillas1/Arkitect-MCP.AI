import type { ClientSession } from "@arkitect/contracts";

export function buildClientSessionGuidance(session: ClientSession): string[] {
  if (session.role === "host") {
    return [
      "Host session: architecture redesign of Arkitect-mcp.com is allowed from this repo root.",
      "Keep modularity and confirm before locking continuation."
    ];
  }

  if (session.targetIsHost) {
    return [
      "Read/diagnose of the Arkitect host is allowed from this client session.",
      session.blockedReason ??
        "Do not redesign Arkitect-mcp.com architecture from this workspace. Change it only from the Arkitect-mcp.com repo root."
    ];
  }

  return [
    "Read/write unlocked for this repo. Local Arkitect overrides (remix, tags, policy) are allowed.",
    "Do not redesign Arkitect-mcp.com from this workspace."
  ];
}
