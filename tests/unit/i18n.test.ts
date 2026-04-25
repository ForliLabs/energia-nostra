import { describe, it, expect } from "vitest";
import { t, getTranslations, SUPPORTED_LOCALES, calculateIncentive, type CountryRegulation } from "@/lib/i18n";

describe("i18n", () => {
  it("returns Italian translations by default", () => {
    expect(t("nav.dashboard")).toBe("Dashboard");
    expect(t("action.save")).toBe("Salva");
  });

  it("returns Spanish translations", () => {
    expect(t("nav.dashboard", "es")).toBe("Panel");
    expect(t("action.save", "es")).toBe("Guardar");
  });

  it("returns French translations", () => {
    expect(t("nav.dashboard", "fr")).toBe("Tableau de bord");
    expect(t("action.save", "fr")).toBe("Enregistrer");
  });

  it("falls back to Italian for missing translations", () => {
    expect(t("app.name", "es")).toBe("EnergiaNostra");
    expect(t("app.name", "fr")).toBe("EnergiaNostra");
  });

  it("returns key for unknown translations", () => {
    expect(t("unknown.key")).toBe("unknown.key");
  });

  it("getTranslations returns complete set", () => {
    const translations = getTranslations("it");
    expect(translations["nav.dashboard"]).toBe("Dashboard");
    expect(translations["action.save"]).toBe("Salva");
    expect(Object.keys(translations).length).toBeGreaterThan(30);
  });

  it("getTranslations for es overrides Italian base", () => {
    const translations = getTranslations("es");
    expect(translations["nav.dashboard"]).toBe("Panel");
    expect(translations["app.name"]).toBe("EnergiaNostra"); // Falls back
  });

  it("supports 3 locales", () => {
    expect(SUPPORTED_LOCALES).toHaveLength(3);
    expect(SUPPORTED_LOCALES.map((l) => l.code)).toEqual(["it", "es", "fr"]);
  });

  it("has exactly one default locale", () => {
    const defaults = SUPPORTED_LOCALES.filter((l) => l.isDefault);
    expect(defaults).toHaveLength(1);
    expect(defaults[0].code).toBe("it");
  });
});

describe("Country-specific incentive calculation", () => {
  it("calculates Italian incentive correctly", () => {
    const italy: CountryRegulation = {
      countryCode: "IT", countryName: "Italia",
      incentiveFormula: { type: "GSE", rateEuroPerMwh: 110, selfConsumptionBonus: 10 },
      reportingFormat: "GSE", gridEmissionFactor: 256, regulatoryReference: "D.Lgs. 199/2021",
    };
    const incentive = calculateIncentive(10000, italy); // 10 MWh
    expect(incentive).toBe(1200); // (10 * 110) + (10 * 10) = 1200
  });

  it("calculates Spanish incentive correctly", () => {
    const spain: CountryRegulation = {
      countryCode: "ES", countryName: "España",
      incentiveFormula: { type: "CNMC", rateEuroPerMwh: 45, selfConsumptionBonus: 5 },
      reportingFormat: "CNMC", gridEmissionFactor: 210, regulatoryReference: "RD 244/2019",
    };
    const incentive = calculateIncentive(10000, spain); // 10 MWh
    expect(incentive).toBe(500); // (10 * 45) + (10 * 5) = 500
  });

  it("calculates French incentive correctly", () => {
    const france: CountryRegulation = {
      countryCode: "FR", countryName: "France",
      incentiveFormula: { type: "ENEDIS", rateEuroPerMwh: 60, selfConsumptionBonus: 8 },
      reportingFormat: "ENEDIS", gridEmissionFactor: 55, regulatoryReference: "Ordonnance 2021-236",
    };
    const incentive = calculateIncentive(10000, france); // 10 MWh
    expect(incentive).toBe(680); // (10 * 60) + (10 * 8) = 680
  });
});
