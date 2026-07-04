export interface LegalSection {
  id: string;
  title: string;
  paragraphs: string[];
}

export interface LegalDocument {
  label: string;
  title: string;
  intro: string;
  sections: LegalSection[];
}
