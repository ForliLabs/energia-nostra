import { generateDocument, getGeneratedDocuments, getTemplates, requestSignatures, verifyAndSign } from "@/lib/documents";
import { getCurrentSession, hasRequiredRole, resolveSessionCerId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const session = await getCurrentSession();
  const cerId = resolveSessionCerId(session, searchParams.get("cerId"));
  const view = searchParams.get("view");

  if (view === "templates") {
    const templates = await getTemplates();
    return Response.json({ templates });
  }

  const [documents, templates] = await Promise.all([getGeneratedDocuments(cerId), getTemplates()]);
  return Response.json({ documents, templates });
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return Response.json({ error: "Accedi per gestire il workflow documentale." }, { status: 401 });
  }

  const body = (await request.json()) as {
    action?: string;
    templateId?: string;
    variables?: Record<string, string>;
    documentId?: string;
    signers?: Array<{ name: string; email: string }>;
    signatureId?: string;
    otpCode?: string;
  };

  if (body.action === "generate") {
    if (!hasRequiredRole(session, ["admin", "auditor", "superadmin"])) {
      return Response.json({ error: "Permessi insufficienti per generare documenti." }, { status: 403 });
    }
    if (!body.templateId) {
      return Response.json({ error: "Template richiesto." }, { status: 400 });
    }

    const document = await generateDocument({
      templateId: body.templateId,
      cerId: resolveSessionCerId(session),
      variables: body.variables || {},
    });
    return Response.json(document, { status: 201 });
  }

  if (body.action === "request-signatures") {
    if (!hasRequiredRole(session, ["admin", "auditor", "superadmin"])) {
      return Response.json({ error: "Permessi insufficienti per avviare la firma." }, { status: 403 });
    }
    if (!body.documentId || !body.signers?.length) {
      return Response.json({ error: "Document ID e firmatari richiesti." }, { status: 400 });
    }
    const signatures = await requestSignatures(body.documentId, body.signers);
    return Response.json({ signatures }, { status: 201 });
  }

  if (body.action === "verify-sign") {
    if (!body.signatureId || !body.otpCode) {
      return Response.json({ error: "Signature ID e OTP richiesti." }, { status: 400 });
    }
    const success = await verifyAndSign(body.signatureId, body.otpCode);
    if (!success) {
      return Response.json({ error: "Verifica OTP fallita o firma scaduta." }, { status: 400 });
    }
    return Response.json({ success: true });
  }

  return Response.json({ error: "Azione non riconosciuta." }, { status: 400 });
}
