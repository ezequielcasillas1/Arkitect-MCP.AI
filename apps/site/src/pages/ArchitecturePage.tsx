import { RevealSection } from "../components/RevealSection";
import { EducationContent, educationToc } from "../features/education";
import { SeoHead } from "../features/seo";

export function ArchitecturePage() {
  return (
    <div className="content-grid instructions-grid">
      <SeoHead route="/architecture" />
      <RevealSection className="panel hero-entrance instructions-hero" delay={0}>
        <p className="section-label">Learn</p>
        <h1>Software architecture &amp; design patterns</h1>
        <p>
          A concise guide to common design patterns and how they connect to architectural choices —
          layered, hexagonal, MVC/MVVM, and microservices. Each section links to trusted references
          for deeper study.
        </p>
      </RevealSection>

      <RevealSection className="panel instructions-layout" delay={60}>
        <aside className="guide-toc" aria-label="Architecture guide sections">
          <p className="guide-toc-label">On this page</p>
          <nav>
            <ol className="guide-toc-list">
              {educationToc.map((section) => (
                <li key={section.id} className="guide-toc-item">
                  <a href={`#${section.id}`} className="guide-toc-link">
                    {section.title}
                  </a>
                  {section.topics.length > 0 ? (
                    <ol className="guide-toc-list">
                      {section.topics.map((topic) => (
                        <li key={topic.id} className="guide-toc-item guide-toc-item-nested">
                          <a href={`#${topic.id}`} className="guide-toc-link">
                            {topic.title}
                          </a>
                        </li>
                      ))}
                    </ol>
                  ) : null}
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <EducationContent />
      </RevealSection>
    </div>
  );
}
