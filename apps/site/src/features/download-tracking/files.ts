import type { DownloadFileKey, TrackedDownloadFile } from "./types";

export const TRACKED_DOWNLOAD_FILES: TrackedDownloadFile[] = [
  { key: "arkitect-setup", label: "Arkitect Setup (.exe)" },
  { key: "user-guide", label: "User guide (.txt)" }
];

export function getDownloadFileLabel(key: DownloadFileKey): string {
  return TRACKED_DOWNLOAD_FILES.find((file) => file.key === key)?.label ?? key;
}

export function isDownloadFileKey(value: string): value is DownloadFileKey {
  return TRACKED_DOWNLOAD_FILES.some((file) => file.key === value);
}
