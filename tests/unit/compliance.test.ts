import { describe, it, expect } from "vitest";
import {
  getCerFormationChecklist,
  getDocumentTemplates,
  getComplianceTimeline,
  getCerEntityTypes,
} from "@/lib/compliance";

describe("compliance", () => {
  describe("CER formation checklist", () => {
    it("returns all checklist steps", () => {
      const checklist = getCerFormationChecklist();
      expect(checklist.length).toBeGreaterThanOrEqual(8);
      expect(checklist[0].step).toBe(1);
    });

    it("steps are in order", () => {
      const checklist = getCerFormationChecklist();
      for (let i = 1; i < checklist.length; i++) {
        expect(checklist[i].step).toBeGreaterThan(checklist[i - 1].step);
      }
    });

    it("includes required documents", () => {
      const checklist = getCerFormationChecklist();
      for (const item of checklist) {
        expect(item.requiredDocuments.length).toBeGreaterThan(0);
        expect(item.authority).toBeDefined();
      }
    });

    it("includes GSE registration step", () => {
      const checklist = getCerFormationChecklist();
      expect(checklist.some((c) => c.title.includes("GSE"))).toBe(true);
    });

    it("includes GDPR compliance step", () => {
      const checklist = getCerFormationChecklist();
      expect(checklist.some((c) => c.title.includes("GDPR"))).toBe(true);
    });
  });

  describe("document templates", () => {
    it("returns all templates", () => {
      const templates = getDocumentTemplates();
      expect(templates.length).toBeGreaterThanOrEqual(4);
    });

    it("includes statute template", () => {
      const templates = getDocumentTemplates();
      const statute = templates.find((t) => t.id === "template-statuto");
      expect(statute).toBeDefined();
      expect(statute!.templateContent).toContain("STATUTO");
      expect(statute!.templateContent).toContain("D.Lgs. 199/2021");
    });

    it("includes DPA template", () => {
      const templates = getDocumentTemplates();
      const dpa = templates.find((t) => t.id === "template-dpa");
      expect(dpa).toBeDefined();
      expect(dpa!.templateContent).toContain("GDPR");
    });

    it("templates have placeholder fields", () => {
      const templates = getDocumentTemplates();
      for (const template of templates) {
        expect(template.requiredFields.length).toBeGreaterThan(0);
        expect(template.templateContent).toContain("{{");
      }
    });
  });

  describe("compliance timeline", () => {
    it("generates timeline from founding date", () => {
      const timeline = getComplianceTimeline("2025-01-15");
      expect(timeline.length).toBeGreaterThanOrEqual(5);
      expect(timeline[0].date).toBe("2025-01-15");
    });

    it("timeline events are chronological", () => {
      const timeline = getComplianceTimeline("2025-06-01");
      for (let i = 1; i < timeline.length; i++) {
        expect(new Date(timeline[i].date).getTime()).toBeGreaterThanOrEqual(
          new Date(timeline[i - 1].date).getTime()
        );
      }
    });

    it("includes regulatory and internal events", () => {
      const timeline = getComplianceTimeline("2025-01-01");
      expect(timeline.some((e) => e.type === "regulatory")).toBe(true);
      expect(timeline.some((e) => e.type === "internal")).toBe(true);
    });
  });

  describe("CER entity types", () => {
    it("returns entity type options", () => {
      const types = getCerEntityTypes();
      expect(types.length).toBeGreaterThanOrEqual(3);
    });

    it("includes association and cooperative", () => {
      const types = getCerEntityTypes();
      expect(types.some((t) => t.id === "association")).toBe(true);
      expect(types.some((t) => t.id === "cooperative")).toBe(true);
    });

    it("each type has pros and cons", () => {
      const types = getCerEntityTypes();
      for (const type of types) {
        expect(type.pros.length).toBeGreaterThan(0);
        expect(type.cons.length).toBeGreaterThan(0);
        expect(type.legalReference).toBeDefined();
      }
    });
  });
});
