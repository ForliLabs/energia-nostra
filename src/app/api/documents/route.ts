import { getTemplates, generateDocument, requestSignatures, verifyAndSign, getGeneratedDocuments } from "@/lib/documents";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cerId = searchParams.get("cerId") || "cer-bertinoro";
  const view = searchParams.get("view"); // templates | documents

  if (view === "templates") {
    const templates = await getTemplates();
    return Response.json({ templates });
  }

  const documents = await getGeneratedDocuments(cerId);
  const templates = await getTemplates();
  return Response.json({ documents, templates });
}

export async function POST(request: Request) {
  const body = await request.json() as {
    action?: string;
    templateId?: string;
    cerId?: string;
    variables?: Record<string, string>;
    documentId?: string;
    signers?: Array<{ name: string; email: string }>;
    signatureId?: string;
    otpCode?: string;
  };

  if (body.action === "generate") {
    if (!body.templateId) {
      return Response.json({ error: "Template richiesto." }, { status: 400 });
    }
    const doc = await generateDocument({
      templateId: body.templateId,
      cerId: body.cerId || "cer-bertinoro",
      variables: body.variables || {},
    });
    return Response.json(doc, { status: 201 });
  }

  if (body.action === "request-signatures") {
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
