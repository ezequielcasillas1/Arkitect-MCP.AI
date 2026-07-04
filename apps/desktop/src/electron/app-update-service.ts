import { app, shell } from "electron";
import type { AppUpdateCheckResult, AppUpdateOpenResult } from "./app-update-types.js";
import { isUpdateAvailable, normalizeVersionTag } from "./version-compare.js";
import { resolveUpdateRepoConfig } from "./update-config.js";

interface GitHubReleaseAsset {
  name: string;
  browser_download_url: string;
}

interface GitHubReleaseResponse {
  tag_name: string;
  html_url: string;
  published_at?: string;
  assets?: GitHubReleaseAsset[];
}

export function getCurrentAppVersion(): string {
  return app.getVersion();
}

export async function checkForAppUpdate(): Promise<AppUpdateCheckResult> {
  const currentVersion = getCurrentAppVersion();
  const config = resolveUpdateRepoConfig();
  const apiUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/releases/latest`;

  try {
    const response = await fetch(apiUrl, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "Arkitect-Desktop"
      }
    });

    if (response.status === 404) {
      return {
        ok: false,
        currentVersion,
        error: {
          code: "not_found",
          message: "No published releases found for this app."
        }
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        currentVersion,
        error: {
          code: "network_error",
          message: `GitHub Releases API returned ${response.status}. Check your network connection.`
        }
      };
    }

    const release = (await response.json()) as GitHubReleaseResponse;

    if (!release.tag_name || !release.html_url) {
      return {
        ok: false,
        currentVersion,
        error: {
          code: "parse_error",
          message: "Latest release response was missing version metadata."
        }
      };
    }

    const latestVersion = normalizeVersionTag(release.tag_name);
    const asset = release.assets?.find((entry) => entry.name === config.installerAssetName);
    const downloadUrl = asset?.browser_download_url;

    return {
      ok: true,
      currentVersion,
      latestVersion,
      updateAvailable: isUpdateAvailable(currentVersion, latestVersion),
      releaseUrl: release.html_url,
      downloadUrl,
      publishedAt: release.published_at
    };
  } catch (error) {
    return {
      ok: false,
      currentVersion,
      error: {
        code: "network_error",
        message: error instanceof Error ? error.message : "Failed to reach GitHub Releases."
      }
    };
  }
}

export async function openAppUpdateDownload(url: string): Promise<AppUpdateOpenResult> {
  try {
    await shell.openExternal(url);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Failed to open download URL."
    };
  }
}
