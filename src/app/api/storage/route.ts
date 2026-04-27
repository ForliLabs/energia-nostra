import {
  listFiles,
  getFolderSummary,
  generateUploadUrl,
  generateDownloadUrl,
  registerUpload,
  deleteFile,
  getFileVersions,
  getStorageStats,
} from "@/lib/storage";
import type { StorageCategory } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cerId = searchParams.get("cerId") || "cer-bertinoro";
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
    const objectId = searchParams.get("objectId");
    if (!objectId) return Response.json({ error: "objectId obbligatorio" }, { status: 400 });
    try {
      const url = await generateDownloadUrl(objectId);
      return Response.json(url);
    } catch (err) {
      return Response.json({ error: (err as Error).message }, { status: 404 });
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
    limit: parseInt(searchParams.get("limit") || "100"),
  });

  return Response.json({ files });
}

export async function POST(request: Request) {
  const body = await request.json() as {
    action: string;
    cerId?: string;
    category?: StorageCategory;
    fileName?: string;
    mimeType?: string;
    sizeBytes?: number;
    uploadedBy?: string;
    objectId?: string;
    isPublic?: boolean;
    parentId?: string;
  };

  const cerId = body.cerId || "cer-bertinoro";

  switch (body.action) {
    case "presign-upload": {
      if (!body.category || !body.fileName || !body.mimeType) {
        return Response.json({ error: "category, fileName, mimeType obbligatori" }, { status: 400 });
      }
      try {
        const url = await generateUploadUrl(cerId, body.category, body.fileName, body.mimeType);
        return Response.json(url, { status: 201 });
      } catch (err) {
        return Response.json({ error: (err as Error).message }, { status: 400 });
      }
    }

    case "register": {
      if (!body.category || !body.fileName || !body.mimeType || !body.sizeBytes) {
        return Response.json({ error: "category, fileName, mimeType, sizeBytes obbligatori" }, { status: 400 });
      }
      try {
        const obj = await registerUpload(
          cerId,
          body.category,
          body.fileName,
          body.mimeType,
          body.sizeBytes,
          body.uploadedBy || "user-admin-1",
          { isPublic: body.isPublic, parentId: body.parentId }
        );
        return Response.json(obj, { status: 201 });
      } catch (err) {
        return Response.json({ error: (err as Error).message }, { status: 400 });
      }
    }

    case "delete": {
      if (!body.objectId) {
        return Response.json({ error: "objectId obbligatorio" }, { status: 400 });
      }
      await deleteFile(body.objectId);
      return Response.json({ success: true });
    }

    default:
      return Response.json({ error: "Azione non riconosciuta" }, { status: 400 });
  }
}
