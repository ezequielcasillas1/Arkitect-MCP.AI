import { Sparkles } from "lucide-react";
import { RevealSection } from "../../components/RevealSection";
import { mcpAutoFillCallout } from "./data";

export function AutoFillCallout() {
  return (
    <RevealSection className="panel panel-card-wide mcp-callout" delay={40}>
      <div className="mcp-callout-header">
        <span className="card-icon mcp-callout-icon" aria-hidden="true">
          <Sparkles size={20} strokeWidth={1.75} />
        </span>
        <div>
          <p className="section-label">{mcpAutoFillCallout.label}</p>
          <h2>{mcpAutoFillCallout.title}</h2>
        </div>
      </div>
      <p className="lede">{mcpAutoFillCallout.lede}</p>
      <ol className="mcp-callout-steps">
        {mcpAutoFillCallout.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <p className="mcp-callout-note">{mcpAutoFillCallout.note}</p>
    </RevealSection>
  );
}
