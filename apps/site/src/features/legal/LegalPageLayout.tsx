import { RevealSection } from "../../components/RevealSection";
import { SeoHead } from "../seo";
import type { RouteSeoKey } from "../seo";
import { LegalDocument } from "./LegalDocument";
import { legalToc } from "./data";
import type { LegalDocument as LegalDocumentType } from "./types";

interface LegalPageLayoutProps {
  route: Extract<RouteSeoKey, "/terms" | "/privacy">;
  document: LegalDocumentType;
}

export function LegalPageLayout({ route, document }: LegalPageLayoutProps) {
  const toc = legalToc(document.sections);

  return (
    <div className="content-grid instructions-grid">
      <SeoHead route={route} />
      <RevealSection className="panel hero-entrance instructions-hero" delay={0}>
        <p className="section-label">{document.label}</p>
        <h1>{document.title}</h1>
        <p>{document.intro}</p>
      </RevealSection>

      <RevealSection className="panel instructions-layout" delay={60}>
        <aside className="guide-toc" aria-label={`${document.title} sections`}>
          <p className="guide-toc-label">On this page</p>
          <nav>
            <ol className="guide-toc-list">
              {toc.map((section) => (
                <li key={section.id} className="guide-toc-item">
                  <a href={`#${section.id}`} className="guide-toc-link">
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <LegalDocument document={document} />
      </RevealSection>
    </div>
  );
}
