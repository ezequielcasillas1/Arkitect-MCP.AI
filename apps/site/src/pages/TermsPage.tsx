import { LegalPageLayout, termsDocument } from "../features/legal";

export function TermsPage() {
  return <LegalPageLayout route="/terms" document={termsDocument} />;
}
