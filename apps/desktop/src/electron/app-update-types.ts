export interface AppUpdateCheckSuccess {
  ok: true;
  currentVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
  releaseUrl: string;
  downloadUrl?: string;
  publishedAt?: string;
}

export interface AppUpdateCheckFailure {
  ok: false;
  currentVersion: string;
  error: {
    code: "network_error" | "parse_error" | "not_found" | "unknown_error";
    message: string;
  };
}

export type AppUpdateCheckResult = AppUpdateCheckSuccess | AppUpdateCheckFailure;

export interface AppUpdateOpenResult {
  ok: boolean;
  message?: string;
}
