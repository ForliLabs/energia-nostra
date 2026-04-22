import { geocodeAddress, fetchPvgisData } from "@/lib/pvgis";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address") || "Bertinoro";
  const peakPowerKw = parseFloat(searchParams.get("peakPower") || "6");

  const coords = geocodeAddress(address);
  if (!coords) {
    return Response.json({ error: "Impossibile geocodificare l'indirizzo." }, { status: 400 });
  }

  const result = await fetchPvgisData({
    lat: coords.lat,
    lng: coords.lng,
    peakPowerKw: Math.max(0.5, Math.min(100, peakPowerKw)),
  });

  return Response.json({ address, ...result });
}
