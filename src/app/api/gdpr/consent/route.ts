import { getConsents, setConsent, type ConsentPurpose } from "@/lib/gdpr";
import { getSessionFromCookie } from "@/lib/auth";
import { schemas, validateBody, validationErrorResponse } from "@/lib/validation";

export async function GET() {
  const session = await getSessionFromCookie();
  if (!session) {
    return Response.json({ error: "Autenticazione richiesta" }, { status: 401 });
  }

  const consents = getConsents(session.user.id);
  return Response.json({ consents });
}

export async function POST(request: Request) {
  const session = await getSessionFromCookie();
  if (!session) {
    return Response.json({ error: "Autenticazione richiesta" }, { status: 401 });
  }

  const body = await request.json();
  const validation = validateBody(schemas.consent, body);
  if (!validation.success) {
    return validationErrorResponse(validation.errors);
  }

  const { purpose, granted } = validation.data;
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const ua = request.headers.get("user-agent") || "unknown";

  const record = setConsent(session.user.id, purpose as ConsentPurpose, granted as boolean, ip, ua);
  return Response.json({ consent: record });
}
