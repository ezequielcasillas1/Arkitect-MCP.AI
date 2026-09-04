export interface OpenSourceCtaCopy {
  label: string;
  heading: string;
  body: string;
  installLabel: string;
  donateLabel: string;
  helperPrefix: string;
  unwiredHint: string;
}

export interface DownloadCounterStats {
  claimedCount: number;
  spotLimit: number;
}

export interface ClaimDownloadSlotResult extends DownloadCounterStats {
  alreadyClaimed: boolean;
}
