import { RevealSection } from "../components/RevealSection";
import { ConnectSection } from "../components/ConnectSection";
import { AboutContent, aboutHero } from "../features/about";
import { SeoHead } from "../features/seo";

export function AboutPage() {
  return (
    <div className="content-grid about-grid">
      <SeoHead route="/about" />
      <RevealSection className="panel hero-entrance" delay={0}>
        <p className="section-label">{aboutHero.label}</p>
        <h1>{aboutHero.title}</h1>
        <p>{aboutHero.intro}</p>
      </RevealSection>

      <AboutContent />

      <RevealSection delay={180}>
        <ConnectSection />
      </RevealSection>
    </div>
  );
}
