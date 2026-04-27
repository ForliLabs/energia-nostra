import { getSpidConfig, handleSpidCallback, createDbSession, logAuthEvent } from "@/lib/auth-production";
import type { SpidAttributes } from "@/lib/auth-production";

export const dynamic = "force-dynamic";

/**
 * GET: Initiate SPID login — redirect to IdP.
 * In production, this generates a SAML AuthnRequest.
 */
export async function GET() {
  const config = getSpidConfig();

  if (!config.certificate || !config.privateKey) {
    return Response.json({
      error: "SPID non configurato. Configurare le variabili d'ambiente SPID_*.",
      loginUrl: null,
      testMode: true,
      // In test mode, POST to this endpoint with SPID attributes directly
    }, { status: 503 });
  }

  // In production: generate SAML AuthnRequest XML and redirect
  const loginUrl = `${config.idpMetadataUrl}?SAMLRequest=...`;

  return Response.json({
    loginUrl,
    entityId: config.entityId,
    provider: "spid",
  });
}

/**
 * POST: Handle SPID callback (SAMLResponse) or test-mode direct auth.
 */
export async function POST(request: Request) {
  const body = await request.json() as {
    samlResponse?: string;
    testAttributes?: SpidAttributes;
  };

  let attributes: SpidAttributes;

  if (body.testAttributes && process.env.NODE_ENV !== "production") {
    // Test mode: accept attributes directly
    attributes = body.testAttributes;
  } else if (body.samlResponse) {
    // Production: parse and validate SAML response
    // In real implementation, use passport-saml or spid-saml-check
    return Response.json({ error: "SAML response parsing requires spid-express library" }, { status: 501 });
  } else {
    return Response.json({ error: "Parametri mancanti" }, { status: 400 });
  }

  const user = await handleSpidCallback(attributes);
  if (!user) {
    return Response.json({ error: "Autenticazione SPID fallita" }, { status: 401 });
  }

  const { sessionId, csrfToken } = await createDbSession(user.id);

  await logAuthEvent("spid_login", user.id, `SPID: ${attributes.spidCode}`);

  const response = Response.json({
    user,
    csrfToken,
    message: "Autenticazione SPID completata",
  });

  response.headers.set(
    "Set-Cookie",
    `session_id=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${24 * 60 * 60}`
  );

  return response;
}
