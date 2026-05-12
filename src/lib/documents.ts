// Document Generation & E-Signature (Feature 6)

import { DEFAULT_CER_ID } from "@/lib/app-config";
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

export function applyDocumentVariables(content: string, variables: Record<string, string>) {
  let resolved = content;
  for (const [key, value] of Object.entries(variables)) {
    resolved = resolved.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }
  return resolved.replace(/\{\{[^}]+\}\}/g, "—");
}

export function generateSignatureOtp() {
  const randomValue = crypto.getRandomValues(new Uint32Array(1))[0];
  return String((randomValue % 900000) + 100000);
}

export async function getTemplates(): Promise<DocumentTemplateInfo[]> {
  const templates = await prisma.documentTemplate.findMany({
    where: { isActive: true },
    orderBy: [{ category: "asc" }, { version: "desc" }],
  });
  return templates.map((template) => ({
    id: template.id,
    name: template.name,
    category: template.category,
    version: template.version,
    isActive: template.isActive,
  }));
}

export async function generateDocument(input: {
  templateId: string;
  cerId: string;
  variables: Record<string, string>;
}): Promise<GeneratedDocumentInfo> {
  const template = await prisma.documentTemplate.findUnique({ where: { id: input.templateId } });
  if (!template) throw new Error("Template non trovato");

  const cer = await prisma.cer.findUnique({ where: { id: input.cerId }, include: { members: true } });

  const now = new Date();
  const mergedVariables: Record<string, string> = {
    year: String(now.getFullYear()),
    day: String(now.getDate()),
    month: now.toLocaleDateString("it-IT", { month: "long" }),
    date: now.toLocaleDateString("it-IT"),
    approvalDate: now.toLocaleDateString("it-IT"),
    boardSize: "5",
    assemblyType: "ordinaria",
    time: "18:00",
    location: cer ? `${cer.municipality} (${cer.province})` : "Sede CER",
    attendeeCount: cer ? String(cer.members.length) : "0",
    quorumReached: "Da verificare",
    agenda: "1. Approvazione ordine del giorno\n2. Aggiornamento stato CER",
    deliberations: "In attesa di compilazione",
    president: "Presidente CER",
    secretary: "Segreteria CER",
    memberName: cer?.members[0]?.name || "Nuovo socio",
    fiscalCode: "—",
    podCode: cer?.members[0]?.podCode || "—",
    memberType: cer?.members[0]?.type || "—",
    ...input.variables,
  };

  if (cer) {
    mergedVariables.cerName = mergedVariables.cerName || cer.name;
    mergedVariables.municipality = mergedVariables.municipality || cer.municipality;
    mergedVariables.province = mergedVariables.province || cer.province;
    mergedVariables.territory = mergedVariables.territory || cer.territory;
    mergedVariables.cabinaPrimaria = mergedVariables.cabinaPrimaria || cer.cabinaPrimaria || "N/A";
    mergedVariables.totalMembers = mergedVariables.totalMembers || String(cer.members.length);
    mergedVariables.memberList = mergedVariables.memberList || cer.members
      .map((member, index) => `${index + 1}. ${member.name} (${member.type}) — POD: ${member.podCode}`)
      .join("\n");
  }

  const content = applyDocumentVariables(template.content, mergedVariables);

  const document = await prisma.generatedDocument.create({
    data: {
      templateId: input.templateId,
      cerId: input.cerId,
      title: `${template.name} — ${cer?.name || "CER"}`,
      content,
      status: "draft",
    },
  });

  return {
    id: document.id,
    templateName: template.name,
    title: document.title,
    status: document.status,
    generatedAt: document.generatedAt.toISOString(),
    signatures: [],
  };
}

export async function requestSignatures(documentId: string, signers: Array<{ name: string; email: string }>): Promise<SignatureInfo[]> {
  const signatures: SignatureInfo[] = [];
  for (const signer of signers) {
    const request = await prisma.signatureRequest.create({
      data: {
        documentId,
        signerName: signer.name,
        signerEmail: signer.email,
        status: "sent",
        otpCode: generateSignatureOtp(),
        otpExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    signatures.push({
      id: request.id,
      signerName: request.signerName,
      signerEmail: request.signerEmail,
      status: request.status,
      signedAt: null,
    });
  }

  await prisma.generatedDocument.update({ where: { id: documentId }, data: { status: "signing" } });
  return signatures;
}

export async function verifyAndSign(signatureId: string, otpCode: string): Promise<boolean> {
  const request = await prisma.signatureRequest.findUnique({ where: { id: signatureId } });
  if (!request || request.status !== "sent") return false;
  if (request.otpCode !== otpCode) return false;
  if (request.otpExpiresAt && request.otpExpiresAt < new Date()) return false;

  await prisma.signatureRequest.update({
    where: { id: signatureId },
    data: { status: "signed", signedAt: new Date() },
  });

  const document = await prisma.generatedDocument.findUnique({
    where: { id: request.documentId },
    include: { signatures: true },
  });

  if (document && document.signatures.every((signature) => signature.status === "signed" || signature.id === signatureId)) {
    await prisma.generatedDocument.update({ where: { id: document.id }, data: { status: "signed" } });
  }

  return true;
}

export async function getGeneratedDocuments(cerId = DEFAULT_CER_ID): Promise<GeneratedDocumentInfo[]> {
  const documents = await prisma.generatedDocument.findMany({
    where: { cerId },
    include: { template: true, signatures: true },
    orderBy: { generatedAt: "desc" },
  });

  return documents.map((document) => ({
    id: document.id,
    templateName: document.template.name,
    title: document.title,
    status: document.status,
    generatedAt: document.generatedAt.toISOString(),
    signatures: document.signatures.map((signature) => ({
      id: signature.id,
      signerName: signature.signerName,
      signerEmail: signature.signerEmail,
      status: signature.status,
      signedAt: signature.signedAt?.toISOString() || null,
    })),
  }));
}
