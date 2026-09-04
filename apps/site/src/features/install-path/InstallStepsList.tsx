import type { CSSProperties } from "react";
import { FileJson, FolderGit2, Package, Replace, ScanSearch } from "lucide-react";
import { installSteps } from "./data";

const stepIcons = [Package, FolderGit2, FileJson, Replace, ScanSearch];

export function InstallStepsList() {
  return (
    <ol className="install-steps">
      {installSteps.map((step, index) => {
        const Icon = stepIcons[index] ?? FileJson;
        return (
          <li key={step.title} className="install-step" style={{ "--step-index": index } as CSSProperties}>
            <span className="install-step-icon" aria-hidden="true">
              <Icon size={22} strokeWidth={1.75} />
            </span>
            <div>
              <strong>{step.title}</strong>
              <p>{step.body}</p>
              {step.command ? (
                <pre className="install-step-command">
                  <code>{step.command}</code>
                </pre>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
