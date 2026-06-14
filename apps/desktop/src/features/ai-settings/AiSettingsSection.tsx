import { useMemo, useState } from "react";
import type { AiConnectionTestResult, AiProviderId, SavedProviderPreset } from "@arkitect/contracts";
import { createRecommendedModel, providerCatalog, resolveModelCostHint } from "@arkitect/ai";

interface AiSettingsSectionProps {
  preferredProvider: AiProviderId;
  modelName: string;
  cursorApiKey: string;
  providerKeys: Partial<Record<AiProviderId, string>>;
  allowUserSuppliedKeys: boolean;
  fallbackProviders: AiProviderId[];
  providerPresets: SavedProviderPreset[];
  connectionState: {
    status: "idle" | "testing" | "connected" | "disconnected" | "error";
    message: string;
    lastResult?: AiConnectionTestResult;
  };
  onProviderChange: (provider: AiProviderId) => void;
  onModelNameChange: (modelName: string) => void;
  onCursorApiKeyChange: (value: string) => void;
  onProviderKeyChange: (provider: AiProviderId, value: string) => void;
  onKeyModeChange: (allow: boolean) => void;
  onFallbackProviderToggle: (provider: AiProviderId) => void;
  onTestConnection: () => void;
  onSaveProviderPreset: (name: string, existingId?: string) => void;
  onLoadProviderPreset: (id: string) => void;
  onDuplicateProviderPreset: (id: string) => void;
  onDeleteProviderPreset: (id: string) => void;
}

const recommendation = createRecommendedModel();
const bringYourOwnProviders: AiProviderId[] = ["anthropic", "openai", "gemini", "groq"];

function connectionStatusClass(status: AiSettingsSectionProps["connectionState"]["status"]) {
  if (status === "connected") {
    return "status-connected";
  }

  if (status === "testing") {
    return "status-attention";
  }

  if (status === "error") {
    return "status-attention";
  }

  return "status-attention";
}

function connectionStatusLabel(status: AiSettingsSectionProps["connectionState"]["status"]) {
  switch (status) {
    case "connected":
      return "Connected";
    case "testing":
      return "Testing connection…";
    case "error":
      return "Connection failed";
    case "disconnected":
      return "Disconnected";
    default:
      return "Not tested";
  }
}

export function AiSettingsSection({
  preferredProvider,
  modelName,
  cursorApiKey,
  providerKeys,
  allowUserSuppliedKeys,
  fallbackProviders,
  providerPresets,
  connectionState,
  onProviderChange,
  onModelNameChange,
  onCursorApiKeyChange,
  onProviderKeyChange,
  onKeyModeChange,
  onFallbackProviderToggle,
  onTestConnection,
  onSaveProviderPreset,
  onLoadProviderPreset,
  onDuplicateProviderPreset,
  onDeleteProviderPreset
}: AiSettingsSectionProps) {
  const [presetName, setPresetName] = useState("");
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const costHint = useMemo(() => resolveModelCostHint(modelName), [modelName]);

  return (
    <section className="section-card">
      <div className="section-header">
        <div>
          <p className="section-label">AI + Execution</p>
          <h2>Connect your diagnosis model</h2>
        </div>
        <span className={`status-pill ${connectionStatusClass(connectionState.status)}`}>
          {connectionStatusLabel(connectionState.status)}
        </span>
      </div>

      <p className="summary-copy">
        Connect a Cursor account API key for Composer (default <code>composer-2.5</code>). The key is your Cursor account
        credential; Composer is the model family. Newer Composer builds are recognized when your account exposes them.
        Keys stay in this session only — saved presets never store API keys.
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
            {provider.recommended ? <span className="soft-pill">Recommended</span> : null}
          </button>
        ))}
      </div>

      <div className="step-grid">
        <article className="panel-card">
          <div className="form-stack">
            {preferredProvider === "composer-2.5" ? (
              <label>
                Cursor API Key
                <input
                  autoComplete="off"
                  onChange={(event) => onCursorApiKeyChange(event.target.value)}
                  placeholder="Cursor account / programmatic API key"
                  type="password"
                  value={cursorApiKey}
                />
              </label>
            ) : null}

            {allowUserSuppliedKeys && preferredProvider !== "composer-2.5" ? (
              <label>
                {providerCatalog.find((item) => item.id === preferredProvider)?.label ?? preferredProvider} API Key
                <input
                  autoComplete="off"
                  onChange={(event) => onProviderKeyChange(preferredProvider, event.target.value)}
                  placeholder={`${preferredProvider} API key`}
                  type="password"
                  value={providerKeys[preferredProvider] ?? ""}
                />
              </label>
            ) : null}

            <p className="helper-copy">
              Use <code>arkitect-mock</code> in dev to exercise the flow without a real key. Run Diagnosis keeps the
              rule engine as baseline and merges AI reasoning when connected.
            </p>

            <label>
              Model id
              <input onChange={(event) => onModelNameChange(event.target.value)} type="text" value={modelName} />
            </label>

            <article className="summary-tile cost-hint-box">
              <span className="metric-label">Cost / quality hint</span>
              <strong>{costHint.modelId}</strong>
              <p>
                Cost: {costHint.costTier} · Quality: {costHint.qualityTier}
              </p>
              <small>{costHint.summary}</small>
            </article>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={allowUserSuppliedKeys}
                onChange={(event) => onKeyModeChange(event.target.checked)}
              />
              Allow bring-your-own provider API keys
            </label>

            {allowUserSuppliedKeys ? (
              <div className="dual-form-grid">
                {bringYourOwnProviders.map((providerId) => (
                  <label key={providerId}>
                    {providerCatalog.find((item) => item.id === providerId)?.label ?? providerId} (optional)
                    <input
                      autoComplete="off"
                      onChange={(event) => onProviderKeyChange(providerId, event.target.value)}
                      placeholder="Optional fallback key"
                      type="password"
                      value={providerKeys[providerId] ?? ""}
                    />
                  </label>
                ))}
              </div>
            ) : null}

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

            <div className="connection-actions">
              <button
                className="primary-button action-button-wide"
                disabled={connectionState.status === "testing"}
                onClick={onTestConnection}
                type="button"
              >
                {connectionState.status === "testing" ? "Testing connection…" : "Test connection"}
              </button>
              {connectionState.message ? <p className="helper-copy">{connectionState.message}</p> : null}
              {connectionState.lastResult?.resolvedModelId ? (
                <p className="helper-copy">Resolved model: {connectionState.lastResult.resolvedModelId}</p>
              ) : null}
            </div>
          </div>

          <p className="recommendation-copy">
            Recommended default: {recommendation.modelName} via {recommendation.provider}.
          </p>
        </article>

        <article className="panel-card">
          <span className="metric-label">Saved provider presets</span>
          <p className="helper-copy">Presets store provider/model choices only — never API keys.</p>
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
