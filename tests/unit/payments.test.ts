import { describe, it, expect } from "vitest";
import { generateCertificazioneUnica } from "@/lib/payments";

describe("payments", () => {
  describe("generateCertificazioneUnica", () => {
    it("generates CU for a member", () => {
      const cu = generateCertificazioneUnica(
        "Mario Rossi",
        "RSSMRA80A01D704Z",
        2024,
        1250.50,
        3600.00
      );

      expect(cu.anno).toBe(2024);
      expect(cu.contribuente).toBe("Mario Rossi");
      expect(cu.codiceFiscale).toBe("RSSMRA80A01D704Z");
      expect(cu.totaleIncentivi).toBe(1250.50);
      expect(cu.totalePagamenti).toBe(3600.00);
      expect(cu.tipologiaReddito).toContain("GSE");
      expect(cu.riferimentoNormativo).toContain("D.Lgs. 199/2021");
      expect(cu.generatoIl).toBeDefined();
    });

    it("rounds values to 2 decimals", () => {
      const cu = generateCertificazioneUnica(
        "Test User",
        "TSTMRA80A01D704Z",
        2024,
        100.555,
        200.777
      );

      expect(cu.totaleIncentivi).toBe(100.56);
      expect(cu.totalePagamenti).toBe(200.78);
    });
  });
});
