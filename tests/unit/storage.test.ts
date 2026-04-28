import { describe, it, expect } from "vitest";
import { formatFileSize, canAccessCategory } from "@/lib/storage";

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
