import {
  parseCSV,
  autoDetectColumns,
  validateImportData,
  createImportJob,
  executeImport,
  rollbackImport,
  getImportJobs,
} from "@/lib/data-import";
import type { ImportType, ColumnMapping } from "@/lib/data-import";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cerId = searchParams.get("cerId") || "cer-forli-centro";

  const jobs = await getImportJobs(cerId);
  return Response.json({ jobs });
}

export async function POST(request: Request) {
  const body = await request.json() as {
    action: string;
    type?: ImportType;
    csvContent?: string;
    mappings?: ColumnMapping[];
    headers?: string[];
    cerId?: string;
    userId?: string;
    fileName?: string;
    jobId?: string;
    dryRun?: boolean;
  };

  const cerId = body.cerId || "cer-forli-centro";
  const userId = body.userId || "user-admin-1";

  switch (body.action) {
    case "parse": {
      if (!body.csvContent) {
        return Response.json({ error: "csvContent obbligatorio" }, { status: 400 });
      }
      const { headers, rows } = parseCSV(body.csvContent);
      return Response.json({
        headers,
        rowCount: rows.length,
        preview: rows.slice(0, 5),
      });
    }

    case "auto-detect": {
      if (!body.headers || !body.type) {
        return Response.json({ error: "headers e type obbligatori" }, { status: 400 });
      }
      const mappings = autoDetectColumns(body.headers, body.type);
      return Response.json({ mappings });
    }

    case "validate": {
      if (!body.csvContent || !body.mappings || !body.type) {
        return Response.json({ error: "csvContent, mappings, type obbligatori" }, { status: 400 });
      }
      const { rows } = parseCSV(body.csvContent);
      const validation = validateImportData(rows, body.mappings, body.type);
      return Response.json({ validation });
    }

    case "execute": {
      if (!body.csvContent || !body.mappings || !body.type) {
        return Response.json({ error: "csvContent, mappings, type obbligatori" }, { status: 400 });
      }

      const job = await createImportJob(
        userId,
        cerId,
        body.type,
        body.fileName || "import.csv",
        body.dryRun || false
      );

      const { rows } = parseCSV(body.csvContent);
      const result = await executeImport(
        job.id,
        rows,
        body.mappings,
        body.type,
        cerId,
        body.dryRun || false
      );

      return Response.json(result, { status: 201 });
    }

    case "rollback": {
      if (!body.jobId) {
        return Response.json({ error: "jobId obbligatorio" }, { status: 400 });
      }
      try {
        await rollbackImport(body.jobId);
        return Response.json({ success: true, message: "Import annullato con successo" });
      } catch (err) {
        return Response.json({ error: (err as Error).message }, { status: 400 });
      }
    }

    default:
      return Response.json({ error: "Azione non riconosciuta" }, { status: 400 });
  }
}
