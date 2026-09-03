import type { ExecutionPermission } from "@arkitect/contracts";

const PERMISSION_RANK: ExecutionPermission[] = [
  "read-only",
  "generate-plan",
  "propose-changes",
  "apply-safe-changes",
  "apply-structural-changes"
];

function rankOf(permission: ExecutionPermission): number {
  return PERMISSION_RANK.indexOf(permission);
}

export function raisePermissionFloor(
  current: ExecutionPermission,
  floor: ExecutionPermission
): ExecutionPermission {
  return rankOf(current) < rankOf(floor) ? floor : current;
}

export function capPermission(
  current: ExecutionPermission,
  ceiling: ExecutionPermission
): ExecutionPermission {
  return rankOf(current) > rankOf(ceiling) ? ceiling : current;
}
