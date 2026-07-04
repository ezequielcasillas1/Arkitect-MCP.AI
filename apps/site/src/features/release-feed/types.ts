export type ReleaseStatus = "released" | "upcoming";

export interface ReleaseEntry {
  version: string;
  releaseDate: string | null;
  status: ReleaseStatus;
  changes: string[];
}
