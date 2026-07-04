export type DownloadFileKey = "arkitect-setup" | "user-guide";

export interface TrackedDownloadFile {
  key: DownloadFileKey;
  label: string;
}

export interface FileDownloadStats {
  fileKey: DownloadFileKey;
  label: string;
  totalCount: number;
  uniqueCount: number;
}

export interface RecordDownloadResult {
  fileKey: DownloadFileKey;
  totalCount: number;
  uniqueCount: number;
}
