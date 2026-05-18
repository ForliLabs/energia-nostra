import {
  getOptimizationDashboard, trainOptimizationModel,
  generateDailyRecommendations, getHourlyProfile,
} from "@/lib/ai-optimization";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cerId = searchParams.get("cerId") || "cer-forli-centro";
  const view = searchParams.get("view"); // dashboard | hourly-profile
  const month = searchParams.get("month");

  if (view === "hourly-profile") {
    const profile = getHourlyProfile(month ? parseInt(month) : new Date().getMonth());
    return Response.json({ profile });
  }

  const dashboard = await getOptimizationDashboard(cerId);
  return Response.json(dashboard);
}

export async function POST(request: Request) {
  const body = await request.json() as {
    action?: string;
    cerId?: string;
    modelType?: string;
  };

  const cerId = body.cerId || "cer-forli-centro";

  if (body.action === "train") {
    const model = await trainOptimizationModel(cerId, body.modelType || "arima");
    return Response.json({ model }, { status: 201 });
  }

  if (body.action === "generate-recommendations") {
    const recommendations = await generateDailyRecommendations(cerId);
    return Response.json({ recommendations }, { status: 201 });
  }

  return Response.json({ error: "Azione non riconosciuta" }, { status: 400 });
}
