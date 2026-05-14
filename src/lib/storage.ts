/**
 * File Storage — S3-compatible object storage with document management.
 */

import { prisma } from "@/lib/prisma";

export type StorageCategory = "atti" | "verbali" | "fatture" | "report" | "contatori" | "contratti" | "profile";

export interface StorageObjectRecord {
  id: string;
  key: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  category: StorageCategory;
  cerId: string | null;
  uploadedBy: string;
  version: number;
  isPublic: boolean;
  createdAt: string;
  downloadUrl?: string;
}

export interface FolderSummary {
  category: StorageCategory;
  label: string;
  icon: string;
  fileCount: number;
  totalSizeBytes: number;
}

export interface PresignedUrl {
  url: string;
  expiresAt: string;
  method: "PUT" | "GET";
}

const CATEGORY_LABELS: Record<StorageCategory, { label: string; icon: string }> = {
  atti: { label: "Atti Costitutivi", icon: "📜" },
  verbali: { label: "Verbali Assemblee", icon: "📋" },
  fatture: { label: "Fatture", icon: "🧾" },
  report: { label: "Report GSE", icon: "📊" },
  contatori: { label: "Dati Contatore", icon: "⚡" },
  contratti: { label: "Contratti", icon: "📝" },
  profile: { label: "Profili", icon: "👤" },
};

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/json",
  "text/plain",
  "application/vnd.oasis.opendocument.spreadsheet",
];

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MAX_CER_STORAGE = 5 * 1024 * 1024 * 1024;

interface S3Config {
  endpoint: string;
  accessKey: string;
  secretKey: string;
  bucket: string;
  region: string;
}

export function isStorageConfigured(env: Partial<NodeJS.ProcessEnv> = process.env) {
  return Boolean(env.S3_ENDPOINT && env.S3_ACCESS_KEY && env.S3_SECRET_KEY && env.S3_BUCKET && env.S3_REGION);
}

function getS3Config(): S3Config {
  if (!isStorageConfigured()) {
    throw new Error("Archiviazione oggetti non configurata. Imposta S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET e S3_REGION.");
  }

  return {
    endpoint: process.env.S3_ENDPOINT as string,
    accessKey: process.env.S3_ACCESS_KEY as string,
    secretKey: process.env.S3_SECRET_KEY as string,
    bucket: process.env.S3_BUCKET as string,
    region: process.env.S3_REGION as string,
  };
}

function generateObjectKey(cerId: string, category: StorageCategory, fileName: string) {
  const timestamp = Date.now();
  const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${cerId}/${category}/${timestamp}_${sanitized}`;
}

export function summarizeStorageRows(rows: Array<{ category: string; sizeBytes: number }>): FolderSummary[] {
  const aggregate = new Map<string, { fileCount: number; totalSizeBytes: number }>();

  for (const row of rows) {
    const current = aggregate.get(row.category) || { fileCount: 0, totalSizeBytes: 0 };
    current.fileCount += 1;
    current.totalSizeBytes += row.sizeBytes;
    aggregate.set(row.category, current);
  }

  return (Object.keys(CATEGORY_LABELS) as StorageCategory[]).map((category) => ({
    category,
    label: CATEGORY_LABELS[category].label,
    icon: CATEGORY_LABELS[category].icon,
    fileCount: aggregate.get(category)?.fileCount || 0,
    totalSizeBytes: aggregate.get(category)?.totalSizeBytes || 0,
  }));
}

export async function generateUploadUrl(
  cerId: string,
  category: StorageCategory,
  fileName: string,
  mimeType: string,
): Promise<PresignedUrl> {
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new Error(`Tipo di file non supportato: ${mimeType}. Tipi supportati: PDF, CSV, XLSX, PNG, JPG`);
  }

  const config = getS3Config();
  const key = generateObjectKey(cerId, category, fileName);

  return {
    url: `${config.endpoint}/${config.bucket}/${key}`,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    method: "PUT",
  };
}

export async function generateDownloadUrl(objectId: string): Promise<PresignedUrl> {
  const object = await prisma.storageObject.findUnique({ where: { id: objectId } });
  if (!object) throw new Error("Oggetto non trovato");

  const config = getS3Config();

  return {
    url: `${config.endpoint}/${config.bucket}/${object.key}`,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    method: "GET",
  };
}

export async function registerUpload(
  cerId: string,
  category: StorageCategory,
  fileName: string,
  mimeType: string,
  sizeBytes: number,
  uploadedBy: string,
  options?: { isPublic?: boolean; parentId?: string },
): Promise<StorageObjectRecord> {
  if (sizeBytes > MAX_FILE_SIZE) {
    throw new Error(`File troppo grande. Massimo: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  const totalUsed = await prisma.storageObject.aggregate({
    where: { cerId, deletedAt: null },
    _sum: { sizeBytes: true },
  });

  if ((totalUsed._sum.sizeBytes || 0) + sizeBytes > MAX_CER_STORAGE) {
    throw new Error("Quota di archiviazione CER superata (5GB)");
  }

  let version = 1;
  if (options?.parentId) {
    const parent = await prisma.storageObject.findUnique({ where: { id: options.parentId } });
    if (parent) version = parent.version + 1;
  }

  const object = await prisma.storageObject.create({
    data: {
      key: generateObjectKey(cerId, category, fileName),
      fileName,
      mimeType,
      sizeBytes,
      category,
      cerId,
      uploadedBy,
      version,
      parentId: options?.parentId || null,
      isPublic: options?.isPublic || false,
    },
  });

  return mapStorageObject(object);
}

export async function listFiles(
  cerId: string,
  options?: { category?: StorageCategory; search?: string; limit?: number },
): Promise<StorageObjectRecord[]> {
  const objects = await prisma.storageObject.findMany({
    where: {
      cerId,
      deletedAt: null,
      ...(options?.category ? { category: options.category } : {}),
      ...(options?.search ? { fileName: { contains: options.search } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: options?.limit || 100,
  });

  return objects.map(mapStorageObject);
}

export async function getStorageObjectById(objectId: string): Promise<StorageObjectRecord | null> {
  const object = await prisma.storageObject.findUnique({ where: { id: objectId } });
  return object ? mapStorageObject(object) : null;
}

export async function getFolderSummary(cerId: string): Promise<FolderSummary[]> {
  const rows = await prisma.storageObject.findMany({
    where: { cerId, deletedAt: null },
    select: { category: true, sizeBytes: true },
  });
  return summarizeStorageRows(rows);
}

export async function deleteFile(objectId: string): Promise<void> {
  await prisma.storageObject.update({
    where: { id: objectId },
    data: { deletedAt: new Date() },
  });
}

export async function getFileVersions(parentId: string): Promise<StorageObjectRecord[]> {
  const objects = await prisma.storageObject.findMany({
    where: {
      OR: [{ id: parentId }, { parentId }],
      deletedAt: null,
    },
    orderBy: { version: "desc" },
  });

  return objects.map(mapStorageObject);
}

const CATEGORY_ACCESS: Record<StorageCategory, string[]> = {
  atti: ["admin", "member", "auditor", "superadmin"],
  verbali: ["admin", "member", "auditor", "superadmin"],
  fatture: ["admin", "auditor", "superadmin"],
  report: ["admin", "auditor", "superadmin"],
  contatori: ["admin", "superadmin"],
  contratti: ["admin", "auditor", "superadmin"],
  profile: ["admin", "member", "superadmin"],
};

export function canAccessCategory(role: string, category: StorageCategory) {
  const allowed = CATEGORY_ACCESS[category];
  return allowed ? allowed.includes(role) : false;
}

export async function getStorageStats(cerId: string): Promise<{
  configured: boolean;
  totalFiles: number;
  totalSizeBytes: number;
  totalSizeMb: number;
  quotaUsedPct: number;
  byCategory: FolderSummary[];
}> {
  const rows = await prisma.storageObject.findMany({
    where: { cerId, deletedAt: null },
    select: { category: true, sizeBytes: true },
  });

  const byCategory = summarizeStorageRows(rows);
  const totalSizeBytes = rows.reduce((sum, row) => sum + row.sizeBytes, 0);

  return {
    configured: isStorageConfigured(),
    totalFiles: rows.length,
    totalSizeBytes,
    totalSizeMb: Math.round((totalSizeBytes / 1024 / 1024) * 100) / 100,
    quotaUsedPct: Math.round((totalSizeBytes / MAX_CER_STORAGE) * 100 * 100) / 100,
    byCategory,
  };
}

function mapStorageObject(object: {
  id: string;
  key: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  category: string;
  cerId: string | null;
  uploadedBy: string;
  version: number;
  isPublic: boolean;
  createdAt: Date;
}): StorageObjectRecord {
  return {
    id: object.id,
    key: object.key,
    fileName: object.fileName,
    mimeType: object.mimeType,
    sizeBytes: object.sizeBytes,
    category: object.category as StorageCategory,
    cerId: object.cerId,
    uploadedBy: object.uploadedBy,
    version: object.version,
    isPublic: object.isPublic,
    createdAt: object.createdAt.toISOString(),
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
