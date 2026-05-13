import { fetchWeatherForecast, generateForecasts } from "@/lib/forecasting";
import { getCurrentSession, resolveSessionCerId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const session = await getCurrentSession();
  const cerId = resolveSessionCerId(session, searchParams.get("cerId"));
  const type = searchParams.get("type");

  if (type === "weather") {
    const lat = parseFloat(searchParams.get("lat") || "44.149");
    const lng = parseFloat(searchParams.get("lng") || "12.136");
    const days = parseInt(searchParams.get("days") || "7", 10);
    const weather = await fetchWeatherForecast(lat, lng, days);
    return Response.json({ weather });
  }

  const dashboard = await generateForecasts(cerId);
  return Response.json(dashboard);
}
