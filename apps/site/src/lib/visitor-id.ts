const STORAGE_KEY = "arkitect_visitor_id";
const MIN_LENGTH = 8;

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `visitor-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

/**
 * Returns a stable, anonymous per-browser identifier persisted in
 * localStorage. Used only for duplicate-claim prevention and basic
 * review rate-limiting — never tied to a real identity.
 */
export function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") {
    return createId();
  }

  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing && existing.length >= MIN_LENGTH) {
      return existing;
    }

    const generated = createId();
    window.localStorage.setItem(STORAGE_KEY, generated);
    return generated;
  } catch {
    return createId();
  }
}
