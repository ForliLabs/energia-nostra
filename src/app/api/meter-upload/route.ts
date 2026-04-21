import { cerMembers } from "@/lib/data";
import { parseMeterCsv, validateMeterData } from "@/lib/meter-pipeline";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || "";

  let csvText: string;

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return Response.json({ error: "Nessun file caricato." }, { status: 400 });
    }
    csvText = await file.text();
  } else {
    const body = (await request.json()) as { csv?: string };
    if (!body.csv) {
      return Response.json({ error: "Dati CSV mancanti." }, { status: 400 });
    }
    csvText = body.csv;
  }

  const { records, errors: parseErrors } = parseMeterCsv(csvText);

  if (records.length === 0) {
    return Response.json(
      { error: "Nessun record valido trovato nel file.", parseErrors },
      { status: 400 }
    );
  }

  const validation = validateMeterData(records, cerMembers);

  return Response.json({
    uploadId: crypto.randomUUID().slice(0, 8),
    fileName: contentType.includes("multipart") ? "upload.csv" : "inline-data",
    ...validation,
    parseErrors,
  });
}
