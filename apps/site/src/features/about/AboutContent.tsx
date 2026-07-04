import { RevealSection } from "../../components/RevealSection";
import { aboutBlocks } from "./data";

export function AboutContent() {
  return (
    <>
      {aboutBlocks.map((block, index) => (
        <RevealSection
          key={block.id}
          className="panel about-block"
          delay={60 + index * 40}
          aria-labelledby={`${block.id}-heading`}
        >
          <section id={block.id}>
            <p className="section-label">{block.label}</p>
            <h2 id={`${block.id}-heading`}>{block.title}</h2>
            {block.paragraphs.map((paragraph, paragraphIndex) => (
              <p key={paragraphIndex} className="guide-paragraph">
                {paragraph}
              </p>
            ))}
          </section>
        </RevealSection>
      ))}
    </>
  );
}
