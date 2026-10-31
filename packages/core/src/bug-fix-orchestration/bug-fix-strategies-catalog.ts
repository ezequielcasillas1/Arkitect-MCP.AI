import type { BugFixStrategy, RootCauseCategory } from "@arkitect/contracts";

export const BUG_FIX_STRATEGIES: BugFixStrategy[] = [
  {
    id: "add-guard-and-validate",
    name: "Add guard and validate inputs",
    summary: "Close missing-guard defects with early validation and fail-fast checks.",
    addressesCategories: ["missing-guard", "incorrect-assumption"],
    agentActions: [
      "Locate the failing entry point and add explicit input/precondition checks.",
      "Prefer returning typed errors over swallowing exceptions.",
      "Add a focused unit test for the previously unguarded path."
    ]
  },
  {
    id: "realign-contract",
    name: "Realign stale contract",
    summary: "Sync producers and consumers when types, schemas, or API shapes drifted.",
    addressesCategories: ["stale-contract", "dependency-mismatch"],
    agentActions: [
      "Diff the failing call site against the declared contract or schema.",
      "Update either producer or consumer so both share one source of truth.",
      "Re-run contract or integration tests after the alignment."
    ]
  },
  {
    id: "stabilize-timing",
    name: "Stabilize race or timing",
    summary: "Remove flaky race windows with awaits, locks, or deterministic scheduling.",
    addressesCategories: ["race-or-timing"],
    agentActions: [
      "Reproduce under load or with forced delays when possible.",
      "Replace shared mutable timing assumptions with explicit synchronization.",
      "Convert flaky sleeps into event-driven waits or fake timers in tests."
    ]
  },
  {
    id: "repair-config-drift",
    name: "Repair configuration drift",
    summary: "Restore expected env, flags, or deploy config that diverged from code assumptions.",
    addressesCategories: ["config-drift"],
    agentActions: [
      "Compare runtime config with documented defaults and secrets inventory.",
      "Fix the mismatched key or document the intentional override.",
      "Add a startup check that fails loudly when required config is missing."
    ]
  },
  {
    id: "contain-boundary-leak",
    name: "Contain architectural boundary leak",
    summary: "Stop cross-layer coupling that lets bugs jump module or service boundaries.",
    addressesCategories: ["architectural-boundary-leak", "state-corruption"],
    agentActions: [
      "Map the leak against the recommended foundation/internal/edge triple.",
      "Move the dependency behind a port or shared contract.",
      "Verify neighboring modules no longer import the private detail."
    ]
  },
  {
    id: "close-test-gap",
    name: "Close test gap",
    summary: "Add the missing regression coverage that let the defect ship.",
    addressesCategories: ["test-gap", "unknown"],
    agentActions: [
      "Write a failing test that reproduces the portrait primary cause.",
      "Keep the test scoped to the blast radius reported by the portrait.",
      "Only then apply the minimal production fix and re-run verify_codebase."
    ]
  }
];

export function listBugFixStrategies(category?: RootCauseCategory): BugFixStrategy[] {
  if (!category) {
    return BUG_FIX_STRATEGIES;
  }

  return BUG_FIX_STRATEGIES.filter((strategy) => strategy.addressesCategories.includes(category));
}
