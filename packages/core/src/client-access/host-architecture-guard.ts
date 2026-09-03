import type {
  ArchitectureRecommendationRequest,
  ClientSession,
  HostArchitectureAction,
  HostArchitectureGuardResult
} from "@arkitect/contracts";

const HOST_REDESIGN_BLOCKED =
  "Host architecture redesign is only allowed from the Arkitect-mcp.com repo root.";

export function guardHostArchitectureWrite(
  session: ClientSession,
  _action: HostArchitectureAction
): HostArchitectureGuardResult {
  if (session.allowHostArchitectureRedesign) {
    return { allowed: true };
  }

  if (!session.targetIsHost) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: session.blockedReason ?? HOST_REDESIGN_BLOCKED
  };
}

export function sanitizeArchitectureRecommendationRequest(
  request: ArchitectureRecommendationRequest,
  session: ClientSession
): { request: ArchitectureRecommendationRequest; lockDenied: boolean; reason?: string } {
  const wantsHostLock = Boolean(request.lockCurrentArchitecture || request.selectedArchitectureId);
  const guard = wantsHostLock ? guardHostArchitectureWrite(session, "lock") : { allowed: true };

  if (guard.allowed) {
    return { request, lockDenied: false };
  }

  return {
    request: {
      ...request,
      lockCurrentArchitecture: false,
      selectedArchitectureId: undefined
    },
    lockDenied: true,
    reason: guard.reason
  };
}
