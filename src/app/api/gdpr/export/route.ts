import { exportUserData } from "@/lib/gdpr";
import { getSessionFromCookie } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getSessionFromCookie();
  if (!session) {
    return Response.json({ error: "Autenticazione richiesta" }, { status: 401 });
  }

  const url = new URL(request.url);
  const format = (url.searchParams.get("format") as "json" | "csv") || "json";
  const userId = url.searchParams.get("userId") || session.user.id;

  // Users can only export their own data, unless admin
  if (userId !== session.user.id && session.user.role !== "admin" && session.user.role !== "superadmin") {
    return Response.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const exportData = await exportUserData(userId, format);
  return Response.json(exportData);
}
