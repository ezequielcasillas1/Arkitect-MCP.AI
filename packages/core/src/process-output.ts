export function tailOutput(output: string, maxLines = 24): string {
  const lines = output.trim().split(/\r?\n/);

  if (lines.length <= maxLines) {
    return lines.join("\n");
  }

  return lines.slice(-maxLines).join("\n");
}
