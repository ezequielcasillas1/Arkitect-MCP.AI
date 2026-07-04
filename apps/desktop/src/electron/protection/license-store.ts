import { app, safeStorage } from "electron";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

interface StoredLicenseRecord {
  encryptedKey: string;
  savedAt: string;
}

const storageFileName = "license-key.json";

function getStoragePath() {
  return join(app.getPath("userData"), storageFileName);
}

function encryptKey(key: string): string {
  if (!safeStorage.isEncryptionAvailable()) {
    return Buffer.from(key, "utf8").toString("base64");
  }

  return safeStorage.encryptString(key).toString("base64");
}

function decryptKey(encryptedKey: string): string {
  const buffer = Buffer.from(encryptedKey, "base64");

  if (!safeStorage.isEncryptionAvailable()) {
    return buffer.toString("utf8");
  }

  return safeStorage.decryptString(buffer);
}

export async function loadStoredLicenseKey(): Promise<string | null> {
  try {
    const raw = await readFile(getStoragePath(), "utf8");
    const parsed = JSON.parse(raw) as StoredLicenseRecord;

    if (!parsed.encryptedKey) {
      return null;
    }

    return decryptKey(parsed.encryptedKey);
  } catch {
    return null;
  }
}

export async function saveStoredLicenseKey(licenseKey: string): Promise<void> {
  const storagePath = getStoragePath();
  const record: StoredLicenseRecord = {
    encryptedKey: encryptKey(licenseKey),
    savedAt: new Date().toISOString()
  };

  await mkdir(dirname(storagePath), { recursive: true });
  await writeFile(storagePath, JSON.stringify(record, null, 2), "utf8");
}

export async function clearStoredLicenseKey(): Promise<void> {
  try {
    await unlink(getStoragePath());
  } catch {
    // no stored license
  }
}
