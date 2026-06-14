import type {
  GitHubApiError,
  GitHubRouteInput,
  GitHubRoutePayload,
  GitHubTokenValidation,
  RepoInspection
} from "@arkitect/contracts";

const apiBase = "https://api.github.com";
const tokenPrefixes = ["ghp_", "github_pat_", "gho_", "ghu_", "ghs_", "ghr_"];
const manifestCandidates = new Set([
  "package.json",
  "pnpm-workspace.yaml",
  "tsconfig.json",
  "vite.config.ts",
  "vite.config.js",
  "next.config.js",
  "next.config.mjs",
  "next.config.ts",
  "wrangler.toml",
  "wrangler.jsonc",
  "Cargo.toml",
  "go.mod",
  "pyproject.toml",
  "requirements.txt"
]);
const frameworkHints = ["electron", "tauri", "react", "next", "vite", "wrangler", "express", "fastify", "nest"];

interface GitHubRepoApiRecord {
  name: string;
  full_name: string;
  private: boolean;
  default_branch: string;
  description: string | null;
  html_url: string;
  visibility: string;
  pushed_at: string | null;
  language: string | null;
}

interface GitHubContentApiRecord {
  name: string;
  type: "file" | "dir" | "submodule" | "symlink";
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function createApiError(code: GitHubApiError["code"], message: string, status?: number): GitHubApiError {
  return { code, message, status };
}

function classifyHttpError(status: number, response: Response, fallback: string): GitHubApiError {
  if (status === 401) {
    return createApiError("unauthorized", "GitHub token was rejected. Check PAT value and scopes.", status);
  }

  if (status === 404) {
    return createApiError("repo_not_found", "Repository or branch was not found with the provided target.", status);
  }

  if (status === 403) {
    const remaining = response.headers.get("x-ratelimit-remaining");
    if (remaining === "0") {
      const resetEpoch = Number(response.headers.get("x-ratelimit-reset") ?? "0");
      const retryAfterSeconds = Number.isFinite(resetEpoch) && resetEpoch > 0 ? Math.max(resetEpoch - Math.floor(Date.now() / 1000), 0) : undefined;
      return {
        code: "rate_limited",
        message: "GitHub API rate limit reached for this token.",
        status,
        retryAfterSeconds
      };
    }

    return createApiError("forbidden", "GitHub API access is forbidden for this repository.", status);
  }

  return createApiError("unknown_error", fallback, status);
}

export interface GitHubClientOptions {
  apiBase?: string;
}

async function requestGitHub<T>(path: string, token: string, clientOptions?: GitHubClientOptions): Promise<T> {
  const resolvedApiBase = clientOptions?.apiBase ?? apiBase;
  let response: Response;
  try {
    response = await fetch(`${resolvedApiBase}${path}`, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "arkitect-desktop"
      }
    });
  } catch {
    throw createApiError("network_error", "GitHub API network request failed.");
  }

  if (!response.ok) {
    throw classifyHttpError(response.status, response, `GitHub request failed for ${path}.`);
  }

  return (await response.json()) as T;
}

export function validateGitHubTokenFormat(rawToken: string): GitHubTokenValidation {
  const normalizedToken = rawToken.trim();

  if (!normalizedToken) {
    return {
      valid: false,
      normalizedToken,
      reason: "Personal Access Token is required."
    };
  }

  if (!tokenPrefixes.some((prefix) => normalizedToken.startsWith(prefix)) && normalizedToken.length < 20) {
    return {
      valid: false,
      normalizedToken,
      reason: "Token format looks too short for a GitHub PAT."
    };
  }

  return {
    valid: true,
    normalizedToken
  };
}

async function fetchDirectorySamples(
  token: string,
  owner: string,
  repo: string,
  branch: string,
  directories: string[],
  clientOptions?: GitHubClientOptions
) {
  const samplePaths: string[] = [];

  for (const directory of directories.slice(0, 3)) {
    try {
      const records = await requestGitHub<GitHubContentApiRecord[]>(
        `/repos/${owner}/${repo}/contents/${encodeURIComponent(directory)}?ref=${encodeURIComponent(branch)}`,
        token,
        clientOptions
      );
      samplePaths.push(...records.slice(0, 6).map((entry) => `${directory}/${entry.name}`));
    } catch {
      continue;
    }
  }

  return unique(samplePaths).sort((left, right) => left.localeCompare(right));
}

export async function fetchGitHubRoutePayload(
  input: GitHubRouteInput,
  clientOptions?: GitHubClientOptions
): Promise<GitHubRoutePayload> {
  const tokenValidation = validateGitHubTokenFormat(input.token);
  if (!tokenValidation.valid) {
    throw createApiError("invalid_token_format", tokenValidation.reason ?? "Invalid GitHub PAT format.");
  }

  const owner = input.owner.trim();
  const repo = input.repo.trim();
  if (!owner || !repo) {
    throw createApiError("repo_not_found", "Owner and repository are required.");
  }

  const repoRecord = await requestGitHub<GitHubRepoApiRecord>(
    `/repos/${owner}/${repo}`,
    tokenValidation.normalizedToken,
    clientOptions
  );

  const branch = input.branch?.trim() || repoRecord.default_branch;
  if (branch !== repoRecord.default_branch) {
    try {
      await requestGitHub(
        `/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}`,
        tokenValidation.normalizedToken,
        clientOptions
      );
    } catch (error) {
      if ((error as GitHubApiError).code === "repo_not_found") {
        throw createApiError("branch_not_found", `Branch "${branch}" was not found for ${owner}/${repo}.`, 404);
      }
      throw error;
    }
  }

  const rootContents = await requestGitHub<GitHubContentApiRecord[]>(
    `/repos/${owner}/${repo}/contents?ref=${encodeURIComponent(branch)}`,
    tokenValidation.normalizedToken,
    clientOptions
  );

  const topLevelDirectories = rootContents.filter((entry) => entry.type === "dir").map((entry) => entry.name);
  const topLevelFiles = rootContents.filter((entry) => entry.type === "file").map((entry) => entry.name);
  const manifestFiles = topLevelFiles.filter((fileName) => manifestCandidates.has(fileName));
  const samplePaths = await fetchDirectorySamples(
    tokenValidation.normalizedToken,
    owner,
    repo,
    branch,
    topLevelDirectories,
    clientOptions
  );
  const frameworkSignals = unique(
    [...manifestFiles, ...topLevelDirectories, ...samplePaths].filter((value) =>
      frameworkHints.some((hint) => value.toLowerCase().includes(hint))
    )
  );
  const detectedMarkers = unique([
    ...manifestFiles,
    ...samplePaths.filter((value) =>
      ["features", "domain", "application", "infrastructure", "packages", "apps", "worker"].some((marker) =>
        value.includes(marker)
      )
    )
  ]);

  return {
    source: "github-api",
    authMode: "personal-access-token",
    target: {
      owner,
      repo,
      fullName: repoRecord.full_name,
      branch,
      defaultBranch: repoRecord.default_branch,
      private: repoRecord.private,
      visibility: repoRecord.visibility,
      htmlUrl: repoRecord.html_url,
      description: repoRecord.description ?? undefined,
      primaryLanguage: repoRecord.language ?? undefined,
      pushedAt: repoRecord.pushed_at ?? undefined
    },
    signals: {
      topLevelDirectories: topLevelDirectories.sort((left, right) => left.localeCompare(right)),
      topLevelFiles: topLevelFiles.sort((left, right) => left.localeCompare(right)),
      manifestFiles: manifestFiles.sort((left, right) => left.localeCompare(right)),
      samplePaths,
      frameworkHints: frameworkSignals,
      detectedMarkers,
      summary: `Connected ${repoRecord.full_name} on branch ${branch} with ${manifestFiles.length} manifest file(s).`
    }
  };
}

export function githubRouteToRepoInspection(payload: GitHubRoutePayload): RepoInspection {
  return {
    source: "github-api",
    path: `${payload.target.htmlUrl}#${payload.target.branch}`,
    repoName: payload.target.fullName,
    exists: true,
    isDirectory: true,
    hasGit: true,
    topLevelDirectories: payload.signals.topLevelDirectories,
    topLevelFiles: payload.signals.topLevelFiles,
    manifestFiles: payload.signals.manifestFiles,
    samplePaths: payload.signals.samplePaths,
    frameworkHints: payload.signals.frameworkHints,
    detectedMarkers: payload.signals.detectedMarkers,
    validationErrors: [],
    summary: payload.signals.summary,
    inspectedAt: new Date().toISOString()
  };
}
