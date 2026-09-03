import type { ClientSession, DiagnosisIntake } from "@arkitect/contracts";
import { capPermission, raisePermissionFloor } from "./permissions.js";

export function applyClientSessionToIntake(intake: DiagnosisIntake, session: ClientSession): DiagnosisIntake {
  if (session.role === "client" && session.targetIsHost) {
    return {
      ...intake,
      executionPermission: capPermission(intake.executionPermission, "generate-plan"),
      catalogPreferences: {
        ...intake.catalogPreferences,
        lockCurrentArchitecture: false
      }
    };
  }

  if (session.role === "client") {
    return {
      ...intake,
      executionPermission: raisePermissionFloor(intake.executionPermission, session.executionPermissionFloor)
    };
  }

  return intake;
}
