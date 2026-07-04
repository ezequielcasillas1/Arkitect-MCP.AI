import type { PatternIntelligenceEntry } from "@arkitect/contracts";

const BASE = "https://refactoring.guru/design-patterns";

function refUrl(slug: string): string {
  return `${BASE}/${slug}`;
}

export const PATTERN_INTELLIGENCE: PatternIntelligenceEntry[] = [
  {
    patternId: "factory-method",
    intent:
      "Provide an interface for creating objects in a superclass but let subclasses decide which class to instantiate.",
    problem:
      "Code becomes coupled to concrete classes when new product variants must be added, forcing widespread edits and conditional branching.",
    solution:
      "Replace direct constructor calls with calls to a factory method whose return type is a common product interface; subclasses override the method to return a different concrete product.",
    applicability: [
      "Use when the exact types and dependencies of the objects you work with are not known in advance.",
      "Use when you want to let library or framework users extend internal components.",
      "Use when you want to save resources by reusing existing objects instead of rebuilding them."
    ],
    implementationSteps: [
      "Make all products follow the same interface with methods that make sense for every product.",
      "Add an empty factory method inside the creator class whose return type matches the product interface.",
      "Replace product constructor references in the creator with calls to the factory method, extracting creation into that method.",
      "Create creator subclasses for each product type and override the factory method in each.",
      "If the base factory method still holds shared logic, keep it as a default; otherwise mark it abstract."
    ],
    pros: [
      "Removes tight coupling between the creator and concrete products.",
      "Concentrates product-creation code in one place (Single Responsibility).",
      "Lets you introduce new product types without breaking existing client code (Open/Closed)."
    ],
    cons: [
      "Code can grow more complicated because you may need many new subclasses.",
      "Adds indirection that is overkill when only one product variant will ever exist."
    ],
    relations: [
      {
        targetPatternId: "abstract-factory",
        kind: "extends",
        rationale: "Abstract Factory classes are frequently built on top of a set of Factory Methods."
      },
      {
        targetPatternId: "prototype",
        kind: "alternative-to",
        rationale: "Prototype avoids inheritance-based creation but requires cloneable initialization."
      },
      {
        targetPatternId: "template-method",
        kind: "specialization-of",
        rationale: "Factory Method is a specialization of Template Method and can serve as one of its steps."
      },
      {
        targetPatternId: "iterator",
        kind: "often-paired-with",
        rationale: "Collections often expose factory methods that return matching iterator types."
      }
    ],
    solidAlignment: ["single-responsibility", "open-closed", "dependency-inversion"],
    antiPatternWarnings: [
      "Do not introduce factories that only wrap a single constructor forever — that is ceremony, not extensibility."
    ],
    referenceUrl: refUrl("factory-method"),
    complexityThreshold: "balanced"
  },
  {
    patternId: "abstract-factory",
    intent: "Produce families of related objects without specifying their concrete classes.",
    problem:
      "A system needs to build several related products together and stay consistent across product variants (themes, tenants, platforms) without hard-coding concrete choices.",
    solution:
      "Declare interfaces for each product in the family, declare an abstract factory that has a creation method for each product, and provide concrete factories per variant.",
    applicability: [
      "Use when your code needs to work with many families of related products and you want to avoid coupling to their concrete classes.",
      "Use when a class you write is meant to be extended with new families later.",
      "Consider it when you notice a class riddled with Factory Methods that all share the same variant selector."
    ],
    implementationSteps: [
      "Map out the matrix of distinct product types and their variants.",
      "Declare an abstract product interface for each product type.",
      "Declare the abstract factory interface with one creation method per product type.",
      "Create a concrete factory class per variant, implementing every creation method.",
      "Have client code depend on the abstract factory and inject the concrete factory at composition root."
    ],
    pros: [
      "Guarantees product families stay consistent with one another.",
      "Isolates concrete class code from the client (Open/Closed and Dependency Inversion).",
      "Simplifies swapping variants across the whole system in one place."
    ],
    cons: [
      "Introduces many new interfaces and classes; can feel heavy for narrow apps.",
      "Adding a new product to the family forces you to update every concrete factory."
    ],
    relations: [
      {
        targetPatternId: "factory-method",
        kind: "often-paired-with",
        rationale: "Concrete factories usually implement their operations with Factory Methods."
      },
      {
        targetPatternId: "prototype",
        kind: "often-paired-with",
        rationale: "Abstract factories can produce their products by cloning prototypes."
      },
      {
        targetPatternId: "builder",
        kind: "alternative-to",
        rationale: "Builder focuses on constructing a complex product step by step; Abstract Factory focuses on families."
      },
      {
        targetPatternId: "facade",
        kind: "often-paired-with",
        rationale: "A facade can hide the family selection behind a simpler subsystem entry point."
      }
    ],
    solidAlignment: ["open-closed", "dependency-inversion", "single-responsibility"],
    antiPatternWarnings: [
      "Avoid Abstract Factory when only one variant will ever be needed — a plain module of factory functions is enough."
    ],
    referenceUrl: refUrl("abstract-factory"),
    complexityThreshold: "structured"
  },
  {
    patternId: "builder",
    intent:
      "Construct complex objects step by step and produce different representations using the same construction code.",
    problem:
      "Objects with many optional fields lead to telescoping constructors, huge parameter lists, or a giant configurator class filled with conditionals.",
    solution:
      "Move construction into a Builder that exposes small step methods and returns the finished product; optionally use a Director to orchestrate common recipes.",
    applicability: [
      "Use when you must construct different representations of a product with the same steps.",
      "Use to get rid of a telescoping constructor with many optional parameters.",
      "Use when construction must run in stages with intermediate configuration."
    ],
    implementationSteps: [
      "Define construction steps that are common across all product variants and declare them in a builder interface.",
      "Create a concrete builder for each product representation, implementing every step.",
      "Give the builder a getResult method that returns the fully built product.",
      "Optionally add a Director class that encodes reusable construction sequences.",
      "Client code creates the builder, passes it to a director or drives it directly, then retrieves the product."
    ],
    pros: [
      "Lets you construct products step by step and reuse code across representations.",
      "Isolates complex construction from business logic (Single Responsibility).",
      "Supports fine-grained control over the construction process."
    ],
    cons: [
      "Overall complexity increases because the pattern adds multiple new classes.",
      "Overkill for objects with only a handful of fields."
    ],
    relations: [
      {
        targetPatternId: "abstract-factory",
        kind: "alternative-to",
        rationale: "Abstract Factory returns products immediately; Builder assembles them step by step."
      },
      {
        targetPatternId: "composite",
        kind: "often-paired-with",
        rationale: "Builders are a natural way to construct Composite trees."
      },
      {
        targetPatternId: "prototype",
        kind: "often-paired-with",
        rationale: "You can plug Prototype into a builder to clone parts of the product graph."
      }
    ],
    solidAlignment: ["single-responsibility", "open-closed"],
    antiPatternWarnings: [
      "Do not force Builder onto simple DTOs — object literals or a factory method are enough."
    ],
    referenceUrl: refUrl("builder"),
    complexityThreshold: "balanced"
  },
  {
    patternId: "prototype",
    intent:
      "Copy existing objects without making your code depend on their concrete classes.",
    problem:
      "Cloning an object from the outside forces callers to know its class and touch every field, and private fields make an accurate copy impossible.",
    solution:
      "Give the object itself a clone method that returns a copy; let all cloneable classes share a common prototype interface.",
    applicability: [
      "Use when your code should not depend on the concrete classes of objects you need to copy.",
      "Use to reduce a subclass hierarchy that differs only in the initial state of created objects.",
      "Use when constructing an object is more expensive than cloning a preconfigured one."
    ],
    implementationSteps: [
      "Create a prototype interface with a single clone method.",
      "Implement the clone method in each concrete class; typically start from a copy constructor.",
      "Optionally register commonly used prototypes in a central prototype registry.",
      "Client code clones a prototype and mutates only what it needs."
    ],
    pros: [
      "Cloning avoids coupling client code to concrete classes.",
      "Reuses complex preconfigured objects instead of rebuilding them.",
      "Produces variants of an object without deep subclass trees."
    ],
    cons: [
      "Cloning objects with circular references becomes tricky.",
      "Deep versus shallow copy semantics are easy to get wrong."
    ],
    relations: [
      {
        targetPatternId: "factory-method",
        kind: "alternative-to",
        rationale: "Prototype avoids inheritance but requires an initialized template object."
      },
      {
        targetPatternId: "abstract-factory",
        kind: "often-paired-with",
        rationale: "An Abstract Factory can produce family members by cloning prototypes."
      },
      {
        targetPatternId: "memento",
        kind: "often-paired-with",
        rationale: "Prototype can implement Memento snapshots when the object graph is deep."
      }
    ],
    solidAlignment: ["single-responsibility", "open-closed"],
    antiPatternWarnings: [
      "Do not use Prototype to work around missing dependency injection — clone semantics hide construction."
    ],
    referenceUrl: refUrl("prototype"),
    complexityThreshold: "structured"
  },
  {
    patternId: "singleton",
    intent:
      "Ensure a class has only one instance and provide a global access point to it.",
    problem:
      "Some infrastructure has one true instance (a config source, a database connection pool, a logger) but every caller keeps re-creating it or reaching for it through hidden globals.",
    solution:
      "Make the class own its single instance behind a private constructor and a static accessor that lazily initializes and returns the same object.",
    applicability: [
      "Use when a class must have exactly one instance available to every caller in the process.",
      "Use when stricter control over a shared global resource is required.",
      "Consider it only for infrastructure — never for domain logic."
    ],
    implementationSteps: [
      "Make the class constructor private (or module-scoped).",
      "Add a static field that will hold the single instance.",
      "Expose a static accessor that lazily creates the instance on first call and returns it thereafter.",
      "Make the accessor thread-safe if the runtime allows concurrent initialization."
    ],
    pros: [
      "Guarantees a single instance of the class.",
      "Provides a globally reachable access point.",
      "Lazy initialization defers creation cost until the object is really needed."
    ],
    cons: [
      "Violates Single Responsibility — the class both does its job and manages its lifetime.",
      "Hides dependencies and makes unit testing harder.",
      "Requires special care in multi-threaded environments."
    ],
    relations: [
      {
        targetPatternId: "facade",
        kind: "often-paired-with",
        rationale: "A Facade is frequently exposed as a Singleton because one instance is enough."
      },
      {
        targetPatternId: "abstract-factory",
        kind: "conflicts-with",
        rationale: "Overusing Singleton inside Abstract Factory kills family swapping."
      },
      {
        targetPatternId: "flyweight",
        kind: "alternative-to",
        rationale: "Flyweight can look like Singleton but returns many shared objects, not a single global one."
      }
    ],
    solidAlignment: [],
    antiPatternWarnings: [
      "Do not use Singleton for stateful business services — prefer explicit composition and injection.",
      "Avoid the Singleton-as-service-locator anti-pattern; it hides the dependency graph."
    ],
    referenceUrl: refUrl("singleton"),
    complexityThreshold: "minimal"
  },
  {
    patternId: "adapter",
    intent:
      "Allow objects with incompatible interfaces to collaborate by translating between them.",
    problem:
      "Existing client code expects one interface, but a valuable class or third-party library speaks a different one; changing either side is not desirable or possible.",
    solution:
      "Wrap the incompatible object in an adapter that implements the interface the client expects and delegates translated calls to the wrapped object.",
    applicability: [
      "Use when you want to use an existing class but its interface is not compatible with the rest of your code.",
      "Use to reuse several existing subclasses that lack a common feature that would otherwise require duplicating code.",
      "Use to insulate a stable core from a volatile third-party API."
    ],
    implementationSteps: [
      "Identify the target interface expected by the client and the adaptee interface that already exists.",
      "Create an adapter class that implements the target interface.",
      "Give the adapter a field holding the adaptee (or extend it in an object-adapter style).",
      "Implement each target-interface method by translating and delegating to the adaptee.",
      "Client code depends only on the target interface; concrete adaptee stays hidden."
    ],
    pros: [
      "Separates interface translation from primary business logic (Single Responsibility).",
      "Lets new adapters be introduced without breaking existing client code (Open/Closed).",
      "Enables reuse of valuable but incompatible classes."
    ],
    cons: [
      "Adds an extra layer of indirection.",
      "Sometimes it is simpler to change the service interface directly."
    ],
    relations: [
      {
        targetPatternId: "bridge",
        kind: "alternative-to",
        rationale: "Bridge is designed up front to separate abstractions and implementations; Adapter retrofits."
      },
      {
        targetPatternId: "decorator",
        kind: "alternative-to",
        rationale: "Decorator adds behavior while keeping the interface; Adapter changes the interface."
      },
      {
        targetPatternId: "facade",
        kind: "alternative-to",
        rationale: "Facade defines a new simplified interface; Adapter conforms to an existing one."
      },
      {
        targetPatternId: "proxy",
        kind: "often-paired-with",
        rationale: "A remote proxy often adapts a local interface to a network protocol at the same time."
      }
    ],
    solidAlignment: ["single-responsibility", "open-closed", "dependency-inversion"],
    antiPatternWarnings: [
      "Do not stack adapters on adapters — collapse them or fix the underlying interface mismatch."
    ],
    referenceUrl: refUrl("adapter"),
    complexityThreshold: "minimal"
  },
  {
    patternId: "bridge",
    intent:
      "Decouple an abstraction from its implementation so the two can vary independently.",
    problem:
      "A class hierarchy grows in two dimensions (e.g. shape × color, driver × platform), producing a combinatorial explosion of subclasses.",
    solution:
      "Split the hierarchy into an abstraction that holds a reference to an implementation interface; each side can evolve on its own axis.",
    applicability: [
      "Use to split a monolithic class that grows several parallel dimensions of variation.",
      "Use when you need to switch implementations at runtime.",
      "Use when both the abstraction and its implementation should be extensible via subclassing."
    ],
    implementationSteps: [
      "Identify the orthogonal dimensions (abstraction versus implementation) in the current class.",
      "Declare the implementation interface with the primitive operations the abstraction needs.",
      "Provide concrete implementations of that interface.",
      "Introduce an abstraction class that holds a reference to the implementation and delegates primitive calls.",
      "Extend abstraction and implementation independently going forward."
    ],
    pros: [
      "Lets abstraction and implementation change independently (Open/Closed).",
      "Follows Single Responsibility — high-level logic separated from platform details.",
      "Reduces subclass explosion in two-dimensional hierarchies."
    ],
    cons: [
      "Adds complexity even for classes with a single, cohesive dimension.",
      "Requires up-front insight into the axes of variation."
    ],
    relations: [
      {
        targetPatternId: "adapter",
        kind: "alternative-to",
        rationale: "Adapter reconciles existing interfaces; Bridge is designed in from the start."
      },
      {
        targetPatternId: "abstract-factory",
        kind: "often-paired-with",
        rationale: "An Abstract Factory can create the right implementation object for a Bridge abstraction."
      },
      {
        targetPatternId: "state",
        kind: "often-paired-with",
        rationale: "Bridge and State share the composition-over-inheritance mechanic."
      }
    ],
    solidAlignment: ["single-responsibility", "open-closed", "dependency-inversion"],
    antiPatternWarnings: [
      "Do not preemptively apply Bridge to hierarchies with only one axis of variation."
    ],
    referenceUrl: refUrl("bridge"),
    complexityThreshold: "structured"
  },
  {
    patternId: "composite",
    intent:
      "Compose objects into tree structures and treat individual objects and compositions uniformly.",
    problem:
      "Client code has to distinguish between a leaf item and a group of items even though the two should behave the same way from the outside.",
    solution:
      "Define a component interface that both leaves and composites implement; composites forward operations to their children.",
    applicability: [
      "Use when your core model can be represented as a tree.",
      "Use when clients should treat individual items and groups of items uniformly.",
      "Use for menus, file systems, graphics scenes, and org charts."
    ],
    implementationSteps: [
      "Design the component interface with operations that make sense for both leaves and composites.",
      "Create a leaf class implementing the interface.",
      "Create a composite class that holds child components and delegates operations recursively.",
      "Decide how child management (add/remove) lives — on the composite only or in the shared interface.",
      "Client code interacts with the component interface everywhere."
    ],
    pros: [
      "Simplifies client code by treating leaves and groups the same way.",
      "Follows Open/Closed — new component types plug in without changing clients.",
      "Naturally represents recursive part-whole hierarchies."
    ],
    cons: [
      "Hard to design a component interface when leaves and composites are very different.",
      "Can hide type errors if child rules are loose."
    ],
    relations: [
      {
        targetPatternId: "builder",
        kind: "often-paired-with",
        rationale: "Builders assemble complex Composite trees step by step."
      },
      {
        targetPatternId: "decorator",
        kind: "often-paired-with",
        rationale: "Decorators wrap composite nodes to add responsibilities."
      },
      {
        targetPatternId: "iterator",
        kind: "often-paired-with",
        rationale: "Iterators traverse Composite trees uniformly."
      },
      {
        targetPatternId: "visitor",
        kind: "often-paired-with",
        rationale: "Visitors add operations across Composite structures without changing element classes."
      },
      {
        targetPatternId: "chain-of-responsibility",
        kind: "often-paired-with",
        rationale: "Composite branches can serve as handler chains that bubble requests up the tree."
      }
    ],
    solidAlignment: ["open-closed", "liskov-substitution"],
    antiPatternWarnings: [
      "Do not force Composite when the domain is not really a tree."
    ],
    referenceUrl: refUrl("composite"),
    complexityThreshold: "balanced"
  },
  {
    patternId: "decorator",
    intent:
      "Attach additional responsibilities to an object dynamically by placing it inside a wrapper that shares the same interface.",
    problem:
      "You need to add cross-cutting behaviors (logging, caching, retries, formatting) to specific objects at runtime without freezing them into a single subclass.",
    solution:
      "Create decorator classes that implement the target interface, wrap a component, and augment behavior before or after delegating.",
    applicability: [
      "Use when you must assign extra behaviors to objects at runtime without changing their code.",
      "Use when inheritance can not solve the problem because behavior combinations are not known in advance.",
      "Use for cross-cutting concerns applied selectively."
    ],
    implementationSteps: [
      "Ensure the base component is defined by an interface, not a concrete class.",
      "Create a base decorator that implements the same interface and holds a reference to the wrapped component.",
      "Implement each concrete decorator that adds behavior around the delegated call.",
      "Compose decorators at the composition root by wrapping components in the required order.",
      "Client code depends only on the component interface."
    ],
    pros: [
      "Extends behavior without subclass explosion (Open/Closed).",
      "Combines multiple decorators at runtime for flexible feature stacks.",
      "Keeps every added responsibility in its own small class (Single Responsibility)."
    ],
    cons: [
      "Removing a specific decorator from the middle of a stack is awkward.",
      "Order of decorators can matter and be hard to debug.",
      "Many small classes to maintain."
    ],
    relations: [
      {
        targetPatternId: "adapter",
        kind: "alternative-to",
        rationale: "Adapter changes the interface; Decorator preserves it while adding behavior."
      },
      {
        targetPatternId: "composite",
        kind: "often-paired-with",
        rationale: "Composite and Decorator share the recursive-wrapping structure."
      },
      {
        targetPatternId: "chain-of-responsibility",
        kind: "alternative-to",
        rationale: "Both wrap chains of objects; Chain of Responsibility can stop propagation, Decorator always chains."
      },
      {
        targetPatternId: "strategy",
        kind: "often-paired-with",
        rationale: "Decorator changes an object's skin while Strategy changes its guts; the two often combine."
      },
      {
        targetPatternId: "proxy",
        kind: "alternative-to",
        rationale: "Proxy controls access to an object with a fixed contract; Decorator adds arbitrary responsibilities."
      }
    ],
    solidAlignment: ["single-responsibility", "open-closed"],
    antiPatternWarnings: [
      "Do not use Decorator for behaviors that must always be present — bake them into the component instead."
    ],
    referenceUrl: refUrl("decorator"),
    complexityThreshold: "balanced"
  },
  {
    patternId: "facade",
    intent:
      "Provide a unified, simplified interface to a set of interfaces in a complex subsystem.",
    problem:
      "Client code that needs a small subset of a large subsystem drags in dozens of classes and initialization steps, making callers fragile and hard to test.",
    solution:
      "Introduce a single class that exposes the operations clients actually need and hides all subsystem wiring behind it.",
    applicability: [
      "Use when you need a straightforward interface to a complex subsystem.",
      "Use when you want to structure a subsystem into layers by defining a Facade for each level.",
      "Use to reduce coupling between clients and third-party libraries."
    ],
    implementationSteps: [
      "Identify the small set of operations clients repeatedly need from the subsystem.",
      "Create a Facade class that owns references (or direct usage) of the subsystem classes.",
      "Implement each high-level operation as an orchestration of subsystem calls.",
      "Route client code exclusively through the facade.",
      "Optionally split into layered facades when responsibilities grow."
    ],
    pros: [
      "Isolates clients from subsystem complexity.",
      "Reduces coupling to volatile third-party or legacy code.",
      "Provides an obvious entry point for new contributors."
    ],
    cons: [
      "A facade can turn into a god object coupled to every subsystem class.",
      "Overuse can hide legitimate flexibility clients might need."
    ],
    relations: [
      {
        targetPatternId: "adapter",
        kind: "alternative-to",
        rationale: "Adapter conforms to an existing interface; Facade defines a new simpler one."
      },
      {
        targetPatternId: "abstract-factory",
        kind: "often-paired-with",
        rationale: "A Facade can hide selection between abstract factory variants."
      },
      {
        targetPatternId: "singleton",
        kind: "often-paired-with",
        rationale: "A stateless facade is often exposed as a singleton."
      },
      {
        targetPatternId: "mediator",
        kind: "alternative-to",
        rationale: "Facade exposes subsystem operations outward; Mediator coordinates peers inward."
      }
    ],
    solidAlignment: ["single-responsibility", "dependency-inversion"],
    antiPatternWarnings: [
      "Do not let the facade absorb business logic — keep it as an orchestration seam only."
    ],
    referenceUrl: refUrl("facade"),
    complexityThreshold: "minimal"
  },
  {
    patternId: "flyweight",
    intent:
      "Share fine-grained objects efficiently by separating intrinsic (shared) state from extrinsic (context-specific) state.",
    problem:
      "The app needs millions of small objects (particles, glyphs, tiles) and RAM usage explodes because most of their state is duplicated.",
    solution:
      "Extract the invariant intrinsic state into a shared flyweight and pass the varying extrinsic state as method arguments.",
    applicability: [
      "Use when an app must support many objects that would not fit into memory otherwise.",
      "Use when most object state can be extracted and shared between many contexts.",
      "Use for text rendering, particle systems, and game grids."
    ],
    implementationSteps: [
      "Split each object's fields into intrinsic (shared) and extrinsic (per-use) state.",
      "Create a Flyweight class that stores intrinsic state only and accepts extrinsic state as parameters.",
      "Add a Flyweight factory that caches and returns shared flyweights by their intrinsic key.",
      "Change client code to pass extrinsic state into flyweight methods rather than storing it on each object.",
      "Measure to confirm memory savings justify the added indirection."
    ],
    pros: [
      "Saves a lot of RAM when many similar objects are needed.",
      "Cleanly separates immutable, sharable state from context-specific state."
    ],
    cons: [
      "Trades RAM for CPU when extrinsic state must be recomputed constantly.",
      "Code complexity rises; new team members can miss the shared-state contract."
    ],
    relations: [
      {
        targetPatternId: "singleton",
        kind: "alternative-to",
        rationale: "Singleton returns one instance; Flyweight returns many shared, immutable instances."
      },
      {
        targetPatternId: "composite",
        kind: "often-paired-with",
        rationale: "Composite trees can use Flyweight for leaf objects that repeat with identical intrinsic state."
      },
      {
        targetPatternId: "state",
        kind: "often-paired-with",
        rationale: "State objects with no per-owner data can be safely implemented as flyweights."
      }
    ],
    solidAlignment: ["single-responsibility"],
    antiPatternWarnings: [
      "Do not apply Flyweight before profiling — premature sharing is a common source of bugs."
    ],
    referenceUrl: refUrl("flyweight"),
    complexityThreshold: "enterprise"
  },
  {
    patternId: "proxy",
    intent:
      "Provide a surrogate or placeholder for another object to control access to it.",
    problem:
      "You need to add cross-cutting control — lazy loading, access checks, remote invocation, caching — around an existing object without changing its clients or its code.",
    solution:
      "Create a proxy class that implements the same interface as the real object, holds a reference to it, and augments calls with the required control logic.",
    applicability: [
      "Use for lazy initialization of expensive objects (virtual proxy).",
      "Use for access control based on caller identity or permissions (protection proxy).",
      "Use to represent a remote object locally (remote proxy).",
      "Use to cache results of repeated identical calls (caching proxy).",
      "Use for logging or reference counting around service operations."
    ],
    implementationSteps: [
      "Ensure the real service is defined by an interface the client depends on.",
      "Create a proxy class that implements the same interface and holds a reference to the real service.",
      "Add the control logic (lazy init, auth, caching, logging) around the delegated calls.",
      "Return the proxy to clients through the composition root; the real service stays hidden.",
      "Consider a factory or DI container to swap real service and proxy transparently."
    ],
    pros: [
      "Controls access to the real service without the client knowing (Open/Closed).",
      "Manages lifecycle of expensive resources.",
      "Adds behavior even when you can not modify the real service."
    ],
    cons: [
      "Introduces indirection and possible latency.",
      "Response time can suffer if the proxy adds heavy work per call."
    ],
    relations: [
      {
        targetPatternId: "adapter",
        kind: "alternative-to",
        rationale: "Adapter changes the interface; Proxy keeps it identical."
      },
      {
        targetPatternId: "decorator",
        kind: "alternative-to",
        rationale: "Decorator adds arbitrary responsibilities; Proxy controls access with a fixed intent."
      },
      {
        targetPatternId: "facade",
        kind: "alternative-to",
        rationale: "Facade exposes a simplified interface; Proxy preserves the existing interface."
      }
    ],
    solidAlignment: ["single-responsibility", "open-closed", "dependency-inversion"],
    antiPatternWarnings: [
      "Do not layer multiple proxies without reason — collapse them into a single well-named control class."
    ],
    referenceUrl: refUrl("proxy"),
    complexityThreshold: "balanced"
  },
  {
    patternId: "chain-of-responsibility",
    intent:
      "Pass a request along a chain of handlers, letting each one decide to process it or forward it.",
    problem:
      "A single request has to run through many conditional checks (validation, authorization, logging, caching, business rules) and stuffing all of them into one method turns into an unmaintainable ladder of ifs.",
    solution:
      "Model each check or step as a handler with a common interface; each handler either processes the request or forwards it to the next handler in the chain.",
    applicability: [
      "Use when your program has to process various requests in various ways but the exact request set and order are not known ahead of time.",
      "Use when it is essential to execute several handlers in a specific order.",
      "Use when the set of handlers must be composed dynamically at runtime."
    ],
    implementationSteps: [
      "Declare a handler interface with a handle method and a way to set the next handler.",
      "Provide a base handler class that stores the next handler and forwards calls by default.",
      "Implement concrete handlers, each doing its check and either short-circuiting or delegating.",
      "At the composition root, wire handlers into the required order.",
      "Client code sends the request to the head of the chain only."
    ],
    pros: [
      "Follows Single Responsibility and Open/Closed — new handlers slot in without changing others.",
      "Order of processing is explicit and easy to reconfigure.",
      "Handlers can be reused across chains."
    ],
    cons: [
      "A request can go unhandled if the chain is misconfigured.",
      "Debugging a long chain is harder than debugging a single method."
    ],
    relations: [
      {
        targetPatternId: "command",
        kind: "often-paired-with",
        rationale: "Handlers often act on Command objects that carry the request context."
      },
      {
        targetPatternId: "composite",
        kind: "often-paired-with",
        rationale: "Composite trees can serve as chains where requests bubble up parent nodes."
      },
      {
        targetPatternId: "decorator",
        kind: "alternative-to",
        rationale: "Decorator always forwards; Chain of Responsibility can stop propagation."
      },
      {
        targetPatternId: "mediator",
        kind: "alternative-to",
        rationale: "Mediator centralizes coordination; Chain of Responsibility distributes it."
      }
    ],
    solidAlignment: ["single-responsibility", "open-closed"],
    antiPatternWarnings: [
      "Do not use Chain of Responsibility as a substitute for a sequential pipeline — that hides intent."
    ],
    referenceUrl: refUrl("chain-of-responsibility"),
    complexityThreshold: "balanced"
  },
  {
    patternId: "command",
    intent:
      "Encapsulate a request as an object, letting you parameterize clients, queue and log requests, and support undoable operations.",
    problem:
      "UI, workflow, or job code invokes business operations directly and can not be undone, retried, queued, or logged uniformly.",
    solution:
      "Turn each operation into a Command object with an execute (and optional undo) method; invokers depend only on the command interface.",
    applicability: [
      "Use to parameterize objects with operations (menus, buttons, hotkeys).",
      "Use to queue, schedule, or log operations.",
      "Use to support undo/redo, transactions, or macro operations."
    ],
    implementationSteps: [
      "Declare a Command interface with an execute method (and optionally undo).",
      "Create a concrete command for each operation, storing the receiver and any parameters.",
      "Change invokers to hold and execute commands instead of calling receivers directly.",
      "Optionally add an invoker that queues, logs, or replays commands.",
      "Add undo support by capturing state before execute and restoring it in undo."
    ],
    pros: [
      "Decouples invokers from receivers (Single Responsibility).",
      "Enables undo, redo, queuing, and logging uniformly (Open/Closed).",
      "Simple composition of macro commands from individual commands."
    ],
    cons: [
      "Can produce many small classes.",
      "Undo semantics can be non-trivial for operations with side effects."
    ],
    relations: [
      {
        targetPatternId: "chain-of-responsibility",
        kind: "often-paired-with",
        rationale: "Chain handlers frequently act on Command objects."
      },
      {
        targetPatternId: "memento",
        kind: "often-paired-with",
        rationale: "Memento provides undo state that Commands can restore."
      },
      {
        targetPatternId: "observer",
        kind: "often-paired-with",
        rationale: "Commands can be executed in response to Observer notifications."
      },
      {
        targetPatternId: "strategy",
        kind: "alternative-to",
        rationale: "Command encapsulates a request; Strategy encapsulates a decision algorithm."
      }
    ],
    solidAlignment: ["single-responsibility", "open-closed"],
    antiPatternWarnings: [
      "Do not use Command for one-shot operations with no undo, queue, or history need — it is extra ceremony."
    ],
    referenceUrl: refUrl("command"),
    complexityThreshold: "balanced"
  },
  {
    patternId: "iterator",
    intent:
      "Access the elements of a collection sequentially without exposing its underlying representation.",
    problem:
      "Different collection types (trees, graphs, streams) require different traversal code, and mixing traversal logic with client logic breaks abstraction.",
    solution:
      "Extract traversal into an Iterator object that exposes a small interface (next, hasNext) and hides how the collection is stored.",
    applicability: [
      "Use when your collection has a complex data structure you want to hide from clients.",
      "Use to provide several traversal strategies over the same collection.",
      "Use to give collections a uniform interface for traversal."
    ],
    implementationSteps: [
      "Declare an Iterator interface with methods to fetch the next element and check completion.",
      "Implement a concrete iterator for each traversal strategy your collection needs.",
      "Add a method to the collection that returns a fresh iterator.",
      "Clients traverse only through the iterator interface.",
      "Iterators encapsulate the current traversal state independently from the collection."
    ],
    pros: [
      "Cleans up client code by removing traversal logic (Single Responsibility).",
      "Different iterators over the same collection work in parallel.",
      "New traversals can be added without changing collection code (Open/Closed)."
    ],
    cons: [
      "Overkill for simple collections where language-native iteration is enough.",
      "Custom iterators can be less efficient than direct traversal."
    ],
    relations: [
      {
        targetPatternId: "composite",
        kind: "often-paired-with",
        rationale: "Iterators are the standard way to walk Composite trees."
      },
      {
        targetPatternId: "factory-method",
        kind: "often-paired-with",
        rationale: "Collections expose factory methods that create matching iterator types."
      },
      {
        targetPatternId: "visitor",
        kind: "often-paired-with",
        rationale: "Visitor and Iterator combine to walk a structure and apply operations to elements."
      }
    ],
    solidAlignment: ["single-responsibility", "open-closed"],
    antiPatternWarnings: [
      "Do not reinvent language-provided iteration primitives — build custom iterators only for real domain traversals."
    ],
    referenceUrl: refUrl("iterator"),
    complexityThreshold: "minimal"
  },
  {
    patternId: "mediator",
    intent:
      "Reduce chaotic dependencies between objects by making them communicate through a mediator instead of directly.",
    problem:
      "A cluster of UI components, services, or workflow steps all know about each other, producing a dense web of dependencies that resists change.",
    solution:
      "Introduce a mediator that owns the interaction rules; peers only know the mediator and send it events instead of calling each other.",
    applicability: [
      "Use when components are tightly coupled and their relationships are hard to reuse or reason about.",
      "Use to centralize workflow coordination in one place.",
      "Use when you want to reuse individual components without their existing peers."
    ],
    implementationSteps: [
      "Identify the group of tightly coupled components.",
      "Declare a mediator interface with methods components use to notify events.",
      "Implement a concrete mediator that receives events and orchestrates the peers.",
      "Change each component to depend on the mediator interface, not other components.",
      "Wire everything at a composition root or in a controller."
    ],
    pros: [
      "Decouples components from one another (Single Responsibility, Open/Closed).",
      "Centralizes control logic in one testable location.",
      "Improves reuse of individual components in new contexts."
    ],
    cons: [
      "The mediator itself can grow into a god object if not carefully scoped.",
      "Adds a layer of indirection to trace when debugging."
    ],
    relations: [
      {
        targetPatternId: "observer",
        kind: "alternative-to",
        rationale: "Observer broadcasts events; Mediator centralizes coordination — the two often blur."
      },
      {
        targetPatternId: "facade",
        kind: "alternative-to",
        rationale: "Facade exposes a subsystem outward; Mediator coordinates peers inward."
      },
      {
        targetPatternId: "chain-of-responsibility",
        kind: "alternative-to",
        rationale: "Chain distributes coordination; Mediator centralizes it."
      },
      {
        targetPatternId: "command",
        kind: "often-paired-with",
        rationale: "Mediators frequently execute Command objects to react to component events."
      }
    ],
    solidAlignment: ["single-responsibility", "open-closed"],
    antiPatternWarnings: [
      "Do not let the mediator absorb business rules unrelated to coordination."
    ],
    referenceUrl: refUrl("mediator"),
    complexityThreshold: "balanced"
  },
  {
    patternId: "memento",
    intent:
      "Capture and externalize an object's internal state without violating encapsulation so it can be restored later.",
    problem:
      "You need undo/redo, checkpoints, or history but exposing an object's private fields to a snapshot manager breaks encapsulation.",
    solution:
      "The originator produces a memento carrying its state; a caretaker stores mementos and hands them back to the originator when restoration is needed.",
    applicability: [
      "Use to implement undo/redo, rollback, or history features.",
      "Use when direct field access would expose private originator state to snapshot code.",
      "Use for save-game or checkpointing systems."
    ],
    implementationSteps: [
      "Identify the originator class whose state must be captured.",
      "Create a memento class that holds the state — friend-scoped or nested inside the originator to preserve encapsulation.",
      "Give the originator save and restore methods that create and consume mementos.",
      "Introduce a caretaker that stores the history of mementos without inspecting their content.",
      "Trigger save and restore from commands or UI actions."
    ],
    pros: [
      "Preserves originator encapsulation while enabling history features.",
      "Simplifies the originator by delegating snapshot management to a caretaker."
    ],
    cons: [
      "High memory cost if snapshots are large or frequent.",
      "Requires careful design of the memento boundary in languages without friend access."
    ],
    relations: [
      {
        targetPatternId: "command",
        kind: "often-paired-with",
        rationale: "Commands often store mementos to implement undo."
      },
      {
        targetPatternId: "prototype",
        kind: "alternative-to",
        rationale: "Prototype clones the whole object; Memento captures only the state needed to restore it."
      },
      {
        targetPatternId: "iterator",
        kind: "often-paired-with",
        rationale: "Iterators can use mementos to preserve traversal position across pauses."
      }
    ],
    solidAlignment: ["single-responsibility"],
    antiPatternWarnings: [
      "Do not implement Memento by making all fields public — that discards its main benefit."
    ],
    referenceUrl: refUrl("memento"),
    complexityThreshold: "structured"
  },
  {
    patternId: "observer",
    intent:
      "Define a one-to-many dependency so that when one object changes state, all its dependents are notified and updated automatically.",
    problem:
      "Consumers of a piece of state must stay in sync with it, and polling or hand-wiring notifications leads to tight coupling and missed updates.",
    solution:
      "Give the subject a subscription mechanism and a notify method; observers implement a common interface and register with the subject.",
    applicability: [
      "Use when changes to one object require changing others and the set of others is not known ahead of time.",
      "Use to react to state changes in a loosely coupled way.",
      "Use for pub/sub, event bus, or UI data-binding scenarios."
    ],
    implementationSteps: [
      "Declare a subscriber interface with an update method.",
      "Add subscribe, unsubscribe, and notify methods to the subject.",
      "Have the subject call notify whenever its state changes.",
      "Concrete subscribers implement update and react to the change.",
      "Consider passing the changed state (push) or letting subscribers pull it explicitly."
    ],
    pros: [
      "Follows Open/Closed — new subscribers plug in without changing the subject.",
      "Establishes relationships between objects at runtime.",
      "Enables reactive and event-driven architectures."
    ],
    cons: [
      "Subscribers are notified in an unpredictable order by default.",
      "Missed unsubscribe calls cause memory leaks."
    ],
    relations: [
      {
        targetPatternId: "mediator",
        kind: "alternative-to",
        rationale: "Mediator centralizes coordination; Observer broadcasts events without a central controller."
      },
      {
        targetPatternId: "command",
        kind: "often-paired-with",
        rationale: "Observers can dispatch Command objects to trigger downstream work."
      },
      {
        targetPatternId: "memento",
        kind: "often-paired-with",
        rationale: "Observers can capture mementos when subjects notify them of state changes."
      }
    ],
    solidAlignment: ["open-closed", "single-responsibility"],
    antiPatternWarnings: [
      "Do not let observer callbacks perform heavy work synchronously — offload to a queue when the subject is hot."
    ],
    referenceUrl: refUrl("observer"),
    complexityThreshold: "balanced"
  },
  {
    patternId: "state",
    intent:
      "Allow an object to alter its behavior when its internal state changes; the object appears to change its class.",
    problem:
      "State-dependent behavior is expressed as a giant conditional in one class that grows unmaintainable as states multiply.",
    solution:
      "Extract each state-specific behavior into its own class implementing a common state interface; the context delegates to the current state object.",
    applicability: [
      "Use when an object behaves very differently depending on its current state and the set of states is likely to change.",
      "Use to replace massive conditionals that switch on a state field.",
      "Use for workflow engines, protocol handlers, and finite state machines."
    ],
    implementationSteps: [
      "Declare a state interface that lists all behaviors that vary between states.",
      "Implement a concrete state class per state.",
      "Give the context a reference to the current state and delegate the varying behaviors to it.",
      "Let states transition the context to another state, or drive transitions from the context.",
      "Optionally make state instances flyweights when they have no per-context data."
    ],
    pros: [
      "Removes bulky conditionals (Single Responsibility, Open/Closed).",
      "Isolates state-specific behavior into cohesive classes.",
      "Makes state transitions explicit and testable."
    ],
    cons: [
      "Overkill when only a handful of states exist and they rarely change.",
      "Requires careful design of who owns state transitions."
    ],
    relations: [
      {
        targetPatternId: "strategy",
        kind: "alternative-to",
        rationale: "Strategy picks an algorithm; State represents where the object is in its lifecycle."
      },
      {
        targetPatternId: "flyweight",
        kind: "often-paired-with",
        rationale: "Stateless state objects can be shared as flyweights."
      },
      {
        targetPatternId: "bridge",
        kind: "often-paired-with",
        rationale: "Both use composition to decouple behavior from a fixed class hierarchy."
      }
    ],
    solidAlignment: ["single-responsibility", "open-closed"],
    antiPatternWarnings: [
      "Do not use State for objects with two or three states — a boolean or enum switch is clearer."
    ],
    referenceUrl: refUrl("state"),
    complexityThreshold: "structured"
  },
  {
    patternId: "strategy",
    intent:
      "Define a family of algorithms, encapsulate each one, and make them interchangeable at runtime.",
    problem:
      "A class contains several variants of the same behavior selected by a condition, and every new variant forces the class to grow.",
    solution:
      "Extract each variant into a strategy class that implements a common interface; the context delegates the behavior to the selected strategy.",
    applicability: [
      "Use when you want to swap different variants of an algorithm at runtime.",
      "Use to isolate business logic from the details of its implementation.",
      "Use to replace conditional statements that pick between similar algorithms."
    ],
    implementationSteps: [
      "Identify the algorithm that varies inside the context.",
      "Declare a strategy interface with the algorithm's method.",
      "Extract each variant into a concrete strategy class implementing the interface.",
      "Change the context to hold a reference to a strategy and delegate the operation to it.",
      "Let clients inject the strategy at construction or configuration time."
    ],
    pros: [
      "Swap algorithms at runtime without changing the context (Open/Closed).",
      "Isolates algorithm implementation from the caller (Single Responsibility).",
      "Replaces conditional branching with polymorphism."
    ],
    cons: [
      "Clients must know which strategy to pick.",
      "Introduces extra classes and interfaces."
    ],
    relations: [
      {
        targetPatternId: "state",
        kind: "alternative-to",
        rationale: "State represents lifecycle stages; Strategy picks an algorithm."
      },
      {
        targetPatternId: "decorator",
        kind: "often-paired-with",
        rationale: "Decorators change an object's skin while Strategy changes its guts."
      },
      {
        targetPatternId: "template-method",
        kind: "alternative-to",
        rationale: "Template Method uses inheritance to vary steps; Strategy uses composition to vary the algorithm."
      },
      {
        targetPatternId: "factory-method",
        kind: "often-paired-with",
        rationale: "Factories are a natural way to hand the right Strategy to the context."
      }
    ],
    solidAlignment: ["single-responsibility", "open-closed", "dependency-inversion"],
    antiPatternWarnings: [
      "Do not use Strategy for algorithms that will never vary — inline logic is clearer."
    ],
    referenceUrl: refUrl("strategy"),
    complexityThreshold: "minimal"
  },
  {
    patternId: "template-method",
    intent:
      "Define the skeleton of an algorithm in a base class and let subclasses override specific steps without changing the overall structure.",
    problem:
      "Multiple classes execute the same high-level algorithm but differ in a few individual steps; duplicating the skeleton is fragile and error prone.",
    solution:
      "Put the algorithm skeleton in a base class as a template method that calls step methods; let subclasses override the varying steps.",
    applicability: [
      "Use when subclasses need to extend only certain steps of an algorithm.",
      "Use when several classes contain nearly identical algorithms with a few differences.",
      "Use to enforce an invariant algorithm structure across variants."
    ],
    implementationSteps: [
      "Identify the algorithm and split it into a sequence of steps.",
      "Put the fixed skeleton in a template method on the base class and mark it non-overridable.",
      "Provide default implementations or leave some steps abstract so subclasses must implement them.",
      "Add optional hook methods for steps subclasses may override.",
      "Concrete subclasses fill in the abstract steps and optionally override hooks."
    ],
    pros: [
      "Removes duplication across variants of the same algorithm (Single Responsibility).",
      "Locks down the algorithm's structure while allowing controlled extension (Open/Closed)."
    ],
    cons: [
      "Rigid — subclasses can only vary predefined steps.",
      "Violates Liskov if subclasses subtly change algorithm semantics."
    ],
    relations: [
      {
        targetPatternId: "factory-method",
        kind: "specialization-of",
        rationale: "Factory Method is a common step in a Template Method."
      },
      {
        targetPatternId: "strategy",
        kind: "alternative-to",
        rationale: "Strategy uses composition to vary the whole algorithm; Template Method uses inheritance to vary steps."
      }
    ],
    solidAlignment: ["single-responsibility", "open-closed"],
    antiPatternWarnings: [
      "Do not build long inheritance chains around Template Method — prefer Strategy for wildly different algorithms."
    ],
    referenceUrl: refUrl("template-method"),
    complexityThreshold: "balanced"
  },
  {
    patternId: "visitor",
    intent:
      "Separate an algorithm from the object structure it operates on so new operations can be added without changing the structure.",
    problem:
      "You need to add many unrelated operations (exports, validations, metrics) over a stable object hierarchy, and adding a method for each on every class is invasive.",
    solution:
      "Define a visitor interface with a visit method per concrete element type; each element accepts a visitor and dispatches to the correct visit method (double dispatch).",
    applicability: [
      "Use when you need to perform many distinct and unrelated operations over an object structure.",
      "Use when the object structure rarely changes but new operations are added often.",
      "Use for compilers, static analyzers, and export/serialization pipelines."
    ],
    implementationSteps: [
      "Declare a visitor interface with a visit method per concrete element type.",
      "Add an accept method to every element that calls the appropriate visit method on a passed visitor.",
      "Implement each concrete visitor with the operation-specific logic per element type.",
      "Client code walks the structure and passes visitors into accept.",
      "New operations are added by creating new visitor classes only."
    ],
    pros: [
      "New operations are added without modifying element classes (Open/Closed).",
      "Concentrates related behavior into a single visitor (Single Responsibility).",
      "Enables operations that must interact with several element types."
    ],
    cons: [
      "Adding a new element type forces updates to every visitor.",
      "Double dispatch adds a mental hop compared to a plain method call."
    ],
    relations: [
      {
        targetPatternId: "composite",
        kind: "often-paired-with",
        rationale: "Visitors are the standard way to walk and operate over Composite structures."
      },
      {
        targetPatternId: "iterator",
        kind: "often-paired-with",
        rationale: "Iterators traverse the structure while a visitor performs the per-element work."
      },
      {
        targetPatternId: "interpreter",
        kind: "often-paired-with",
        rationale: "Interpreters use visitors to walk syntax trees and produce results."
      }
    ],
    solidAlignment: ["open-closed", "single-responsibility"],
    antiPatternWarnings: [
      "Do not use Visitor over an unstable element hierarchy — every new element ripples through visitors."
    ],
    referenceUrl: refUrl("visitor"),
    complexityThreshold: "enterprise"
  },
  {
    patternId: "interpreter",
    intent:
      "Given a language, define a representation for its grammar along with an interpreter that uses the representation to interpret sentences in the language.",
    problem:
      "Small domain languages (rules, filters, expressions) need to be parsed and evaluated but hard-coding a bespoke parser mixes grammar with business logic.",
    solution:
      "Model each grammar rule as a class implementing an interpret method; compose the classes into an abstract syntax tree that walks itself when interpreted.",
    applicability: [
      "Use when a simple grammar recurs often (search filters, rule engines, query DSLs).",
      "Use when efficiency is not critical and grammar clarity matters more.",
      "Use for programmable configuration surfaces."
    ],
    implementationSteps: [
      "Define an abstract expression interface with an interpret method that takes a context.",
      "Implement terminal expression classes for atomic grammar elements.",
      "Implement non-terminal expression classes that compose other expressions.",
      "Build an abstract syntax tree from parsed input.",
      "Call interpret on the root to evaluate the sentence against the context."
    ],
    pros: [
      "Grammar rules are explicit and easy to extend (Open/Closed).",
      "Each grammar rule has its own class (Single Responsibility)."
    ],
    cons: [
      "Class explosion for anything but trivial grammars.",
      "Parser or AST construction usually needs its own strategy on top of Interpreter."
    ],
    relations: [
      {
        targetPatternId: "visitor",
        kind: "often-paired-with",
        rationale: "Visitors are commonly used to evaluate or transform interpreter ASTs."
      },
      {
        targetPatternId: "composite",
        kind: "often-paired-with",
        rationale: "Interpreter ASTs are Composite trees of expression nodes."
      },
      {
        targetPatternId: "iterator",
        kind: "often-paired-with",
        rationale: "Iterators traverse AST nodes when the walk order must be controlled."
      }
    ],
    solidAlignment: ["single-responsibility", "open-closed"],
    antiPatternWarnings: [
      "Do not use Interpreter for large or performance-critical languages — reach for a real parser generator."
    ],
    referenceUrl: refUrl("interpreter"),
    complexityThreshold: "enterprise"
  }
];

const patternIntelligenceMap = new Map(PATTERN_INTELLIGENCE.map((entry) => [entry.patternId, entry]));

export function listPatternIntelligence() {
  return PATTERN_INTELLIGENCE;
}

export function getPatternIntelligenceEntry(patternId: PatternIntelligenceEntry["patternId"]) {
  return patternIntelligenceMap.get(patternId);
}
