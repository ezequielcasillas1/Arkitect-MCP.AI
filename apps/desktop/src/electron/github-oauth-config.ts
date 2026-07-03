import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const placeholderClientIds = new Set(["YOUR_GITHUB_OAUTH_CLIENT_ID", "your_client_id_here", "your_client_id"]);

function normalizeClientId(value: string | undefined): string | undefined {
  const trimmed = value?.trim();

  if (!trimmed || placeholderClientIds.has(trimmed)) {
    return undefined;
  }

  return trimmed;
}

function readClientIdFromFile(configPath: string): string | undefined {
  if (!existsSync(configPath)) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(readFileSync(configPath, "utf8")) as { clientId?: string };
    return normalizeClientId(parsed.clientId);
  } catch {
    return undefined;
  }
}

export function getGitHubOAuthClientId(): string | undefined {
  const fromEnv = normalizeClientId(process.env.GITHUB_OAUTH_CLIENT_ID);

  if (fromEnv) {
    return fromEnv;
  }

  const configCandidates = [
    join(__dirname, "..", "github-oauth.config.json"),
    join(process.cwd(), "github-oauth.config.json"),
    join(process.cwd(), "apps", "desktop", "github-oauth.config.json")
  ];

  for (const configPath of configCandidates) {
    const clientId = readClientIdFromFile(configPath);

    if (clientId) {
      return clientId;
    }
  }

  return undefined;
}

export function getGitHubOAuthConfigured(): boolean {
  return Boolean(getGitHubOAuthClientId());
}
