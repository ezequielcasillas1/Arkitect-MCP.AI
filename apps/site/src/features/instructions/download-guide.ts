const GUIDE_FILENAME = "arkitect-user-guide.txt";

export function downloadGuideAsText(markdown: string, filename = GUIDE_FILENAME) {
  const blob = new Blob([markdown], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
