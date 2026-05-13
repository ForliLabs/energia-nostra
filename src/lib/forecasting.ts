// Energy Forecasting Engine (Feature 2)
// Linear regression + seasonal decomposition for CER energy prediction

import { DEFAULT_CER_ID } from "@/lib/app-config";
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

const SEASONAL_FACTORS: Record<number, number> = {
  0: 0.45, 1: 0.55, 2: 0.75, 3: 0.95, 4: 1.15, 5: 1.30,
  6: 1.35, 7: 1.25, 8: 1.00, 9: 0.70, 10: 0.50, 11: 0.40,
};

function linearRegression(data: number[]): { slope: number; intercept: number } {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: data[0] || 0 };
  const xMean = (n - 1) / 2;
  const yMean = data.reduce((sum, value) => sum + value, 0) / n;
  let num = 0;
  let den = 0;
  for (let index = 0; index < n; index++) {
    num += (index - xMean) * (data[index] - yMean);
    den += (index - xMean) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  return { slope, intercept: yMean - slope * xMean };
}

export async function fetchWeatherForecast(lat: number, lng: number, days = 7): Promise<WeatherForecast[]> {
  const cached = await prisma.weatherCache.findMany({
    where: { latitude: lat, longitude: lng },
    orderBy: { date: "desc" },
    take: days,
  });

  if (cached.length >= days) {
    return cached.map((entry) => ({
      date: entry.date,
      tempC: entry.tempC,
      cloudCover: entry.cloudCover,
      irradiance: entry.irradiance,
    }));
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_mean,cloud_cover_mean,shortwave_radiation_sum&forecast_days=${days}`;
    const response = await fetch(url, { next: { revalidate: 86400 } });
    if (!response.ok) throw new Error(`Open-Meteo error: ${response.status}`);

    const data = await response.json();
    const forecasts: WeatherForecast[] = [];

    for (let index = 0; index < (data.daily?.time?.length || 0); index++) {
      const forecast: WeatherForecast = {
        date: data.daily.time[index],
        tempC: data.daily.temperature_2m_mean?.[index] || 20,
        cloudCover: data.daily.cloud_cover_mean?.[index] || 50,
        irradiance: data.daily.shortwave_radiation_sum?.[index] || 15,
      };
      forecasts.push(forecast);

      await prisma.weatherCache.upsert({
        where: { latitude_longitude_date: { latitude: lat, longitude: lng, date: forecast.date } },
        update: { tempC: forecast.tempC, cloudCover: forecast.cloudCover, irradiance: forecast.irradiance },
        create: { latitude: lat, longitude: lng, ...forecast, source: "open-meteo" },
      });
    }
    return forecasts;
  } catch {
    return Array.from({ length: days }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() + index);
      const month = date.getMonth();
      return {
        date: date.toISOString().slice(0, 10),
        tempC: 10 + month * 2.5 - Math.abs(month - 6) * 1.5,
        cloudCover: 40 + Math.random() * 30,
        irradiance: 10 + SEASONAL_FACTORS[month] * 15,
      };
    });
  }
}

async function persistForecasts(cerId: string, forecasts: ForecastResult[]) {
  if (forecasts.length === 0) {
    return;
  }

  await prisma.energyForecast.deleteMany({
    where: {
      cerId,
      OR: forecasts.map((forecast) => ({ forecastType: forecast.forecastType, periodStart: forecast.period })),
    },
  });

  await prisma.energyForecast.createMany({
    data: forecasts.map((forecast) => ({
      cerId,
      forecastType: forecast.forecastType,
      periodStart: forecast.period,
      periodEnd: forecast.period,
      forecastedKwh: forecast.forecastedKwh,
      confidenceLow: forecast.confidenceLow,
      confidenceHigh: forecast.confidenceHigh,
      model: forecast.model,
    })),
  });
}

export async function generateForecasts(cerId = DEFAULT_CER_ID): Promise<ForecastDashboard> {
  const readings = await prisma.energyReading.findMany({
    where: { cerId },
    orderBy: { createdAt: "asc" },
  });

  if (readings.length === 0) {
    return {
      production: [],
      consumption: [],
      sharedEnergy: [],
      optimalWindows: getOptimalWindows(),
      summary: { nextMonthProductionKwh: 0, nextMonthConsumptionKwh: 0, nextMonthSharedKwh: 0, nextMonthIncentiveEuro: 0, confidencePct: 0 },
    };
  }

  const prodData = readings.map((reading) => reading.productionKwh);
  const consData = readings.map((reading) => reading.consumptionKwh);
  const sharedData = readings.map((reading) => reading.sharedEnergyKwh);

  const prodReg = linearRegression(prodData);
  const consReg = linearRegression(consData);
  const sharedReg = linearRegression(sharedData);

  const months = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];
  const forecastMonths = [1, 2, 3];
  const production: ForecastResult[] = [];
  const consumption: ForecastResult[] = [];
  const sharedEnergy: ForecastResult[] = [];

  for (const offset of forecastMonths) {
    const month = new Date();
    month.setMonth(month.getMonth() + offset);
    const monthIndex = month.getMonth();
    const seasonalFactor = SEASONAL_FACTORS[monthIndex] || 1;
    const index = readings.length + offset - 1;
    const label = `${months[monthIndex]} ${month.getFullYear()}`;

    const productionBase = prodReg.intercept + prodReg.slope * index;
    const productionForecast = round(productionBase * seasonalFactor);
    production.push({
      period: label,
      forecastType: "production",
      forecastedKwh: productionForecast,
      confidenceLow: round(productionForecast * 0.85),
      confidenceHigh: round(productionForecast * 1.15),
      model: "linear_seasonal",
    });

    const consumptionBase = consReg.intercept + consReg.slope * index;
    const consumptionForecast = round(consumptionBase * (1 + (seasonalFactor - 1) * 0.3));
    consumption.push({
      period: label,
      forecastType: "consumption",
      forecastedKwh: consumptionForecast,
      confidenceLow: round(consumptionForecast * 0.9),
      confidenceHigh: round(consumptionForecast * 1.1),
      model: "linear_seasonal",
    });

    const sharedBase = sharedReg.intercept + sharedReg.slope * index;
    const sharedForecast = round(sharedBase * seasonalFactor);
    sharedEnergy.push({
      period: label,
      forecastType: "shared_energy",
      forecastedKwh: sharedForecast,
      confidenceLow: round(sharedForecast * 0.8),
      confidenceHigh: round(sharedForecast * 1.2),
      model: "linear_seasonal",
    });
  }

  const allForecasts = [...production, ...consumption, ...sharedEnergy];
  await persistForecasts(cerId, allForecasts);

  const nextProd = production[0]?.forecastedKwh || 0;
  const nextCons = consumption[0]?.forecastedKwh || 0;
  const nextShared = sharedEnergy[0]?.forecastedKwh || 0;

  return {
    production,
    consumption,
    sharedEnergy,
    optimalWindows: getOptimalWindows(),
    summary: {
      nextMonthProductionKwh: nextProd,
      nextMonthConsumptionKwh: nextCons,
      nextMonthSharedKwh: nextShared,
      nextMonthIncentiveEuro: round((nextShared / 1000) * 110),
      confidencePct: Math.min(98, round(85 + readings.length * 1.5, 0)),
    },
  };
}

function getOptimalWindows(): OptimalWindow[] {
  return [
    { dayOfWeek: "Lun-Ven", startHour: 10, endHour: 15, potentialSavingsEuro: 3.2, reason: "Picco produzione fotovoltaica — massimo autoconsumo condiviso" },
    { dayOfWeek: "Sab-Dom", startHour: 11, endHour: 16, potentialSavingsEuro: 2.5, reason: "Consumi domestici ridotti + alta produzione = surplus da condividere" },
    { dayOfWeek: "Lun-Ven", startHour: 13, endHour: 14, potentialSavingsEuro: 1.8, reason: "Finestra ottimale per ricarica EV e pompe di calore" },
  ];
}
