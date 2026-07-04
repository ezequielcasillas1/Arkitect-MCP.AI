import type { EducationSection } from "./types";

export const educationSections: EducationSection[] = [
  {
    id: "overview",
    title: "Patterns and architecture",
    intro:
      "Design patterns are reusable solutions to recurring design problems inside a codebase. Software architecture is the higher-level structure — layers, boundaries, deployment, and data flow — that patterns help you express cleanly. Patterns do not replace architecture; they make each layer easier to change, test, and reason about.",
    topics: [],
    resources: [
      {
        label: "Refactoring Guru — Design Patterns",
        url: "https://refactoring.guru/design-patterns"
      },
      {
        label: "Martin Fowler — Architecture",
        url: "https://martinfowler.com/architecture/"
      },
      {
        label: "Microsoft Learn — Architecture styles",
        url: "https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/"
      }
    ]
  },
  {
    id: "creational",
    title: "Creational patterns",
    intro:
      "Creational patterns control how objects are created so construction logic stays in one place instead of scattered across callers.",
    topics: [
      {
        id: "factory",
        title: "Factory Method",
        summary:
          "Define an interface for creating objects, but let subclasses or providers decide which concrete type to instantiate.",
        architectureConnection:
          "Keeps domain code depending on abstractions, not concrete classes — essential in layered and hexagonal architectures where infrastructure swaps implementations behind ports.",
        resource: {
          label: "Refactoring Guru — Factory Method",
          url: "https://refactoring.guru/design-patterns/factory-method"
        }
      },
      {
        id: "singleton",
        title: "Singleton",
        summary: "Ensure a class has only one instance and provide a global access point to it.",
        architectureConnection:
          "Use sparingly for true shared resources (config, connection pools). Overuse creates hidden global state that fights testability and modular boundaries.",
        resource: {
          label: "SourceMaking — Singleton",
          url: "https://sourcemaking.com/design_patterns/singleton"
        }
      },
      {
        id: "builder",
        title: "Builder",
        summary:
          "Separate the construction of a complex object from its representation so the same process can build different variants.",
        architectureConnection:
          "Pairs well with immutable domain models and API DTO assembly — configuration and object graphs stay readable as systems grow.",
        resource: {
          label: "Refactoring Guru — Builder",
          url: "https://refactoring.guru/design-patterns/builder"
        }
      },
      {
        id: "abstract-factory",
        title: "Abstract Factory",
        summary:
          "Provide an interface for creating families of related objects without specifying their concrete classes.",
        architectureConnection:
          "Useful when swapping entire platform stacks (UI themes, cloud providers, persistence backends) behind one factory contract at infrastructure boundaries.",
        resource: {
          label: "Refactoring Guru — Abstract Factory",
          url: "https://refactoring.guru/design-patterns/abstract-factory"
        }
      },
      {
        id: "prototype",
        title: "Prototype",
        summary:
          "Create new objects by copying an existing instance (prototype) instead of constructing from scratch.",
        architectureConnection:
          "Supports cloning complex domain graphs and configuration templates — common when duplicating aggregates or seeding test fixtures without tight coupling to constructors.",
        resource: {
          label: "Refactoring Guru — Prototype",
          url: "https://refactoring.guru/design-patterns/prototype"
        }
      }
    ]
  },
  {
    id: "structural",
    title: "Structural patterns",
    intro:
      "Structural patterns compose classes and objects into larger structures while keeping interfaces stable.",
    topics: [
      {
        id: "adapter",
        title: "Adapter",
        summary:
          "Convert the interface of a class into another interface clients expect — wrap a legacy or third-party API behind your domain contract.",
        architectureConnection:
          "Core to hexagonal (ports & adapters) architecture: adapters sit at the boundary so the core never imports vendor SDKs directly.",
        resource: {
          label: "Refactoring Guru — Adapter",
          url: "https://refactoring.guru/design-patterns/adapter"
        }
      },
      {
        id: "decorator",
        title: "Decorator",
        summary:
          "Attach additional responsibilities to an object dynamically without altering its class.",
        architectureConnection:
          "Supports cross-cutting concerns (logging, caching, auth) in a composable way instead of deep inheritance trees — common in middleware pipelines.",
        resource: {
          label: "SourceMaking — Decorator",
          url: "https://sourcemaking.com/design_patterns/decorator"
        }
      },
      {
        id: "facade",
        title: "Facade",
        summary:
          "Provide a simplified interface to a complex subsystem of classes, modules, or services.",
        architectureConnection:
          "Defines module or service boundaries: callers see one entry point while internal complexity stays encapsulated — a building block of modular monoliths and microservice APIs.",
        resource: {
          label: "Refactoring Guru — Facade",
          url: "https://refactoring.guru/design-patterns/facade"
        }
      },
      {
        id: "bridge",
        title: "Bridge",
        summary:
          "Decouple an abstraction from its implementation so the two can vary independently.",
        architectureConnection:
          "Keeps domain abstractions stable while swapping infrastructure implementations — a natural fit for hexagonal ports where the core never references concrete drivers.",
        resource: {
          label: "Refactoring Guru — Bridge",
          url: "https://refactoring.guru/design-patterns/bridge"
        }
      },
      {
        id: "composite",
        title: "Composite",
        summary:
          "Compose objects into tree structures to represent part-whole hierarchies; treat individual objects and compositions uniformly.",
        architectureConnection:
          "Models nested domain structures (menus, org charts, file systems) and recursive operations without special-casing leaves vs. containers.",
        resource: {
          label: "Refactoring Guru — Composite",
          url: "https://refactoring.guru/design-patterns/composite"
        }
      },
      {
        id: "flyweight",
        title: "Flyweight",
        summary:
          "Share intrinsic state among many fine-grained objects to reduce memory use when thousands of similar instances exist.",
        architectureConnection:
          "Optimizes read-heavy caches and rendering pipelines — intrinsic data lives in a shared pool while extrinsic context stays per-use.",
        resource: {
          label: "Refactoring Guru — Flyweight",
          url: "https://refactoring.guru/design-patterns/flyweight"
        }
      },
      {
        id: "proxy",
        title: "Proxy",
        summary:
          "Provide a surrogate or placeholder that controls access to another object — lazy loading, caching, or access control.",
        architectureConnection:
          "Common at hexagonal boundaries for remote services, permission checks, and deferred initialization without leaking infrastructure into domain code.",
        resource: {
          label: "Refactoring Guru — Proxy",
          url: "https://refactoring.guru/design-patterns/proxy"
        }
      }
    ]
  },
  {
    id: "behavioral",
    title: "Behavioral patterns",
    intro:
      "Behavioral patterns govern communication and responsibility assignment between objects.",
    topics: [
      {
        id: "observer",
        title: "Observer",
        summary:
          "Define a one-to-many dependency so when one object changes state, all dependents are notified and updated automatically.",
        architectureConnection:
          "Underpins event-driven and reactive architectures — domain events, pub/sub buses, and UI binding (e.g. MVVM) all use this idea.",
        resource: {
          label: "Refactoring Guru — Observer",
          url: "https://refactoring.guru/design-patterns/observer"
        }
      },
      {
        id: "strategy",
        title: "Strategy",
        summary:
          "Define a family of algorithms, encapsulate each one, and make them interchangeable at runtime.",
        architectureConnection:
          "Enables policy and plugin slots in clean architecture — swap sorting, pricing, or AI providers without rewriting callers.",
        resource: {
          label: "Refactoring Guru — Strategy",
          url: "https://refactoring.guru/design-patterns/strategy"
        }
      },
      {
        id: "command",
        title: "Command",
        summary:
          "Encapsulate a request as an object, letting you parameterize clients, queue operations, and support undo.",
        architectureConnection:
          "Maps directly to CQRS and job queues: each command is a discrete unit of work crossing application boundaries with clear audit trails.",
        resource: {
          label: "SourceMaking — Command",
          url: "https://sourcemaking.com/design_patterns/command"
        }
      },
      {
        id: "chain-of-responsibility",
        title: "Chain of Responsibility",
        summary:
          "Pass a request along a chain of handlers; each handler decides whether to process it or forward it to the next.",
        architectureConnection:
          "Models middleware pipelines, validation chains, and authorization filters — core to HTTP middleware and clean-architecture request pipelines.",
        resource: {
          label: "Refactoring Guru — Chain of Responsibility",
          url: "https://refactoring.guru/design-patterns/chain-of-responsibility"
        }
      },
      {
        id: "iterator",
        title: "Iterator",
        summary:
          "Provide a way to traverse elements of a collection without exposing its internal representation.",
        architectureConnection:
          "Standardizes pagination, streaming, and lazy enumeration across repositories and APIs — callers iterate without knowing storage details.",
        resource: {
          label: "Refactoring Guru — Iterator",
          url: "https://refactoring.guru/design-patterns/iterator"
        }
      },
      {
        id: "mediator",
        title: "Mediator",
        summary:
          "Define an object that encapsulates how a set of objects interact, promoting loose coupling by avoiding direct references.",
        architectureConnection:
          "Reduces tangled cross-module calls — chat rooms, event buses, and orchestrators often act as mediators between bounded contexts.",
        resource: {
          label: "Refactoring Guru — Mediator",
          url: "https://refactoring.guru/design-patterns/mediator"
        }
      },
      {
        id: "memento",
        title: "Memento",
        summary:
          "Capture and externalize an object's internal state so it can be restored later without violating encapsulation.",
        architectureConnection:
          "Supports undo/redo, snapshots, and audit trails in workflow engines — state is stored separately from the object that produced it.",
        resource: {
          label: "Refactoring Guru — Memento",
          url: "https://refactoring.guru/design-patterns/memento"
        }
      },
      {
        id: "state",
        title: "State",
        summary:
          "Allow an object to alter its behavior when its internal state changes, as if the object changed its class.",
        architectureConnection:
          "Models order lifecycles, connection states, and workflow transitions cleanly — each state encapsulates its own rules instead of giant switch statements.",
        resource: {
          label: "Refactoring Guru — State",
          url: "https://refactoring.guru/design-patterns/state"
        }
      },
      {
        id: "template-method",
        title: "Template Method",
        summary:
          "Define the skeleton of an algorithm in a base class, letting subclasses override specific steps without changing the overall structure.",
        architectureConnection:
          "Useful in framework hooks and pipeline bases — the invariant flow stays in one place while extension points live in subclasses or strategies.",
        resource: {
          label: "Refactoring Guru — Template Method",
          url: "https://refactoring.guru/design-patterns/template-method"
        }
      },
      {
        id: "visitor",
        title: "Visitor",
        summary:
          "Represent an operation to perform on elements of an object structure; lets you add new operations without changing element classes.",
        architectureConnection:
          "Powers AST walkers, report generators, and cross-cutting traversals over stable domain trees — common in compilers and DDD aggregate visitors.",
        resource: {
          label: "Refactoring Guru — Visitor",
          url: "https://refactoring.guru/design-patterns/visitor"
        }
      },
      {
        id: "interpreter",
        title: "Interpreter",
        summary:
          "Define a representation for a language grammar and an interpreter that evaluates sentences in that language.",
        architectureConnection:
          "Used for rules engines, query DSLs, and policy expressions — keeps domain-specific logic declarative instead of buried in imperative code.",
        resource: {
          label: "Refactoring Guru — Interpreter",
          url: "https://refactoring.guru/design-patterns/interpreter"
        }
      }
    ]
  },
  {
    id: "architecture-styles",
    title: "Architecture styles",
    intro:
      "An architecture style organizes the system into major parts and defines how they interact. Patterns often appear inside each part.",
    topics: [
      {
        id: "layered",
        title: "Layered (n-tier)",
        summary:
          "Organize code into horizontal layers — presentation, application, domain, infrastructure — with dependencies pointing inward.",
        architectureConnection:
          "Factory, Repository, and Facade patterns typically live at layer boundaries to keep domain rules isolated from frameworks.",
        resource: {
          label: "Microsoft Learn — Layered architecture",
          url: "https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/layered-architecture"
        }
      },
      {
        id: "hexagonal",
        title: "Hexagonal (ports & adapters)",
        summary:
          "Place the domain at the center; all I/O (UI, DB, messaging) connects through ports implemented by adapters.",
        architectureConnection:
          "Adapter and Strategy are first-class citizens here — they are how you plug in databases, HTTP, and third-party services without polluting core logic.",
        resource: {
          label: "Alistair Cockburn — Hexagonal architecture",
          url: "https://alistair.cockburn.us/hexagonal-architecture/"
        }
      },
      {
        id: "mvc-mvvm",
        title: "MVC / MVVM",
        summary:
          "Separate user interface, application logic, and data: MVC splits Model–View–Controller; MVVM adds data binding between View and ViewModel.",
        architectureConnection:
          "Observer and Command patterns support reactive UIs and user actions; keeps presentation replaceable (web, desktop, mobile) over shared domain code.",
        resource: {
          label: "Martin Fowler — GUI architectures",
          url: "https://martinfowler.com/eaaDev/uiArchs.html"
        }
      },
      {
        id: "microservices",
        title: "Microservices (overview)",
        summary:
          "Decompose a system into independently deployable services, each owning a bounded context and communicating over the network.",
        architectureConnection:
          "Facade defines service APIs; Adapter integrates legacy systems; Saga/Command patterns coordinate distributed workflows — with trade-offs in consistency and ops complexity.",
        resource: {
          label: "Martin Fowler — Microservices",
          url: "https://martinfowler.com/articles/microservices.html"
        }
      },
      {
        id: "event-driven",
        title: "Event-Driven",
        summary:
          "Components communicate by producing and consuming events asynchronously rather than calling each other directly.",
        architectureConnection:
          "Observer and Mediator underpin pub/sub buses and domain events — enables loose coupling, eventual consistency, and reactive scaling across services.",
        resource: {
          label: "Martin Fowler — Event-Driven Architecture",
          url: "https://martinfowler.com/articles/201701-event-driven.html"
        }
      },
      {
        id: "clean-architecture",
        title: "Clean Architecture",
        summary:
          "Organize code in concentric rings with dependencies pointing inward — entities and use cases at the center, frameworks and UI at the edge.",
        architectureConnection:
          "Formalizes ports-and-adapters thinking: Factory, Strategy, and Repository patterns live at ring boundaries to keep business rules framework-agnostic.",
        resource: {
          label: "Robert C. Martin — Clean Architecture",
          url: "https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html"
        }
      },
      {
        id: "onion-architecture",
        title: "Onion Architecture",
        summary:
          "Layer the application around the domain model with dependencies flowing inward; infrastructure implements interfaces defined by inner layers.",
        architectureConnection:
          "Repository and Unit of Work sit at the domain–infrastructure seam; Adapter wraps external systems so the core stays persistence-ignorant.",
        resource: {
          label: "Jeffrey Palermo — Onion Architecture",
          url: "https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/"
        }
      },
      {
        id: "monolithic",
        title: "Monolithic",
        summary:
          "Build the entire application as a single deployable unit with shared memory, process, and codebase.",
        architectureConnection:
          "Simplest starting point — Facade and layered boundaries still matter so the monolith can be modularized or strangler-migrated later without a rewrite.",
        resource: {
          label: "Microsoft Learn — Monolithic architecture",
          url: "https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/monolithic"
        }
      },
      {
        id: "soa",
        title: "SOA (Service-Oriented Architecture)",
        summary:
          "Organize capabilities as loosely coupled, discoverable services with standardized contracts, often orchestrated via an enterprise service bus.",
        architectureConnection:
          "Precursor to microservices — Adapter and Facade define service contracts; emphasizes interoperability and shared governance over independent deployment.",
        resource: {
          label: "Microsoft Learn — SOA",
          url: "https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/service-oriented-architecture"
        }
      }
    ]
  },
  {
    id: "domain-driven-design",
    title: "Domain-driven design",
    intro:
      "Domain-driven design (DDD) aligns software structure with business domains — bounded contexts, ubiquitous language, and strategic patterns keep complex systems understandable.",
    topics: [
      {
        id: "ddd",
        title: "Domain-Driven Design",
        summary:
          "Model software around the business domain using a shared language, bounded contexts, and rich domain models instead of anemic data layers.",
        architectureConnection:
          "Guides how you slice microservices and modular monoliths — each bounded context owns its aggregates, events, and anti-corruption layers at integration points.",
        resource: {
          label: "Martin Fowler — Domain-Driven Design",
          url: "https://martinfowler.com/bliki/DomainDrivenDesign.html"
        }
      },
      {
        id: "repository",
        title: "Repository",
        summary:
          "Mediate between the domain and data mapping layers using a collection-like interface for accessing aggregates.",
        architectureConnection:
          "Hides persistence details behind a domain-facing port — core to hexagonal, onion, and clean architectures where infrastructure implements the repository contract.",
        resource: {
          label: "Martin Fowler — Repository",
          url: "https://martinfowler.com/eaaCatalog/repository.html"
        }
      },
      {
        id: "unit-of-work",
        title: "Unit of Work",
        summary:
          "Track changes to objects during a business transaction and coordinate writing them out as a single atomic operation.",
        architectureConnection:
          "Pairs with Repository in application services — ensures aggregate consistency and transaction boundaries without leaking ORM session details into the domain.",
        resource: {
          label: "Martin Fowler — Unit of Work",
          url: "https://martinfowler.com/eaaCatalog/unitOfWork.html"
        }
      },
      {
        id: "anti-corruption-layer",
        title: "Anti-Corruption Layer",
        summary:
          "Translate between your domain model and an external system's model so foreign concepts do not leak into your bounded context.",
        architectureConnection:
          "Adapter at the strategic level — sits between bounded contexts or legacy integrations, preserving ubiquitous language inside your core.",
        resource: {
          label: "Microsoft Learn — Anti-corruption layer",
          url: "https://learn.microsoft.com/en-us/azure/architecture/patterns/anti-corruption-layer"
        }
      }
    ],
    resources: [
      {
        label: "Eric Evans — Domain-Driven Design (book overview)",
        url: "https://www.domainlanguage.com/ddd/"
      }
    ]
  },
  {
    id: "distributed-patterns",
    title: "Distributed & cloud patterns",
    intro:
      "These patterns address reliability, consistency, and integration challenges that arise when systems span processes, networks, and teams.",
    topics: [
      {
        id: "cqrs",
        title: "CQRS",
        summary:
          "Separate read models from write models so commands and queries can be optimized, scaled, and evolved independently.",
        architectureConnection:
          "Extends the Command pattern across service boundaries — write side emits events or updates projections consumed by specialized read stores.",
        resource: {
          label: "Martin Fowler — CQRS",
          url: "https://martinfowler.com/bliki/CQRS.html"
        }
      },
      {
        id: "event-sourcing",
        title: "Event Sourcing",
        summary:
          "Persist state as an append-only sequence of domain events rather than overwriting current state in place.",
        architectureConnection:
          "Complements event-driven and CQRS architectures — Observer notifies projections; Memento-like replay reconstructs any point-in-time snapshot.",
        resource: {
          label: "Martin Fowler — Event Sourcing",
          url: "https://martinfowler.com/eaaDev/EventSourcing.html"
        }
      },
      {
        id: "circuit-breaker",
        title: "Circuit Breaker",
        summary:
          "Wrap remote calls with a breaker that opens after repeated failures, preventing cascading outages and allowing downstream recovery.",
        architectureConnection:
          "Essential resilience pattern in microservices and SOA — Proxy-like wrapper around external calls with fallback and health-aware routing.",
        resource: {
          label: "Martin Fowler — Circuit Breaker",
          url: "https://martinfowler.com/bliki/CircuitBreaker.html"
        }
      },
      {
        id: "saga",
        title: "Saga",
        summary:
          "Coordinate a long-running distributed transaction as a sequence of local transactions, each with a compensating action on failure.",
        architectureConnection:
          "Replaces two-phase commit in microservices — Command and Observer patterns choreograph or orchestrate steps across bounded contexts.",
        resource: {
          label: "Microsoft Learn — Saga",
          url: "https://learn.microsoft.com/en-us/azure/architecture/reference-architectures/saga/saga"
        }
      },
      {
        id: "api-gateway",
        title: "API Gateway",
        summary:
          "Provide a single entry point that routes, aggregates, authenticates, and rate-limits requests to backend services.",
        architectureConnection:
          "Facade at the network edge — hides service topology from clients and centralizes cross-cutting concerns before traffic reaches individual services.",
        resource: {
          label: "Microsoft Learn — API Gateway",
          url: "https://learn.microsoft.com/en-us/azure/architecture/microservices/design/gateway"
        }
      },
      {
        id: "bff",
        title: "BFF (Backend for Frontend)",
        summary:
          "Create a dedicated backend API tailored to the needs of a specific client (web, mobile, IoT) rather than one generic API for all.",
        architectureConnection:
          "Sits behind or alongside the API Gateway — Adapter and Facade combine to shape responses per channel without bloating core domain services.",
        resource: {
          label: "Sam Newman — Backends for Frontends",
          url: "https://samnewman.io/patterns/architectural/bff/"
        }
      },
      {
        id: "strangler-fig",
        title: "Strangler Fig",
        summary:
          "Incrementally replace a legacy system by routing new functionality to new services while the old system is gradually retired.",
        architectureConnection:
          "Migration strategy for monolith-to-microservices — Adapter and Facade route traffic until the legacy core is fully displaced without a big-bang rewrite.",
        resource: {
          label: "Martin Fowler — Strangler Fig",
          url: "https://martinfowler.com/bliki/StranglerFigApplication.html"
        }
      }
    ],
    resources: [
      {
        label: "Microsoft Azure — Cloud design patterns",
        url: "https://learn.microsoft.com/en-us/azure/architecture/patterns/"
      }
    ]
  },
  {
    id: "solid",
    title: "SOLID and patterns",
    intro:
      "SOLID principles guide class and module design; patterns are concrete ways to uphold them at scale.",
    topics: [
      {
        id: "solid-patterns",
        title: "How SOLID connects to patterns",
        summary:
          "Single Responsibility: one reason to change per module. Open/Closed: extend via Strategy/Decorator instead of editing core code. Liskov: substitutable implementations behind Factory/Strategy. Interface Segregation: small ports in hexagonal layouts. Dependency Inversion: depend on abstractions — Factory, Adapter, and DI containers wire concrete types at the edge.",
        architectureConnection:
          "Healthy architecture scores how well boundaries respect SOLID; patterns are the vocabulary Arkitect and similar tools use when suggesting refactors and slice boundaries.",
        resource: {
          label: "Refactoring Guru — SOLID",
          url: "https://refactoring.guru/design-principles/solid-principles"
        }
      }
    ],
    resources: [
      {
        label: "Microsoft Learn — SOLID principles",
        url: "https://learn.microsoft.com/en-us/dotnet/architecture/modern-web-apps-azure/common-web-application-architectures"
      }
    ]
  }
];

export const educationToc = educationSections.map((section) => ({
  id: section.id,
  title: section.title,
  topics: section.topics.map((topic) => ({ id: topic.id, title: topic.title }))
}));
