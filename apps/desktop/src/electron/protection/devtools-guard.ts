import type { BrowserWindow } from "electron";
import type { ProtectionConfig } from "./protection-config.js";

export function applyDevToolsGuard(window: BrowserWindow, config: ProtectionConfig): void {
  if (!config.blockDevTools) {
    return;
  }

  window.webContents.on("before-input-event", (event, input) => {
    const key = input.key.toLowerCase();
    const opensDevTools =
      key === "f12" ||
      (input.control && input.shift && (key === "i" || key === "j" || key === "c"));

    if (opensDevTools) {
      event.preventDefault();
    }
  });

  window.webContents.on("devtools-opened", () => {
    window.webContents.closeDevTools();
  });
}
