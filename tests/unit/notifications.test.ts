import { describe, it, expect } from "vitest";
import {
  getEmailTemplate,
} from "@/lib/notifications";

describe("notifications", () => {
  describe("getEmailTemplate", () => {
    it("generates welcome email", () => {
      const template = getEmailTemplate("welcome", {
        name: "Mario Rossi",
        cerName: "CER Bertinoro",
        loginUrl: "https://energianostra.it/login",
      });

      expect(template.subject).toBe("Benvenuto in EnergiaNostra!");
      expect(template.html).toContain("Mario Rossi");
      expect(template.html).toContain("CER Bertinoro");
      expect(template.html).toContain("https://energianostra.it/login");
      expect(template.text).toContain("Mario Rossi");
    });

    it("generates invoice email", () => {
      const template = getEmailTemplate("invoice", {
        invoiceNumber: "INV-2024-001",
        memberName: "Mario Rossi",
        period: "Gennaio 2024",
        amount: "125.50",
        dueDate: "2024-02-15",
        paymentUrl: "https://energianostra.it/pay/123",
      });

      expect(template.subject).toContain("INV-2024-001");
      expect(template.html).toContain("€125.50");
      expect(template.html).toContain("Gennaio 2024");
    });

    it("generates vote invitation email", () => {
      const template = getEmailTemplate("vote_invitation", {
        voteTitle: "Approvazione Bilancio 2024",
        voteDescription: "Votazione per l'approvazione del bilancio annuale",
        closesAt: "2024-03-15",
        voteUrl: "https://energianostra.it/dashboard/voting",
      });

      expect(template.subject).toContain("Approvazione Bilancio 2024");
      expect(template.html).toContain("Approvazione Bilancio 2024");
      expect(template.html).toContain("2024-03-15");
    });

    it("generates monthly summary email", () => {
      const template = getEmailTemplate("monthly_summary", {
        memberName: "Mario Rossi",
        month: "Gennaio 2024",
        productionKwh: "450",
        sharedKwh: "280",
        savings: "35.50",
        co2Avoided: "125",
      });

      expect(template.subject).toContain("Gennaio 2024");
      expect(template.html).toContain("450 kWh");
      expect(template.html).toContain("€35.50");
      expect(template.html).toContain("125 kg");
    });

    it("generates password reset email", () => {
      const template = getEmailTemplate("password_reset", {
        resetUrl: "https://energianostra.it/reset/abc123",
      });

      expect(template.subject).toContain("Reset password");
      expect(template.html).toContain("https://energianostra.it/reset/abc123");
      expect(template.html).toContain("1 ora");
    });

    it("handles unknown template gracefully", () => {
      const template = getEmailTemplate("nonexistent", { key: "value" });
      expect(template.subject).toBe("EnergiaNostra");
      expect(template.text).toContain("value");
    });
  });
});
