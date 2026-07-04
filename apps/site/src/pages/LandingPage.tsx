import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { Layers, Sparkles, Zap } from "lucide-react";
import { providerCatalog, createRecommendedModel } from "@arkitect/ai";
import { ConnectSection } from "../components/ConnectSection";
import { InstallSection } from "../components/InstallSection";
import { RevealSection } from "../components/RevealSection";
import { DownloadCounterSection } from "../features/download-counter/DownloadCounterSection";

const ArkitectLogo3D = lazy(() =>
  import("../components/ArkitectLogo3D").then((module) => ({ default: module.ArkitectLogo3D }))
);

const recommendation = createRecommendedModel();

const pillars = [
  {
    icon: Zap,
    label: "Diagnose first",
    body: "Arkitect scans your repo and surfaces the real architecture, health, and intent before anything changes."
  },
  {
    icon: Layers,
    label: "Continue what's healthy",
    body: "Detected structure keeps flowing automatically once confidence is high — no forced rewrites."
  },
  {
    icon: Sparkles,
    label: "Report before refactor",
    body: "Drifting or spaghetti structure is reported clearly. Refactors only happen with explicit intent."
  }
];

const heroPills = [
  { label: "Free for the first 1,000 users" },
  { label: "Vertical-slice friendly" },
  { label: "MCP-native for Cursor" }
];

export function LandingPage() {
  return (
    <div className="content-grid landing-grid">
      <section className="hero panel hero-entrance">
        <div className="hero-copy">
          <p className="eyebrow">Arkitect MCP</p>
          <h1>Design the structure before the code starts drifting.</h1>
          <p className="lede">
            Arkitect is a desktop-first architecture reasoning tool with an MCP server Cursor and other
            AI clients can call directly — diagnosis, catalog recommendations, and guidance, grounded in
            your actual repo.
          </p>
          <div className="hero-actions">
            <a href="#download-counter-heading" className="primary-button">
              Get the free download
            </a>
            <a href="#install-heading" className="secondary-button">
              See install steps
            </a>
            <Link to="/reviews" className="ghost-button">
              See what people are saying
            </Link>
          </div>
        </div>
        <div className="hero-visual">
          <Suspense fallback={<div className="hero-logo-placeholder" aria-hidden="true" />}>
            <ArkitectLogo3D />
          </Suspense>
          <div className="hero-card">
            {heroPills.map((pill) => (
              <span key={pill.label} className="pill">
                {pill.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <RevealSection className="counter-panel" delay={0}>
        <DownloadCounterSection />
      </RevealSection>

      <InstallSection />

      <RevealSection className="panel" delay={80}>
        <p className="section-label">Why Arkitect</p>
        <h2>Architecture-first, design patterns second.</h2>
        <div className="pillar-grid">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <article key={pillar.label} className="provider-card pillar-card">
                <span className="card-icon" aria-hidden="true">
                  <Icon size={20} strokeWidth={1.75} />
                </span>
                <strong>{pillar.label}</strong>
                <p>{pillar.body}</p>
              </article>
            );
          })}
        </div>
      </RevealSection>

      <RevealSection className="panel" delay={100}>
        <p className="section-label">Pricing</p>
        <h2>Free for the first 1,000 users.</h2>
        <p>
          Claim your spot above while free access lasts. Membership pricing for desktop, MCP, and
          licensing features arrives after the free cohort — early claimants keep free access.
        </p>
      </RevealSection>

      <RevealSection className="panel panel-card-wide" delay={120}>
        <p className="section-label">AI Defaults</p>
        <h2>Provider-agnostic by default.</h2>
        <p>
          {recommendation.modelName} via {recommendation.provider} is the recommended default. Bring
          your own provider keys any time without changing how Arkitect reasons about your repo.
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
      </RevealSection>

      <RevealSection delay={140}>
        <ConnectSection />
      </RevealSection>
    </div>
  );
}
