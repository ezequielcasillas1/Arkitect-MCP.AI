/**
 * Decorator: wraps an async action so overlapping calls are rejected while
 * one is already in flight. Used as a lightweight client-side abuse guard
 * on top of the server-side dedup/cap checks (double-click / rapid-repeat
 * submit prevention on the counter claim and review submit actions).
 */
export function withPendingGuard<Args extends unknown[], Result>(
  action: (...args: Args) => Promise<Result>
): (...args: Args) => Promise<Result> {
  let pending = false;

  return async (...args: Args) => {
    if (pending) {
      throw new Error("action_already_in_progress");
    }

    pending = true;
    try {
      return await action(...args);
    } finally {
      pending = false;
    }
  };
}
