export interface ExternalResource {
  label: string;
  url: string;
}

export interface EducationTopic {
  id: string;
  title: string;
  summary: string;
  architectureConnection: string;
  resource: ExternalResource;
}

export interface EducationSection {
  id: string;
  title: string;
  intro: string;
  topics: EducationTopic[];
  resources?: ExternalResource[];
}
