import { useEffect, useId, useState } from "react";
import { Check, Copy, Terminal } from "lucide-react";
import { clientRepoMcpJson, installPathNotes } from "./data";

interface McpJsonRevealProps {
  snippet?: string;
  defaultOpen?: boolean;
}

export function McpJsonReveal({ snippet = clientRepoMcpJson, defaultOpen = false }: McpJsonRevealProps) {
  const panelId = useId();
  const [open, setOpen] = useState(defaultOpen);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    function syncFromHash() {
      if (window.location.hash === "#install-path") {
        setOpen(true);
      }
    }

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  async function handleCopy() {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="install-config-block" id="install-path">
      <div className="install-config-header">
        <Terminal size={18} strokeWidth={1.75} aria-hidden="true" />
        <span>Cursor MCP config</span>
      </div>
      <div className="install-reveal-actions">
        <button
          type="button"
          className="secondary-button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((current) => !current)}
        >
          {open ? "Hide install path" : "See the path to install"}
        </button>
      </div>
      {open ? (
        <div id={panelId} className="install-json-panel">
          <div className="install-config-toolbar">
            <p className="helper-copy">Drop this into your project <code>.cursor/mcp.json</code>, then restart MCP.</p>
            <button type="button" className="ghost-button" onClick={() => void handleCopy()}>
              {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
              {copied ? "Copied" : "Copy JSON"}
            </button>
          </div>
          <pre className="install-config-code">
            <code>{snippet}</code>
          </pre>
          <ul className="install-path-notes">
            {installPathNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
