import { describe, it, expect } from "vitest";
import {
  parseCSV,
  autoDetectColumns,
  validateImportData,
} from "@/lib/data-import";

describe("data-import", () => {
  describe("parseCSV", () => {
    it("parses comma-separated CSV", () => {
      const csv = "Nome,POD,Tipo\nMario Rossi,IT001E12345678,consumatore\nGiulia Bianchi,IT002E87654321,produttore";
      const result = parseCSV(csv);
      expect(result.headers).toEqual(["Nome", "POD", "Tipo"]);
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].Nome).toBe("Mario Rossi");
      expect(result.rows[0].POD).toBe("IT001E12345678");
    });

    it("parses semicolon-separated CSV (Italian format)", () => {
      const csv = "Nome;POD;Tipo\nMario Rossi;IT001E12345678;consumatore";
      const result = parseCSV(csv);
      expect(result.headers).toEqual(["Nome", "POD", "Tipo"]);
      expect(result.rows).toHaveLength(1);
    });

    it("handles quoted values", () => {
      const csv = '"Nome";"POD";"Tipo"\n"Mario Rossi";"IT001E12345678";"consumatore"';
      const result = parseCSV(csv);
      expect(result.headers).toEqual(["Nome", "POD", "Tipo"]);
      expect(result.rows[0].Nome).toBe("Mario Rossi");
    });

    it("handles empty lines", () => {
      const csv = "Nome;POD\nMario;IT001E12345678\n\nGiulia;IT002E87654321\n";
      const result = parseCSV(csv);
      expect(result.rows).toHaveLength(2);
    });

    it("returns empty for empty input", () => {
      const result = parseCSV("");
      expect(result.headers).toEqual([]);
      expect(result.rows).toEqual([]);
    });
  });

  describe("autoDetectColumns", () => {
    it("detects member columns from Italian headers", () => {
      const headers = ["Nome", "Codice POD", "Tipologia", "Comune", "Codice Fiscale"];
      const mappings = autoDetectColumns(headers, "members");

      const nameMapping = mappings.find(m => m.targetField === "name");
      expect(nameMapping).toBeDefined();
      expect(nameMapping!.sourceColumn).toBe("Nome");

      const podMapping = mappings.find(m => m.targetField === "podCode");
      expect(podMapping).toBeDefined();
      expect(podMapping!.sourceColumn).toBe("Codice POD");
    });

    it("detects energy data columns", () => {
      const headers = ["POD", "Mese", "Consumo kWh", "Produzione kWh"];
      const mappings = autoDetectColumns(headers, "energy_data");

      expect(mappings.find(m => m.targetField === "podCode")).toBeDefined();
      expect(mappings.find(m => m.targetField === "consumptionKwh")).toBeDefined();
      expect(mappings.find(m => m.targetField === "productionKwh")).toBeDefined();
    });

    it("detects financial columns", () => {
      const headers = ["Beneficiario", "Periodo", "Importo"];
      const mappings = autoDetectColumns(headers, "financial");

      expect(mappings.find(m => m.targetField === "memberName")).toBeDefined();
      expect(mappings.find(m => m.targetField === "period")).toBeDefined();
      expect(mappings.find(m => m.targetField === "amount")).toBeDefined();
    });

    it("marks unknown columns with empty targetField", () => {
      const headers = ["XYZ", "Unknown Column"];
      const mappings = autoDetectColumns(headers, "members");

      expect(mappings.every(m => m.targetField === "")).toBe(true);
      expect(mappings.every(m => m.confidence === 0)).toBe(true);
    });
  });

  describe("validateImportData", () => {
    it("validates correct member data", () => {
      const rows = [
        { Nome: "Mario Rossi", "Codice POD": "IT001E12345678", Tipo: "consumatore" },
      ];
      const mappings = [
        { sourceColumn: "Nome", targetField: "name", confidence: 0.9 },
        { sourceColumn: "Codice POD", targetField: "podCode", confidence: 0.9 },
        { sourceColumn: "Tipo", targetField: "type", confidence: 0.9 },
      ];

      const result = validateImportData(rows, mappings, "members");
      expect(result.valid).toBe(true);
      expect(result.validRows).toBe(1);
      expect(result.errors).toHaveLength(0);
    });

    it("catches invalid POD code format", () => {
      const rows = [
        { Nome: "Mario Rossi", POD: "INVALID_POD" },
      ];
      const mappings = [
        { sourceColumn: "Nome", targetField: "name", confidence: 0.9 },
        { sourceColumn: "POD", targetField: "podCode", confidence: 0.9 },
      ];

      const result = validateImportData(rows, mappings, "members");
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.error.includes("POD"))).toBe(true);
    });

    it("catches invalid fiscal code", () => {
      const rows = [
        { Nome: "Mario Rossi", CF: "INVALID" },
      ];
      const mappings = [
        { sourceColumn: "Nome", targetField: "name", confidence: 0.9 },
        { sourceColumn: "CF", targetField: "fiscalCode", confidence: 0.9 },
      ];

      const result = validateImportData(rows, mappings, "members");
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.error.includes("fiscale"))).toBe(true);
    });

    it("catches missing required name field", () => {
      const rows = [
        { Nome: "", POD: "IT001E12345678" },
      ];
      const mappings = [
        { sourceColumn: "Nome", targetField: "name", confidence: 0.9 },
        { sourceColumn: "POD", targetField: "podCode", confidence: 0.9 },
      ];

      const result = validateImportData(rows, mappings, "members");
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.error.includes("obbligatorio"))).toBe(true);
    });

    it("validates energy data with numeric checks", () => {
      const rows = [
        { POD: "IT001E12345678", Consumo: "not_a_number" },
      ];
      const mappings = [
        { sourceColumn: "POD", targetField: "podCode", confidence: 0.9 },
        { sourceColumn: "Consumo", targetField: "consumptionKwh", confidence: 0.9 },
      ];

      const result = validateImportData(rows, mappings, "energy_data");
      expect(result.valid).toBe(false);
    });

    it("accepts valid energy data with Italian decimal format", () => {
      const rows = [
        { POD: "IT001E12345678", Consumo: "350,5", Produzione: "0" },
      ];
      const mappings = [
        { sourceColumn: "POD", targetField: "podCode", confidence: 0.9 },
        { sourceColumn: "Consumo", targetField: "consumptionKwh", confidence: 0.9 },
        { sourceColumn: "Produzione", targetField: "productionKwh", confidence: 0.9 },
      ];

      const result = validateImportData(rows, mappings, "energy_data");
      expect(result.valid).toBe(true);
    });

    it("provides preview of first 10 rows", () => {
      const rows = Array.from({ length: 15 }, (_, i) => ({
        Nome: `Membro ${i}`,
        POD: `IT001E${String(i).padStart(8, "0")}`,
      }));
      const mappings = [
        { sourceColumn: "Nome", targetField: "name", confidence: 0.9 },
        { sourceColumn: "POD", targetField: "podCode", confidence: 0.9 },
      ];

      const result = validateImportData(rows, mappings, "members");
      expect(result.preview.length).toBeLessThanOrEqual(10);
      expect(result.totalRows).toBe(15);
    });
  });
});
