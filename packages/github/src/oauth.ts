import type {
  GitHubApiError,
  GitHubBranchOption,
  GitHubOAuthDeviceStart,
  GitHubOAuthSession,
  GitHubRepositoryOption
} from "@arkitect/contracts";

const deviceCodeUrl = "https://github.com/login/device/code";
const accessTokenUrl = "https://github.com/login/oauth/access_token";
const defaultScope = "read:user repo";

interface GitHubDeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
  error?: string;
  error_description?: string;
}

interface GitHubAccessTokenResponse {
  access_token?: string;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
}

interface GitHubUserApiRecord {
  login: string;
  name: string | null;
  avatar_url: string;
}

interface GitHubRepoListRecord {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  default_branch: string;
  updated_at: string;
  description: string | null;
  html_url: string;
  owner: { login: string };
}

interface GitHubBranchListRecord {
  name: string;
  protected: boolean;
}

function createApiError(code: GitHubApiError["code"], message: string): GitHubApiError {
  return { code, message };
}

export async function requestGitHubDeviceCode(clientId: string): Promise<GitHubOAuthDeviceStart> {
  let response: Response;

  try {
    response = await fetch(deviceCodeUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        client_id: clientId,
        scope: defaultScope
      })
    });
  } catch {
    throw createApiError("network_error", "Failed to reach GitHub device authorization.");
  }

  const payload = (await response.json()) as GitHubDeviceCodeResponse;

  if (!response.ok || payload.error) {
    throw createApiError(
      "oauth_not_configured",
      payload.error_description ?? payload.error ?? "GitHub device authorization request failed."
    );
  }

  return {
    deviceCode: payload.device_code,
    userCode: payload.user_code,
    verificationUri: payload.verification_uri,
    expiresIn: payload.expires_in,
    interval: payload.interval
  };
}

export type GitHubDevicePollResult =
  | { status: "pending" }
  | { status: "success"; accessToken: string; scope?: string }
  | { status: "error"; error: GitHubApiError };

export async function pollGitHubDeviceToken(clientId: string, deviceCode: string): Promise<GitHubDevicePollResult> {
  let response: Response;

  try {
    response = await fetch(accessTokenUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        client_id: clientId,
        device_code: deviceCode,
        grant_type: "urn:ietf:params:oauth:grant-type:device_code"
      })
    });
  } catch {
    return {
      status: "error",
      error: createApiError("network_error", "Failed to poll GitHub for authorization.")
    };
  }

  const payload = (await response.json()) as GitHubAccessTokenResponse;

  if (payload.error === "authorization_pending") {
    return { status: "pending" };
  }

  if (payload.error === "slow_down") {
    return { status: "pending" };
  }

  if (payload.error === "expired_token") {
    return {
      status: "error",
      error: createApiError("oauth_expired", "GitHub authorization expired. Start sign-in again.")
    };
  }

  if (payload.error === "access_denied") {
    return {
      status: "error",
      error: createApiError("oauth_denied", "GitHub authorization was denied.")
    };
  }

  if (!payload.access_token) {
    return {
      status: "error",
      error: createApiError(
        "unknown_error",
        payload.error_description ?? payload.error ?? "GitHub did not return an access token."
      )
    };
  }

  return {
    status: "success",
    accessToken: payload.access_token,
    scope: payload.scope
  };
}

export async function fetchGitHubOAuthSession(token: string, apiBase?: string): Promise<GitHubOAuthSession> {
  const resolvedApiBase = apiBase ?? "https://api.github.com";
  let response: Response;

  try {
    response = await fetch(`${resolvedApiBase}/user`, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "arkitect-desktop"
      }
    });
  } catch {
    throw createApiError("network_error", "Failed to load GitHub account profile.");
  }

  if (!response.ok) {
    throw createApiError("unauthorized", "GitHub OAuth token was rejected.");
  }

  const user = (await response.json()) as GitHubUserApiRecord;

  return {
    connected: true,
    login: user.login,
    name: user.name ?? undefined,
    avatarUrl: user.avatar_url
  };
}

export async function fetchGitHubRepositoryOptions(
  token: string,
  clientOptions?: { apiBase?: string }
): Promise<GitHubRepositoryOption[]> {
  const resolvedApiBase = clientOptions?.apiBase ?? "https://api.github.com";
  const repos: GitHubRepositoryOption[] = [];
  let page = 1;

  while (page <= 5) {
    let response: Response;

    try {
      response = await fetch(
        `${resolvedApiBase}/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member&page=${page}`,
        {
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${token}`,
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "arkitect-desktop"
          }
        }
      );
    } catch {
      throw createApiError("network_error", "Failed to load GitHub repositories.");
    }

    if (!response.ok) {
      throw createApiError("unknown_error", "GitHub repository list request failed.");
    }

    const records = (await response.json()) as GitHubRepoListRecord[];

    if (records.length === 0) {
      break;
    }

    repos.push(
      ...records.map((record) => ({
        id: record.id,
        fullName: record.full_name,
        owner: record.owner.login,
        repo: record.name,
        private: record.private,
        defaultBranch: record.default_branch,
        updatedAt: record.updated_at,
        description: record.description ?? undefined,
        htmlUrl: record.html_url
      }))
    );

    if (records.length < 100) {
      break;
    }

    page += 1;
  }

  return repos.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function fetchGitHubBranchOptions(
  token: string,
  owner: string,
  repo: string,
  clientOptions?: { apiBase?: string }
): Promise<GitHubBranchOption[]> {
  const resolvedApiBase = clientOptions?.apiBase ?? "https://api.github.com";
  let response: Response;

  try {
    response = await fetch(`${resolvedApiBase}/repos/${owner}/${repo}/branches?per_page=100`, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "arkitect-desktop"
      }
    });
  } catch {
    throw createApiError("network_error", "Failed to load GitHub branches.");
  }

  if (!response.ok) {
    throw createApiError("repo_not_found", "Could not load branches for the selected repository.");
  }

  const records = (await response.json()) as GitHubBranchListRecord[];

  return records
    .map((record) => ({
      name: record.name,
      protected: record.protected
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function inferGitHubAuthMode(token: string): "oauth" | "personal-access-token" {
  return token.trim().startsWith("gho_") ? "oauth" : "personal-access-token";
}
