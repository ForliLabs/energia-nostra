import {
  canAccessCategory,
  deleteFile,
  generateDownloadUrl,
  generateUploadUrl,
  getFileVersions,
  getFolderSummary,
  getStorageObjectById,
  getStorageStats,
  listFiles,
  registerUpload,
} from "@/lib/storage";
import type { StorageCategory } from "@/lib/storage";
import { getCurrentSession, resolveSessionCerId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const session = await getCurrentSession();
  const cerId = resolveSessionCerId(session, searchParams.get("cerId"));
  const view = searchParams.get("view");
  const category = searchParams.get("category") as StorageCategory | null;

  if (view === "folders") {
    const folders = await getFolderSummary(cerId);
    return Response.json({ folders });
  }

  if (view === "stats") {
    const stats = await getStorageStats(cerId);
    return Response.json({ stats });
  }

  if (view === "download") {
    if (!session) {
      return Response.json({ error: "Accedi per scaricare i documenti." }, { status: 401 });
    }

    const objectId = searchParams.get("objectId");
    if (!objectId) return Response.json({ error: "objectId obbligatorio" }, { status: 400 });

    const object = await getStorageObjectById(objectId);
    if (!object) {
      return Response.json({ error: "Oggetto non trovato" }, { status: 404 });
    }
    if (!canAccessCategory(session.user.role, object.category)) {
      return Response.json({ error: "Permessi insufficienti per questa categoria." }, { status: 403 });
    }

    try {
      const url = await generateDownloadUrl(objectId);
      return Response.json(url);
    } catch (error) {
      return Response.json({ error: (error as Error).message }, { status: 400 });
    }
  }

  if (view === "versions") {
    const parentId = searchParams.get("parentId");
    if (!parentId) return Response.json({ error: "parentId obbligatorio" }, { status: 400 });
    const versions = await getFileVersions(parentId);
    return Response.json({ versions });
  }

  const files = await listFiles(cerId, {
    category: category || undefined,
    search: searchParams.get("search") || undefined,
    limit: Number.parseInt(searchParams.get("limit") || "100", 10),
  });

  return Response.json({ files });
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return Response.json({ error: "Accedi per gestire l'archivio documentale." }, { status: 401 });
  }

  const body = (await request.json()) as {
    action: string;
    category?: StorageCategory;
    fileName?: string;
    mimeType?: string;
    sizeBytes?: number;
    objectId?: string;
    isPublic?: boolean;
    parentId?: string;
  };

  const cerId = resolveSessionCerId(session);

  switch (body.action) {
    case "presign-upload": {
      if (!body.category || !body.fileName || !body.mimeType) {
        return Response.json({ error: "category, fileName, mimeType obbligatori" }, { status: 400 });
      }
      if (!canAccessCategory(session.user.role, body.category)) {
        return Response.json({ error: "Permessi insufficienti per questa categoria." }, { status: 403 });
      }
      try {
        const url = await generateUploadUrl(cerId, body.category, body.fileName, body.mimeType);
        return Response.json(url, { status: 201 });
      } catch (error) {
        return Response.json({ error: (error as Error).message }, { status: 400 });
      }
    }

    case "register": {
      if (!body.category || !body.fileName || !body.mimeType || typeof body.sizeBytes !== "number") {
        return Response.json({ error: "category, fileName, mimeType, sizeBytes obbligatori" }, { status: 400 });
      }
      if (!canAccessCategory(session.user.role, body.category)) {
        return Response.json({ error: "Permessi insufficienti per questa categoria." }, { status: 403 });
      }
      try {
        const object = await registerUpload(
          cerId,
          body.category,
          body.fileName,
          body.mimeType,
          body.sizeBytes,
          session.user.id,
          { isPublic: body.isPublic, parentId: body.parentId },
        );
        return Response.json(object, { status: 201 });
      } catch (error) {
        return Response.json({ error: (error as Error).message }, { status: 400 });
      }
    }

    case "delete": {
      if (!body.objectId) {
        return Response.json({ error: "objectId obbligatorio" }, { status: 400 });
      }
      const object = await getStorageObjectById(body.objectId);
      if (!object) {
        return Response.json({ error: "Oggetto non trovato" }, { status: 404 });
      }
      if (!canAccessCategory(session.user.role, object.category)) {
        return Response.json({ error: "Permessi insufficienti per questa categoria." }, { status: 403 });
      }
      await deleteFile(body.objectId);
      return Response.json({ success: true });
    }

    default:
      return Response.json({ error: "Azione non riconosciuta" }, { status: 400 });
  }
}
