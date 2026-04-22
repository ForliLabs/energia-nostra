export interface PvgisResult {
  location: { latitude: number; longitude: number; elevation: number };
  annualProductionKwh: number;
  optimalTilt: number;
  optimalAzimuth: number;
  monthlyProduction: Array<{ month: string; kWh: number }>;
  peakPowerKw: number;
  systemLoss: number;
}

export interface PvgisParams {
  lat: number;
  lng: number;
  peakPowerKw: number;
  systemLoss?: number;
  tilt?: number;
  azimuth?: number;
}

const MONTH_NAMES = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];

// Common addresses in Forlì-Cesena for geocoding fallback
const KNOWN_LOCATIONS: Record<string, { lat: number; lng: number }> = {
  bertinoro: { lat: 44.149, lng: 12.136 },
  forlì: { lat: 44.222, lng: 12.041 },
  forli: { lat: 44.222, lng: 12.041 },
  cesena: { lat: 44.140, lng: 12.242 },
  forlimpopoli: { lat: 44.187, lng: 12.128 },
  meldola: { lat: 44.127, lng: 12.061 },
  "fratta terme": { lat: 44.124, lng: 12.148 },
  predappio: { lat: 44.102, lng: 11.980 },
  castrocaro: { lat: 44.172, lng: 11.949 },
};

export function geocodeAddress(address: string): { lat: number; lng: number } | null {
  const lower = address.toLowerCase();
  for (const [key, coords] of Object.entries(KNOWN_LOCATIONS)) {
    if (lower.includes(key)) return coords;
  }
  // Default to Bertinoro area
  return { lat: 44.149, lng: 12.136 };
}

export async function fetchPvgisData(params: PvgisParams): Promise<PvgisResult> {
  const { lat, lng, peakPowerKw, systemLoss = 14, tilt, azimuth } = params;

  const url = new URL("https://re.jrc.ec.europa.eu/api/v5_3/PVcalc");
  url.searchParams.set("lat", lat.toString());
  url.searchParams.set("lon", lng.toString());
  url.searchParams.set("peakpower", peakPowerKw.toString());
  url.searchParams.set("loss", systemLoss.toString());
  url.searchParams.set("outputformat", "json");

  if (tilt !== undefined) url.searchParams.set("angle", tilt.toString());
  if (azimuth !== undefined) url.searchParams.set("aspect", azimuth.toString());
  if (tilt === undefined) url.searchParams.set("optimalangles", "1");

  try {
    const response = await fetch(url.toString(), { next: { revalidate: 86400 } }); // Cache 24h
    if (!response.ok) throw new Error(`PVGIS API error: ${response.status}`);

    const data = await response.json();
    const outputs = data?.outputs;
    const totals = outputs?.totals?.fixed;
    const monthly = outputs?.monthly?.fixed || [];

    return {
      location: {
        latitude: data?.inputs?.location?.latitude || lat,
        longitude: data?.inputs?.location?.longitude || lng,
        elevation: data?.inputs?.location?.elevation || 0,
      },
      annualProductionKwh: totals?.E_y || estimateProduction(lat, peakPowerKw),
      optimalTilt: data?.inputs?.mounting_system?.fixed?.slope?.value || 35,
      optimalAzimuth: data?.inputs?.mounting_system?.fixed?.azimuth?.value || 0,
      monthlyProduction: monthly.map((m: { month: number; E_m: number }) => ({
        month: MONTH_NAMES[m.month - 1] || `M${m.month}`,
        kWh: Math.round(m.E_m),
      })),
      peakPowerKw,
      systemLoss,
    };
  } catch {
    // Fallback with estimated data for Forlì-Cesena area
    return generateEstimatedData(lat, lng, peakPowerKw, systemLoss);
  }
}

// Estimation for fallback when PVGIS API is unavailable
function estimateProduction(lat: number, peakPowerKw: number): number {
  const irradiance = 1400 - (lat - 44) * 30; // ~1400 kWh/m²/year for Forlì-Cesena
  return Math.round(peakPowerKw * irradiance * 0.85);
}

function generateEstimatedData(lat: number, lng: number, peakPowerKw: number, systemLoss: number): PvgisResult {
  const annual = estimateProduction(lat, peakPowerKw);
  const monthlyFactors = [0.05, 0.06, 0.08, 0.10, 0.11, 0.12, 0.12, 0.11, 0.10, 0.08, 0.05, 0.04];

  return {
    location: { latitude: lat, longitude: lng, elevation: 150 },
    annualProductionKwh: annual,
    optimalTilt: 35,
    optimalAzimuth: 0,
    monthlyProduction: monthlyFactors.map((f, i) => ({
      month: MONTH_NAMES[i],
      kWh: Math.round(annual * f),
    })),
    peakPowerKw,
    systemLoss,
  };
}
