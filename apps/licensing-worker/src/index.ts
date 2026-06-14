import type {
  EntitlementRecord,
  LicenseValidationRequest,
  LicenseValidationResponse,
  StripeWebhookEventEnvelope
} from "@arkitect/contracts";

interface Env {
  STRIPE_WEBHOOK_SECRET?: string;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8"
    }
  });
}

async function handleStripeWebhook(request: Request, env: Env): Promise<Response> {
  const signature = request.headers.get("stripe-signature");
  const body = await request.text();

  const event: StripeWebhookEventEnvelope = {
    eventId: signature ?? "placeholder-signature",
    eventType: "unverified.placeholder",
    livemode: false,
    receivedAt: new Date().toISOString()
  };

  return json({
    received: true,
    configured: Boolean(env.STRIPE_WEBHOOK_SECRET),
    bodyLength: body.length,
    event
  });
}

function createEntitlement(valid: boolean): EntitlementRecord {
  return {
    membershipTier: valid ? "member" : "trial",
    downloadEnabled: valid,
    updatesEnabled: valid
  };
}

async function handleLicenseValidation(request: Request): Promise<Response> {
  const payload = (await request.json()) as LicenseValidationRequest;
  const valid = payload.licenseKey.startsWith("ark_") && payload.machineFingerprint.length >= 8;

  const response: LicenseValidationResponse = {
    valid,
    reason: valid
      ? "License format passed placeholder validation."
      : "License keys must start with ark_ and include a machine fingerprint.",
    entitlement: createEntitlement(valid)
  };

  return json(response, valid ? 200 : 422);
}

function handleEntitlementLookup(licenseKey: string): Response {
  const valid = licenseKey.startsWith("ark_");

  return json({
    licenseKey,
    entitlement: createEntitlement(valid),
    source: "placeholder-worker-surface"
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/webhooks/stripe") {
      return handleStripeWebhook(request, env);
    }

    if (request.method === "POST" && url.pathname === "/licenses/validate") {
      return handleLicenseValidation(request);
    }

    if (request.method === "GET" && url.pathname.startsWith("/entitlements/")) {
      const licenseKey = url.pathname.replace("/entitlements/", "");
      return handleEntitlementLookup(licenseKey);
    }

    return json(
      {
        product: "Arkitect licensing worker",
        routes: [
          "POST /webhooks/stripe",
          "POST /licenses/validate",
          "GET /entitlements/:licenseKey"
        ]
      },
      404
    );
  }
};
