import { describe, it, expect } from "vitest";
import {
  getConsents,
  setConsent,
  hasConsent,
  getProcessingRecords,
  getCookieCategories,
  getRetentionPolicies,
  exportUserData,
  eraseUserData,
} from "@/lib/gdpr";

describe("gdpr", () => {
  describe("consent management", () => {
    it("returns default essential consent", () => {
      const consents = getConsents("user-gdpr-test-1");
      expect(consents.length).toBeGreaterThanOrEqual(1);
      expect(consents[0].purpose).toBe("essential");
      expect(consents[0].granted).toBe(true);
    });

    it("sets and retrieves consent", () => {
      const userId = `user-gdpr-${Date.now()}`;
      setConsent(userId, "analytics", true, "1.2.3.4", "test-agent");
      const consents = getConsents(userId);
      const analytics = consents.find((c) => c.purpose === "analytics");
      expect(analytics).toBeDefined();
      expect(analytics!.granted).toBe(true);
      expect(analytics!.ipAddress).toBe("1.2.3.4");
    });

    it("withdraws consent", () => {
      const userId = `user-gdpr-withdraw-${Date.now()}`;
      setConsent(userId, "marketing", true);
      setConsent(userId, "marketing", false);
      const consents = getConsents(userId);
      const marketing = consents.find((c) => c.purpose === "marketing");
      expect(marketing!.granted).toBe(false);
      expect(marketing!.withdrawnAt).toBeDefined();
    });

    it("essential consent is always true", () => {
      expect(hasConsent("any-user", "essential")).toBe(true);
    });

    it("non-granted consent returns false", () => {
      const userId = `user-no-consent-${Date.now()}`;
      expect(hasConsent(userId, "marketing")).toBe(false);
    });
  });

  describe("processing records", () => {
    it("returns all processing records", () => {
      const records = getProcessingRecords();
      expect(records.length).toBeGreaterThanOrEqual(5);
      expect(records[0].purpose).toBeDefined();
      expect(records[0].legalBasis).toBeDefined();
    });

    it("includes required GDPR fields", () => {
      const records = getProcessingRecords();
      for (const record of records) {
        expect(record.id).toBeDefined();
        expect(record.dataCategories.length).toBeGreaterThan(0);
        expect(record.retentionPeriod).toBeDefined();
        expect(record.technicalMeasures.length).toBeGreaterThan(0);
      }
    });
  });

  describe("cookie categories", () => {
    it("returns cookie categories", () => {
      const categories = getCookieCategories();
      expect(categories.length).toBeGreaterThanOrEqual(2);
    });

    it("has required essential category", () => {
      const categories = getCookieCategories();
      const essential = categories.find((c) => c.id === "essential");
      expect(essential).toBeDefined();
      expect(essential!.required).toBe(true);
    });
  });

  describe("retention policies", () => {
    it("returns retention policies", () => {
      const policies = getRetentionPolicies();
      expect(policies.length).toBeGreaterThanOrEqual(5);
    });

    it("all policies have valid actions", () => {
      const policies = getRetentionPolicies();
      for (const policy of policies) {
        expect(["archive", "delete", "anonymize"]).toContain(policy.action);
        expect(policy.retentionDays).toBeGreaterThan(0);
      }
    });
  });

  describe("data export", () => {
    it("exports user data structure", async () => {
      const result = await exportUserData("user-export-test", "json");
      expect(result.exportId).toBeDefined();
      expect(result.userId).toBe("user-export-test");
      expect(result.format).toBe("json");
      expect(result.data.consents).toBeDefined();
    });
  });

  describe("data erasure", () => {
    it("erases user data and returns result", async () => {
      const userId = `user-erase-${Date.now()}`;
      setConsent(userId, "analytics", true);
      const result = await eraseUserData(userId);
      expect(result.userId).toBe(userId);
      expect(result.erasedAt).toBeDefined();
      expect(result.auditLogId).toBeDefined();
    });
  });
});
