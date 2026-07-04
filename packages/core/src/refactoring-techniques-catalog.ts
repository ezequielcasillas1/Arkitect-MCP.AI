import type {
  RefactoringSmellId,
  RefactoringTechnique,
  RefactoringTechniqueCategory
} from "@arkitect/contracts";

const BASE = "https://refactoring.guru/refactoring/techniques";

const CATEGORY_LABELS: Record<RefactoringTechniqueCategory, string> = {
  "composing-methods": "Composing Methods",
  "moving-features": "Moving Features between Objects",
  "organizing-data": "Organizing Data",
  "simplifying-conditionals": "Simplifying Conditional Expressions",
  "simplifying-method-calls": "Simplifying Method Calls",
  "dealing-with-generalization": "Dealing with Generalization"
};

function technique(
  id: string,
  name: string,
  category: RefactoringTechniqueCategory,
  slug: string,
  summary: string,
  addressesSmells: RefactoringSmellId[]
): RefactoringTechnique {
  return {
    id,
    name,
    category,
    categoryLabel: CATEGORY_LABELS[category],
    summary,
    referenceUrl: `${BASE}/${category}/${slug}`,
    addressesSmells
  };
}

export const REFACTORING_TECHNIQUES: RefactoringTechnique[] = [
  technique(
    "extract-method",
    "Extract Method",
    "composing-methods",
    "extract-method",
    "Turn a code fragment into its own method with a name that explains its purpose.",
    ["long-methods", "duplicate-code", "mixed-responsibilities"]
  ),
  technique(
    "inline-method",
    "Inline Method",
    "composing-methods",
    "inline-method",
    "Replace calls to a method with the body of the method itself when indirection adds no clarity.",
    ["long-methods"]
  ),
  technique(
    "extract-variable",
    "Extract Variable",
    "composing-methods",
    "extract-variable",
    "Replace an expression with a variable that carries a meaningful name.",
    ["long-methods", "primitive-obsession"]
  ),
  technique(
    "replace-temp-with-query",
    "Replace Temp with Query",
    "composing-methods",
    "replace-temp-with-query",
    "Replace temporary variables with a method call when the expression is reusable.",
    ["long-methods", "duplicate-code"]
  ),
  technique(
    "split-temporary-variable",
    "Split Temporary Variable",
    "composing-methods",
    "split-temporary-variable",
    "Split one temporary that holds unrelated values into separate variables.",
    ["long-methods", "mixed-responsibilities"]
  ),
  technique(
    "replace-method-with-method-object",
    "Replace Method with Method Object",
    "composing-methods",
    "replace-method-with-method-object",
    "Move a long method into a dedicated class when local variables block extraction.",
    ["long-methods", "god-class"]
  ),
  technique(
    "substitute-algorithm",
    "Substitute Algorithm",
    "composing-methods",
    "substitute-algorithm",
    "Replace a complex algorithm with a clearer or more efficient one.",
    ["long-methods", "duplicate-code"]
  ),
  technique(
    "move-method",
    "Move Method",
    "moving-features",
    "move-method",
    "Move a method to the class that uses it most or owns the data it needs.",
    ["feature-envy", "god-class", "architectural-drift"]
  ),
  technique(
    "move-field",
    "Move Field",
    "moving-features",
    "move-field",
    "Move a field to the class that uses it most.",
    ["feature-envy", "architectural-drift"]
  ),
  technique(
    "extract-class",
    "Extract Class",
    "moving-features",
    "extract-class",
    "Split one class doing two jobs into two focused classes.",
    ["god-class", "mixed-responsibilities", "spaghetti-structure"]
  ),
  technique(
    "inline-class",
    "Inline Class",
    "moving-features",
    "inline-class",
    "Merge a class that no longer pulls its weight into another class.",
    ["god-class", "architectural-drift"]
  ),
  technique(
    "hide-delegate",
    "Hide Delegate",
    "moving-features",
    "hide-delegate",
    "Hide delegation behind a method on the owning class to reduce coupling.",
    ["tight-coupling", "feature-envy"]
  ),
  technique(
    "remove-middle-man",
    "Remove Middle Man",
    "moving-features",
    "remove-middle-man",
    "Remove a class that only delegates when clients can call the delegate directly.",
    ["tight-coupling", "god-class"]
  ),
  technique(
    "encapsulate-field",
    "Encapsulate Field",
    "organizing-data",
    "encapsulate-field",
    "Make a field private and expose access through methods.",
    ["primitive-obsession", "architectural-drift"]
  ),
  technique(
    "encapsulate-collection",
    "Encapsulate Collection",
    "organizing-data",
    "encapsulate-collection",
    "Return a read-only view of a collection instead of the collection itself.",
    ["tight-coupling", "architectural-drift"]
  ),
  technique(
    "replace-magic-number",
    "Replace Magic Number with Symbolic Constant",
    "organizing-data",
    "replace-magic-number-with-symbolic-constant",
    "Replace unexplained numeric literals with named constants.",
    ["primitive-obsession", "long-methods"]
  ),
  technique(
    "replace-type-code-with-class",
    "Replace Type Code with Class",
    "organizing-data",
    "replace-type-code-with-class",
    "Replace a type code with a class when behavior attaches to the code.",
    ["primitive-obsession", "switch-statements"]
  ),
  technique(
    "replace-type-code-with-subclasses",
    "Replace Type Code with Subclasses",
    "organizing-data",
    "replace-type-code-with-subclasses",
    "Replace type-code branching with subclasses when behavior varies by type.",
    ["switch-statements", "deep-inheritance"]
  ),
  technique(
    "replace-type-code-with-state-strategy",
    "Replace Type Code with State/Strategy",
    "organizing-data",
    "replace-type-code-with-state-strategy",
    "Replace type-code branching with state or strategy objects.",
    ["switch-statements", "mixed-responsibilities"]
  ),
  technique(
    "introduce-parameter-object",
    "Introduce Parameter Object",
    "organizing-data",
    "introduce-parameter-object",
    "Group a long parameter list into a single object.",
    ["long-methods", "tight-coupling"]
  ),
  technique(
    "decompose-conditional",
    "Decompose Conditional",
    "simplifying-conditionals",
    "decompose-conditional",
    "Extract complex condition branches into well-named methods.",
    ["long-methods", "switch-statements"]
  ),
  technique(
    "consolidate-conditional-expression",
    "Consolidate Conditional Expression",
    "simplifying-conditionals",
    "consolidate-conditional-expression",
    "Merge duplicate conditional logic into a single expression.",
    ["duplicate-code", "long-methods"]
  ),
  technique(
    "replace-conditional-with-polymorphism",
    "Replace Conditional with Polymorphism",
    "simplifying-conditionals",
    "replace-conditional-with-polymorphism",
    "Replace type-based conditionals with polymorphic dispatch.",
    ["switch-statements", "mixed-responsibilities"]
  ),
  technique(
    "replace-nested-conditional-with-guard-clauses",
    "Replace Nested Conditional with Guard Clauses",
    "simplifying-conditionals",
    "replace-nested-conditional-with-guard-clauses",
    "Flatten nested conditionals with early returns.",
    ["long-methods", "spaghetti-structure"]
  ),
  technique(
    "introduce-null-object",
    "Introduce Null Object",
    "simplifying-conditionals",
    "introduce-null-object",
    "Replace null checks with a null object that provides safe default behavior.",
    ["long-methods", "spaghetti-structure"]
  ),
  technique(
    "rename-method",
    "Rename Method",
    "simplifying-method-calls",
    "rename-method",
    "Rename a method so its name reflects what it actually does.",
    ["long-methods", "architectural-drift"]
  ),
  technique(
    "separate-query-from-modifier",
    "Separate Query from Modifier",
    "simplifying-method-calls",
    "separate-query-from-modifier",
    "Split a method that returns a value and changes state into separate methods.",
    ["mixed-responsibilities", "long-methods"]
  ),
  technique(
    "replace-constructor-with-factory-method",
    "Replace Constructor with Factory Method",
    "simplifying-method-calls",
    "replace-constructor-with-factory-method",
    "Replace a complex constructor with a factory that expresses intent.",
    ["tight-coupling", "primitive-obsession"]
  ),
  technique(
    "pull-up-method",
    "Pull Up Method",
    "dealing-with-generalization",
    "pull-up-method",
    "Move identical methods from subclasses into a superclass.",
    ["duplicate-code", "deep-inheritance"]
  ),
  technique(
    "push-down-method",
    "Push Down Method",
    "dealing-with-generalization",
    "push-down-method",
    "Move behavior from a superclass to the subclass that uses it.",
    ["deep-inheritance", "god-class"]
  ),
  technique(
    "extract-superclass",
    "Extract Superclass",
    "dealing-with-generalization",
    "extract-superclass",
    "Extract shared behavior from two classes into a superclass.",
    ["duplicate-code", "god-class"]
  ),
  technique(
    "extract-interface",
    "Extract Interface",
    "dealing-with-generalization",
    "extract-interface",
    "Extract an interface from a class to reduce coupling to concrete types.",
    ["tight-coupling", "architectural-drift"]
  ),
  technique(
    "form-template-method",
    "Form Template Method",
    "dealing-with-generalization",
    "form-template-method",
    "Structure an algorithm skeleton in a superclass with overridable steps.",
    ["duplicate-code", "deep-inheritance"]
  ),
  technique(
    "replace-inheritance-with-delegation",
    "Replace Inheritance with Delegation",
    "dealing-with-generalization",
    "replace-inheritance-with-delegation",
    "Replace inheritance with composition when subclassing is too rigid.",
    ["deep-inheritance", "tight-coupling"]
  ),
  technique(
    "replace-delegation-with-inheritance",
    "Replace Delegation with Inheritance",
    "dealing-with-generalization",
    "replace-delegation-with-inheritance",
    "Replace delegation with inheritance when the whole delegate API is used.",
    ["deep-inheritance"]
  )
];

export function listRefactoringTechniques(category?: RefactoringTechniqueCategory): RefactoringTechnique[] {
  if (!category) {
    return [...REFACTORING_TECHNIQUES];
  }

  return REFACTORING_TECHNIQUES.filter((entry) => entry.category === category);
}

export function getRefactoringTechniqueById(id: string): RefactoringTechnique | undefined {
  return REFACTORING_TECHNIQUES.find((entry) => entry.id === id);
}

export function getRefactoringCategoryLabels(): Array<{ id: RefactoringTechniqueCategory; label: string; techniqueCount: number }> {
  return (Object.keys(CATEGORY_LABELS) as RefactoringTechniqueCategory[]).map((id) => ({
    id,
    label: CATEGORY_LABELS[id],
    techniqueCount: REFACTORING_TECHNIQUES.filter((entry) => entry.category === id).length
  }));
}
