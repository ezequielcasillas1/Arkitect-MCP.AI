import { LegalPageLayout, privacyDocument } from "../features/legal";

export function PrivacyPage() {
  return <LegalPageLayout route="/privacy" document={privacyDocument} />;
}
