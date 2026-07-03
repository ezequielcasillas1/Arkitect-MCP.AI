import { app, safeStorage } from "electron";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { GitHubOAuthSession } from "@arkitect/contracts";

interface StoredGitHubOAuthRecord {
  session: GitHubOAuthSession;
  encryptedToken: string;
  connectedAt: string;
}

const storageFileName = "github-oauth-session.json";

function getStoragePath() {
  return join(app.getPath("userData"), storageFileName);
}

function encryptToken(token: string): string {
  if (!safeStorage.isEncryptionAvailable()) {
    return Buffer.from(token, "utf8").toString("base64");
  }

  return safeStorage.encryptString(token).toString("base64");
}

function decryptToken(encryptedToken: string): string {
  const buffer = Buffer.from(encryptedToken, "base64");

  if (!safeStorage.isEncryptionAvailable()) {
    return buffer.toString("utf8");
  }

  return safeStorage.decryptString(buffer);
}

export async function loadStoredGitHubOAuth(): Promise<{ session: GitHubOAuthSession; token: string } | null> {
  try {
    const raw = await readFile(getStoragePath(), "utf8");
    const parsed = JSON.parse(raw) as StoredGitHubOAuthRecord;

    if (!parsed.session?.connected || !parsed.encryptedToken) {
      return null;
    }

    return {
      session: parsed.session,
      token: decryptToken(parsed.encryptedToken)
    };
  } catch {
    return null;
  }
}

export async function saveStoredGitHubOAuth(session: GitHubOAuthSession, token: string): Promise<void> {
  const storagePath = getStoragePath();
  const record: StoredGitHubOAuthRecord = {
    session,
    encryptedToken: encryptToken(token),
    connectedAt: new Date().toISOString()
  };

  await mkdir(dirname(storagePath), { recursive: true });
  await writeFile(storagePath, JSON.stringify(record, null, 2), "utf8");
}

export async function clearStoredGitHubOAuth(): Promise<void> {
  try {
    await unlink(getStoragePath());
  } catch {
    // No stored session yet.
  }
}

export async function getStoredGitHubOAuthSession(): Promise<GitHubOAuthSession> {
  const stored = await loadStoredGitHubOAuth();

  return stored?.session ?? { connected: false };
}
