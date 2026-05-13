import { describe, it, expect } from "vitest";
import { canAccessCategory, formatFileSize, isStorageConfigured, summarizeStorageRows } from "@/lib/storage";

describe("storage", () => {
  describe("formatFileSize", () => {
    it("formats bytes", () => {
      expect(formatFileSize(500)).toBe("500 B");
    });

    it("formats kilobytes", () => {
      expect(formatFileSize(2048)).toBe("2.0 KB");
    });

    it("formats megabytes", () => {
      expect(formatFileSize(5 * 1024 * 1024)).toBe("5.0 MB");
    });

    it("formats gigabytes", () => {
      expect(formatFileSize(2.5 * 1024 * 1024 * 1024)).toBe("2.50 GB");
    });
  });

  describe("storage configuration", () => {
    it("detects a fully configured storage environment", () => {
      expect(isStorageConfigured({
        S3_ENDPOINT: "https://example-s3.local",
        S3_ACCESS_KEY: "key",
        S3_SECRET_KEY: "secret",
        S3_BUCKET: "bucket",
        S3_REGION: "eu-south-1",
      })).toBe(true);
    });

    it("returns false when a required value is missing", () => {
      expect(isStorageConfigured({ S3_ENDPOINT: "https://example-s3.local" })).toBe(false);
    });

    it("summarises storage rows without repeated aggregate queries", () => {
      expect(summarizeStorageRows([
        { category: "atti", sizeBytes: 1200 },
        { category: "atti", sizeBytes: 800 },
        { category: "report", sizeBytes: 5000 },
      ]).find((folder) => folder.category === "atti")).toMatchObject({ fileCount: 2, totalSizeBytes: 2000 });
    });
  });

  describe("canAccessCategory", () => {
    it("allows admin to access all categories", () => {
      expect(canAccessCategory("admin", "atti")).toBe(true);
      expect(canAccessCategory("admin", "fatture")).toBe(true);
      expect(canAccessCategory("admin", "contatori")).toBe(true);
    });

    it("allows member to access public categories", () => {
      expect(canAccessCategory("member", "atti")).toBe(true);
      expect(canAccessCategory("member", "verbali")).toBe(true);
    });

    it("denies member from financial categories", () => {
      expect(canAccessCategory("member", "fatture")).toBe(false);
      expect(canAccessCategory("member", "report")).toBe(false);
      expect(canAccessCategory("member", "contatori")).toBe(false);
    });

    it("allows auditor to access financial categories", () => {
      expect(canAccessCategory("auditor", "fatture")).toBe(true);
      expect(canAccessCategory("auditor", "report")).toBe(true);
      expect(canAccessCategory("auditor", "atti")).toBe(true);
    });

    it("denies auditor from contatori", () => {
      expect(canAccessCategory("auditor", "contatori")).toBe(false);
    });

    it("allows superadmin to access everything", () => {
      expect(canAccessCategory("superadmin", "atti")).toBe(true);
      expect(canAccessCategory("superadmin", "fatture")).toBe(true);
      expect(canAccessCategory("superadmin", "contatori")).toBe(true);
    });
  });
});
