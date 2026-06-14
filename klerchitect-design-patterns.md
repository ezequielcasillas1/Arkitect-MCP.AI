# Klerchitect Design Patterns Guide
## How Design Patterns Work, Why They Matter, and How Klerchitect Evaluates & Applies Them

---

## Overview

Design patterns are reusable, proven solutions to recurring problems in software design. They are not finished code you paste in — they are templates or blueprints that describe *how* to solve a problem in a way that has been tested, refined, and named by the software engineering community over decades.

Klerchitect operates at two levels: **macro architecture** (how your whole system is structured) and **micro design patterns** (how specific problems inside that system are solved). This document covers the micro level — design patterns — and explains when each one applies, how they are categorized, and how Klerchitect's evaluation engine decides which patterns to recommend and enforce for any given project.

---

## The Three Families of Design Patterns

Design patterns are divided into three families, each targeting a different dimension of a coding problem.

| Family | Core Question | Typical Problem Solved |
|---|---|---|
| **Creational** | *How do I create this object?* | Object creation is complex, repeated, or needs to be controlled |
| **Structural** | *How do I connect these parts?* | Composing classes or bridging incompatible interfaces |
| **Behavioral** | *How do these parts communicate?* | Managing responsibility, coordination, and messaging between objects |

---

## Creational Patterns

Creational patterns manage the process of object instantiation. Use them when object creation logic would otherwise be scattered, complex, or repeated throughout your codebase.

### Singleton
**Situation:** Only one instance of a class should ever exist across the entire application.  
**Real use cases:** Database connection pools, config managers, loggers, thread pool managers.  
**Klerchitect tag:** `creational:singleton` — flagged when a project includes infrastructure services like DB or auth clients.

### Factory Method
**Situation:** A class cannot anticipate which type of object it needs to create, so a subclass or method decides.  
**Real use cases:** Notification services (email vs. SMS vs. push), payment processors, logger factories.  
**Klerchitect tag:** `creational:factory` — recommended when multi-provider integrations are detected in project requirements.

### Abstract Factory
**Situation:** A system needs to work with multiple families of related objects without coupling to their concrete classes.  
**Real use cases:** Cross-platform UI kits (Windows vs. macOS), multi-tenant theming, database driver families.  
**Klerchitect tag:** `creational:abstract-factory` — suggested when multi-tenant or platform-agnostic UI requirements are present.

### Builder
**Situation:** An object requires many steps to construct, or the construction process must produce different representations.  
**Real use cases:** Complex API request builders, HTML/PDF report generators, SQL query builders, test object factories.  
**Klerchitect tag:** `creational:builder` — flagged when entities have more than 5 optional fields or complex initialization logic.

### Prototype
**Situation:** Creating a new object from scratch is expensive, and cloning an existing one is faster.  
**Real use cases:** Graphic editors, game object spawning, template duplication, clone-before-mutate workflows.  
**Klerchitect tag:** `creational:prototype` — suggested when object graphs are deep and instantiation cost is flagged.

---

## Structural Patterns

Structural patterns describe how objects and classes are composed to form larger structures. Use them when you need to bridge incompatible interfaces, simplify complexity, or add responsibilities without touching existing code.

### Adapter
**Situation:** Two incompatible interfaces need to work together.  
**Real use cases:** Wrapping third-party APIs (Stripe, Twilio, SendGrid) into your own interface contracts, legacy system bridges.  
**Klerchitect tag:** `structural:adapter` — auto-recommended whenever external SDK integrations are declared in the project manifest.

### Facade
**Situation:** A complex subsystem needs to be simplified behind a clean, unified interface.  
**Real use cases:** Authentication libraries hiding OAuth complexity, booking systems, SDK wrappers.  
**Klerchitect tag:** `structural:facade` — triggered when subsystem complexity score exceeds threshold in architecture scan.

### Decorator
**Situation:** Responsibilities need to be added to objects dynamically without modifying their class.  
**Real use cases:** Middleware pipelines, adding caching/logging/auth checks to services, response transformation layers.  
**Klerchitect tag:** `structural:decorator` — recommended for cross-cutting concerns like logging, caching, and rate limiting.

### Proxy
**Situation:** You need controlled access to an object — for lazy loading, access control, or remote access.  
**Real use cases:** Lazy-loading large images, API rate-limit wrappers, security access gates, virtual proxies for expensive resources.  
**Klerchitect tag:** `structural:proxy` — suggested when lazy loading or access control is a declared requirement.

### Composite
**Situation:** Individual objects and groups of objects need to be treated uniformly.  
**Real use cases:** File systems (folders contain files or more folders), UI component trees, menu hierarchies, permission group trees.  
**Klerchitect tag:** `structural:composite` — flagged when recursive or tree-shaped data models are detected.

### Bridge
**Situation:** An abstraction and its implementation need to be developed and varied independently.  
**Real use cases:** Cross-platform rendering engines, notifications with multiple backends, graphics rasterizers.  
**Klerchitect tag:** `structural:bridge` — suggested when platform-agnostic abstraction is declared in architecture goals.

### Flyweight
**Situation:** A large number of similar objects is creating memory pressure.  
**Real use cases:** Text editors rendering millions of characters, game particle systems, map pin renderers, font glyph caches.  
**Klerchitect tag:** `structural:flyweight` — recommended when high-volume object instantiation is detected in performance profiles.

---

## Behavioral Patterns

Behavioral patterns manage how objects communicate and distribute responsibility. Use them when the complexity is in the *interactions* between objects rather than their structure or creation.

### Observer
**Situation:** Many objects need to be notified when one object changes state.  
**Real use cases:** Event systems, real-time UI state updates, pub/sub feeds, stock price tickers, notification systems.  
**Klerchitect tag:** `behavioral:observer` — flagged when real-time or reactive data flows are declared.

### Strategy
**Situation:** Multiple algorithms or behaviors are interchangeable at runtime.  
**Real use cases:** Payment processors, sorting algorithms, compression methods, AI model provider switching, pricing calculators.  
**Klerchitect tag:** `behavioral:strategy` — recommended whenever multiple interchangeable service providers or algorithms are detected.

### Command
**Situation:** Requests need to be encapsulated as objects to support queuing, logging, or undo/redo.  
**Real use cases:** Undo/redo systems, job queues, task schedulers, macro recording, transactional operations.  
**Klerchitect tag:** `behavioral:command` — suggested when undo history, job queues, or CQRS patterns are part of the architecture.

### Mediator
**Situation:** Many objects communicate directly, creating a tangled web of dependencies.  
**Real use cases:** Chat systems, form validation controllers, air traffic control-style coordination, MediatR in .NET pipelines.  
**Klerchitect tag:** `behavioral:mediator` — auto-included in Jimmy Bogard Slice and any CQRS-based architecture remix.

### Chain of Responsibility
**Situation:** A request must pass through a chain of handlers until one handles it.  
**Real use cases:** Middleware pipelines (Next.js, Express), auth/permission checkers, event bubbling, support ticket escalation.  
**Klerchitect tag:** `behavioral:chain` — recommended in all middleware-heavy API architectures.

### Template Method
**Situation:** An algorithm has a fixed skeleton but some steps should be customizable by subclasses.  
**Real use cases:** Data pipelines (read → process → write), report generators, test framework lifecycle hooks.  
**Klerchitect tag:** `behavioral:template-method` — flagged when pipeline or multi-step processing flows are declared.

### State
**Situation:** An object must change its behavior when its internal state changes.  
**Real use cases:** Order checkout flows, vending machines, game character state machines, traffic light controllers.  
**Klerchitect tag:** `behavioral:state` — recommended when the project has multi-step user flows or complex lifecycle management.

### Iterator
**Situation:** A collection needs to be traversed without exposing its underlying structure.  
**Real use cases:** Custom data structure traversal, pagination engines, database cursor result sets.  
**Klerchitect tag:** `behavioral:iterator` — suggested when custom collections or paginated data models are present.

### Visitor
**Situation:** New operations need to be added to existing object structures without modifying them.  
**Real use cases:** Compilers, AST (Abstract Syntax Tree) traversal, reporting engines, object graph analytics.  
**Klerchitect tag:** `behavioral:visitor` — triggered when non-destructive operations on complex object graphs are declared.

### Memento
**Situation:** The state of an object must be captured and restored later.  
**Real use cases:** Game save/load systems, form draft auto-saving, undo history, snapshot-based rollback.  
**Klerchitect tag:** `behavioral:memento` — flagged when undo, versioning, or snapshot requirements are declared.

### Interpreter
**Situation:** A language or grammar needs to be defined and executed.  
**Real use cases:** Math expression evaluators, SQL query parsers, rule engines, DSL (Domain-Specific Language) runners.  
**Klerchitect tag:** `behavioral:interpreter` — recommended when custom rule engines or query DSLs are in scope.

---

## When NOT to Use Design Patterns

Misapplying design patterns is as harmful as ignoring them. Klerchitect's evaluation engine actively checks for over-engineering signals and warns when a pattern is unnecessary.

| Situation | Why Patterns Are Wrong Here |
|---|---|
| Simple scripts or utilities under ~100 lines | Abstraction overhead outweighs any benefit |
| When a plain function already works cleanly | Don't wrap a function in a Strategy class without cause |
| When the framework already provides it | React Context = Observer. Next.js routing = Front Controller. Don't duplicate. |
| When the problem doesn't exist yet | Speculative pattern use creates complexity without solving anything |
| Prototypes and MVPs | Move fast first; add structure when the shape of the problem is confirmed |

> **Klerchitect Rule:** If the Pattern DNA evaluation returns a complexity score below the project threshold, the engine will recommend deferring the pattern and flagging it as a future refactor candidate rather than implementing it immediately.

---

## How Klerchitect Evaluates and Decides

Klerchitect's **Pattern Evaluation Engine** is the intelligence layer that determines which design patterns to recommend, enforce, or defer for any given project. It operates through a multi-step decision flow.

---

### Step 1 — Project Intake

The builder provides a project manifest either through the Studio UI, MCP Tool call, or CLI. The manifest captures:

- App type (SaaS, API service, mobile backend, AI agent, CLI tool)
- Scale expectations (solo, small team, enterprise)
- Stack (Next.js, FastAPI, .NET, Node.js, etc.)
- Key requirements (multi-tenancy, real-time, auth, payments, file handling, AI integration)
- Architecture remix selected (e.g., Uncle Bob Special, Jimmy Bogard Slice, AI-Native Stack)
- Performance and scalability targets

---

### Step 2 — Architecture Alignment Scan

The engine first resolves the selected architecture pattern at the macro level. Each architecture has a **pattern affinity map** — a pre-defined set of design patterns that naturally align with it:

| Architecture | High-Affinity Patterns |
|---|---|
| Clean Architecture (Uncle Bob) | Factory, Adapter, Repository, Facade, Strategy |
| Vertical Slice (Bogard) | Mediator, Command, Strategy, Decorator |
| DDD + Hexagonal (Vernon) | Factory, Observer, Command, Visitor, Interpreter |
| Event-Driven (Dahan) | Observer, Command, Chain of Responsibility, Mediator |
| Event Sourcing + CQRS (Young) | Command, Memento, Observer, Iterator |
| Microkernel (Ford) | Strategy, Composite, Facade, Decorator |
| AI-Native Stack (Klerchitect) | Adapter, Strategy, Observer, Facade, Mediator |

---

### Step 3 — Requirements Signal Detection

The engine scans the declared requirements for signals that trigger specific pattern recommendations:

```
IF requires multi-provider payment     → RECOMMEND Strategy + Adapter
IF requires real-time updates          → RECOMMEND Observer + Mediator
IF requires undo/redo                  → RECOMMEND Command + Memento
IF requires plugin/extension system   → RECOMMEND Strategy + Composite + Decorator
IF requires background job queue      → RECOMMEND Command + Chain of Responsibility
IF requires AI model switching        → RECOMMEND Strategy + Facade + Adapter
IF requires audit trail / event log   → RECOMMEND Command + Memento + Observer
IF requires complex object creation   → RECOMMEND Builder + Factory
IF requires cross-cutting concerns    → RECOMMEND Decorator + Proxy + Chain
```

Each signal produces a weighted recommendation score per pattern.

---

### Step 4 — Complexity Threshold Check

Each project is assigned a **Complexity Profile** based on team size, scale target, and app type:

| Profile | Team | Scale | Pattern Depth |
|---|---|---|---|
| **Minimal** | Solo dev | MVP / prototype | Only essential patterns, warn against over-engineering |
| **Balanced** | 1–5 devs | Early-stage SaaS | Moderate patterns — core creational + behavioral only |
| **Structured** | 5–20 devs | Growth-stage | Full pattern library available, structural patterns encouraged |
| **Enterprise** | 20+ devs | Large-scale | All patterns active, strict enforcement via linter |

The engine suppresses low-value pattern recommendations for Minimal and Balanced profiles to avoid over-engineering.

---

### Step 5 — Pattern DNA Output

The final evaluation produces a **Pattern DNA Object** — a structured metadata output attached to the generated blueprint:

```json
{
  "project": "my-saas-app",
  "architectureRemix": "Jimmy Bogard Slice",
  "complexityProfile": "Balanced",
  "recommendedPatterns": {
    "creational": ["Factory Method", "Builder"],
    "structural": ["Adapter", "Facade", "Decorator"],
    "behavioral": ["Mediator", "Strategy", "Command", "Chain of Responsibility"]
  },
  "deferredPatterns": ["Visitor", "Flyweight", "Interpreter"],
  "antiPatternWarnings": ["Singleton overuse in service layer detected"],
  "patternAffinityScore": 0.87,
  "overEngineeringRisk": "Low"
}
```

This DNA object is:
- Embedded in the generated blueprint's metadata
- Used by the **Architecture Linter** to enforce or warn during development
- Readable by any connected MCP client (Claude, Cursor, custom agents)
- Stored in the builder's **Architecture Profile** for reuse on future projects

---

### Step 6 — ADR Generation

For every pattern decision, Klerchitect auto-generates an **Architecture Decision Record (ADR)** explaining:

- What pattern was chosen and why
- What alternatives were considered
- What trade-offs were accepted
- Under what conditions this decision should be revisited

This makes Klerchitect not just a generator but a **reasoning system** — it documents *why* structure decisions were made, not just what they are.

---

## Pattern + Architecture Quick Reference

| Pattern | Category | Best Coding Situation | Best Architecture Pairing |
|---|---|---|---|
| Singleton | Creational | Single shared resource (DB, config, logger) | Any — use sparingly |
| Factory Method | Creational | Multi-provider services | Clean, Vertical Slice |
| Abstract Factory | Creational | Multi-platform / multi-tenant families | DDD, Enterprise |
| Builder | Creational | Complex object construction | Any |
| Prototype | Creational | Expensive object cloning | Game / simulation systems |
| Adapter | Structural | Third-party API integration | Hexagonal, AI-Native |
| Facade | Structural | Simplify complex subsystems | Clean, Onion |
| Decorator | Structural | Dynamic responsibility addition | Vertical Slice, Microkernel |
| Proxy | Structural | Lazy loading, access control | Hexagonal, DDD |
| Composite | Structural | Tree-shaped data models | Microkernel, DDD |
| Bridge | Structural | Platform-agnostic abstractions | Hexagonal |
| Flyweight | Structural | High-volume memory optimization | Performance-critical services |
| Observer | Behavioral | Real-time / reactive state | Event-Driven, AI-Native |
| Strategy | Behavioral | Swappable algorithms/providers | Vertical Slice, AI-Native |
| Command | Behavioral | Undo, job queues, CQRS | CQRS, Event Sourcing |
| Mediator | Behavioral | Decouple many-to-many communication | Vertical Slice (MediatR) |
| Chain of Responsibility | Behavioral | Middleware pipelines | Clean, Hexagonal |
| Template Method | Behavioral | Step-based pipelines with shared skeleton | Event-Driven, Clean |
| State | Behavioral | Multi-step lifecycle / state machine | DDD, AI-Native |
| Iterator | Behavioral | Custom collection traversal | Any data-heavy system |
| Visitor | Behavioral | Non-destructive object graph operations | DDD, Compiler-style |
| Memento | Behavioral | Snapshot, undo, save/restore | Event Sourcing, CQRS |
| Interpreter | Behavioral | Custom DSL, rule engine, expression parser | DDD, AI-Native |

---

## Summary

Design patterns are micro-level tools that solve recurring problems inside a codebase. Klerchitect treats them as first-class citizens of architecture — not afterthoughts — by evaluating project requirements, architecture alignment, and complexity profile before recommending any pattern. The result is a **Pattern DNA Object** that serves as a living contract between the project's intent and its implementation, enforced by linting, surfaced through MCP, and documented through auto-generated ADRs.

The goal is not to use every pattern — it is to use the *right* patterns at the *right* time, with full awareness of trade-offs and exit conditions.
