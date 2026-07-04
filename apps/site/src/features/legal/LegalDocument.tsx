import type { LegalDocument as LegalDocumentType } from "./types";

interface LegalDocumentProps {
  document: LegalDocumentType;
}

export function LegalDocument({ document }: LegalDocumentProps) {
  return (
    <article className="guide-content legal-content">
      {document.sections.map((section) => (
        <section key={section.id} id={section.id} aria-labelledby={`${section.id}-heading`}>
          <h2 className="guide-h2" id={`${section.id}-heading`}>
            {section.title}
          </h2>
          {section.paragraphs.map((paragraph, index) => (
            <p key={index} className="guide-paragraph">
              {paragraph}
            </p>
          ))}
        </section>
      ))}
    </article>
  );
}
