import type { ArchitectureCatalogId, ComplexityProfile, DiagnosisResult, RemixProfileId } from "@arkitect/contracts";
import { getCatalogCounts, getDesignPatternDisplayName, listArchitectureCatalog, listRemixProfileCatalog } from "@arkitect/core";

interface CatalogLibrarySectionProps {
  result: DiagnosisResult;
  selectedRemixId?: RemixProfileId;
  complexityProfile: ComplexityProfile;
  onRemixChange: (value?: RemixProfileId) => void;
  onComplexityProfileChange: (value: ComplexityProfile) => void;
}

const architectures = listArchitectureCatalog();
const remixes = listRemixProfileCatalog();
const counts = getCatalogCounts();
const architectureLabels = new Map(architectures.map((entry) => [entry.id, entry.displayName]));
const remixLabels = new Map(remixes.map((entry) => [entry.id, entry.displayName]));

export function CatalogLibrarySection({
  result,
  selectedRemixId,
  complexityProfile,
  onRemixChange,
  onComplexityProfileChange
}: CatalogLibrarySectionProps) {
  const selectedArchitectureId = result.decision.selectedArchitectureId;
  const detectedArchitecture = result.signals.currentArchitecture.final.value;
  const topArchitectureIds = new Set(result.catalogRecommendation.architectureCandidates.slice(0, 3).map((candidate) => candidate.id));
  const detectedArchitectureLabel = architectureLabels.get(detectedArchitecture as ArchitectureCatalogId) ?? detectedArchitecture;
  const selectedArchitectureLabel = selectedArchitectureId
    ? architectureLabels.get(selectedArchitectureId) ?? selectedArchitectureId
    : "not stable yet";

  return (
    <section className="section-card">
      <div className="section-header">
        <div>
          <p className="section-label">Encoded Library</p>
          <h2>Architectures, remixes, and pattern DNA</h2>
        </div>
        <span className="status-pill status-visible">
          {counts.architectures} architectures | {counts.remixProfiles} remixes | {counts.designPatterns} patterns
        </span>
      </div>

      <p className="summary-copy">
        Auto-detected architecture stays visible, remix selection stays explicit, and pattern recommendations remain
        downstream from the architecture decision.
      </p>

      <div className="control-grid library-controls">
        <label>
          Selected remix profile
          <select
            value={selectedRemixId ?? ""}
            onChange={(event) => onRemixChange((event.target.value || undefined) as RemixProfileId | undefined)}
          >
            <option value="">Auto-rank only</option>
            {remixes.map((remix) => (
              <option key={remix.id} value={remix.id}>
                {remix.displayName}
              </option>
            ))}
          </select>
        </label>

        <label>
          Complexity profile
          <select value={complexityProfile} onChange={(event) => onComplexityProfileChange(event.target.value as ComplexityProfile)}>
            <option value="minimal">minimal</option>
            <option value="balanced">balanced</option>
            <option value="structured">structured</option>
            <option value="enterprise">enterprise</option>
          </select>
        </label>
      </div>

      <div className="metric-grid library-grid">
        <article className="metric-card">
          <span className="metric-label">Architecture catalog</span>
          <p className="catalog-meta">
            Auto-detected: <strong>{detectedArchitectureLabel}</strong>
            <br />
            Selected path: <strong>{selectedArchitectureLabel}</strong>
          </p>
          <div className="catalog-chip-grid">
            {architectures.map((architecture) => {
              const isDetected = detectedArchitecture === architecture.id;
              const isSelected = selectedArchitectureId === architecture.id;
              const isTopCandidate = topArchitectureIds.has(architecture.id);
              const className = [
                "catalog-chip",
                isSelected ? "catalog-chip-selected" : "",
                isDetected ? "catalog-chip-detected" : "",
                isTopCandidate ? "catalog-chip-ranked" : ""
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <div className={className} key={architecture.id}>
                  <strong>{architecture.displayName}</strong>
                  <span>{architecture.category}</span>
                </div>
              );
            })}
          </div>
        </article>

        <article className="metric-card">
          <span className="metric-label">Remix profiles</span>
          <p className="catalog-meta">
            Selected remix: <strong>{selectedRemixId ? remixLabels.get(selectedRemixId) : "auto-ranked only"}</strong>
          </p>
          <ul className="tight-list">
            {result.catalogRecommendation.remixCandidates.slice(0, 4).map((candidate) => (
              <li key={candidate.id}>
                <strong>{remixLabels.get(candidate.id)}</strong> | {Math.round(candidate.score * 100)}%
              </li>
            ))}
          </ul>
        </article>

        <article className="metric-card">
          <span className="metric-label">Pattern DNA</span>
          <div className="pattern-family-group">
            <strong>Creational</strong>
            <div className="tag-row">
              {result.patternGuidance.recommendedPatterns.creational.map((pattern) => (
                <span className="soft-pill" key={pattern}>
                  {getDesignPatternDisplayName(pattern)}
                </span>
              ))}
            </div>
          </div>
          <div className="pattern-family-group">
            <strong>Structural</strong>
            <div className="tag-row">
              {result.patternGuidance.recommendedPatterns.structural.map((pattern) => (
                <span className="soft-pill" key={pattern}>
                  {getDesignPatternDisplayName(pattern)}
                </span>
              ))}
            </div>
          </div>
          <div className="pattern-family-group">
            <strong>Behavioral</strong>
            <div className="tag-row">
              {result.patternGuidance.recommendedPatterns.behavioral.map((pattern) => (
                <span className="soft-pill" key={pattern}>
                  {getDesignPatternDisplayName(pattern)}
                </span>
              ))}
            </div>
          </div>
        </article>
      </div>

      <div className="top-candidate-row">
        <span className="metric-label">Top architecture candidates</span>
        <div className="tag-row">
          {result.catalogRecommendation.architectureCandidates.slice(0, 4).map((candidate) => (
            <span className="soft-pill" key={candidate.id}>
              {architectureLabels.get(candidate.id)} | {Math.round(candidate.score * 100)}%
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
