import { educationSections } from "./data";

function ExternalLink({ href, children }: { href: string; children: string }) {
  return (
    <a href={href} className="education-external-link" target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

export function EducationContent() {
  return (
    <article className="guide-content education-content">
      {educationSections.map((section) => (
        <section key={section.id} id={section.id} aria-labelledby={`${section.id}-heading`}>
          <h2 className="guide-h2" id={`${section.id}-heading`}>
            {section.title}
          </h2>
          <p className="guide-paragraph">{section.intro}</p>

          {section.topics.map((topic) => (
            <div key={topic.id} id={topic.id}>
              <h3 className="guide-h3">{topic.title}</h3>
              <p className="guide-paragraph">{topic.summary}</p>
              <p className="guide-paragraph">
                <strong>Architecture connection:</strong> {topic.architectureConnection}
              </p>
              <p className="guide-paragraph education-learn-more">
                Learn more:{" "}
                <ExternalLink href={topic.resource.url}>{topic.resource.label}</ExternalLink>
              </p>
            </div>
          ))}

          {section.resources && section.resources.length > 0 ? (
            <div className="education-section-resources">
              <p className="guide-paragraph">
                <strong>Further reading:</strong>
              </p>
              <ul className="education-resource-list">
                {section.resources.map((resource) => (
                  <li key={resource.url}>
                    <ExternalLink href={resource.url}>{resource.label}</ExternalLink>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ))}
    </article>
  );
}
