import type { DesignPrincipleEntry } from "@arkitect/contracts";

const REFACTORING_GURU_BASE = "https://refactoring.guru/design-patterns";

export const DESIGN_PRINCIPLES: DesignPrincipleEntry[] = [
  {
    id: "encapsulate-what-varies",
    name: "Encapsulate What Varies",
    family: "general",
    summary:
      "Identify the parts of a program that change most often and separate them from the parts that stay stable.",
    keyIdea:
      "Isolate volatile logic behind stable interfaces so the rest of the code does not ripple when the volatile part changes.",
    examples: [
      "Hide tax-rate rules behind a calculateTax method that callers use through a stable signature.",
      "Wrap provider-specific SDK calls (payments, auth) so switching provider does not require touching business logic."
    ],
    violations: [
      "Business classes reach directly into third-party SDKs.",
      "Long conditionals branching on provider or region keys leak across the codebase."
    ],
    relatedPatternIds: ["strategy", "factory-method", "adapter", "facade", "template-method"],
    referenceUrl: `${REFACTORING_GURU_BASE}`
  },
  {
    id: "program-to-an-interface",
    name: "Program to an Interface, not an Implementation",
    family: "general",
    summary:
      "Depend on abstractions rather than concrete classes so implementations can vary without breaking callers.",
    keyIdea:
      "Callers should ask for behavior through an abstract type; concrete providers are wired in at the composition root.",
    examples: [
      "A checkout service depends on a PaymentGateway interface, not a specific Stripe class.",
      "Repositories are exposed as interfaces and swapped between in-memory and database implementations in tests."
    ],
    violations: [
      "new StripeClient() called deep inside domain code.",
      "Types tied to a specific framework class instead of an abstraction."
    ],
    relatedPatternIds: ["strategy", "adapter", "abstract-factory", "bridge", "observer"],
    referenceUrl: `${REFACTORING_GURU_BASE}`
  },
  {
    id: "favor-composition-over-inheritance",
    name: "Favor Composition Over Inheritance",
    family: "general",
    summary:
      "Prefer composing behavior from small collaborating objects over deep inheritance hierarchies.",
    keyIdea:
      "Combine capabilities by holding other objects instead of extending base classes; delegation is more flexible than subclassing.",
    examples: [
      "A Robot class composes weapon and movement strategies instead of subclassing FlyingArmedRobot.",
      "Cross-cutting behavior (logging, caching) is layered via decorators rather than base-class hooks."
    ],
    violations: [
      "Deep inheritance chains where subclasses override each other's overrides.",
      "Base classes accumulating features because subclassing was the only extension mechanism."
    ],
    relatedPatternIds: ["strategy", "decorator", "bridge", "composite", "state"],
    referenceUrl: `${REFACTORING_GURU_BASE}`
  },
  {
    id: "single-responsibility",
    name: "Single Responsibility Principle",
    family: "solid",
    summary: "A class should have one, and only one, reason to change.",
    keyIdea:
      "Group code that changes for the same business reason together; split code that changes for different reasons apart.",
    examples: [
      "Reporting classes are split from persistence classes so report formatting can change without touching storage.",
      "A command object executes one operation and delegates unrelated concerns to collaborators."
    ],
    violations: [
      "God classes owning I/O, business rules, and presentation at once.",
      "Modules changed by three unrelated teams in the same release."
    ],
    relatedPatternIds: ["command", "strategy", "facade", "mediator", "chain-of-responsibility"],
    referenceUrl: `${REFACTORING_GURU_BASE}`
  },
  {
    id: "open-closed",
    name: "Open/Closed Principle",
    family: "solid",
    summary: "Classes should be open for extension but closed for modification.",
    keyIdea:
      "New behavior is added by writing new classes that plug in through abstractions, not by editing stable classes.",
    examples: [
      "New payment providers are added by implementing an existing PaymentGateway interface.",
      "Analytics extensions plug in as decorators or observers instead of if-branches in core code."
    ],
    violations: [
      "Every new feature touches the same switch statement.",
      "Adding a new type forces changes in dozens of unrelated files."
    ],
    relatedPatternIds: [
      "strategy",
      "factory-method",
      "decorator",
      "observer",
      "chain-of-responsibility",
      "visitor"
    ],
    referenceUrl: `${REFACTORING_GURU_BASE}`
  },
  {
    id: "liskov-substitution",
    name: "Liskov Substitution Principle",
    family: "solid",
    summary:
      "Subtypes must be substitutable for their base types without breaking the correctness of the program.",
    keyIdea:
      "A subclass must honor the contracts, invariants, and preconditions of its superclass; overrides may not tighten preconditions or weaken postconditions.",
    examples: [
      "A ReadOnlyList that inherits from List but throws on add() breaks LSP — model it as a separate type instead.",
      "A Square inheriting from Rectangle that changes setWidth semantics violates LSP."
    ],
    violations: [
      "Overrides throwing NotSupportedException for methods callers expect to work.",
      "Downcasting to check a specific subtype before using it."
    ],
    relatedPatternIds: ["template-method", "strategy", "composite", "state"],
    referenceUrl: `${REFACTORING_GURU_BASE}`
  },
  {
    id: "interface-segregation",
    name: "Interface Segregation Principle",
    family: "solid",
    summary:
      "Clients should not be forced to depend on interfaces they do not use.",
    keyIdea:
      "Prefer many small, focused interfaces to one fat interface; each caller depends only on the operations it actually needs.",
    examples: [
      "Split a Repository interface into Reader and Writer for read-only consumers.",
      "Break a Notifier interface into EmailNotifier and PushNotifier so services do not implement empty methods."
    ],
    violations: [
      "Classes implementing interfaces with dozens of methods, many left empty or throwing.",
      "Test doubles forced to stub methods the code under test never calls."
    ],
    relatedPatternIds: ["adapter", "facade", "proxy", "decorator"],
    referenceUrl: `${REFACTORING_GURU_BASE}`
  },
  {
    id: "dependency-inversion",
    name: "Dependency Inversion Principle",
    family: "solid",
    summary:
      "Depend on abstractions, not concretions; high-level policy should not depend on low-level detail.",
    keyIdea:
      "Both high-level and low-level modules depend on interfaces owned by the domain; concrete implementations are injected at the boundary.",
    examples: [
      "Use cases depend on repository interfaces defined in the domain; database adapters implement them.",
      "Notification workflows depend on a Notifier abstraction rather than a specific transport."
    ],
    violations: [
      "Domain classes importing an ORM or HTTP client directly.",
      "Interfaces defined by infrastructure and referenced by domain code."
    ],
    relatedPatternIds: ["factory-method", "abstract-factory", "adapter", "strategy", "bridge"],
    referenceUrl: `${REFACTORING_GURU_BASE}`
  }
];

const principleMap = new Map(DESIGN_PRINCIPLES.map((entry) => [entry.id, entry]));

export function listDesignPrinciples() {
  return DESIGN_PRINCIPLES;
}

export function getDesignPrincipleEntry(id: DesignPrincipleEntry["id"]) {
  return principleMap.get(id);
}
