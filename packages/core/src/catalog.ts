import type {
  ArchitectureCatalogEntry,
  ArchitectureCatalogId,
  ComplexityProfile,
  DesignPatternCatalogEntry,
  DesignPatternId,
  PatternFamily,
  RemixProfileCatalogEntry,
  RemixProfileId,
  WorkloadType
} from "@arkitect/contracts";
import type { ArchitectureStyle, PlatformType } from "@arkitect/contracts";

const allPlatforms: PlatformType[] = ["desktop", "web", "api", "cli", "library", "worker", "hybrid"];
const allWorkloads: WorkloadType[] = [
  "architecture-foundation",
  "feature-delivery",
  "bug-fix",
  "migration",
  "repo-recovery",
  "diagnosis"
];
const lowComplexityProfiles: ComplexityProfile[] = ["minimal", "balanced"];

export const architectureCatalog: ArchitectureCatalogEntry[] = [
  {
    id: "vertical-slice",
    displayName: "Vertical Slice Architecture",
    category: "foundation",
    summary: "Organizes code by feature so each slice owns its request, logic, and persistence path.",
    bestFor: ["Feature-rich apps", "Teams wanting modular delivery without service sprawl"],
    useCases: ["Internal tools", "SaaS backends", "Desktop products with feature islands"],
    strengths: ["Strong feature ownership", "Low cross-slice coupling", "Fits incremental delivery well"],
    tradeoffs: ["Shared concerns still need discipline", "Cross-slice reporting can drift without conventions"],
    warnings: ["Avoid turning slices into hidden layers.", "Do not bypass slice boundaries with convenience imports."],
    compatiblePlatforms: ["desktop", "web", "api", "hybrid"],
    compatibleWorkloads: ["architecture-foundation", "feature-delivery", "migration", "diagnosis"],
    highAffinityPatterns: ["mediator", "command", "strategy", "decorator"],
    relatedArchitectures: ["modular-monolith", "minimal-api", "clean-architecture", "screaming-architecture"],
    detectionKeywords: ["vertical slice", "slice", "feature folder", "feature-first", "mediatr"]
  },
  {
    id: "clean-architecture",
    displayName: "Clean / Onion Architecture",
    category: "foundation",
    summary: "Uses strict dependency inversion so the domain stays independent from frameworks and I/O.",
    bestFor: ["Framework-agnostic business logic", "Long-lived systems with high testability needs"],
    useCases: ["Core business platforms", "Compliance-sensitive apps", "Shared domain libraries"],
    strengths: ["Strong dependency direction", "High testability", "Stable domain boundaries"],
    tradeoffs: ["Extra abstraction cost", "Can feel heavy for narrow CRUD apps"],
    warnings: ["Do not add layers with no responsibility.", "Avoid ceremonial interfaces when the boundary is not real."],
    compatiblePlatforms: ["desktop", "web", "api", "library", "hybrid"],
    compatibleWorkloads: ["architecture-foundation", "migration", "repo-recovery", "diagnosis"],
    highAffinityPatterns: ["factory-method", "adapter", "facade", "strategy"],
    relatedArchitectures: ["hexagonal", "screaming-architecture", "domain-driven-design", "layered"],
    detectionKeywords: ["clean architecture", "onion", "use case", "application layer", "dependency inversion"]
  },
  {
    id: "hexagonal",
    displayName: "Hexagonal Architecture",
    category: "foundation",
    summary: "Decouples the core from external I/O through explicit ports and adapters.",
    bestFor: ["Integration-heavy systems", "Provider-agnostic services", "Apps with replaceable infrastructure"],
    useCases: ["API platforms", "Workers", "AI tool backends", "Payment-heavy systems"],
    strengths: ["Replaceable adapters", "Strong test seams", "Clear boundary around the domain"],
    tradeoffs: ["Port design takes effort", "Over-modeling simple endpoints can slow delivery"],
    warnings: ["Do not make every helper a port.", "Keep adapters thin or the boundary becomes noisy."],
    compatiblePlatforms: ["api", "worker", "library", "hybrid", "web"],
    compatibleWorkloads: ["architecture-foundation", "feature-delivery", "migration", "diagnosis"],
    highAffinityPatterns: ["adapter", "facade", "proxy", "bridge", "chain-of-responsibility"],
    relatedArchitectures: ["clean-architecture", "domain-driven-design", "minimal-api", "repository-pattern"],
    detectionKeywords: ["hexagonal", "ports and adapters", "ports", "adapters", "inbound adapter", "outbound adapter"]
  },
  {
    id: "modular-monolith",
    displayName: "Modular Monolith",
    category: "foundation",
    summary: "Keeps a single deployable unit while enforcing strong internal module boundaries.",
    bestFor: ["Growing teams", "Products not ready for microservices", "Repos needing clearer seams now"],
    useCases: ["Monorepo business platforms", "Desktop + service bundles", "Operationally simple SaaS stacks"],
    strengths: ["Simple operations", "Clear modules", "Good migration runway toward services later"],
    tradeoffs: ["Requires boundary discipline", "One deploy unit can still create release contention"],
    warnings: ["Do not call it modular if every module imports everything.", "Protect boundaries with contracts and reviews."],
    compatiblePlatforms: ["desktop", "web", "api", "hybrid"],
    compatibleWorkloads: ["architecture-foundation", "feature-delivery", "migration", "repo-recovery", "diagnosis"],
    highAffinityPatterns: ["mediator", "command", "decorator", "factory-method"],
    relatedArchitectures: ["vertical-slice", "microservices", "clean-architecture", "microkernel"],
    detectionKeywords: ["modular monolith", "module boundary", "internal module", "single deployable", "workspace"]
  },
  {
    id: "minimal-api",
    displayName: "Minimal API Architecture",
    category: "foundation",
    summary: "Optimizes for low-ceremony request handling with thin endpoints and focused services.",
    bestFor: ["Fast APIs", "Small teams", "Worker-style services", "Low-ceremony platforms"],
    useCases: ["Service endpoints", "Webhook handlers", "Background task coordinators"],
    strengths: ["Fast delivery", "Low ceremony", "Great fit for narrow service boundaries"],
    tradeoffs: ["Can accumulate implicit conventions", "Needs discipline to avoid handler sprawl"],
    warnings: ["Do not let thin handlers grow hidden business logic.", "Layer in structure before the endpoint surface sprawls."],
    compatiblePlatforms: ["api", "worker", "web", "hybrid"],
    compatibleWorkloads: ["feature-delivery", "architecture-foundation", "bug-fix", "diagnosis"],
    highAffinityPatterns: ["facade", "adapter", "strategy", "chain-of-responsibility"],
    relatedArchitectures: ["vertical-slice", "hexagonal", "cqrs", "event-driven"],
    detectionKeywords: ["minimal api", "minimal endpoint", "thin handler", "low ceremony api", "route handler"]
  },
  {
    id: "domain-driven-design",
    displayName: "Domain-Driven Design (DDD)",
    category: "foundation",
    summary: "Models complex business domains with bounded contexts, aggregates, value objects, and domain events.",
    bestFor: ["Complex business domains", "Teams sharing a rich ubiquitous language", "Multi-domain systems"],
    useCases: ["Fintech", "Operations platforms", "Order and workflow-heavy products"],
    strengths: ["Deep business modeling", "Clear context boundaries", "Strong language around rules"],
    tradeoffs: ["Needs domain maturity", "Can overwhelm simple CRUD systems"],
    warnings: ["Do not force aggregates where transaction boundaries are simple.", "Avoid cargo-cult event modeling."],
    compatiblePlatforms: ["api", "web", "desktop", "hybrid", "library"],
    compatibleWorkloads: ["architecture-foundation", "migration", "diagnosis", "repo-recovery"],
    highAffinityPatterns: ["factory-method", "observer", "command", "visitor", "interpreter", "state"],
    relatedArchitectures: ["hexagonal", "clean-architecture", "event-sourcing", "cqrs"],
    detectionKeywords: ["ddd", "domain-driven", "bounded context", "aggregate", "value object", "domain event"]
  },
  {
    id: "event-driven",
    displayName: "Event-Driven Architecture",
    category: "foundation",
    summary: "Uses messages, queues, and pub/sub to coordinate asynchronous flows across components or services.",
    bestFor: ["Async workflows", "Integrations", "Eventually consistent systems", "Real-time signaling"],
    useCases: ["Notification systems", "Order orchestration", "Background job ecosystems", "Realtime collaboration"],
    strengths: ["Loose temporal coupling", "Scales async work well", "Fits reactive systems"],
    tradeoffs: ["Observability is harder", "Consistency is more complex", "Failure handling needs rigor"],
    warnings: ["Do not choose events just to avoid clear synchronous boundaries.", "Message sprawl without ownership becomes chaos."],
    compatiblePlatforms: ["api", "worker", "hybrid", "web"],
    compatibleWorkloads: ["feature-delivery", "migration", "diagnosis", "architecture-foundation"],
    highAffinityPatterns: ["observer", "command", "chain-of-responsibility", "mediator", "template-method"],
    relatedArchitectures: ["cqrs", "microservices", "event-sourcing", "microkernel"],
    detectionKeywords: ["event-driven", "pubsub", "pub/sub", "message queue", "event bus", "broker"]
  },
  {
    id: "microservices",
    displayName: "Microservices Blueprint",
    category: "foundation",
    summary: "Splits the system into independently deployable services with explicit inter-service contracts.",
    bestFor: ["Independent scaling", "Team autonomy", "Different runtime needs per domain"],
    useCases: ["Large multi-team products", "Platform ecosystems", "Global traffic systems"],
    strengths: ["Independent deployability", "Service isolation", "Clear operational ownership"],
    tradeoffs: ["Operational overhead", "Distributed debugging cost", "Cross-service consistency is hard"],
    warnings: ["Do not split too early.", "Service boundaries without team ownership create distributed monoliths."],
    compatiblePlatforms: ["api", "worker", "hybrid"],
    compatibleWorkloads: ["migration", "architecture-foundation", "diagnosis"],
    highAffinityPatterns: ["adapter", "facade", "proxy", "observer", "strategy"],
    relatedArchitectures: ["modular-monolith", "event-driven", "cqrs", "minimal-api"],
    detectionKeywords: ["microservice", "microservices", "service boundary", "independent deploy", "distributed service"]
  },
  {
    id: "cqrs",
    displayName: "CQRS",
    category: "supporting",
    summary: "Separates read and write models so commands and queries can evolve independently.",
    bestFor: ["Complex workflows", "Audit-heavy systems", "Systems with different read and write pressures"],
    useCases: ["Back offices", "Workflow engines", "Financial ledgers", "Search-heavy admin portals"],
    strengths: ["Clear write intent", "Flexible read models", "Pairs well with event sourcing"],
    tradeoffs: ["More moving parts", "Read/write divergence to manage", "Not always needed for CRUD"],
    warnings: ["Avoid CQRS for simple CRUD with no scaling or workflow pressure.", "Separate models only when the behavior demands it."],
    compatiblePlatforms: ["api", "web", "desktop", "hybrid"],
    compatibleWorkloads: ["feature-delivery", "migration", "diagnosis", "architecture-foundation"],
    highAffinityPatterns: ["command", "memento", "iterator", "observer", "mediator"],
    relatedArchitectures: ["vertical-slice", "event-driven", "event-sourcing", "domain-driven-design"],
    detectionKeywords: ["cqrs", "command query separation", "query model", "read model", "write model"]
  },
  {
    id: "screaming-architecture",
    displayName: "Screaming Architecture",
    category: "supporting",
    summary: "Organizes structure so the domain and use cases are louder than frameworks or delivery technology.",
    bestFor: ["Repos needing clearer intent", "Teams refocusing structure around business capabilities"],
    useCases: ["Refactors away from framework-first folders", "Domain-centric monoliths"],
    strengths: ["Clear domain signaling", "Better onboarding", "Makes intent visible in the tree"],
    tradeoffs: ["Naming discipline matters", "Still needs execution boundaries underneath"],
    warnings: ["Renaming folders alone is not architecture.", "Do not use screaming labels to hide weak boundaries."],
    compatiblePlatforms: ["desktop", "web", "api", "library", "hybrid"],
    compatibleWorkloads: ["repo-recovery", "migration", "diagnosis", "architecture-foundation"],
    highAffinityPatterns: ["facade", "strategy", "factory-method"],
    relatedArchitectures: ["clean-architecture", "vertical-slice", "domain-driven-design", "layered"],
    detectionKeywords: ["screaming architecture", "feature intent", "domain-first folders", "use case folders"]
  },
  {
    id: "repository-pattern",
    displayName: "Repository Pattern",
    category: "data-access",
    summary: "Abstracts data access behind repository contracts and unit-of-work style boundaries when they add value.",
    bestFor: ["Domain-centric persistence", "Teams needing swappable data access seams", "Testable write paths"],
    useCases: ["DDD aggregates", "Clean architecture services", "Legacy data access isolation"],
    strengths: ["Keeps data access localized", "Improves test seams", "Supports transaction boundaries"],
    tradeoffs: ["Can duplicate ORM capabilities", "Over-abstraction hurts simple queries"],
    warnings: ["Use it selectively, not as a blanket rule for every table.", "Do not hide query needs behind anaemic repositories."],
    compatiblePlatforms: ["api", "web", "desktop", "hybrid", "library"],
    compatibleWorkloads: ["feature-delivery", "migration", "repo-recovery", "diagnosis"],
    highAffinityPatterns: ["factory-method", "facade", "proxy"],
    relatedArchitectures: ["clean-architecture", "domain-driven-design", "layered", "hexagonal"],
    detectionKeywords: ["repository pattern", "repository", "unit of work", "data access abstraction"]
  },
  {
    id: "layered",
    displayName: "Layered Architecture",
    category: "supporting",
    summary: "Separates presentation, application, domain, and data responsibilities into explicit layers.",
    bestFor: ["Traditional enterprise apps", "Data-heavy systems", "Teams used to service-layer design"],
    useCases: ["CRUD-heavy back offices", "Line-of-business portals", "Long-lived internal systems"],
    strengths: ["Easy to explain", "Works well with service layers", "Stable for classic enterprise flows"],
    tradeoffs: ["Can turn into pass-through layers", "Feature ownership is weaker than slice-oriented designs"],
    warnings: ["Avoid layers that only forward calls.", "Watch for framework coupling leaking inward."],
    compatiblePlatforms: ["web", "api", "desktop", "hybrid"],
    compatibleWorkloads: ["architecture-foundation", "migration", "diagnosis", "feature-delivery"],
    highAffinityPatterns: ["facade", "factory-method", "strategy"],
    relatedArchitectures: ["clean-architecture", "repository-pattern", "screaming-architecture"],
    detectionKeywords: ["layered architecture", "service layer", "application layer", "domain layer", "infrastructure layer"]
  },
  {
    id: "event-sourcing",
    displayName: "Event Sourcing",
    category: "supporting",
    summary: "Stores state changes as immutable events and rebuilds current state through replay or projections.",
    bestFor: ["Audit-heavy systems", "Temporal modeling", "High-traceability domains"],
    useCases: ["Financial ledgers", "Workflow history", "Compliance-focused systems"],
    strengths: ["Strong audit trail", "Temporal debugging", "Pairs naturally with projections and CQRS"],
    tradeoffs: ["Operational complexity", "Projection consistency work", "Schema evolution is a real concern"],
    warnings: ["Do not adopt event sourcing without a clear audit or history need.", "Replay and projection tooling must be planned early."],
    compatiblePlatforms: ["api", "worker", "hybrid"],
    compatibleWorkloads: ["architecture-foundation", "migration", "diagnosis"],
    highAffinityPatterns: ["command", "memento", "observer", "iterator"],
    relatedArchitectures: ["cqrs", "event-driven", "domain-driven-design"],
    detectionKeywords: ["event sourcing", "append-only", "projection", "event stream", "replay"]
  },
  {
    id: "microkernel",
    displayName: "Microkernel",
    category: "supporting",
    summary: "Keeps a small stable core and extends capabilities through plugins or extension modules.",
    bestFor: ["Plugin platforms", "Extensible products", "Products with variable customer capabilities"],
    useCases: ["Developer tooling", "Marketplace platforms", "White-label systems"],
    strengths: ["Strong extensibility", "Clear core/plugin split", "Supports product-line variation"],
    tradeoffs: ["Extension contracts are hard", "Plugin lifecycle management adds complexity"],
    warnings: ["Do not call every optional feature a plugin.", "Keep plugin APIs stable or the kernel becomes brittle."],
    compatiblePlatforms: ["desktop", "web", "api", "hybrid"],
    compatibleWorkloads: ["architecture-foundation", "feature-delivery", "migration", "diagnosis"],
    highAffinityPatterns: ["strategy", "composite", "facade", "decorator"],
    relatedArchitectures: ["modular-monolith", "event-driven", "microservices"],
    detectionKeywords: ["microkernel", "plugin", "extension", "kernel", "plugin architecture"]
  },
  {
    id: "onion-architecture",
    displayName: "Onion Architecture",
    category: "foundation",
    summary: "Layers the application around the domain model with dependencies flowing inward and infrastructure implementing inner interfaces.",
    bestFor: ["Domain-centric apps", "Persistence-ignorant cores", "Teams separating domain from ORM details"],
    useCases: ["Enterprise line-of-business apps", "DDD-style services", "Framework-swappable backends"],
    strengths: ["Clear inward dependency flow", "Domain stays persistence-ignorant", "Natural repository and UoW seams"],
    tradeoffs: ["Layer ceremony for simple CRUD", "Mapping between layers adds overhead"],
    warnings: ["Do not confuse folder layers with real boundaries.", "Keep infrastructure adapters thin."],
    compatiblePlatforms: ["web", "api", "desktop", "hybrid", "library"],
    compatibleWorkloads: ["architecture-foundation", "migration", "repo-recovery", "diagnosis"],
    highAffinityPatterns: ["factory-method", "adapter", "facade", "strategy"],
    relatedArchitectures: ["clean-architecture", "hexagonal", "domain-driven-design", "repository-pattern", "unit-of-work"],
    detectionKeywords: ["onion architecture", "onion", "domain model inward", "persistence ignorant", "onion layer"]
  },
  {
    id: "monolithic",
    displayName: "Monolithic Architecture",
    category: "foundation",
    summary: "Builds the entire application as a single deployable unit with shared memory, process, and codebase.",
    bestFor: ["Early-stage products", "Small teams", "Simple operational footprint"],
    useCases: ["MVPs", "Internal tools", "Single-team SaaS before scale pressure"],
    strengths: ["Simplest deployment", "Low operational overhead", "Fast local development loop"],
    tradeoffs: ["Scaling limits", "Release contention grows with team size", "Harder to isolate failures at scale"],
    warnings: ["Use modular boundaries inside the monolith early.", "Plan strangler paths before scale forces a rewrite."],
    compatiblePlatforms: ["web", "api", "desktop", "hybrid"],
    compatibleWorkloads: ["architecture-foundation", "feature-delivery", "bug-fix", "diagnosis"],
    highAffinityPatterns: ["facade", "strategy", "mediator", "decorator"],
    relatedArchitectures: ["modular-monolith", "layered", "vertical-slice", "strangler-fig"],
    detectionKeywords: ["monolith", "monolithic", "single deployable", "single process", "one codebase"]
  },
  {
    id: "soa",
    displayName: "Service-Oriented Architecture (SOA)",
    category: "foundation",
    summary: "Organizes capabilities as loosely coupled, discoverable services with standardized contracts, often coordinated through an enterprise bus.",
    bestFor: ["Enterprise integration", "Shared service governance", "Interop across heterogeneous systems"],
    useCases: ["Enterprise ERP integration", "Shared platform services", "Multi-vendor ecosystems"],
    strengths: ["Standardized contracts", "Service reuse", "Governed interoperability"],
    tradeoffs: ["ESB bottlenecks", "Heavier governance than microservices", "Can accumulate shared mutable state"],
    warnings: ["Do not treat SOA as microservices with an ESB.", "Keep service ownership explicit."],
    compatiblePlatforms: ["api", "web", "hybrid", "worker"],
    compatibleWorkloads: ["architecture-foundation", "migration", "diagnosis"],
    highAffinityPatterns: ["adapter", "facade", "proxy", "bridge"],
    relatedArchitectures: ["microservices", "api-gateway", "event-driven", "layered"],
    detectionKeywords: ["soa", "service-oriented", "enterprise service bus", "esb", "discoverable service", "service contract"]
  },
  {
    id: "unit-of-work",
    displayName: "Unit of Work",
    category: "data-access",
    summary: "Tracks object changes during a business transaction and coordinates a single atomic write to persistence.",
    bestFor: ["Aggregate consistency", "Transaction boundaries", "Application service write paths"],
    useCases: ["DDD aggregate persistence", "Multi-entity commits", "ORM session coordination"],
    strengths: ["Clear transaction scope", "Pairs naturally with repositories", "Keeps ORM details out of domain"],
    tradeoffs: ["Adds abstraction over simple saves", "Lifecycle management complexity"],
    warnings: ["Use only when multiple writes must commit atomically.", "Do not leak UoW into read-only query paths."],
    compatiblePlatforms: ["api", "web", "desktop", "hybrid", "library"],
    compatibleWorkloads: ["feature-delivery", "migration", "repo-recovery", "diagnosis"],
    highAffinityPatterns: ["facade", "proxy", "command"],
    relatedArchitectures: ["repository-pattern", "onion-architecture", "clean-architecture", "domain-driven-design"],
    detectionKeywords: ["unit of work", "unit-of-work", "uow", "transaction boundary", "atomic write", "aggregate consistency"]
  },
  {
    id: "anti-corruption-layer",
    displayName: "Anti-Corruption Layer",
    category: "supporting",
    summary: "Translates between your domain model and an external or legacy system so foreign concepts do not leak into your bounded context.",
    bestFor: ["Legacy integration", "Bounded context isolation", "Third-party model translation"],
    useCases: ["Migrating off legacy APIs", "Integrating partner systems", "Protecting ubiquitous language"],
    strengths: ["Preserves domain language", "Isolates foreign models", "Strategic adapter at context boundaries"],
    tradeoffs: ["Translation mapping cost", "Maintenance as external systems evolve"],
    warnings: ["Do not skip the ACL when foreign models pollute domain code.", "Keep translation logic explicit and testable."],
    compatiblePlatforms: ["api", "worker", "hybrid", "web"],
    compatibleWorkloads: ["migration", "feature-delivery", "architecture-foundation", "diagnosis"],
    highAffinityPatterns: ["adapter", "facade", "bridge", "proxy"],
    relatedArchitectures: ["domain-driven-design", "hexagonal", "strangler-fig", "soa"],
    detectionKeywords: ["anti-corruption", "anti corruption layer", "acl", "bounded context integration", "legacy integration", "domain isolation", "foreign model"]
  },
  {
    id: "circuit-breaker",
    displayName: "Circuit Breaker",
    category: "supporting",
    summary: "Wraps remote calls with a breaker that opens after repeated failures, preventing cascading outages and allowing downstream recovery.",
    bestFor: ["Distributed resilience", "External dependency protection", "Fault-tolerant service calls"],
    useCases: ["Microservice HTTP clients", "Payment provider calls", "Third-party API integration"],
    strengths: ["Prevents cascade failures", "Fast-fail under stress", "Supports graceful degradation"],
    tradeoffs: ["Tuning thresholds takes effort", "False opens if thresholds are wrong"],
    warnings: ["Pair with retries and timeouts thoughtfully.", "Monitor breaker state in production."],
    compatiblePlatforms: ["api", "worker", "hybrid", "web"],
    compatibleWorkloads: ["feature-delivery", "migration", "diagnosis"],
    highAffinityPatterns: ["proxy", "decorator", "chain-of-responsibility", "state"],
    relatedArchitectures: ["microservices", "soa", "api-gateway", "event-driven"],
    detectionKeywords: ["circuit breaker", "circuit-breaker", "resilience", "cascading failure", "fault tolerance", "fallback", "bulkhead"]
  },
  {
    id: "saga",
    displayName: "Saga",
    category: "supporting",
    summary: "Coordinates a long-running distributed transaction as local steps with compensating actions when a step fails.",
    bestFor: ["Distributed workflows", "Eventually consistent transactions", "Multi-service business processes"],
    useCases: ["Order fulfillment", "Booking workflows", "Cross-service financial flows"],
    strengths: ["Avoids two-phase commit", "Fits microservice boundaries", "Explicit failure compensation"],
    tradeoffs: ["Complex orchestration or choreography", "Idempotency and observability are mandatory"],
    warnings: ["Design compensating actions before production.", "Do not use sagas for simple single-service transactions."],
    compatiblePlatforms: ["api", "worker", "hybrid"],
    compatibleWorkloads: ["feature-delivery", "migration", "architecture-foundation", "diagnosis"],
    highAffinityPatterns: ["command", "observer", "mediator", "state"],
    relatedArchitectures: ["event-driven", "microservices", "cqrs", "soa"],
    detectionKeywords: ["saga", "distributed transaction", "compensating", "long-running transaction", "choreography", "orchestration workflow"]
  },
  {
    id: "api-gateway",
    displayName: "API Gateway",
    category: "supporting",
    summary: "Provides a single entry point that routes, aggregates, authenticates, and rate-limits requests to backend services.",
    bestFor: ["Microservice edges", "Centralized cross-cutting concerns", "Client-facing API stability"],
    useCases: ["Public API surfaces", "Multi-service routing", "Auth and rate-limit enforcement"],
    strengths: ["Hides service topology", "Centralizes edge concerns", "Stable client contract"],
    tradeoffs: ["Can become a bottleneck", "Gateway logic can grow unchecked"],
    warnings: ["Keep gateway logic thin — routing and policy only.", "Avoid business rules in the gateway."],
    compatiblePlatforms: ["api", "web", "hybrid"],
    compatibleWorkloads: ["feature-delivery", "migration", "architecture-foundation", "diagnosis"],
    highAffinityPatterns: ["facade", "proxy", "chain-of-responsibility", "decorator"],
    relatedArchitectures: ["microservices", "bff", "soa", "minimal-api"],
    detectionKeywords: ["api gateway", "api-gateway", "gateway", "edge routing", "rate limit gateway", "single entry point", "reverse proxy"]
  },
  {
    id: "bff",
    displayName: "Backend for Frontend (BFF)",
    category: "supporting",
    summary: "Provides a dedicated backend API tailored to a specific client channel rather than one generic API for all surfaces.",
    bestFor: ["Multi-channel products", "Mobile vs web API shaping", "Client-specific aggregation"],
    useCases: ["Mobile apps with tailored payloads", "Web dashboards with composite views", "IoT device APIs"],
    strengths: ["Optimized per-channel responses", "Decouples core services from UI churn", "Clear ownership per client team"],
    tradeoffs: ["Multiple BFFs to maintain", "Duplication risk without discipline"],
    warnings: ["Do not put domain logic in the BFF.", "Keep BFFs as adapters, not second domain layers."],
    compatiblePlatforms: ["web", "api", "hybrid", "desktop"],
    compatibleWorkloads: ["feature-delivery", "architecture-foundation", "diagnosis"],
    highAffinityPatterns: ["facade", "adapter", "proxy", "decorator"],
    relatedArchitectures: ["api-gateway", "microservices", "minimal-api", "vertical-slice"],
    detectionKeywords: ["bff", "backend for frontend", "mobile api", "channel-specific", "client-specific api", "frontend backend"]
  },
  {
    id: "strangler-fig",
    displayName: "Strangler Fig",
    category: "supporting",
    summary: "Incrementally replaces a legacy system by routing new functionality to new services while the old core is gradually retired.",
    bestFor: ["Legacy modernization", "Phased migration", "Risk-reduced rewrites"],
    useCases: ["Monolith-to-microservices migration", "Cloud lift-and-shift transitions", "Replacing vendor systems"],
    strengths: ["Avoids big-bang rewrites", "Continuous delivery during migration", "Reversible routing decisions"],
    tradeoffs: ["Temporary dual-system complexity", "Routing and data sync overhead during transition"],
    warnings: ["Set exit criteria for the legacy core.", "Do not let strangler routes become permanent accidental architecture."],
    compatiblePlatforms: ["web", "api", "hybrid", "worker"],
    compatibleWorkloads: ["migration", "repo-recovery", "diagnosis", "architecture-foundation"],
    highAffinityPatterns: ["adapter", "facade", "proxy", "strategy"],
    relatedArchitectures: ["monolithic", "microservices", "modular-monolith", "anti-corruption-layer", "api-gateway"],
    detectionKeywords: ["strangler", "strangler fig", "strangler-fig", "incremental migration", "legacy replacement", "phased modernization", "migrate legacy"]
  }
];

export const designPatternCatalog: DesignPatternCatalogEntry[] = [
  {
    id: "singleton",
    displayName: "Singleton",
    family: "creational",
    summary: "Coordinates a single shared infrastructure instance when multiplicity would be harmful or wasteful.",
    bestFor: ["DB clients", "Config managers", "Loggers", "Shared infrastructure handles"],
    strengths: ["Simple global coordination", "Avoids duplicate heavy resources"],
    tradeoffs: ["Hidden coupling", "Harder test isolation when overused"],
    warnings: ["Prefer explicit composition for business services.", "Treat singleton as infrastructure, not domain logic."],
    tag: "creational:singleton",
    compatibleArchitectures: [
      "vertical-slice",
      "clean-architecture",
      "hexagonal",
      "modular-monolith",
      "minimal-api",
      "domain-driven-design",
      "event-driven",
      "microservices",
      "cqrs",
      "screaming-architecture",
      "repository-pattern",
      "layered",
      "event-sourcing",
      "microkernel"
    ],
    compatiblePlatforms: allPlatforms,
    compatibleWorkloads: allWorkloads,
    deferForProfiles: []
  },
  {
    id: "factory-method",
    displayName: "Factory Method",
    family: "creational",
    summary: "Creates the right implementation at runtime when providers or behaviors vary.",
    bestFor: ["Payments", "Notifications", "Auth providers", "Pluggable services"],
    strengths: ["Keeps callers decoupled from concrete types", "Works well with provider switching"],
    tradeoffs: ["Adds indirection", "Can become ceremony for trivial creation paths"],
    warnings: ["Use it when creation genuinely varies.", "Avoid factories that only wrap a single constructor forever."],
    tag: "creational:factory",
    compatibleArchitectures: ["clean-architecture", "vertical-slice", "domain-driven-design", "layered"],
    compatiblePlatforms: ["desktop", "web", "api", "worker", "hybrid"],
    compatibleWorkloads: ["feature-delivery", "architecture-foundation", "migration"],
    deferForProfiles: []
  },
  {
    id: "abstract-factory",
    displayName: "Abstract Factory",
    family: "creational",
    summary: "Produces related families of objects without binding callers to concrete implementations.",
    bestFor: ["Multi-tenant theming", "Cross-platform families", "Enterprise object families"],
    strengths: ["Keeps families consistent", "Works well across platform or tenant boundaries"],
    tradeoffs: ["Heavy abstraction", "Can be excessive for a single deployment path"],
    warnings: ["Prefer simpler factories until families are truly divergent."],
    tag: "creational:abstract-factory",
    compatibleArchitectures: ["domain-driven-design", "clean-architecture", "microkernel"],
    compatiblePlatforms: ["desktop", "web", "api", "hybrid"],
    compatibleWorkloads: ["architecture-foundation", "migration"],
    deferForProfiles: ["minimal", "balanced"]
  },
  {
    id: "builder",
    displayName: "Builder",
    family: "creational",
    summary: "Constructs complex objects step by step without bloating constructors or call sites.",
    bestFor: ["Complex request objects", "Report generation", "Configuration-heavy models"],
    strengths: ["Readable construction flow", "Flexible optional fields"],
    tradeoffs: ["Extra types to maintain", "Can be overkill for simple DTOs"],
    warnings: ["Prefer plain object literals until creation complexity is real."],
    tag: "creational:builder",
    compatibleArchitectures: [
      "vertical-slice",
      "clean-architecture",
      "hexagonal",
      "modular-monolith",
      "minimal-api",
      "domain-driven-design",
      "microservices",
      "layered"
    ],
    compatiblePlatforms: ["desktop", "web", "api", "worker", "hybrid"],
    compatibleWorkloads: ["feature-delivery", "architecture-foundation"],
    deferForProfiles: ["minimal"]
  },
  {
    id: "prototype",
    displayName: "Prototype",
    family: "creational",
    summary: "Clones an existing object graph when creating a fresh one is expensive or repetitive.",
    bestFor: ["Game entities", "Template duplication", "Deep object graph cloning"],
    strengths: ["Avoids expensive reconstruction", "Preserves complex defaults"],
    tradeoffs: ["Clone semantics can surprise", "Harder to reason about identity and mutation"],
    warnings: ["Use only when clone-before-mutate is a real need."],
    tag: "creational:prototype",
    compatibleArchitectures: ["domain-driven-design", "microkernel", "event-sourcing"],
    compatiblePlatforms: ["desktop", "web", "api", "hybrid"],
    compatibleWorkloads: ["feature-delivery", "architecture-foundation"],
    deferForProfiles: ["minimal", "balanced"]
  },
  {
    id: "adapter",
    displayName: "Adapter",
    family: "structural",
    summary: "Wraps incompatible or third-party interfaces behind Arkitect-owned contracts.",
    bestFor: ["Stripe", "Twilio", "Supabase", "MCP or SDK bridges"],
    strengths: ["Strong integration boundary", "Protects internal code from vendor churn"],
    tradeoffs: ["Adds mapping code", "Too many tiny adapters can fragment understanding"],
    warnings: ["Keep adapters thin and behaviorally honest."],
    tag: "structural:adapter",
    compatibleArchitectures: ["hexagonal", "clean-architecture", "microservices", "repository-pattern"],
    compatiblePlatforms: ["api", "worker", "web", "desktop", "hybrid"],
    compatibleWorkloads: ["feature-delivery", "architecture-foundation", "migration"],
    deferForProfiles: []
  },
  {
    id: "facade",
    displayName: "Facade",
    family: "structural",
    summary: "Presents a focused surface over a complex subsystem or orchestration flow.",
    bestFor: ["Auth flows", "Multi-service orchestration", "SDK wrappers", "Cross-package workflows"],
    strengths: ["Reduces call-site complexity", "Creates a stable high-level entry point"],
    tradeoffs: ["Can become a god-object", "May hide useful detail if over-compressed"],
    warnings: ["Keep facades purposeful and narrow."],
    tag: "structural:facade",
    compatibleArchitectures: ["clean-architecture", "layered", "microkernel", "hexagonal"],
    compatiblePlatforms: ["desktop", "web", "api", "worker", "hybrid"],
    compatibleWorkloads: ["feature-delivery", "repo-recovery", "diagnosis"],
    deferForProfiles: []
  },
  {
    id: "decorator",
    displayName: "Decorator",
    family: "structural",
    summary: "Adds cross-cutting behavior without changing the wrapped service or handler directly.",
    bestFor: ["Logging", "Caching", "Auth", "Metrics", "Rate limiting"],
    strengths: ["Composable cross-cutting concerns", "Keeps core logic focused"],
    tradeoffs: ["Nested wrappers can be hard to trace", "Ordering matters"],
    warnings: ["Do not hide critical business rules inside invisible wrappers."],
    tag: "structural:decorator",
    compatibleArchitectures: ["vertical-slice", "microkernel", "clean-architecture", "modular-monolith"],
    compatiblePlatforms: ["desktop", "web", "api", "worker", "hybrid"],
    compatibleWorkloads: ["feature-delivery", "architecture-foundation", "repo-recovery"],
    deferForProfiles: []
  },
  {
    id: "proxy",
    displayName: "Proxy",
    family: "structural",
    summary: "Controls access to a resource for lazy loading, rate limiting, caching, or security gating.",
    bestFor: ["Access control", "Remote services", "Expensive resources", "Lazy initialization"],
    strengths: ["Centralized access rules", "Resource usage control"],
    tradeoffs: ["More indirection", "Behavior can become surprising if implicit"],
    warnings: ["Make proxy behavior explicit to callers when it affects latency or auth."],
    tag: "structural:proxy",
    compatibleArchitectures: ["hexagonal", "domain-driven-design", "microservices", "repository-pattern"],
    compatiblePlatforms: ["desktop", "web", "api", "worker", "hybrid"],
    compatibleWorkloads: ["feature-delivery", "migration", "diagnosis"],
    deferForProfiles: []
  },
  {
    id: "composite",
    displayName: "Composite",
    family: "structural",
    summary: "Treats individual objects and object groups uniformly across tree-shaped structures.",
    bestFor: ["Permission trees", "File structures", "UI trees", "Plugin registries"],
    strengths: ["Uniform traversal", "Natural fit for recursive models"],
    tradeoffs: ["Can blur leaf vs container responsibilities", "Mutability rules need care"],
    warnings: ["Use only when the tree abstraction is genuinely central."],
    tag: "structural:composite",
    compatibleArchitectures: ["microkernel", "domain-driven-design", "modular-monolith"],
    compatiblePlatforms: ["desktop", "web", "api", "hybrid"],
    compatibleWorkloads: ["feature-delivery", "architecture-foundation"],
    deferForProfiles: ["minimal"]
  },
  {
    id: "bridge",
    displayName: "Bridge",
    family: "structural",
    summary: "Separates an abstraction from its implementation so both can vary independently.",
    bestFor: ["Cross-platform services", "Pluggable renderers", "Provider-agnostic abstractions"],
    strengths: ["Supports parallel variation", "Prevents inheritance explosion"],
    tradeoffs: ["Needs a real abstraction line", "Adds more types and contracts"],
    warnings: ["Prefer a simpler adapter or strategy when only one axis varies."],
    tag: "structural:bridge",
    compatibleArchitectures: ["hexagonal", "clean-architecture", "microkernel"],
    compatiblePlatforms: ["desktop", "web", "api", "hybrid"],
    compatibleWorkloads: ["architecture-foundation", "migration"],
    deferForProfiles: ["minimal", "balanced"]
  },
  {
    id: "flyweight",
    displayName: "Flyweight",
    family: "structural",
    summary: "Shares intrinsic state to reduce memory pressure in very high-volume object scenarios.",
    bestFor: ["Renderers", "Map pins", "Particles", "Text processing"],
    strengths: ["Significant memory savings", "Enables large-scale in-memory sets"],
    tradeoffs: ["State partitioning complexity", "Not useful without proven pressure"],
    warnings: ["Reach for profiling before using flyweight."],
    tag: "structural:flyweight",
    compatibleArchitectures: ["microservices", "microkernel", "event-driven"],
    compatiblePlatforms: ["desktop", "web", "api"],
    compatibleWorkloads: ["feature-delivery", "diagnosis"],
    deferForProfiles: ["minimal", "balanced", "structured"]
  },
  {
    id: "observer",
    displayName: "Observer",
    family: "behavioral",
    summary: "Notifies interested parties when state changes without tight point-to-point wiring.",
    bestFor: ["Realtime updates", "Pub/sub", "Reactive UIs", "Event notification"],
    strengths: ["Loose notification coupling", "Fits event-driven designs naturally"],
    tradeoffs: ["Ordering and fan-out can be hard to trace", "Risk of hidden side effects"],
    warnings: ["Document event ownership and delivery expectations."],
    tag: "behavioral:observer",
    compatibleArchitectures: ["event-driven", "domain-driven-design", "event-sourcing", "cqrs"],
    compatiblePlatforms: ["desktop", "web", "api", "worker", "hybrid"],
    compatibleWorkloads: ["feature-delivery", "migration", "diagnosis"],
    deferForProfiles: []
  },
  {
    id: "strategy",
    displayName: "Strategy",
    family: "behavioral",
    summary: "Swaps algorithms or providers at runtime through a stable interface.",
    bestFor: ["AI model routing", "Payment provider switching", "Pricing rules", "Scoring policies"],
    strengths: ["Provider agility", "Easy A/B or rules variation", "Keeps branching localized"],
    tradeoffs: ["Too many strategies can obscure the default path", "Shared context must stay coherent"],
    warnings: ["Prefer functions or simple tables until variation becomes a first-class concern."],
    tag: "behavioral:strategy",
    compatibleArchitectures: ["vertical-slice", "clean-architecture", "hexagonal", "microkernel"],
    compatiblePlatforms: ["desktop", "web", "api", "worker", "hybrid"],
    compatibleWorkloads: ["feature-delivery", "architecture-foundation", "diagnosis"],
    deferForProfiles: []
  },
  {
    id: "command",
    displayName: "Command",
    family: "behavioral",
    summary: "Encapsulates requests as objects so they can be validated, queued, logged, retried, or undone.",
    bestFor: ["CQRS writes", "Job queues", "Undo/redo", "Transactional workflows"],
    strengths: ["Explicit intent", "Great for queues and audit trails", "Supports retry and serialization"],
    tradeoffs: ["More types and handlers", "Can be verbose for simple mutations"],
    warnings: ["Reserve command objects for workflows with real orchestration value."],
    tag: "behavioral:command",
    compatibleArchitectures: ["cqrs", "event-sourcing", "vertical-slice", "event-driven"],
    compatiblePlatforms: ["desktop", "web", "api", "worker", "hybrid"],
    compatibleWorkloads: ["feature-delivery", "migration", "diagnosis"],
    deferForProfiles: []
  },
  {
    id: "mediator",
    displayName: "Mediator",
    family: "behavioral",
    summary: "Centralizes many-to-many coordination to keep participants from forming tangled direct dependencies.",
    bestFor: ["Slice request pipelines", "Form orchestration", "Workflow coordination", "MediatR-style dispatch"],
    strengths: ["Reduces direct coupling", "Creates clear orchestration points"],
    tradeoffs: ["Mediator can become a traffic hub", "Tracing logic may require conventions"],
    warnings: ["Do not use mediator to hide anemic services."],
    tag: "behavioral:mediator",
    compatibleArchitectures: ["vertical-slice", "cqrs", "event-driven", "modular-monolith"],
    compatiblePlatforms: ["desktop", "web", "api", "hybrid"],
    compatibleWorkloads: ["feature-delivery", "architecture-foundation", "repo-recovery"],
    deferForProfiles: []
  },
  {
    id: "chain-of-responsibility",
    displayName: "Chain of Responsibility",
    family: "behavioral",
    summary: "Passes a request through an ordered pipeline of handlers until the work is complete.",
    bestFor: ["Middleware", "Permission checks", "Event pipelines", "Queue processors"],
    strengths: ["Composable pipelines", "Clear handler ordering", "Easy incremental extension"],
    tradeoffs: ["Debugging order issues can be tricky", "Pipeline depth can become opaque"],
    warnings: ["Keep handler contracts tight and order explicit."],
    tag: "behavioral:chain",
    compatibleArchitectures: ["clean-architecture", "hexagonal", "event-driven", "minimal-api"],
    compatiblePlatforms: ["web", "api", "worker", "hybrid"],
    compatibleWorkloads: ["feature-delivery", "repo-recovery", "diagnosis"],
    deferForProfiles: []
  },
  {
    id: "template-method",
    displayName: "Template Method",
    family: "behavioral",
    summary: "Defines a fixed processing skeleton while allowing selected steps to vary.",
    bestFor: ["Pipelines", "Report generation", "ETL-style flows", "Step-based processors"],
    strengths: ["Consistent flow", "Reusable algorithm skeletons"],
    tradeoffs: ["Inheritance-driven variation can be rigid", "May be better as composition in some languages"],
    warnings: ["Prefer composition when inheritance is already noisy."],
    tag: "behavioral:template-method",
    compatibleArchitectures: ["event-driven", "clean-architecture", "layered"],
    compatiblePlatforms: ["api", "worker", "desktop", "web", "hybrid"],
    compatibleWorkloads: ["feature-delivery", "architecture-foundation"],
    deferForProfiles: ["minimal"]
  },
  {
    id: "state",
    displayName: "State",
    family: "behavioral",
    summary: "Encapsulates behavior changes around lifecycle states instead of sprawling conditionals.",
    bestFor: ["Checkout flows", "Lifecycle-heavy domains", "Approval workflows", "Agent run state"],
    strengths: ["Clear lifecycle rules", "Improves readability over giant switch statements"],
    tradeoffs: ["More classes or cases to manage", "Overkill for simple two-state flags"],
    warnings: ["Use state once lifecycle branching becomes a maintenance burden."],
    tag: "behavioral:state",
    compatibleArchitectures: ["domain-driven-design", "event-driven", "vertical-slice"],
    compatiblePlatforms: ["desktop", "web", "api", "hybrid"],
    compatibleWorkloads: ["feature-delivery", "migration"],
    deferForProfiles: ["minimal"]
  },
  {
    id: "iterator",
    displayName: "Iterator",
    family: "behavioral",
    summary: "Traverses collections or paged data without exposing the underlying structure.",
    bestFor: ["Paged data", "Custom collections", "Projection traversal", "Streaming result sets"],
    strengths: ["Consistent traversal contract", "Works well across data backends"],
    tradeoffs: ["Extra abstraction if native iteration already solves it"],
    warnings: ["Do not wrap simple arrays without a real traversal need."],
    tag: "behavioral:iterator",
    compatibleArchitectures: ["event-sourcing", "cqrs", "layered", "microservices"],
    compatiblePlatforms: ["desktop", "web", "api", "worker", "hybrid"],
    compatibleWorkloads: ["feature-delivery", "diagnosis"],
    deferForProfiles: ["minimal"]
  },
  {
    id: "visitor",
    displayName: "Visitor",
    family: "behavioral",
    summary: "Adds operations over complex object graphs without modifying the graph types directly.",
    bestFor: ["ASTs", "Rule engines", "Reporting over rich models", "Static analysis"],
    strengths: ["Adds non-destructive operations cleanly", "Keeps graph types stable"],
    tradeoffs: ["Harder to evolve node contracts", "Verbosity is high"],
    warnings: ["Use only when the graph is stable and operations multiply."],
    tag: "behavioral:visitor",
    compatibleArchitectures: ["domain-driven-design", "event-sourcing", "clean-architecture"],
    compatiblePlatforms: ["desktop", "web", "api", "library"],
    compatibleWorkloads: ["diagnosis", "architecture-foundation", "feature-delivery"],
    deferForProfiles: ["minimal", "balanced"]
  },
  {
    id: "memento",
    displayName: "Memento",
    family: "behavioral",
    summary: "Captures and restores state snapshots for rollback, undo, or history recovery.",
    bestFor: ["Undo/redo", "Snapshot save", "Rollback workflows", "Event-store checkpoints"],
    strengths: ["Clear recovery model", "Strong fit for history-aware systems"],
    tradeoffs: ["Storage overhead", "Snapshot scope must be carefully defined"],
    warnings: ["Do not snapshot blindly when append-only events or diffs are enough."],
    tag: "behavioral:memento",
    compatibleArchitectures: ["event-sourcing", "cqrs", "vertical-slice"],
    compatiblePlatforms: ["desktop", "web", "api", "hybrid"],
    compatibleWorkloads: ["feature-delivery", "migration"],
    deferForProfiles: ["minimal"]
  },
  {
    id: "interpreter",
    displayName: "Interpreter",
    family: "behavioral",
    summary: "Defines and executes a custom language, grammar, or rules expression model.",
    bestFor: ["Rule engines", "DSLs", "Expression evaluators", "Query languages"],
    strengths: ["Makes domain rules explicit", "Supports builder-defined expressions"],
    tradeoffs: ["Language design cost", "Performance and safety need attention"],
    warnings: ["Do not create a DSL before proving plain configuration is insufficient."],
    tag: "behavioral:interpreter",
    compatibleArchitectures: ["domain-driven-design", "event-sourcing", "clean-architecture"],
    compatiblePlatforms: ["desktop", "web", "api", "library"],
    compatibleWorkloads: ["architecture-foundation", "feature-delivery", "diagnosis"],
    deferForProfiles: ["minimal", "balanced"]
  }
];

export const remixProfileCatalog: RemixProfileCatalogEntry[] = [
  {
    id: "martin-fowler-stack",
    displayName: "The Martin Fowler Stack",
    summary: "Layered enterprise structure with repositories, domain models, and service-layer coordination.",
    inspiredBy: "Martin Fowler",
    bestFor: ["Enterprise SaaS", "Data-heavy apps", "Teams comfortable with service layers"],
    strengths: ["Familiar enterprise shape", "Works well with repositories and transactional workflows"],
    tradeoffs: ["Can drift into pass-through layers", "Feature ownership is less direct than slice-based designs"],
    warnings: ["Watch for anaemic service layers and DTO tunneling."],
    compatiblePlatforms: ["web", "api", "desktop", "hybrid"],
    compatibleWorkloads: ["architecture-foundation", "migration", "diagnosis"],
    architectureIds: ["layered", "repository-pattern", "unit-of-work"],
    patternIds: ["factory-method", "facade", "proxy", "iterator"],
    composedOf: [
      { kind: "architecture", id: "layered", label: "Layered", rationale: "Provides the structural backbone." },
      {
        kind: "architecture",
        id: "repository-pattern",
        label: "Repository Pattern",
        rationale: "Keeps data access behind service-facing contracts."
      },
      {
        kind: "architecture",
        id: "unit-of-work",
        label: "Unit of Work",
        rationale: "Coordinates atomic writes across aggregate changes."
      },
      { kind: "concept", label: "Domain Model", rationale: "Centers behavior in domain objects." },
      { kind: "concept", label: "Service Layer", rationale: "Coordinates use cases above persistence details." }
    ],
    rationale: [
      "Best when the team wants explicit services and repositories without jumping to distributed architecture.",
      "Strong fit for data-heavy back-office flows."
    ]
  },
  {
    id: "uncle-bob-special",
    displayName: "The Uncle Bob Special",
    summary: "Clean architecture blended with screaming boundaries and use-case driven application flow.",
    inspiredBy: "Robert C. Martin",
    bestFor: ["Framework-agnostic domain systems", "Refactors away from framework coupling"],
    strengths: ["Strong dependency direction", "Clear use-case focus", "Domain stays isolated"],
    tradeoffs: ["More abstraction", "Requires discipline to keep adapters thin"],
    warnings: ["Avoid ceremonial interfaces where the boundary is not real."],
    compatiblePlatforms: ["web", "api", "desktop", "library", "hybrid"],
    compatibleWorkloads: ["architecture-foundation", "migration", "repo-recovery", "diagnosis"],
    architectureIds: ["clean-architecture", "screaming-architecture", "onion-architecture"],
    patternIds: ["factory-method", "adapter", "facade", "strategy", "chain-of-responsibility"],
    composedOf: [
      {
        kind: "architecture",
        id: "clean-architecture",
        label: "Clean Architecture",
        rationale: "Supplies the dependency rule and inner-core isolation."
      },
      {
        kind: "architecture",
        id: "screaming-architecture",
        label: "Screaming Architecture",
        rationale: "Keeps the folder tree domain-first instead of framework-first."
      },
      { kind: "concept", label: "SOLID", rationale: "Guides class and dependency design discipline." },
      { kind: "concept", label: "Use-Case Driven", rationale: "Anchors the app around explicit user actions." }
    ],
    rationale: [
      "A strong corrective when frameworks have taken over the repo shape.",
      "Pairs well with ports-and-adapters style infrastructure edges."
    ]
  },
  {
    id: "jimmy-bogard-slice",
    displayName: "The Jimmy Bogard Slice",
    summary: "Vertical slices combined with request mediation and CQRS-style command/query separation.",
    inspiredBy: "Jimmy Bogard",
    bestFor: ["Feature-rich apps", "Teams wanting clear feature isolation with request pipelines"],
    strengths: ["Feature ownership is strong", "Mediated requests stay focused", "CQRS can evolve naturally"],
    tradeoffs: ["Slice conventions must be consistent", "Can accumulate pipeline complexity"],
    warnings: ["Do not split queries and commands mechanically when the behavior is trivial."],
    compatiblePlatforms: ["web", "api", "desktop", "hybrid"],
    compatibleWorkloads: ["feature-delivery", "architecture-foundation", "migration"],
    architectureIds: ["vertical-slice", "cqrs", "minimal-api"],
    patternIds: ["mediator", "command", "strategy", "decorator"],
    composedOf: [
      {
        kind: "architecture",
        id: "vertical-slice",
        label: "Vertical Slice",
        rationale: "Makes features the unit of ownership."
      },
      { kind: "architecture", id: "cqrs", label: "CQRS", rationale: "Separates reads and writes when needed." },
      { kind: "concept", label: "MediatR", rationale: "Common request dispatch shape for slice orchestration." },
      { kind: "concept", label: "Minimal Coupling", rationale: "Keeps slice dependencies narrow and intentional." }
    ],
    rationale: [
      "Great fit for teams shipping many features with diverse concerns.",
      "Works especially well when handlers and cross-cutting behaviors stay pipeline-friendly."
    ]
  },
  {
    id: "vaughn-vernon-ddd-remix",
    displayName: "The Vaughn Vernon DDD Remix",
    summary: "DDD, bounded contexts, event sourcing, and hexagonal edges for rich domain systems.",
    inspiredBy: "Vaughn Vernon",
    bestFor: ["Complex multi-domain systems", "Context-heavy business platforms", "Rich domain workflows"],
    strengths: ["Strong context boundaries", "Excellent audit and integration story", "High modeling fidelity"],
    tradeoffs: ["Steep learning curve", "Tooling and governance overhead are real"],
    warnings: ["Avoid it for simple CRUD with limited business language."],
    compatiblePlatforms: ["api", "web", "hybrid", "library"],
    compatibleWorkloads: ["architecture-foundation", "migration", "diagnosis"],
    architectureIds: ["domain-driven-design", "hexagonal", "event-sourcing", "anti-corruption-layer", "unit-of-work"],
    patternIds: ["factory-method", "observer", "command", "visitor", "interpreter"],
    composedOf: [
      {
        kind: "architecture",
        id: "domain-driven-design",
        label: "DDD",
        rationale: "Keeps the business domain central and explicit."
      },
      { kind: "concept", label: "Bounded Contexts", rationale: "Prevents domain concepts from bleeding together." },
      {
        kind: "architecture",
        id: "event-sourcing",
        label: "Event Sourcing",
        rationale: "Preserves temporal history for important domain behavior."
      },
      {
        kind: "architecture",
        id: "hexagonal",
        label: "Hexagonal",
        rationale: "Protects the domain from integration and infrastructure churn."
      }
    ],
    rationale: [
      "Strong choice when context boundaries and history matter as much as raw delivery speed.",
      "Pairs well with long-lived platforms that need durable business language."
    ]
  },
  {
    id: "udi-dahan-messaging-mix",
    displayName: "The Udi Dahan Messaging Mix",
    summary: "Distributed messaging blend with event-driven coordination, CQRS, sagas, and a service bus mindset.",
    inspiredBy: "Udi Dahan",
    bestFor: ["Distributed eventually consistent systems", "Workflow orchestration", "Message-first platforms"],
    strengths: ["Strong async decoupling", "Fits long-running workflows", "Supports failure-aware coordination"],
    tradeoffs: ["Operational complexity", "Needs disciplined message ownership and tracing"],
    warnings: ["Do not adopt messaging-first architecture without strong observability and retry discipline."],
    compatiblePlatforms: ["api", "worker", "hybrid"],
    compatibleWorkloads: ["architecture-foundation", "migration", "diagnosis"],
    architectureIds: ["event-driven", "cqrs", "microservices", "saga"],
    patternIds: ["observer", "command", "chain-of-responsibility", "mediator", "state"],
    composedOf: [
      {
        kind: "architecture",
        id: "event-driven",
        label: "Event-Driven",
        rationale: "Provides the async backbone."
      },
      { kind: "architecture", id: "cqrs", label: "CQRS", rationale: "Clarifies write intent and projection needs." },
      { kind: "architecture", id: "saga", label: "Saga", rationale: "Coordinates long-running multi-step workflows." },
      { kind: "concept", label: "Service Bus", rationale: "Centralizes message routing contracts." }
    ],
    rationale: [
      "Strong fit when eventual consistency is acceptable and orchestration is explicit.",
      "Works best when the team is ready for messaging operations and tooling."
    ]
  },
  {
    id: "greg-young-event-machine",
    displayName: "The Greg Young Event Machine",
    summary: "Event sourcing and CQRS centered on append-only event storage and projection-heavy read models.",
    inspiredBy: "Greg Young",
    bestFor: ["Audit-heavy systems", "Financial or compliance workloads", "History-first domains"],
    strengths: ["Excellent traceability", "Projection flexibility", "Strong temporal debugging story"],
    tradeoffs: ["Projection maintenance", "Schema evolution and replay cost", "Higher cognitive load"],
    warnings: ["Do not use it without a real need for immutable history."],
    compatiblePlatforms: ["api", "worker", "hybrid"],
    compatibleWorkloads: ["architecture-foundation", "migration", "diagnosis"],
    architectureIds: ["event-sourcing", "cqrs", "event-driven"],
    patternIds: ["command", "memento", "observer", "iterator"],
    composedOf: [
      {
        kind: "architecture",
        id: "event-sourcing",
        label: "Event Sourcing",
        rationale: "Makes events the source of truth."
      },
      { kind: "architecture", id: "cqrs", label: "CQRS", rationale: "Separates event writes from read projections." },
      { kind: "concept", label: "Append-Only Store", rationale: "Preserves immutable history." },
      { kind: "concept", label: "Projection Engine", rationale: "Materializes purpose-built read views." }
    ],
    rationale: [
      "A strong choice when history and auditability matter more than simplicity.",
      "Best when teams accept the projection and replay operational model."
    ]
  },
  {
    id: "neal-ford-hybrid-engine",
    displayName: "The Neal Ford Hybrid Engine",
    summary: "Extensible core with plugin boundaries, modular packaging, and event-driven communication.",
    inspiredBy: "Neal Ford & Mark Richards",
    bestFor: ["Plugin platforms", "Extensible systems", "Product lines with optional capability packs"],
    strengths: ["Extension-friendly", "Keeps a stable kernel", "Good modular growth story"],
    tradeoffs: ["Plugin lifecycle complexity", "Contract drift between core and extensions"],
    warnings: ["Keep the kernel small or everything becomes a plugin-shaped monolith."],
    compatiblePlatforms: ["desktop", "web", "api", "hybrid"],
    compatibleWorkloads: ["architecture-foundation", "feature-delivery", "migration", "diagnosis"],
    architectureIds: ["microkernel", "event-driven", "modular-monolith"],
    patternIds: ["strategy", "composite", "facade", "decorator", "observer"],
    composedOf: [
      { kind: "architecture", id: "microkernel", label: "Microkernel", rationale: "Defines the stable core." },
      {
        kind: "architecture",
        id: "event-driven",
        label: "Event-Driven",
        rationale: "Allows extensions to communicate with low direct coupling."
      },
      {
        kind: "architecture",
        id: "modular-monolith",
        label: "Modular Monolith",
        rationale: "Keeps deployment simple while modules and plugins grow."
      }
    ],
    rationale: [
      "Useful when the product needs extension points before it needs distributed services.",
      "Balances extensibility with a single operational unit."
    ]
  },
  {
    id: "microsoft-azure-blend",
    displayName: "The Microsoft Azure Blend",
    summary: "Cloud migration remix focused on gateway aggregation, strangler moves, CQRS, and deployment stamps.",
    inspiredBy: "Azure Architecture Center",
    bestFor: ["Legacy-to-cloud migration paths", "Incremental modernization", "Platform transition work"],
    strengths: ["Migration-friendly", "Supports phased replacement", "Matches cloud rollout discipline"],
    tradeoffs: ["Complex during transition", "Temporary duplication is common"],
    warnings: ["Do not let strangler routes become permanent accidental architecture."],
    compatiblePlatforms: ["web", "api", "worker", "hybrid"],
    compatibleWorkloads: ["migration", "repo-recovery", "diagnosis"],
    architectureIds: ["microservices", "cqrs", "event-driven", "strangler-fig", "api-gateway"],
    patternIds: ["adapter", "facade", "proxy", "command", "chain-of-responsibility"],
    composedOf: [
      { kind: "architecture", id: "api-gateway", label: "API Gateway", rationale: "Stabilizes the client-facing edge." },
      { kind: "architecture", id: "strangler-fig", label: "Strangler Fig", rationale: "Supports incremental legacy replacement." },
      { kind: "architecture", id: "cqrs", label: "CQRS", rationale: "Helps split modernization hotspots." },
      { kind: "concept", label: "Deployment Stamps", rationale: "Supports repeatable cloud scale-out." }
    ],
    rationale: [
      "Best when the target state matters, but the migration path matters just as much.",
      "Pairs well with phased modernization rather than big-bang rewrites."
    ]
  },
  {
    id: "ai-native-stack",
    displayName: "The AI-Native Stack",
    summary: "Arkitect's AI-centric remix using slices, adapters, agent services, and MCP-facing boundaries.",
    inspiredBy: "Arkitect.Ai",
    bestFor: ["AI-powered SaaS", "Copilots", "Agent backends", "Tool-driven products"],
    strengths: ["Strong provider isolation", "Fits tool registries and agent services", "Matches Arkitect's MCP surfaces"],
    tradeoffs: ["Requires careful boundary design around AI orchestration", "Can overfit if AI is not core to the product"],
    warnings: ["Do not force agent layers into products that only need a simple API client."],
    compatiblePlatforms: ["desktop", "web", "api", "worker", "hybrid"],
    compatibleWorkloads: ["architecture-foundation", "feature-delivery", "migration", "diagnosis"],
    architectureIds: ["vertical-slice", "hexagonal", "modular-monolith"],
    patternIds: ["adapter", "strategy", "observer", "facade", "mediator"],
    composedOf: [
      {
        kind: "architecture",
        id: "vertical-slice",
        label: "Vertical Slice",
        rationale: "Keeps feature and tool flows isolated."
      },
      {
        kind: "concept",
        label: "MCP Tool Registry",
        rationale: "Makes capabilities visible to MCP-aware clients like Cursor."
      },
      { kind: "concept", label: "Agent Services", rationale: "Separates orchestration from delivery surfaces." },
      {
        kind: "architecture",
        id: "hexagonal",
        label: "Hexagonal Adapters",
        rationale: "Keeps providers and transport edges replaceable."
      }
    ],
    rationale: [
      "Fits products where tool calling, provider switching, and agent workflows are first-class.",
      "Strong match for Arkitect's MCP-aware desktop and shared library direction."
    ]
  },
  {
    id: "clean-slice-fusion",
    displayName: "The Clean Slice Fusion",
    summary: "Combines clean dependency rules with feature slices and tactical DDD patterns.",
    inspiredBy: ".NET / dev.to community",
    bestFor: ["Teams wanting slice delivery with a clean domain core", "Growth-stage product teams"],
    strengths: ["Balances domain purity with feature ownership", "Works well for modular monoliths and SaaS apps"],
    tradeoffs: ["Needs clear conventions to avoid slice-vs-layer confusion", "Can add ceremony if the domain is simple"],
    warnings: ["Keep the architecture decision visible so slices do not drift into mini layered stacks."],
    compatiblePlatforms: ["web", "api", "desktop", "hybrid"],
    compatibleWorkloads: ["architecture-foundation", "feature-delivery", "migration", "diagnosis"],
    architectureIds: ["clean-architecture", "vertical-slice", "domain-driven-design"],
    patternIds: ["mediator", "strategy", "factory-method", "decorator", "adapter"],
    composedOf: [
      {
        kind: "architecture",
        id: "clean-architecture",
        label: "Clean Architecture",
        rationale: "Preserves inward dependency direction."
      },
      {
        kind: "architecture",
        id: "vertical-slice",
        label: "Vertical Slice",
        rationale: "Keeps delivery organized by feature."
      },
      {
        kind: "concept",
        label: "DDD Tactical Patterns",
        rationale: "Adds aggregates, value objects, and explicit domain behavior where helpful."
      }
    ],
    rationale: [
      "A pragmatic blend when teams want both clean boundaries and feature-focused implementation.",
      "Often a better stepping stone than jumping directly into full DDD or distributed services."
    ]
  }
];

const architectureMap = new Map(architectureCatalog.map((entry) => [entry.id, entry]));
const patternMap = new Map(designPatternCatalog.map((entry) => [entry.id, entry]));
const remixMap = new Map(remixProfileCatalog.map((entry) => [entry.id, entry]));

export function listArchitectureCatalog(): ArchitectureCatalogEntry[] {
  return architectureCatalog;
}

export function listDesignPatternCatalog(): DesignPatternCatalogEntry[] {
  return designPatternCatalog;
}

export function listRemixProfileCatalog(): RemixProfileCatalogEntry[] {
  return remixProfileCatalog;
}

export function getArchitectureCatalogEntry(id: ArchitectureCatalogId): ArchitectureCatalogEntry | undefined {
  return architectureMap.get(id);
}

export function getDesignPatternCatalogEntry(id: DesignPatternId): DesignPatternCatalogEntry | undefined {
  return patternMap.get(id);
}

export function getRemixProfileCatalogEntry(id: RemixProfileId): RemixProfileCatalogEntry | undefined {
  return remixMap.get(id);
}

export function getDesignPatternDisplayName(id: DesignPatternId): string {
  return patternMap.get(id)?.displayName ?? id;
}

export function getDesignPatternFamily(id: DesignPatternId): PatternFamily {
  return patternMap.get(id)?.family ?? "behavioral";
}

export function isArchitectureCatalogId(value: ArchitectureStyle): value is ArchitectureCatalogId {
  return value !== "spaghetti" && value !== "unknown";
}

export function getCatalogCounts() {
  return {
    architectures: architectureCatalog.length,
    remixProfiles: remixProfileCatalog.length,
    designPatterns: designPatternCatalog.length
  };
}

export function getDeferredPatternsForProfile(profile: ComplexityProfile): DesignPatternId[] {
  if (lowComplexityProfiles.includes(profile)) {
    return ["abstract-factory", "prototype", "flyweight", "visitor", "interpreter"];
  }

  if (profile === "structured") {
    return ["flyweight"];
  }

  return [];
}
