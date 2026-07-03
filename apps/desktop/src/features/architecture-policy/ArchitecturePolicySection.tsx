import { useState } from "react";
import type {
  ComplexityProfile,
  DiagnosisResult,
  RemixProfileId,
  SavedArchitectureProfile
} from "@arkitect/contracts";
import {
  getArchitectureCatalogEntry,
  getDesignPatternDisplayName,
  getRemixProfileCatalogEntry,
  listDiagnosisStrategies,
  listRemixProfileCatalog
} from "@arkitect/core";

interface ArchitecturePolicySectionProps {
  result: DiagnosisResult;
  selectedRemixId?: RemixProfileId;
  complexityProfile: ComplexityProfile;
  requirementTags: string[];
  architectureProfiles: SavedArchitectureProfile[];
  onRemixChange: (value?: RemixProfileId) => void;
  onComplexityProfileChange: (value: ComplexityProfile) => void;
  onRequirementTagsChange: (tags: string[]) => void;
  onSaveArchitectureProfile: (name: string, existingId?: string) => void;
  onLoadArchitectureProfile: (id: string) => void;
  onDuplicateArchitectureProfile: (id: string) => void;
  onDeleteArchitectureProfile: (id: string) => void;
}

type PolicyTab = "policy" | "remixes" | "playbooks";

const remixCatalog = listRemixProfileCatalog();

export function ArchitecturePolicySection({
  result,
  selectedRemixId,
  complexityProfile,
  requirementTags,
  architectureProfiles,
  onRemixChange,
  onComplexityProfileChange,
  onRequirementTagsChange,
  onSaveArchitectureProfile,
  onLoadArchitectureProfile,
  onDuplicateArchitectureProfile,
  onDeleteArchitectureProfile
}: ArchitecturePolicySectionProps) {
  const [activeTab, setActiveTab] = useState<PolicyTab>("policy");
  const [tagInput, setTagInput] = useState("");
  const [profileName, setProfileName] = useState("");
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const strategyLabels = new Map(listDiagnosisStrategies().map((strategy) => [strategy.id, strategy.label]));
  const selectedArchitecture = result.decision.selectedArchitectureId
    ? getArchitectureCatalogEntry(result.decision.selectedArchitectureId)
    : undefined;
  const selectedRemix = result.decision.selectedRemixId
    ? getRemixProfileCatalogEntry(result.decision.selectedRemixId)
    : undefined;

  return (
    <section className="section-card">
      <div className="section-header">
        <div>
          <p className="section-label">Architecture Policy</p>
          <h2>Choose how Arkitect should continue</h2>
        </div>
        <span className="status-pill status-visible">Architecture first</span>
      </div>

      <p className="summary-copy">{result.decision.reason}</p>

      <div className="tab-row">
        <button
          className={`tab-button ${activeTab === "policy" ? "tab-button-active" : ""}`}
          onClick={() => setActiveTab("policy")}
          type="button"
        >
          Policy
        </button>
        <button
          className={`tab-button ${activeTab === "remixes" ? "tab-button-active" : ""}`}
          onClick={() => setActiveTab("remixes")}
          type="button"
        >
          Remix selection
        </button>
        <button
          className={`tab-button ${activeTab === "playbooks" ? "tab-button-active" : ""}`}
          onClick={() => setActiveTab("playbooks")}
          type="button"
        >
          Saved playbooks
        </button>
      </div>

      {activeTab === "policy" ? (
        <>
          <div className="metric-grid">
            <article className="metric-card">
              <span className="metric-label">Selected path</span>
              <strong>{selectedArchitecture?.displayName ?? "Architecture confirmation still needed"}</strong>
              <p>{selectedArchitecture?.summary ?? "Use remix guidance and user input to stabilize the architecture path."}</p>
              <div className="tag-row">
                <span className="soft-pill">{selectedRemix?.displayName ?? "No explicit remix selected"}</span>
                <span className="soft-pill">{complexityProfile}</span>
              </div>
            </article>

            <article className="metric-card">
              <span className="metric-label">Recommended next steps</span>
              <ul className="tight-list">
                {result.decision.nextSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            </article>

            <article className="metric-card">
              <span className="metric-label">Applied strategies</span>
              <div className="tag-row">
                {result.decision.appliedStrategies.map((strategyId) => (
                  <span className="soft-pill" key={strategyId}>
                    {strategyLabels.get(strategyId) ?? strategyId}
                  </span>
                ))}
              </div>
            </article>
          </div>

          <article className="panel-card section-spacer">
            <div className="control-grid">
              <label>
                Complexity profile
                <select value={complexityProfile} onChange={(event) => onComplexityProfileChange(event.target.value as ComplexityProfile)}>
                  <option value="minimal">minimal</option>
                  <option value="balanced">balanced</option>
                  <option value="structured">structured</option>
                  <option value="enterprise">enterprise</option>
                </select>
              </label>

              <label>
                Selected remix
                <select
                  value={selectedRemixId ?? ""}
                  onChange={(event) => onRemixChange((event.target.value || undefined) as RemixProfileId | undefined)}
                >
                  <option value="">Auto-ranked only</option>
                  {remixCatalog.map((remix) => (
                    <option key={remix.id} value={remix.id}>
                      {remix.displayName}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="tag-editor section-spacer">
              <div className="tag-editor-header">
                <div>
                  <span className="metric-label">Requirement tags</span>
                  <p className="helper-copy">Tags steer remix and pattern ranking. Apply scope-based suggestions or add your own.</p>
                </div>
                {result.requirementTagSuggestions.filter((suggestion) => !requirementTags.includes(suggestion.tag)).length > 0 ? (
                  <button
                    className="secondary-button"
                    onClick={() => {
                      const pending = result.requirementTagSuggestions
                        .map((suggestion) => suggestion.tag)
                        .filter((tag) => !requirementTags.includes(tag));
                      onRequirementTagsChange([...requirementTags, ...pending]);
                    }}
                    type="button"
                  >
                    Apply all suggestions
                  </button>
                ) : null}
              </div>

              {result.requirementTagSuggestions.length > 0 ? (
                <div className="suggestion-panel section-spacer">
                  <span className="metric-label">Suggested for this project</span>
                  <div className="chip-cluster">
                    {result.requirementTagSuggestions.map((suggestion) => {
                      const isApplied = requirementTags.includes(suggestion.tag);

                      return (
                        <button
                          className={`suggestion-chip ${isApplied ? "suggestion-chip-applied" : ""}`}
                          disabled={isApplied}
                          key={suggestion.tag}
                          onClick={() => onRequirementTagsChange([...requirementTags, suggestion.tag])}
                          title={`${suggestion.reason} (${Math.round(suggestion.confidence * 100)}% confidence)`}
                          type="button"
                        >
                          <span>{suggestion.tag}</span>
                          <span className="suggestion-chip-meta">{Math.round(suggestion.confidence * 100)}%</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="helper-copy section-spacer">Connect and inspect a repo to unlock scope-based tag suggestions.</p>
              )}

              <div className="preset-form-row section-spacer">
                <input
                  onChange={(event) => setTagInput(event.target.value)}
                  placeholder="Add requirement tag"
                  type="text"
                  value={tagInput}
                />
                <button
                  className="secondary-button"
                  onClick={() => {
                    const nextTag = tagInput.trim();

                    if (!nextTag || requirementTags.includes(nextTag)) {
                      return;
                    }

                    onRequirementTagsChange([...requirementTags, nextTag]);
                    setTagInput("");
                  }}
                  type="button"
                >
                  Add tag
                </button>
              </div>
              <div className="chip-cluster">
                {requirementTags.map((tag) => (
                  <button
                    className="tag-chip-button"
                    key={tag}
                    onClick={() => onRequirementTagsChange(requirementTags.filter((value) => value !== tag))}
                    type="button"
                  >
                    {tag} <span aria-hidden="true">x</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pattern-stack">
              <div className="pattern-family-group">
                <strong>Recommended creational patterns</strong>
                <div className="tag-row">
                  {result.patternGuidance.recommendedPatterns.creational.map((pattern) => (
                    <span className="soft-pill" key={pattern}>
                      {getDesignPatternDisplayName(pattern)}
                    </span>
                  ))}
                </div>
              </div>
              <div className="pattern-family-group">
                <strong>Recommended structural patterns</strong>
                <div className="tag-row">
                  {result.patternGuidance.recommendedPatterns.structural.map((pattern) => (
                    <span className="soft-pill" key={pattern}>
                      {getDesignPatternDisplayName(pattern)}
                    </span>
                  ))}
                </div>
              </div>
              <div className="pattern-family-group">
                <strong>Recommended behavioral patterns</strong>
                <div className="tag-row">
                  {result.patternGuidance.recommendedPatterns.behavioral.map((pattern) => (
                    <span className="soft-pill" key={pattern}>
                      {getDesignPatternDisplayName(pattern)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </article>
        </>
      ) : null}

      {activeTab === "remixes" ? (
        <div className="candidate-grid">
          {result.catalogRecommendation.remixCandidates.map((candidate) => {
            const remix = getRemixProfileCatalogEntry(candidate.id);

            if (!remix) {
              return null;
            }

            return (
              <button
                className={`candidate-card ${selectedRemixId === remix.id ? "candidate-card-active" : ""}`}
                key={candidate.id}
                onClick={() => onRemixChange(remix.id)}
                type="button"
              >
                <div className="candidate-card-header">
                  <strong>{remix.displayName}</strong>
                  <span className="soft-pill">{Math.round(candidate.score * 100)}%</span>
                </div>
                <p>{remix.summary}</p>
                <div className="tag-row">
                  {remix.architectureIds.slice(0, 3).map((architectureId) => (
                    <span className="soft-pill" key={architectureId}>
                      {architectureId}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      ) : null}

      {activeTab === "playbooks" ? (
        <article className="panel-card">
          <div className="preset-form-row">
            <input
              onChange={(event) => setProfileName(event.target.value)}
              placeholder="Playbook name"
              type="text"
              value={profileName}
            />
            <button
              className="secondary-button"
              onClick={() => {
                if (!profileName.trim()) {
                  return;
                }

                onSaveArchitectureProfile(profileName.trim(), editingId);
                setProfileName("");
                setEditingId(undefined);
              }}
              type="button"
            >
              {editingId ? "Update playbook" : "Save playbook"}
            </button>
          </div>

          <div className="preset-grid">
            {architectureProfiles.length > 0 ? (
              architectureProfiles.map((profile) => (
                <article className="preset-card" key={profile.id}>
                  <div className="preset-card-header">
                    <strong>{profile.name}</strong>
                    <span className="soft-pill">{profile.complexityProfile}</span>
                  </div>
                  <p>{profile.notes}</p>
                  <div className="tag-row">
                    {profile.preferredArchitectureId ? <span className="soft-pill">{profile.preferredArchitectureId}</span> : null}
                    {profile.selectedRemixId ? <span className="soft-pill">{profile.selectedRemixId}</span> : null}
                  </div>
                  <div className="preset-actions">
                    <button className="ghost-button" onClick={() => onLoadArchitectureProfile(profile.id)} type="button">
                      Load
                    </button>
                    <button
                      className="ghost-button"
                      onClick={() => {
                        setEditingId(profile.id);
                        setProfileName(profile.name);
                        onLoadArchitectureProfile(profile.id);
                      }}
                      type="button"
                    >
                      Load for update
                    </button>
                    <button className="ghost-button" onClick={() => onDuplicateArchitectureProfile(profile.id)} type="button">
                      Duplicate
                    </button>
                    <button className="ghost-button ghost-button-danger" onClick={() => onDeleteArchitectureProfile(profile.id)} type="button">
                      Delete
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-state">
                <strong>No saved playbooks yet</strong>
                <p>Save the current remix, complexity, and tag combination when you want a reusable architecture preset.</p>
              </div>
            )}
          </div>
        </article>
      ) : null}

      {result.decision.warnings.length > 0 ? (
        <div className="warning-box section-spacer">
          <strong>Warnings</strong>
          <ul className="tight-list">
            {result.decision.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
