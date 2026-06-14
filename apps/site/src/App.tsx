import type { CSSProperties } from "react";
import { createRecommendedModel, providerCatalog } from "@arkitect/ai";
import { arkitectWindowsTheme, buildCssVariables } from "@arkitect/design-system";

const themeStyle = buildCssVariables(arkitectWindowsTheme) as CSSProperties;
const recommendation = createRecommendedModel();

const membershipFlow = [
  "Discover Arkitect on the marketing site and review the product surfaces.",
  "Purchase desktop access or a membership plan through Stripe checkout.",
  "Receive download and entitlement handling through Cloudflare-backed licensing routes.",
  "Launch the desktop app and continue from the same diagnosis-first architecture context."
];

export function App() {
  return (
    <div className="site-shell" style={themeStyle}>
      <header className="hero panel">
        <div>
          <p className="eyebrow">Arkitect</p>
          <h1>Design the structure before the code starts drifting.</h1>
          <p className="lede">
            Arkitect is a desktop-first architecture reasoning product with a supporting website for
            paid downloads, membership access, and release messaging.
          </p>
        </div>
        <div className="hero-card">
          <span className="pill">Windows 11 desktop-first</span>
          <span className="pill">Stripe membership flow</span>
          <span className="pill">Cloudflare download + licensing edge</span>
        </div>
      </header>

      <main className="content-grid">
        <section className="panel">
          <p className="section-label">Why Arkitect</p>
          <h2>Architecture-first, design patterns second.</h2>
          <p>
            The product focuses on detecting the current structure, continuing healthy architecture,
            and reporting unhealthy structure before any refactor path is considered.
          </p>
        </section>

        <section className="panel">
          <p className="section-label">Membership + Download Flow</p>
          <ol className="flow-list">
            {membershipFlow.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>

        <section className="panel">
          <p className="section-label">AI Defaults</p>
          <h2>Provider-agnostic by default.</h2>
          <p>
            Composer 2.5 is the recommended default, while teams can bring their own provider keys
            without changing Arkitect&apos;s analysis model.
          </p>
          <div className="provider-grid">
            {providerCatalog.map((provider) => (
              <article className="provider-card" key={provider.id}>
                <strong>{provider.label}</strong>
                <span>{provider.inputMode}</span>
                <p>{provider.notes[0]}</p>
              </article>
            ))}
          </div>
          <p className="recommendation">
            Recommended now: {recommendation.modelName} via {recommendation.provider}.
          </p>
        </section>

        <section className="panel">
          <p className="section-label">Current Milestone</p>
          <h2>Scaffolded foundation</h2>
          <p>
            This milestone creates the monorepo baseline, diagnosis contracts, desktop shell, site
            shell, licensing worker scaffold, and MCP-facing result structures.
          </p>
        </section>
      </main>
    </div>
  );
}
