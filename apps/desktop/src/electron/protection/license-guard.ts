import type { LicenseValidationRequest, LicenseValidationResponse } from "@arkitect/contracts";
import { getMachineFingerprint } from "./machine-fingerprint.js";
import { loadStoredLicenseKey } from "./license-store.js";
import type { ProtectionConfig } from "./protection-config.js";

export async function validateLicense(
  config: ProtectionConfig
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!config.licenseRequired) {
    return { ok: true };
  }

  if (!config.licensingWorkerUrl) {
    return { ok: false, reason: "License validation is enabled but ARKITECT_LICENSING_WORKER_URL is not set." };
  }

  const licenseKey = config.licenseKey ?? (await loadStoredLicenseKey());
  if (!licenseKey) {
    return { ok: false, reason: "A valid license key is required to run Arkitect." };
  }

  const payload: LicenseValidationRequest = {
    licenseKey,
    machineFingerprint: getMachineFingerprint(),
    product: "arkitect-desktop"
  };

  let response: Response;
  try {
    response = await fetch(new URL("/licenses/validate", config.licensingWorkerUrl).toString(), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network error";
    return { ok: false, reason: `License validation failed: ${message}` };
  }

  let body: LicenseValidationResponse;
  try {
    body = (await response.json()) as LicenseValidationResponse;
  } catch {
    return { ok: false, reason: "License validation returned an invalid response." };
  }

  if (!response.ok || !body.valid) {
    return { ok: false, reason: body.reason || "License is invalid." };
  }

  if (config.machineBind && payload.machineFingerprint.length < 8) {
    return { ok: false, reason: "Machine binding fingerprint is unavailable." };
  }

  return { ok: true };
}
