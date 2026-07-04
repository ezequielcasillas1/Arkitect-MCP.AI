import { app, dialog } from "electron";
import { verifyIntegrity } from "./integrity-check.js";
import { validateLicense } from "./license-guard.js";
import { getProtectionConfig } from "./protection-config.js";

export interface ProtectionResult {
  ok: boolean;
  reason?: string;
}

async function runChecks(): Promise<ProtectionResult> {
  const config = getProtectionConfig();

  if (!config.enabled) {
    return { ok: true };
  }

  if (config.integrityCheck) {
    const integrity = await verifyIntegrity();
    if (!integrity.ok) {
      return { ok: false, reason: integrity.reason };
    }
  }

  const license = await validateLicense(config);
  if (!license.ok) {
    return { ok: false, reason: license.reason };
  }

  return { ok: true };
}

export async function enforceProtectionOnStartup(): Promise<ProtectionResult> {
  const config = getProtectionConfig();
  const result = await runChecks();

  if (!result.ok) {
    const message = [config.tamperMessage, result.reason].filter(Boolean).join("\n\n");
    dialog.showErrorBox("Arkitect", message);
    app.exit(config.tamperExitCode);
  }

  return result;
}

export { getProtectionConfig };
