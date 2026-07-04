import { app } from "electron";

export interface ProtectionConfig {
  enabled: boolean;
  integrityCheck: boolean;
  licenseRequired: boolean;
  blockDevTools: boolean;
  machineBind: boolean;
  licensingWorkerUrl: string | null;
  licenseKey: string | null;
  tamperExitCode: number;
  tamperMessage: string;
}

function envFlag(name: string, defaultValue: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") {
    return defaultValue;
  }

  const normalized = raw.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

function envString(name: string): string | null {
  const raw = process.env[name]?.trim();
  return raw ? raw : null;
}

export function getProtectionConfig(): ProtectionConfig {
  const packaged = app.isPackaged;
  const enabled = envFlag("ARKITECT_PROTECTION_ENABLED", packaged);
  const licenseRequired = envFlag("ARKITECT_PROTECTION_LICENSE", false);

  return {
    enabled,
    integrityCheck: envFlag("ARKITECT_PROTECTION_INTEGRITY", enabled && packaged),
    licenseRequired,
    blockDevTools: envFlag("ARKITECT_PROTECTION_DEVTOOLS", enabled && packaged),
    machineBind: envFlag("ARKITECT_PROTECTION_MACHINE_BIND", licenseRequired),
    licensingWorkerUrl: envString("ARKITECT_LICENSING_WORKER_URL"),
    licenseKey: envString("ARKITECT_LICENSE_KEY"),
    tamperExitCode: 1,
    tamperMessage:
      envString("ARKITECT_PROTECTION_TAMPER_MESSAGE") ??
      "This copy of Arkitect has been modified or is not licensed. The application will exit."
  };
}
