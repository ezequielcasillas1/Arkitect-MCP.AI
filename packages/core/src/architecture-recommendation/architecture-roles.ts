import type { ArchitectureCatalogId, ArchitectureRole } from "@arkitect/contracts";
import { getArchitectureCatalogEntry } from "../catalog.js";

const ROLE_BY_ID: Record<ArchitectureCatalogId, ArchitectureRole> = {
  "modular-monolith": "foundation",
  monolithic: "foundation",
  microservices: "foundation",
  soa: "foundation",
  microkernel: "foundation",
  "vertical-slice": "internal",
  layered: "internal",
  "screaming-architecture": "internal",
  "domain-driven-design": "internal",
  hexagonal: "edge",
  "clean-architecture": "edge",
  "onion-architecture": "edge",
  bff: "edge",
  "api-gateway": "edge",
  "anti-corruption-layer": "edge",
  "minimal-api": "edge",
  "event-driven": "supporting",
  "event-sourcing": "supporting",
  cqrs: "supporting",
  saga: "supporting",
  "circuit-breaker": "supporting",
  "strangler-fig": "supporting",
  "repository-pattern": "supporting",
  "unit-of-work": "supporting"
};

export function getArchitectureRole(id: ArchitectureCatalogId): ArchitectureRole {
  return ROLE_BY_ID[id];
}

export function listArchitectureIdsForRole(role: ArchitectureRole): ArchitectureCatalogId[] {
  return (Object.entries(ROLE_BY_ID) as Array<[ArchitectureCatalogId, ArchitectureRole]>)
    .filter(([, value]) => value === role)
    .map(([id]) => id);
}

export function relatedIdsForRole(
  architectureId: ArchitectureCatalogId,
  role: ArchitectureRole
): ArchitectureCatalogId[] {
  const related = getArchitectureCatalogEntry(architectureId)?.relatedArchitectures ?? [];
  return related.filter((id) => getArchitectureRole(id) === role);
}

export function architecturesAreRelated(left: ArchitectureCatalogId, right: ArchitectureCatalogId): boolean {
  const leftRelated = getArchitectureCatalogEntry(left)?.relatedArchitectures ?? [];
  const rightRelated = getArchitectureCatalogEntry(right)?.relatedArchitectures ?? [];
  return leftRelated.includes(right) || rightRelated.includes(left);
}
