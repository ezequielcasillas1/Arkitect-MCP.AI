export interface DownloadCounterStats {
  claimedCount: number;
  spotLimit: number;
}

export interface ClaimDownloadSlotResult extends DownloadCounterStats {
  alreadyClaimed: boolean;
}
