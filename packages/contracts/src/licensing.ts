export interface StripeWebhookEventEnvelope {
  eventId: string;
  eventType: string;
  livemode: boolean;
  receivedAt: string;
}

export interface LicenseValidationRequest {
  licenseKey: string;
  machineFingerprint: string;
  product: "arkitect-desktop";
}

export interface EntitlementRecord {
  customerEmail?: string;
  membershipTier: "trial" | "member" | "team";
  downloadEnabled: boolean;
  updatesEnabled: boolean;
}

export interface LicenseValidationResponse {
  valid: boolean;
  reason: string;
  entitlement: EntitlementRecord;
}
