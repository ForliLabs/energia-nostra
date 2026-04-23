import { generateForecasts, fetchWeatherForecast } from "@/lib/forecasting";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cerId = searchParams.get("cerId") || "cer-bertinoro";
  const type = searchParams.get("type"); // weather | forecasts

  if (type === "weather") {
    const lat = parseFloat(searchParams.get("lat") || "44.149");
    const lng = parseFloat(searchParams.get("lng") || "12.136");
    const days = parseInt(searchParams.get("days") || "7");
    const weather = await fetchWeatherForecast(lat, lng, days);
    return Response.json({ weather });
  }

  const dashboard = await generateForecasts(cerId);
  return Response.json(dashboard);
}
