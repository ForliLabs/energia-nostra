import { getCieConfig, handleCieCallback, createDbSession, logAuthEvent } from "@/lib/auth-production";
import type { CieAttributes } from "@/lib/auth-production";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = getCieConfig();

  if (!config.certificate || !config.privateKey) {
    return Response.json({
      error: "CIE non configurato. Configurare le variabili d'ambiente CIE_*.",
      loginUrl: null,
      testMode: true,
    }, { status: 503 });
  }

  return Response.json({
    loginUrl: `${config.idpMetadataUrl}?SAMLRequest=...`,
    entityId: config.entityId,
    provider: "cie",
  });
}

export async function POST(request: Request) {
  const body = await request.json() as {
    samlResponse?: string;
    testAttributes?: CieAttributes;
  };

  let attributes: CieAttributes;

  if (body.testAttributes && process.env.NODE_ENV !== "production") {
    attributes = body.testAttributes;
  } else if (body.samlResponse) {
    return Response.json({ error: "SAML response parsing requires CIE library" }, { status: 501 });
  } else {
    return Response.json({ error: "Parametri mancanti" }, { status: 400 });
  }

  const user = await handleCieCallback(attributes);
  if (!user) {
    return Response.json({ error: "Autenticazione CIE fallita" }, { status: 401 });
  }

  const { sessionId, csrfToken } = await createDbSession(user.id);

  await logAuthEvent("cie_login", user.id, `CIE: ${attributes.cieId}`);

  const response = Response.json({
    user,
    csrfToken,
    message: "Autenticazione CIE completata",
  });

  response.headers.set(
    "Set-Cookie",
    `session_id=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${24 * 60 * 60}`
  );

  return response;
}
