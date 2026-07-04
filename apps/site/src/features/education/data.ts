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
