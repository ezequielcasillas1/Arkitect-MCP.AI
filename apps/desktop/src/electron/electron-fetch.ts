import { net } from "electron";

export function installElectronNetFetch(): void {
  if (typeof net.fetch !== "function") {
    return;
  }

  globalThis.fetch = net.fetch.bind(net) as typeof fetch;
}
