// Document Generation & E-Signature (Feature 6)

import { prisma } from "@/lib/prisma";

export interface DocumentTemplateInfo {
  id: string;
  name: string;
  category: string;
  version: number;
  isActive: boolean;
}

export interface GeneratedDocumentInfo {
  id: string;
  templateName: string;
  title: string;
  status: string;
  generatedAt: string;
  signatures: SignatureInfo[];
}

export interface SignatureInfo {
  id: string;
  signerName: string;
  signerEmail: string;
  status: string;
  signedAt: string | null;
}

export async function getTemplates(): Promise<DocumentTemplateInfo[]> {
  const templates = await prisma.documentTemplate.findMany({
    where: { isActive: true },
    orderBy: { category: "asc" },
  });
  return templates.map((t) => ({
    id: t.id, name: t.name, category: t.category, version: t.version, isActive: t.isActive,
  }));
}

export async function generateDocument(input: {
  templateId: string;
  cerId: string;
  variables: Record<string, string>;
}): Promise<GeneratedDocumentInfo> {
  const template = await prisma.documentTemplate.findUnique({ where: { id: input.templateId } });
  if (!template) throw new Error("Template non trovato");

  // Replace placeholders in template content
  let content = template.content;
  for (const [key, value] of Object.entries(input.variables)) {
    content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }

  // Auto-populate CER data
  const cer = await prisma.cer.findUnique({ where: { id: input.cerId }, include: { members: true } });
  if (cer) {
    content = content.replace(/\{\{cerName\}\}/g, cer.name);
    content = content.replace(/\{\{municipality\}\}/g, cer.municipality);
    content = content.replace(/\{\{province\}\}/g, cer.province);
    content = content.replace(/\{\{territory\}\}/g, cer.territory);
    content = content.replace(/\{\{cabinaPrimaria\}\}/g, cer.cabinaPrimaria || "N/A");
    content = content.replace(/\{\{year\}\}/g, String(new Date().getFullYear()));
    content = content.replace(/\{\{day\}\}/g, String(new Date().getDate()));
    content = content.replace(/\{\{month\}\}/g, new Date().toLocaleDateString("it-IT", { month: "long" }));
    content = content.replace(/\{\{date\}\}/g, new Date().toLocaleDateString("it-IT"));
    content = content.replace(/\{\{totalMembers\}\}/g, String(cer.members.length));
    content = content.replace(/\{\{memberList\}\}/g, cer.members.map((m, i) => `${i + 1}. ${m.name} (${m.type}) — POD: ${m.podCode}`).join("\n"));
  }

  const doc = await prisma.generatedDocument.create({
    data: {
      templateId: input.templateId,
      cerId: input.cerId,
      title: `${template.name} — ${cer?.name || "CER"}`,
      content,
      status: "draft",
    },
  });

  return {
    id: doc.id, templateName: template.name, title: doc.title,
    status: doc.status, generatedAt: doc.generatedAt.toISOString(), signatures: [],
  };
}

export async function requestSignatures(documentId: string, signers: Array<{ name: string; email: string }>): Promise<SignatureInfo[]> {
  const results: SignatureInfo[] = [];
  for (const signer of signers) {
    const otp = String(Math.floor(100000 + Math.random() * 900000)); // 6-digit OTP
    const req = await prisma.signatureRequest.create({
      data: {
        documentId,
        signerName: signer.name,
        signerEmail: signer.email,
        status: "sent",
        otpCode: otp,
        otpExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h expiry
      },
    });
    results.push({
      id: req.id, signerName: req.signerName, signerEmail: req.signerEmail,
      status: req.status, signedAt: null,
    });
  }
  await prisma.generatedDocument.update({ where: { id: documentId }, data: { status: "signing" } });
  return results;
}

export async function verifyAndSign(signatureId: string, otpCode: string): Promise<boolean> {
  const req = await prisma.signatureRequest.findUnique({ where: { id: signatureId } });
  if (!req || req.status !== "sent") return false;
  if (req.otpCode !== otpCode) return false;
  if (req.otpExpiresAt && req.otpExpiresAt < new Date()) return false;

  await prisma.signatureRequest.update({
    where: { id: signatureId },
    data: { status: "signed", signedAt: new Date() },
  });

  // Check if all signers have signed
  const doc = await prisma.generatedDocument.findUnique({
    where: { id: req.documentId },
    include: { signatures: true },
  });
  if (doc) {
    const allSigned = doc.signatures.every((s) => s.status === "signed" || s.id === signatureId);
    if (allSigned) {
      await prisma.generatedDocument.update({ where: { id: doc.id }, data: { status: "signed" } });
    }
  }
  return true;
}

export async function getGeneratedDocuments(cerId = "cer-bertinoro"): Promise<GeneratedDocumentInfo[]> {
  const docs = await prisma.generatedDocument.findMany({
    where: { cerId },
    include: { template: true, signatures: true },
    orderBy: { generatedAt: "desc" },
  });
  return docs.map((d) => ({
    id: d.id, templateName: d.template.name, title: d.title,
    status: d.status, generatedAt: d.generatedAt.toISOString(),
    signatures: d.signatures.map((s) => ({
      id: s.id, signerName: s.signerName, signerEmail: s.signerEmail,
      status: s.status, signedAt: s.signedAt?.toISOString() || null,
    })),
  }));
}
