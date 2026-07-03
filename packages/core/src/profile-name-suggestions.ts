import type { ProfileNameSuggestion, ProfileNameSuggestionInput } from "@arkitect/contracts";

interface NameCandidate {
  name: string;
  score: number;
  reason: string;
  source: ProfileNameSuggestion["source"];
}

function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeKey(value: string): string {
  return normalizeName(value).toLowerCase();
}

function basenameFromPath(repoPath: string): string {
  const segments = repoPath.replace(/\\/g, "/").split("/").filter(Boolean);
  return segments[segments.length - 1] ?? "project";
}

function resolveBaseName(input: ProfileNameSuggestionInput): string {
  if (input.repoName.trim()) {
    return normalizeName(input.repoName);
  }

  if (input.repoInspection?.repoName.trim()) {
    return normalizeName(input.repoInspection.repoName);
  }

  if (input.githubRoute?.target.repo) {
    return normalizeName(input.githubRoute.target.repo);
  }

  if (input.pendingGitHub?.fullName) {
    const segments = input.pendingGitHub.fullName.split("/");
    return normalizeName(segments[segments.length - 1] ?? input.pendingGitHub.fullName);
  }

  return normalizeName(basenameFromPath(input.repoPath));
}

function addCandidate(bucket: Map<string, NameCandidate>, candidate: NameCandidate) {
  const key = normalizeKey(candidate.name);
  const existing = bucket.get(key);

  if (!existing || candidate.score > existing.score) {
    bucket.set(key, candidate);
  }
}

function titleCase(value: string): string {
  return value
    .split(/[\s-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const stackHintRules: Array<{
  keywords: string[];
  suffix: string;
  reason: string;
}> = [
  { keywords: ["electron"], suffix: "desktop", reason: "Electron desktop shell detected." },
  { keywords: ["next", "nextjs"], suffix: "web", reason: "Next.js web stack detected." },
  { keywords: ["react"], suffix: "frontend", reason: "React frontend stack detected." },
  { keywords: ["wrangler", "cloudflare"], suffix: "edge", reason: "Cloudflare edge stack detected." },
  { keywords: ["vite"], suffix: "vite", reason: "Vite toolchain detected." },
  { keywords: ["turbo"], suffix: "turbo", reason: "Turborepo tooling detected." }
];

export function suggestProjectProfileNames(input: ProfileNameSuggestionInput): ProfileNameSuggestion[] {
  const baseName = resolveBaseName(input);
  const existing = new Set(input.existingProfileNames.map((name) => normalizeKey(name)));
  const bucket = new Map<string, NameCandidate>();

  addCandidate(bucket, {
    name: baseName,
    score: 0.95,
    reason: "Uses the current project label.",
    source: "repo-inspection"
  });

  if (input.routeSource === "local-path" && input.repoPath.trim()) {
    addCandidate(bucket, {
      name: `${baseName} local`,
      score: 0.88,
      reason: "Local filesystem route for this repo path.",
      source: "route-context"
    });
  }

  const githubTarget = input.githubRoute?.target;
  const pendingFullName = input.pendingGitHub?.fullName.trim();
  const pendingBranch = input.pendingGitHub?.branch.trim();
  const fullName = githubTarget?.fullName ?? pendingFullName;
  const branch = githubTarget?.branch ?? pendingBranch ?? "";
  const defaultBranch = githubTarget?.defaultBranch ?? "";

  if (input.routeSource === "github-api" && fullName) {
    addCandidate(bucket, {
      name: fullName,
      score: 0.9,
      reason: "GitHub repository full name.",
      source: "route-context"
    });

    if (branch) {
      addCandidate(bucket, {
        name: `${fullName.split("/").pop() ?? fullName} (${branch})`,
        score: branch !== defaultBranch ? 0.87 : 0.82,
        reason:
          branch !== defaultBranch
            ? `GitHub branch route on ${branch}.`
            : `GitHub default branch route on ${branch}.`,
        source: "route-context"
      });
    }
  }

  const inspectionText = [
    input.repoInspection?.summary ?? "",
    ...(input.repoInspection?.manifestFiles ?? []),
    ...(input.repoInspection?.frameworkHints ?? []),
    ...(input.repoInspection?.topLevelDirectories ?? [])
  ]
    .join(" ")
    .toLowerCase();

  const isMonorepo =
    inspectionText.includes("pnpm-workspace") ||
    inspectionText.includes("turbo.json") ||
    (input.repoInspection?.topLevelDirectories ?? []).some((dir) => ["apps", "packages"].includes(dir.toLowerCase()));

  if (isMonorepo) {
    addCandidate(bucket, {
      name: `${baseName} monorepo`,
      score: 0.84,
      reason: "Monorepo layout detected from inspection signals.",
      source: "stack-hint"
    });
  }

  for (const hint of input.repoInspection?.frameworkHints ?? []) {
    const normalizedHint = hint.toLowerCase();

    addCandidate(bucket, {
      name: `${baseName} ${normalizedHint}`,
      score: 0.8,
      reason: `Framework hint: ${hint}.`,
      source: "stack-hint"
    });
  }

  for (const rule of stackHintRules) {
    const matches = rule.keywords.filter(
      (keyword) =>
        inspectionText.includes(keyword) ||
        (input.repoInspection?.frameworkHints ?? []).some((hint) => hint.toLowerCase().includes(keyword))
    );

    if (matches.length === 0) {
      continue;
    }

    addCandidate(bucket, {
      name: `${baseName} ${rule.suffix}`,
      score: 0.78 + matches.length * 0.02,
      reason: rule.reason,
      source: "stack-hint"
    });
  }

  if (input.repoInspection?.hasGit) {
    addCandidate(bucket, {
      name: `${baseName} git`,
      score: 0.72,
      reason: "Git repository detected during inspection.",
      source: "repo-inspection"
    });
  }

  const displayBase = titleCase(baseName);

  return [...bucket.values()]
    .map((candidate) => ({
      ...candidate,
      name: candidate.name === baseName ? displayBase : candidate.name
    }))
    .filter((candidate) => candidate.name.length > 0 && !existing.has(normalizeKey(candidate.name)))
    .sort((left, right) => right.score - left.score || left.name.localeCompare(right.name))
    .slice(0, 6)
    .map((candidate) => ({
      name: candidate.name,
      reason: candidate.reason,
      confidence: Math.min(candidate.score, 0.98),
      source: candidate.source
    }));
}
