// Energy Forecasting Engine (Feature 2)
// Linear regression + seasonal decomposition for CER energy prediction

import { prisma } from "@/lib/prisma";

const round = (value: number, decimals = 2) => Number(value.toFixed(decimals));

export interface ForecastResult {
  period: string;
  forecastType: "production" | "consumption" | "shared_energy";
  forecastedKwh: number;
  confidenceLow: number;
  confidenceHigh: number;
  model: string;
}

export interface WeatherForecast {
  date: string;
  tempC: number;
  cloudCover: number;
  irradiance: number;
}

export interface ForecastDashboard {
  production: ForecastResult[];
  consumption: ForecastResult[];
  sharedEnergy: ForecastResult[];
  optimalWindows: OptimalWindow[];
  summary: {
    nextMonthProductionKwh: number;
    nextMonthConsumptionKwh: number;
    nextMonthSharedKwh: number;
    nextMonthIncentiveEuro: number;
    confidencePct: number;
  };
}

export interface OptimalWindow {
  dayOfWeek: string;
  startHour: number;
  endHour: number;
  potentialSavingsEuro: number;
  reason: string;
}

// Seasonal factors for Forlì-Cesena area (normalized solar production)
const SEASONAL_FACTORS: Record<number, number> = {
  0: 0.45, 1: 0.55, 2: 0.75, 3: 0.95, 4: 1.15, 5: 1.30,
  6: 1.35, 7: 1.25, 8: 1.00, 9: 0.70, 10: 0.50, 11: 0.40,
};

// Simple linear regression
function linearRegression(data: number[]): { slope: number; intercept: number } {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: data[0] || 0 };
  const xMean = (n - 1) / 2;
  const yMean = data.reduce((s, v) => s + v, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (data[i] - yMean);
    den += (i - xMean) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  return { slope, intercept: yMean - slope * xMean };
}

// Fetch weather data from Open-Meteo API with caching
export async function fetchWeatherForecast(lat: number, lng: number, days = 7): Promise<WeatherForecast[]> {
  // Check cache first
  const cached = await prisma.weatherCache.findMany({
    where: { latitude: lat, longitude: lng },
    orderBy: { date: "desc" },
    take: days,
  });
  
  if (cached.length >= days) {
    return cached.map((c) => ({
      date: c.date, tempC: c.tempC, cloudCover: c.cloudCover, irradiance: c.irradiance,
    }));
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_mean,cloud_cover_mean,shortwave_radiation_sum&forecast_days=${days}`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);
    
    const data = await res.json();
    const forecasts: WeatherForecast[] = [];
    
    for (let i = 0; i < (data.daily?.time?.length || 0); i++) {
      const forecast: WeatherForecast = {
        date: data.daily.time[i],
        tempC: data.daily.temperature_2m_mean?.[i] || 20,
        cloudCover: data.daily.cloud_cover_mean?.[i] || 50,
        irradiance: data.daily.shortwave_radiation_sum?.[i] || 15,
      };
      forecasts.push(forecast);
      
      // Cache the result
      await prisma.weatherCache.upsert({
        where: { latitude_longitude_date: { latitude: lat, longitude: lng, date: forecast.date } },
        update: { tempC: forecast.tempC, cloudCover: forecast.cloudCover, irradiance: forecast.irradiance },
        create: { latitude: lat, longitude: lng, ...forecast, source: "open-meteo" },
      });
    }
    return forecasts;
  } catch {
    // Generate estimated weather data
    return Array.from({ length: days }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const month = d.getMonth();
      return {
        date: d.toISOString().slice(0, 10),
        tempC: 10 + month * 2.5 - Math.abs(month - 6) * 1.5,
        cloudCover: 40 + Math.random() * 30,
        irradiance: 10 + SEASONAL_FACTORS[month] * 15,
      };
    });
  }
}

// Generate forecasts for a CER
export async function generateForecasts(cerId = "cer-bertinoro"): Promise<ForecastDashboard> {
  const readings = await prisma.energyReading.findMany({
    where: { cerId },
    orderBy: { createdAt: "asc" },
  });

  if (readings.length === 0) {
    return {
      production: [], consumption: [], sharedEnergy: [],
      optimalWindows: getOptimalWindows(),
      summary: { nextMonthProductionKwh: 0, nextMonthConsumptionKwh: 0, nextMonthSharedKwh: 0, nextMonthIncentiveEuro: 0, confidencePct: 0 },
    };
  }

  const prodData = readings.map((r) => r.productionKwh);
  const consData = readings.map((r) => r.consumptionKwh);
  const sharedData = readings.map((r) => r.sharedEnergyKwh);

  const prodReg = linearRegression(prodData);
  const consReg = linearRegression(consData);
  const sharedReg = linearRegression(sharedData);

  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const nextMonthIdx = nextMonth.getMonth();
  const seasonalAdj = SEASONAL_FACTORS[nextMonthIdx] || 1;

  const MONTHS_IT = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];

  const forecastMonths = [1, 2, 3]; // Next 3 months
  const production: ForecastResult[] = [];
  const consumption: ForecastResult[] = [];
  const sharedEnergy: ForecastResult[] = [];

  for (const offset of forecastMonths) {
    const m = new Date();
    m.setMonth(m.getMonth() + offset);
    const mIdx = m.getMonth();
    const sf = SEASONAL_FACTORS[mIdx] || 1;
    const n = readings.length + offset - 1;
    const label = `${MONTHS_IT[mIdx]} ${m.getFullYear()}`;

    const pBase = prodReg.intercept + prodReg.slope * n;
    const pForecast = round(pBase * sf);
    production.push({
      period: label, forecastType: "production", forecastedKwh: pForecast,
      confidenceLow: round(pForecast * 0.85), confidenceHigh: round(pForecast * 1.15), model: "linear_seasonal",
    });

    const cBase = consReg.intercept + consReg.slope * n;
    const cForecast = round(cBase * (1 + (sf - 1) * 0.3)); // Consumption less seasonal than production
    consumption.push({
      period: label, forecastType: "consumption", forecastedKwh: cForecast,
      confidenceLow: round(cForecast * 0.9), confidenceHigh: round(cForecast * 1.1), model: "linear_seasonal",
    });

    const sBase = sharedReg.intercept + sharedReg.slope * n;
    const sForecast = round(sBase * sf);
    sharedEnergy.push({
      period: label, forecastType: "shared_energy", forecastedKwh: sForecast,
      confidenceLow: round(sForecast * 0.8), confidenceHigh: round(sForecast * 1.2), model: "linear_seasonal",
    });
  }

  const nextProd = production[0]?.forecastedKwh || 0;
  const nextCons = consumption[0]?.forecastedKwh || 0;
  const nextShared = sharedEnergy[0]?.forecastedKwh || 0;

  // Store forecasts in database
  for (const f of [...production, ...consumption, ...sharedEnergy]) {
    await prisma.energyForecast.create({
      data: {
        cerId, forecastType: f.forecastType, periodStart: f.period, periodEnd: f.period,
        forecastedKwh: f.forecastedKwh, confidenceLow: f.confidenceLow, confidenceHigh: f.confidenceHigh,
        model: f.model,
      },
    });
  }

  return {
    production, consumption, sharedEnergy,
    optimalWindows: getOptimalWindows(),
    summary: {
      nextMonthProductionKwh: nextProd,
      nextMonthConsumptionKwh: nextCons,
      nextMonthSharedKwh: nextShared,
      nextMonthIncentiveEuro: round((nextShared / 1000) * 110),
      confidencePct: round(85 + readings.length * 1.5, 0),
    },
  };
}

function getOptimalWindows(): OptimalWindow[] {
  return [
    { dayOfWeek: "Lun-Ven", startHour: 10, endHour: 15, potentialSavingsEuro: 3.20, reason: "Picco produzione fotovoltaica — massimo autoconsumo condiviso" },
    { dayOfWeek: "Sab-Dom", startHour: 11, endHour: 16, potentialSavingsEuro: 2.50, reason: "Consumi domestici ridotti + alta produzione = surplus da condividere" },
    { dayOfWeek: "Lun-Ven", startHour: 13, endHour: 14, potentialSavingsEuro: 1.80, reason: "Finestra ottimale per ricarica EV e pompe di calore" },
  ];
}
