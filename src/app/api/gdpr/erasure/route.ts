import { eraseUserData } from "@/lib/gdpr";
import { getSessionFromCookie } from "@/lib/auth";
import { schemas, validateBody, validationErrorResponse } from "@/lib/validation";

export async function POST(request: Request) {
  const session = await getSessionFromCookie();
  if (!session) {
    return Response.json({ error: "Autenticazione richiesta" }, { status: 401 });
  }

  const body = await request.json();
  const validation = validateBody(schemas.gdprErasure, body);
  if (!validation.success) {
    return validationErrorResponse(validation.errors);
  }

  const { userId, confirmation } = validation.data;

  // Users can only erase their own data, unless superadmin
  if (userId !== session.user.id && session.user.role !== "superadmin") {
    return Response.json({ error: "Non autorizzato" }, { status: 403 });
  }

  if (confirmation !== "ELIMINA") {
    return Response.json({ error: "Conferma richiesta: digitare ELIMINA" }, { status: 400 });
  }

  const result = await eraseUserData(userId);
  return Response.json(result);
}
