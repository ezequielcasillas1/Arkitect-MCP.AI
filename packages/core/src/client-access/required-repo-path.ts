import { resolveRepoPath } from "./paths.js";

export type MissingRepoPathErrorCode = "missing_repo_path";

export type RequiredRepoPathResult =
  | { ok: true; repoPath: string }
  | {
      ok: false;
      repoPath: string;
      errorCode: MissingRepoPathErrorCode;
      summary: string;
      hint: string;
    };

export function buildMissingRepoPathResult(): Extract<RequiredRepoPathResult, { ok: false }> {
  return {
    ok: false,
    repoPath: "",
    errorCode: "missing_repo_path",
    summary: "No target repo path provided.",
    hint:
      "Pass repoPath in the tool arguments or set ARKITECT_DEFAULT_REPO_PATH in the MCP server env. Arkitect will not default to the MCP server install directory or process.cwd()."
  };
}

export function resolveRequiredRepoPath(input?: { repoPath?: string }): RequiredRepoPathResult {
  const explicit = input?.repoPath?.trim();

  if (explicit) {
    return { ok: true, repoPath: resolveRepoPath(explicit) };
  }

  const fromEnv = process.env.ARKITECT_DEFAULT_REPO_PATH?.trim();

  if (fromEnv) {
    return { ok: true, repoPath: resolveRepoPath(fromEnv) };
  }

  return buildMissingRepoPathResult();
}
