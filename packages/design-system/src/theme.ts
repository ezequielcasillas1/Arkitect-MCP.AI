export interface ArkitectTheme {
  fontFamily: string;
  radius: {
    panel: string;
    pill: string;
  };
  colors: {
    background: string;
    surface: string;
    surfaceAlt: string;
    panelBorder: string;
    text: string;
    textMuted: string;
    accent: string;
    accentSoft: string;
    success: string;
    warning: string;
    danger: string;
  };
}

export const arkitectWindowsTheme: ArkitectTheme = {
  fontFamily: "\"Segoe UI\", Inter, system-ui, sans-serif",
  radius: {
    panel: "18px",
    pill: "999px"
  },
  colors: {
    background: "#090b10",
    surface: "#111521",
    surfaceAlt: "#171d2d",
    panelBorder: "#263045",
    text: "#f5f8ff",
    textMuted: "#9aa6c2",
    accent: "#6d8cff",
    accentSoft: "rgba(109, 140, 255, 0.18)",
    success: "#57d39b",
    warning: "#ffbe69",
    danger: "#ff7f7f"
  }
};

export function buildCssVariables(theme: ArkitectTheme): Record<string, string> {
  return {
    "--ark-font-family": theme.fontFamily,
    "--ark-radius-panel": theme.radius.panel,
    "--ark-radius-pill": theme.radius.pill,
    "--ark-color-background": theme.colors.background,
    "--ark-color-surface": theme.colors.surface,
    "--ark-color-surface-alt": theme.colors.surfaceAlt,
    "--ark-color-panel-border": theme.colors.panelBorder,
    "--ark-color-text": theme.colors.text,
    "--ark-color-text-muted": theme.colors.textMuted,
    "--ark-color-accent": theme.colors.accent,
    "--ark-color-accent-soft": theme.colors.accentSoft,
    "--ark-color-success": theme.colors.success,
    "--ark-color-warning": theme.colors.warning,
    "--ark-color-danger": theme.colors.danger
  };
}
