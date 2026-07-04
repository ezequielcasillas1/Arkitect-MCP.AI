interface CursorModelEntry {
  id: string;
  aliases?: string[];
}

function buildCursorAuthHeader(apiKey: string) {
  return `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`;
}

function normalizeModelList(data: unknown): CursorModelEntry[] {
  if (!data || typeof data !== "object") {
    return [];
  }

  const payload = data as { items?: unknown; models?: unknown };

  if (Array.isArray(payload.items)) {
    const models: CursorModelEntry[] = [];

    for (const item of payload.items) {
      if (!item || typeof item !== "object") {
        continue;
      }

      const entry = item as { id?: unknown; aliases?: unknown };

      if (typeof entry.id !== "string") {
        continue;
      }

      models.push({
        id: entry.id,
        aliases: Array.isArray(entry.aliases)
          ? entry.aliases.filter((alias): alias is string => typeof alias === "string")
          : undefined
      });
    }

    return models;
  }

  if (Array.isArray(payload.models)) {
    return payload.models
      .filter((model): model is string => typeof model === "string")
      .map((id) => ({ id }));
  }

  return [];
}

export async function listCursorModelsViaRest(apiKey: string): Promise<CursorModelEntry[]> {
  const authHeader = buildCursorAuthHeader(apiKey);
  let lastError = "Could not list Cursor models.";

  for (const url of ["https://api.cursor.com/v1/models", "https://api.cursor.com/v0/models"]) {
    const response = await fetch(url, {
      headers: {
        Authorization: authHeader,
        Accept: "application/json"
      }
    });

    if (response.status === 401 || response.status === 403) {
      throw new Error("Invalid Cursor API key.");
    }

    if (!response.ok) {
      lastError = `Cursor models request failed (${response.status}).`;
      continue;
    }

    const models = normalizeModelList(await response.json());

    if (models.length > 0) {
      return models;
    }
  }

  throw new Error(lastError);
}

export function resolveCursorModelFromList(models: CursorModelEntry[], modelId: string) {
  const direct = models.find((model) => model.id === modelId);

  if (direct) {
    return direct.id;
  }

  const aliasMatch = models.find((model) => model.aliases?.includes(modelId));

  if (aliasMatch) {
    return aliasMatch.id;
  }

  const composerMatch = models.find((model) => model.id.includes("composer"));

  return composerMatch?.id;
}
