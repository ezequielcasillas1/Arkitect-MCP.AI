# Arkitect.Ai — Product Overview
### The Architecture Layer for AI App Builders

---

> **Arkitect.Ai** is an MCP-native architecture platform that helps AI app builders design clean, modular, scalable codebases — before and during development. It is not a code generator. It is an **architecture reasoning engine** with developer tooling built on top of it.

**Tagline:** Design your codebase before you generate code.

---

## What Arkitect.Ai Does

Arkitect.Ai takes a plain-text project description or structured manifest and produces:

- A complete folder and namespace structure
- A dependency direction map
- Micro-level design pattern recommendations
- CI/CD pipeline scaffolds
- Architecture Decision Records (ADRs)
- A Pattern DNA Object — a living metadata contract for your project

All of this is accessible through a web UI, REST API, CLI, VS Code extension, or any MCP-compatible AI client (Claude, Cursor, Windsurf, custom agents).

---

## Core Capabilities

| Capability | What It Does |
|---|---|
| **Blueprint Engine** | Generates full macro architecture structures from a project description |
| **Pattern Evaluation Engine** | Recommends the right micro design patterns based on your stack, requirements, and scale |
| **MCP Tool Registry** | Exposes architecture tools to any AI client via Model Context Protocol |
| **CI/CD Scaffold Generator** | Produces ready-to-use pipeline configs (GitHub Actions, GitLab CI, Azure DevOps) |
| **Architecture Linter** | Continuously checks code for violations of your chosen architecture's rules |
| **Pattern Migration Advisor** | Detects when you've outgrown your architecture and guides you to the next one |
| **ADR Generator** | Auto-documents every architecture decision with rationale and trade-offs |
| **Architecture Profile Store** | Save your preferred stack + pattern combo as a reusable profile |
| **Visual Dependency Map** | Interactive diagram of module relationships and dependency direction |
| **Bottleneck Detector** | Identifies slow or constrained stages in your pipeline or architecture |

---

## Architecture Patterns Supported

### Standard / Foundation Patterns

These are the well-established architecture patterns Arkitect.Ai can scaffold, validate, and enforce:

| Pattern | Best For |
|---|---|
| **Vertical Slice Architecture** | Feature-organized codebases where each feature owns its full stack |
| **Clean / Onion Architecture** | Apps where the domain must never be polluted by frameworks or databases |
| **Hexagonal Architecture (Ports & Adapters)** | Decoupling core logic from all external I/O |
| **Modular Monolith** | Teams scaling toward microservices who need enforced module boundaries now |
| **Minimal API Architecture** | Lightweight, low-ceremony services and fast APIs |
| **Domain-Driven Design (DDD)** | Complex business domains with aggregates, events, and bounded contexts |
| **Event-Driven Architecture** | Async systems using message queues, pub/sub, and event sourcing |
| **Microservices Blueprint** | Service boundary mapping with inter-service communication contracts |
| **CQRS** | Systems needing separate read and write models |
| **Screaming Architecture** | Folder structures that reflect domain intent, not framework conventions |
| **Repository Pattern** | Clean data access abstraction with interfaces and unit of work |

---

### Influencer Remix Profiles

Arkitect.Ai formalizes the hybrid patterns that real teams actually use — combinations of two or more foundational architectures popularized by legendary software architects. These are available as one-click selectable **Remix Profiles**:

| Remix | Patterns Combined | Popularized By | Best For |
|---|---|---|---|
| **The Martin Fowler Stack** | Layered + Repository + Domain Model + Service Layer | Martin Fowler (*PEAA*) | Enterprise SaaS, data-heavy apps |
| **The Uncle Bob Special** | Clean Architecture + SOLID + Screaming + Use-Case Driven | Robert C. Martin | Framework-agnostic domain systems |
| **The Jimmy Bogard Slice** | Vertical Slice + MediatR + CQRS + Minimal Coupling | Jimmy Bogard | Feature-rich apps with diverse concerns |
| **The Vaughn Vernon DDD Remix** | DDD + Bounded Contexts + Event Sourcing + Hexagonal | Vaughn Vernon | Complex multi-domain business systems |
| **The Udi Dahan Messaging Mix** | Event-Driven + CQRS + Saga Pattern + Service Bus | Udi Dahan | Distributed, eventually consistent systems |
| **The Greg Young Event Machine** | Event Sourcing + CQRS + Append-Only Store + Projection Engine | Greg Young | Audit-heavy, financial, compliance systems |
| **The Neal Ford Hybrid Engine** | Microkernel + Event-Driven + Modular Monolith | Neal Ford & Mark Richards | Plugin-based platforms, extensible systems |
| **The Microsoft Azure Blend** | Gateway Aggregation + Strangler Fig + CQRS + Deployment Stamps | Azure Architecture Center | Legacy-to-cloud migration paths |
| **The AI-Native Stack** *(Arkitect.Ai Original)* | Vertical Slice + MCP Tool Registry + Agent Services + Hexagonal Adapters | Arkitect.Ai | AI-powered SaaS, copilots, autonomous agents |
| **The Clean Slice Fusion** *(Community Favorite)* | Clean Architecture + Vertical Slice + DDD Tactical Patterns | .NET / dev.to community | Teams wanting feature isolation + clean domain |

---

## Design Patterns (Micro Level)

Inside every generated blueprint, Arkitect.Ai recommends the right **micro-level design patterns** — the Gang of Four solutions to recurring coding problems — matched to your architecture, stack, and requirements.

### Creational Patterns
| Pattern | When Arkitect.Ai Recommends It |
|---|---|
| Singleton | Infrastructure services (DB, config, logger) needing a single shared instance |
| Factory Method | Multi-provider services (payments, notifications, auth) |
| Abstract Factory | Multi-tenant or cross-platform object families |
| Builder | Complex objects with many optional fields or construction steps |
| Prototype | Expensive object graphs requiring cloning |

### Structural Patterns
| Pattern | When Arkitect.Ai Recommends It |
|---|---|
| Adapter | Wrapping third-party SDKs (Stripe, Twilio) into internal interfaces |
| Facade | Hiding subsystem complexity behind a clean surface |
| Decorator | Adding cross-cutting concerns (logging, caching, auth) without modifying classes |
| Proxy | Lazy loading, rate limiting, access control |
| Composite | Tree-shaped data (file systems, permissions, UI trees) |
| Bridge | Platform-agnostic abstractions needing independent variation |
| Flyweight | High-volume object scenarios with memory constraints |

### Behavioral Patterns
| Pattern | When Arkitect.Ai Recommends It |
|---|---|
| Observer | Real-time updates, event systems, pub/sub feeds |
| Strategy | Swappable algorithms or providers (AI model switching, payment processors) |
| Command | Undo/redo, job queues, CQRS command handling |
| Mediator | Decoupling many-to-many communication (MediatR pipelines) |
| Chain of Responsibility | Middleware pipelines, permission checkers, event bubbling |
| Template Method | Step-based pipelines with a shared processing skeleton |
| State | Multi-step checkout flows, lifecycle state machines |
| Iterator | Custom collection traversal, pagination engines |
| Visitor | Non-destructive operations on complex object graphs |
| Memento | Undo history, snapshot saves, rollback states |
| Interpreter | Rule engines, custom DSLs, expression parsers |

---

## CI/CD Pipeline Scaffolding

Arkitect.Ai generates complete CI/CD pipeline configurations as a first-class output — not an add-on. Every scaffold includes:

**CI Stages:**
- Dependency install + caching
- Lint and static analysis
- Parallel unit and integration tests
- Security scanning (SAST + dependency audit)
- Build and artifact creation with signing

**CD Stages:**
- Artifact promotion (never rebuild between environments)
- Environment config injection
- Deployment strategy (blue/green, canary, rolling)
- Post-deploy smoke tests and health checks
- Automatic rollback gate on failed health checks
- Observability hooks (metrics, tracing, alerting)

**Supported Targets:** GitHub Actions · GitLab CI · Azure DevOps · Vercel · Docker + Kubernetes (Helm)

---

## How Arkitect.Ai Decides What to Recommend

The **Pattern Evaluation Engine** runs a 6-step process for every project:

1. **Project Intake** — app type, stack, scale, requirements, selected remix
2. **Architecture Alignment Scan** — maps remix to its high-affinity design patterns
3. **Requirements Signal Detection** — detects triggers (e.g., real-time → Observer + Mediator)
4. **Complexity Profile** — assigns Minimal / Balanced / Structured / Enterprise to prevent over-engineering
5. **Pattern DNA Output** — structured JSON object driving the linter, MCP tools, and ADR generator
6. **ADR Generation** — auto-documents every decision with rationale and exit conditions

---

## Delivery Surfaces

| Surface | Description |
|---|---|
| **Arkitect.Ai Studio** | Web UI for visual blueprint design, pattern browsing, and ADR management |
| **REST API** | Full programmatic access to all capabilities |
| **MCP Server** | Connect directly to Claude, Cursor, Windsurf, or any MCP-compatible AI client |
| **CLI** | `arkitect init` · `arkitect validate` · `arkitect suggest` · `arkitect scaffold` |
| **VS Code Extension** | Live architecture linting and pattern guidance inline while coding |

---

## Product Modules

| Module | Description |
|---|---|
| **Arkitect.Ai Core** | Blueprint Engine + Pattern Evaluation Engine |
| **Arkitect.Ai MCP** | MCP Server and Tool Registry for AI client integration |
| **Arkitect.Ai Patterns** | Full design pattern library with tagging and affinity maps |
| **Arkitect.Ai Flows** | CI/CD scaffold generation and pipeline architecture |
| **Arkitect.Ai SDK** | Programmatic access to all engine capabilities |
| **Arkitect.Ai Studio** | Visual web UI for blueprint design and ADR management |

---

## Who It's For

- **AI-assisted developers** (vibe coders, solo builders) who want structure without ceremony
- **Small teams** who need to move fast but build on solid foundations
- **Software architects** encoding their standards as reusable profiles
- **Enterprise teams** needing architecture governance across multiple products
- **AI agent builders** working with MCP-compatible clients who need clean backend structure

---

> Arkitect.Ai makes good architecture the default, not the exception.
