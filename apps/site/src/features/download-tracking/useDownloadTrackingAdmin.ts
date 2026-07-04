import { useCallback, useEffect, useState } from "react";
import { downloadTrackingGateway } from "./data-access";
import type { FileDownloadStats } from "./types";

interface DownloadTrackingAdminState {
  status: "loading" | "ready" | "error";
  stats: FileDownloadStats[];
  errorMessage: string | null;
  refresh: () => void;
}

export function useDownloadTrackingAdmin(): DownloadTrackingAdminState {
  const [status, setStatus] = useState<DownloadTrackingAdminState["status"]>("loading");
  const [stats, setStats] = useState<FileDownloadStats[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(() => {
    setStatus("loading");
    setErrorMessage(null);

    downloadTrackingGateway
      .getStats()
      .then((nextStats) => {
        setStats(nextStats);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        setErrorMessage(error instanceof Error ? error.message : "Failed to load download stats.");
        setStatus("error");
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { status, stats, errorMessage, refresh: load };
}
