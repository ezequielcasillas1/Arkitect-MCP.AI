# Architect.Ai — Platform Architecture & System Design
### Formerly Klerchitect | The Architecture Layer for AI App Builders

---

## What Is Architect.Ai?

Architect.Ai is an MCP-native architecture platform that gives AI app builders a structured, intelligent way to design, generate, and enforce codebase architecture — before and during development. It operates at two levels simultaneously: **macro architecture** (how the entire system is structured) and **micro design patterns** (how individual problems inside that system are solved).

Rather than generating messy, frameworkless code, Architect.Ai produces structured, opinionated blueprints — folder structures, dependency maps, pattern sets, CI/CD scaffolds, and ADRs — that builders can trust as a foundation for real production systems.

Architect.Ai is not a code generator. It is an **architecture reasoning engine** with developer tooling built on top of it.

---

## Core Platform Layers

Architect.Ai is built across four interconnected layers:

```
┌──────────────────────────────────────────────────────────┐
│                   ARCHITECT.AI PLATFORM                  │
├──────────────────────────────────────────────────────────┤
│  Layer 4 — Delivery Surface                              │
│  Studio UI · CLI · VS Code Extension · REST API          │
├──────────────────────────────────────────────────────────┤
│  Layer 3 — MCP Tool Registry                             │
│  Tools · Resources · Prompts · Sampling                  │
├──────────────────────────────────────────────────────────┤
│  Layer 2 — Pattern Evaluation Engine                     │
│  Intake → Alignment Scan → Signal Detection →            │
│  Complexity Profile → Pattern DNA → ADR Generator        │
├──────────────────────────────────────────────────────────┤
│  Layer 1 — Architecture Blueprint Engine                 │
│  Macro Architecture · Remix Profiles · Dependency Maps   │
└──────────────────────────────────────────────────────────┘
```

---

## Layer 1 — Architecture Blueprint Engine

The Blueprint Engine is the core of Architect.Ai. Given a plain-text project description or structured manifest, it generates a full architecture blueprint — before a single line of code is written.

### What It Produces
- Complete folder and namespace structure aligned to the chosen architecture
- Dependency direction map (which modules depend on which)
- Layer responsibility definitions (what lives where and why)
- Naming convention contracts
- Module boundary rules and interface contracts

### Supported Architecture Patterns

| Pattern | Description |
|---|---|
| Vertical Slice Architecture | Organizes code by feature; each slice owns its full stack |
| Clean / Onion Architecture | Strict dependency inversion; inner layers are framework-agnostic |
| Hexagonal Architecture | Decouples core logic from I/O via explicit ports and adapters |
| Modular Monolith | Enforced module boundaries inside a single deployable unit |
| Minimal API Architecture | Thin, low-ceremony services for lightweight fast APIs |
| Domain-Driven Design (DDD) | Bounded contexts, aggregates, domain events, value objects |
| Event-Driven Architecture | Message queues, event sourcing, pub/sub patterns |
| Microservices Blueprint | Service boundary mapping and inter-service contracts |
| CQRS | Separate read and write models |
| Screaming Architecture | Folder structure that reflects the domain, not the framework |

### Influencer Remix Profiles

Architect.Ai formalizes community-proven hybrid patterns as selectable **Remix Profiles**:

| Remix Name | Patterns Combined | Best For |
|---|---|---|
| **The Martin Fowler Stack** | Layered + Repository + Domain Model + Service Layer | Enterprise SaaS, data-heavy apps |
| **The Uncle Bob Special** | Clean Architecture + SOLID + Screaming + Use-Case Driven | Framework-agnostic domain systems |
| **The Jimmy Bogard Slice** | Vertical Slice + MediatR + CQRS + Minimal Coupling | Feature-rich apps with diverse concerns |
| **The Vaughn Vernon DDD Remix** | DDD + Bounded Contexts + Event Sourcing + Hexagonal | Complex multi-domain business systems |
| **The Udi Dahan Messaging Mix** | Event-Driven + CQRS + Saga Pattern + Service Bus | Distributed, eventually consistent systems |
| **The Greg Young Event Machine** | Event Sourcing + CQRS + Append-Only + Projection Engine | Audit-heavy, financial, compliance systems |
| **The Neal Ford Hybrid Engine** | Microkernel + Event-Driven + Modular Monolith | Plugin-based platforms and extensible systems |
| **The Microsoft Azure Blend** | Gateway Aggregation + Strangler Fig + CQRS + Deployment Stamps | Legacy-to-cloud migration paths |
| **The AI-Native Stack** | Vertical Slice + MCP Tool Registry + Agent Services + Hexagonal | AI-powered SaaS, copilots, autonomous agents |
| **The Clean Slice Fusion** | Clean Architecture + Vertical Slice + DDD Tactical Patterns | Teams wanting feature isolation + clean domain |

---

## Layer 2 — Pattern Evaluation Engine

The Pattern Evaluation Engine is Architect.Ai's intelligence layer. It decides which micro-level design patterns to recommend, enforce, or defer for any given project by running a 6-step evaluation flow.

### Step 1 — Project Intake
Builder provides a project manifest via Studio UI, MCP Tool call, or CLI:
- App type (SaaS, API service, mobile backend, AI agent, CLI tool)
- Scale target (solo MVP → enterprise)
- Tech stack (Next.js, FastAPI, .NET, Node.js, etc.)
- Key requirements (multi-tenancy, real-time, payments, auth, AI integration)
- Selected architecture remix
- CI/CD and deployment targets

### Step 2 — Architecture Alignment Scan
Each architecture has a pre-mapped **pattern affinity set**:

| Architecture | High-Affinity Design Patterns |
|---|---|
| Clean Architecture | Factory, Adapter, Repository, Facade, Strategy |
| Vertical Slice | Mediator, Command, Strategy, Decorator |
| DDD + Hexagonal | Factory, Observer, Command, Visitor, Interpreter |
| Event-Driven | Observer, Command, Chain of Responsibility, Mediator |
| Event Sourcing + CQRS | Command, Memento, Observer, Iterator |
| Microkernel | Strategy, Composite, Facade, Decorator |
| AI-Native Stack | Adapter, Strategy, Observer, Facade, Mediator |

### Step 3 — Requirements Signal Detection
Scans declared requirements for pattern trigger signals:

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

### Step 4 — Complexity Profile Assignment

| Profile | Team | Scale | Pattern Depth |
|---|---|---|---|
| **Minimal** | Solo dev | MVP / prototype | Essential patterns only; over-engineering warnings active |
| **Balanced** | 1–5 devs | Early-stage SaaS | Moderate patterns — creational + core behavioral |
| **Structured** | 5–20 devs | Growth-stage | Full pattern library; structural patterns encouraged |
| **Enterprise** | 20+ devs | Large-scale | All patterns active; strict linter enforcement |

### Step 5 — Pattern DNA Output
The engine produces a **Pattern DNA Object** attached to every generated blueprint:

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

### Step 6 — ADR Generation
Every pattern and architecture decision produces an **Architecture Decision Record (ADR)** documenting:
- What was chosen and why
- Alternatives that were considered
- Trade-offs accepted
- Conditions that would trigger re-evaluation

---

## Layer 3 — MCP Tool Registry

Architect.Ai exposes its intelligence as a live **MCP (Model Context Protocol) server**, allowing any compatible AI client — Claude, Cursor, Windsurf, GPT-based agents, or custom agents — to call Architect.Ai tools directly from within their workflow.

### MCP Primitives Exposed

**Tools (callable functions):**
- `generate_blueprint` — scaffold full architecture from a stack + requirement description
- `validate_architecture` — check if existing code violates the chosen pattern's rules
- `suggest_pattern` — recommend best architecture for a described use case
- `map_dependencies` — visualize coupling, cohesion, and dependency direction
- `compare_patterns` — side-by-side trade-off analysis between two architectures
- `scaffold_cicd` — generate CI/CD pipeline config for a given stack and deployment target
- `generate_adr` — produce an Architecture Decision Record for any decision
- `detect_bottleneck` — identify pipeline or architecture stages causing throughput constraints

**Resources (readable data):**
- Architecture blueprint templates (by remix profile)
- Pattern DNA schemas
- ADR templates
- Stack-specific scaffold packs
- CI/CD pipeline templates (GitHub Actions, GitLab CI, Azure DevOps)

**Prompts (pre-built architecture prompts):**
- "Design a clean SaaS API using vertical slice for a solo developer"
- "Scaffold a DDD-based multi-tenant platform with event sourcing"
- "Build an AI agent backend using the AI-Native Stack remix"
- "Generate a CI/CD pipeline for a Next.js + Supabase app targeting Vercel"

### Multi-Agent Architecture Planner
Using MCP's sampling feature, Architect.Ai spawns specialized sub-agents for each concern:
- **Domain Agent** — models the business domain and bounded contexts
- **Data Agent** — designs the data layer, repository contracts, and persistence strategy
- **API Agent** — designs the API surface, versioning, and gateway patterns
- **CI/CD Agent** — scaffolds the pipeline from build to production deployment
- **Pattern Agent** — selects and validates micro-level design patterns

All sub-agents coordinate through the central Pattern Evaluation Engine to produce a unified, coherent architecture output.

---

## Layer 4 — Delivery Surfaces

Architect.Ai reaches builders through five surfaces:

| Surface | Description |
|---|---|
| **Architect.Ai Studio** | Web UI — visual blueprint design, pattern selection, ADR browser, dependency map viewer |
| **REST API** | Full programmatic access to all blueprint and pattern capabilities |
| **MCP Server** | Connect to Claude Desktop, Cursor, Windsurf, or any MCP-compatible AI client |
| **CLI Tool** | `arkitect init`, `arkitect validate`, `arkitect suggest`, `arkitect scaffold` |
| **VS Code Extension** | Live architecture guidance and linting inline while you code |

---

## CI/CD Pipeline Scaffolding

Architect.Ai generates complete CI/CD pipeline configurations as part of the blueprint output — not as an afterthought, but as a first-class architecture concern.

### What a Pipeline Scaffold Includes

A full Architect.Ai-generated CI/CD scaffold contains:

```
pipeline-scaffold/
├── .github/workflows/
│   ├── ci.yml              ← Build + test pipeline
│   ├── cd-staging.yml      ← Deploy to staging on merge to main
│   └── cd-production.yml   ← Deploy to production on release tag
├── docker/
│   ├── Dockerfile
│   └── .dockerignore
├── helm/ (if Kubernetes target)
│   ├── Chart.yaml
│   ├── values.yaml
│   └── templates/
├── scripts/
│   ├── build.sh
│   ├── test.sh
│   └── deploy.sh
└── .arkitect/
    ├── pipeline-manifest.json   ← Architect.Ai pipeline DNA
    └── adr/
        └── 001-pipeline-strategy.md
```

### Pipeline Stages Architect.Ai Scaffolds

**Continuous Integration (CI):**
1. Source trigger (push, PR, merge)
2. Dependency install + caching
3. Lint and static analysis
4. Unit tests (parallel by module/slice)
5. Integration tests
6. Security scanning (SAST, dependency audit)
7. Build and artifact creation
8. Artifact signing and digest pinning

**Continuous Delivery (CD):**
1. Artifact promotion (staging → production, never rebuild)
2. Environment-specific config injection
3. Deployment strategy execution (blue/green, canary, rolling)
4. Smoke tests and health checks post-deploy
5. Rollback gate — automatic if health checks fail
6. Observability hooks (metrics, tracing, alerting)

### Bottleneck Prevention Built In
Every generated pipeline includes parallel job execution, artifact caching layers, and environment promotion gates — all bottleneck-prevention patterns baked into the scaffold output. The `detect_bottleneck` MCP tool can analyze an existing pipeline and identify where throughput is constrained by slow stages, missing caching, or sequential jobs that could be parallelized.

### Immutable Artifact Principle
Architect.Ai enforces the **promote-always rule**: the same container image or compiled artifact that passes CI must be the exact object deployed to production. Scaffolds include artifact signing via Cosign/Notary and digest pinning in every generated Helm chart or deployment manifest.

---

## Architecture Linter

The Architect.Ai linter integrates into CI/CD pipelines as an MCP server that continuously checks whether code changes violate the chosen architecture's rules — like ESLint, but for system structure.

### What It Checks
- Dependency direction violations (e.g., domain layer importing from infrastructure)
- Feature slice boundary breaches (e.g., one slice directly importing from another)
- Pattern misuse detection (e.g., Singleton abuse in service layers)
- Naming convention drift from the blueprint contract
- Layer responsibility violations (e.g., business logic in controllers)

### Integration Points
- GitHub Actions / GitLab CI — runs as a pipeline step, fails build on critical violations
- VS Code Extension — real-time inline warnings as you code
- MCP Tool — `validate_architecture` callable from any AI client

---

## Architecture Profile Store

Builders save their project configurations as reusable **Architecture Profiles**:

```json
{
  "profileName": "My Standard SaaS Stack",
  "architectureRemix": "The Clean Slice Fusion",
  "complexityProfile": "Balanced",
  "stack": "Next.js + Supabase + TypeScript",
  "cicdTarget": "GitHub Actions → Vercel",
  "preferredPatterns": ["Mediator", "Strategy", "Adapter", "Decorator"],
  "suppressedWarnings": [],
  "lastUsed": "2026-05-26"
}
```

Profiles are portable across Architect.Ai Studio, CLI, and MCP clients — a builder's preferences follow them everywhere.

---

## Pattern Migration Advisor

One of Architect.Ai's most unique capabilities: detecting when a codebase has **outgrown its current architecture** and providing a step-by-step migration path.

### Migration Paths Supported

| From | To | Trigger Signals |
|---|---|---|
| Monolith | Modular Monolith | Team grows beyond 5, feature coupling increasing |
| Modular Monolith | Microservices | Independent scaling needs, team autonomy required |
| Layered Architecture | Clean Architecture | Framework coupling causing test friction |
| Vertical Slice | DDD + Bounded Contexts | Domain complexity growing beyond simple CRUD |
| REST API | Event-Driven | Async requirements, saga-style workflows emerging |
| Custom CI/CD | Standardized Scaffold | Pipeline drift, inconsistent environments detected |

Each migration path includes incremental steps, risk ratings, and rollback strategies.

---

## Product Modules

| Module | Description |
|---|---|
| **Architect.Ai Core** | Blueprint Engine + Pattern Evaluation Engine |
| **Architect.Ai MCP** | MCP Server + Tool Registry for AI client integration |
| **Architect.Ai Patterns** | Full design pattern library with tagging and affinity maps |
| **Architect.Ai Flows** | CI/CD scaffold generation and pipeline architecture |
| **Architect.Ai SDK** | Programmatic access to all engine capabilities |
| **Architect.Ai Studio** | Visual web UI for blueprint design and ADR management |

---

## Positioning

**What Architect.Ai is:**
An architecture reasoning engine and MCP-native developer platform for AI app builders who want clean, modular, scalable application foundations instead of raw generated code.

**Who it is for:**
- AI-assisted developers (vibe coders, solo builders, small teams)
- Software architects who want to encode their standards as reusable profiles
- Development teams building on top of AI agents and MCP-compatible clients
- Enterprises needing architecture governance across multiple products

**One-liner:**
> Architect.Ai — Design your codebase before you generate code.

---

## Summary

Architect.Ai is a four-layer platform: a Blueprint Engine that produces macro architecture structures, a Pattern Evaluation Engine that selects micro-level design patterns intelligently, an MCP Tool Registry that connects the platform to any AI client, and delivery surfaces (Studio, API, CLI, VS Code) that meet builders where they work. CI/CD pipeline scaffolding, architecture linting, ADR generation, bottleneck detection, and migration advisory are all first-class capabilities — not bolt-ons. The goal is to make good architecture the default, not the exception.
