import { app } from "electron";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { DesktopLibraryState } from "@arkitect/contracts";
import { createDefaultDesktopLibrary } from "@arkitect/core";

const storageFileName = "arkitect-desktop-library.json";

function ensureLibraryShape(value: unknown): DesktopLibraryState {
  const fallback = createDefaultDesktopLibrary();

  if (!value || typeof value !== "object") {
    return fallback;
  }

  const parsed = value as Partial<DesktopLibraryState>;

  return {
    version: typeof parsed.version === "number" ? parsed.version : fallback.version,
    projectProfiles: Array.isArray(parsed.projectProfiles) ? parsed.projectProfiles : fallback.projectProfiles,
    architectureProfiles: Array.isArray(parsed.architectureProfiles)
      ? parsed.architectureProfiles
      : fallback.architectureProfiles,
    providerPresets: Array.isArray(parsed.providerPresets) ? parsed.providerPresets : fallback.providerPresets,
    workbenchPresets: Array.isArray(parsed.workbenchPresets) ? parsed.workbenchPresets : fallback.workbenchPresets,
    lastOpenedRepoPath: parsed.lastOpenedRepoPath
  };
}

export function getDesktopLibraryPath() {
  return join(app.getPath("userData"), storageFileName);
}

export async function loadDesktopLibrary(): Promise<DesktopLibraryState> {
  try {
    const raw = await readFile(getDesktopLibraryPath(), "utf8");
    return ensureLibraryShape(JSON.parse(raw));
  } catch {
    return createDefaultDesktopLibrary();
  }
}

export async function saveDesktopLibrary(state: DesktopLibraryState): Promise<DesktopLibraryState> {
  const storagePath = getDesktopLibraryPath();
  await mkdir(dirname(storagePath), { recursive: true });
  await writeFile(storagePath, JSON.stringify(state, null, 2), "utf8");
  return state;
}
