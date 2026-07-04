import { useCallback, useEffect, useRef, useState } from "react";
import { getOrCreateVisitorId } from "../../lib/visitor-id";
import { withPendingGuard } from "../../lib/with-pending-guard";
import { downloadCounterGateway } from "./data-access";
import type { DownloadCounterStats } from "./types";

type Status = "loading" | "ready" | "claiming" | "error";

interface DownloadCounterState {
  status: Status;
  stats: DownloadCounterStats | null;
  hasClaimed: boolean;
  errorMessage: string | null;
  claim: () => Promise<void>;
}

const CLAIMED_FLAG_KEY = "arkitect_download_claimed";

export function useDownloadCounter(): DownloadCounterState {
  const [status, setStatus] = useState<Status>("loading");
  const [stats, setStats] = useState<DownloadCounterStats | null>(null);
  const [hasClaimed, setHasClaimed] = useState<boolean>(
    () => typeof window !== "undefined" && window.localStorage.getItem(CLAIMED_FLAG_KEY) === "true"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const guardedClaimRef = useRef(withPendingGuard(downloadCounterGateway.claimSlot));

  useEffect(() => {
    let cancelled = false;

    downloadCounterGateway
      .getStats()
      .then((result) => {
        if (!cancelled) {
          setStats(result);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setErrorMessage("Could not load the live claim count. Please refresh to try again.");
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const claim = useCallback(async () => {
    setStatus("claiming");
    setErrorMessage(null);

    try {
      const visitorId = getOrCreateVisitorId();
      const result = await guardedClaimRef.current(visitorId);
      setStats({ claimedCount: result.claimedCount, spotLimit: result.spotLimit });
      setHasClaimed(true);
      window.localStorage.setItem(CLAIMED_FLAG_KEY, "true");
      setStatus("ready");
    } catch {
      setErrorMessage("We couldn't claim your free spot just now. Please try again in a moment.");
      setStatus("ready");
    }
  }, []);

  return { status, stats, hasClaimed, errorMessage, claim };
}
