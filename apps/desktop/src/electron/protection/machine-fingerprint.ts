import { createHash } from "node:crypto";
import { arch, hostname, platform, userInfo } from "node:os";

export function getMachineFingerprint(): string {
  const seed = [hostname(), platform(), arch(), userInfo().username].join(":");
  return createHash("sha256").update(seed).digest("hex").slice(0, 32);
}
