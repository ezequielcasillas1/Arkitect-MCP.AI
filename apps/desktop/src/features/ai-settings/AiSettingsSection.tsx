import { useState } from "react";
import type { AiProviderId, SavedProviderPreset } from "@arkitect/contracts";
import { createRecommendedModel, providerCatalog } from "@arkitect/ai";

interface AiSettingsSectionProps {
  preferredProvider: AiProviderId;
  modelName: string;
  cursorApiKey: string;
  allowUserSuppliedKeys: boolean;
  fallbackProviders: AiProviderId[];
  providerPresets: SavedProviderPreset[];
  onProviderChange: (provider: AiProviderId) => void;
  onModelNameChange: (modelName: string) => void;
  onCursorApiKeyChange: (value: string) => void;
  onKeyModeChange: (allow: boolean) => void;
  onFallbackProviderToggle: (provider: AiProviderId) => void;
  onSaveProviderPreset: (name: string, existingId?: string) => void;
  onLoadProviderPreset: (id: string) => void;
  onDuplicateProviderPreset: (id: string) => void;
  onDeleteProviderPreset: (id: string) => void;
}

const recommendation = createRecommendedModel();

export function AiSettingsSection({
  preferredProvider,
  modelName,
  cursorApiKey,
  allowUserSuppliedKeys,
  fallbackProviders,
  providerPresets,
  onProviderChange,
  onModelNameChange,
  onCursorApiKeyChange,
  onKeyModeChange,
  onFallbackProviderToggle,
  onSaveProviderPreset,
  onLoadProviderPreset,
  onDuplicateProviderPreset,
  onDeleteProviderPreset
}: AiSettingsSectionProps) {
  const [presetName, setPresetName] = useState("");
  const [editingId, setEditingId] = useState<string | undefined>(undefined);

  return (
    <section className="section-card">
      <div className="section-header">
        <div>
          <p className="section-label">AI + Execution Settings</p>
          <h2>Provider-agnostic model routing</h2>
        </div>
        <span className="status-pill status-visible">Cursor API Key + composer-2.5</span>
      </div>

      <p className="summary-copy">
        Use a Cursor API Key for Arkitect&apos;s default model access. Composer is the selected model family/build,
        with `composer-2.5` recommended by default and newer Composer-family builds recognized when available.
      </p>

      <div className="provider-grid provider-grid-large">
        {providerCatalog.map((provider) => (
          <button
            className={`provider-option ${preferredProvider === provider.id ? "provider-option-active" : ""}`}
            key={provider.id}
            onClick={() => onProviderChange(provider.id)}
            type="button"
          >
            <strong>{provider.label}</strong>
            <span>{provider.inputMode}</span>
            <p>{provider.notes[0]}</p>
          </button>
        ))}
      </div>

      <div className="step-grid">
        <article className="panel-card">
          <div className="form-stack">
            <label>
              Cursor API Key
              <input
                onChange={(event) => onCursorApiKeyChange(event.target.value)}
                placeholder="Cursor account/programmatic API key"
                type="password"
                value={cursorApiKey}
              />
            </label>

            <p className="helper-copy">
              This is a Cursor account/programmatic API key. Composer is the selected model family/build, not the key type.
            </p>

            <label>
              Selected model name
              <input onChange={(event) => onModelNameChange(event.target.value)} type="text" value={modelName} />
            </label>

            <p className="helper-copy">
              Recommended default: `composer-2.5`. Arkitect can also recognize newer Composer-family build updates.
            </p>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={allowUserSuppliedKeys}
                onChange={(event) => onKeyModeChange(event.target.checked)}
              />
              Allow users to bring other provider API keys
            </label>

            <div>
              <span className="metric-label">Fallback providers</span>
              <div className="chip-cluster">
                {providerCatalog
                  .filter((provider) => provider.id !== preferredProvider)
                  .map((provider) => (
                    <button
                      className={`tag-chip-button ${fallbackProviders.includes(provider.id) ? "tag-chip-button-active" : ""}`}
                      key={provider.id}
                      onClick={() => onFallbackProviderToggle(provider.id)}
                      type="button"
                    >
                      {provider.label}
                    </button>
                  ))}
              </div>
            </div>
          </div>

          <p className="recommendation-copy">
            Recommended default: {recommendation.modelName} via {recommendation.provider}.
          </p>
        </article>

        <article className="panel-card">
          <span className="metric-label">Saved provider presets</span>
          <p className="helper-copy">Presets store provider/model choices, not the Cursor API Key itself.</p>
          <div className="preset-form-row">
            <input
              onChange={(event) => setPresetName(event.target.value)}
              placeholder="Provider preset name"
              type="text"
              value={presetName}
            />
            <button
              className="secondary-button"
              onClick={() => {
                if (!presetName.trim()) {
                  return;
                }

                onSaveProviderPreset(presetName.trim(), editingId);
                setPresetName("");
                setEditingId(undefined);
              }}
              type="button"
            >
              {editingId ? "Update preset" : "Save preset"}
            </button>
          </div>

          <div className="preset-grid">
            {providerPresets.map((preset) => (
              <article className="preset-card" key={preset.id}>
                <div className="preset-card-header">
                  <strong>{preset.name}</strong>
                  <span className="soft-pill">{preset.preferredProvider}</span>
                </div>
                <p>{preset.modelName}</p>
                <div className="tag-row">
                  {preset.fallbackProviders.map((provider) => (
                    <span className="soft-pill" key={provider}>
                      {provider}
                    </span>
                  ))}
                </div>
                <div className="preset-actions">
                  <button className="ghost-button" onClick={() => onLoadProviderPreset(preset.id)} type="button">
                    Load
                  </button>
                  <button
                    className="ghost-button"
                    onClick={() => {
                      setEditingId(preset.id);
                      setPresetName(preset.name);
                      onLoadProviderPreset(preset.id);
                    }}
                    type="button"
                  >
                    Load for update
                  </button>
                  <button className="ghost-button" onClick={() => onDuplicateProviderPreset(preset.id)} type="button">
                    Duplicate
                  </button>
                  <button className="ghost-button ghost-button-danger" onClick={() => onDeleteProviderPreset(preset.id)} type="button">
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
