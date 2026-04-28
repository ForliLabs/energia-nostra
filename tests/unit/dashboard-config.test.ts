import { describe, it, expect } from "vitest";
import {
  getAvailableWidgets,
  getOnboardingTour,
  getNavItemsForRole,
  WIDGET_REGISTRY,
} from "@/lib/dashboard-config";
import type { UserRole } from "@/lib/auth";

describe("dashboard-config", () => {
  describe("WIDGET_REGISTRY", () => {
    it("has at least 10 widgets", () => {
      expect(WIDGET_REGISTRY.length).toBeGreaterThanOrEqual(10);
    });

    it("every widget has required fields", () => {
      for (const widget of WIDGET_REGISTRY) {
        expect(widget.type).toBeDefined();
        expect(widget.title).toBeDefined();
        expect(widget.description).toBeDefined();
        expect(widget.defaultSize).toBeDefined();
        expect(widget.roles.length).toBeGreaterThan(0);
        expect(widget.icon).toBeDefined();
      }
    });
  });

  describe("getAvailableWidgets", () => {
    it("returns admin widgets", () => {
      const widgets = getAvailableWidgets("admin");
      expect(widgets.length).toBeGreaterThan(5);
      const types = widgets.map(w => w.type);
      expect(types).toContain("kpi_card");
      expect(types).toContain("billing_status");
      expect(types).toContain("compliance");
    });

    it("returns member widgets (subset)", () => {
      const adminWidgets = getAvailableWidgets("admin");
      const memberWidgets = getAvailableWidgets("member");
      expect(memberWidgets.length).toBeLessThan(adminWidgets.length);
      const types = memberWidgets.map(w => w.type);
      expect(types).toContain("personal_savings");
      expect(types).toContain("achievements");
    });

    it("returns superadmin widgets including multi_cer_overview", () => {
      const widgets = getAvailableWidgets("superadmin");
      const types = widgets.map(w => w.type);
      expect(types).toContain("multi_cer_overview");
    });

    it("doesn't give member admin-only widgets", () => {
      const memberWidgets = getAvailableWidgets("member");
      const types = memberWidgets.map(w => w.type);
      expect(types).not.toContain("multi_cer_overview");
      expect(types).not.toContain("onboarding_checklist");
    });
  });

  describe("getNavItemsForRole", () => {
    it("admin has all navigation items", () => {
      const items = getNavItemsForRole("admin");
      expect(items.length).toBeGreaterThan(15);
      expect(items).toContain("/dashboard");
      expect(items).toContain("/dashboard/billing");
      expect(items).toContain("/dashboard/payments");
      expect(items).toContain("/dashboard/import");
    });

    it("member has limited navigation", () => {
      const items = getNavItemsForRole("member");
      expect(items.length).toBeLessThan(getNavItemsForRole("admin").length);
      expect(items).toContain("/dashboard");
      expect(items).toContain("/dashboard/voting");
      expect(items).not.toContain("/dashboard/api-platform");
    });

    it("auditor has compliance-focused navigation", () => {
      const items = getNavItemsForRole("auditor");
      expect(items).toContain("/dashboard/billing");
      expect(items).toContain("/dashboard/gse-reports");
      expect(items).not.toContain("/dashboard/trading");
    });
  });

  describe("getOnboardingTour", () => {
    const roles: UserRole[] = ["admin", "member", "auditor", "superadmin"];

    for (const role of roles) {
      it(`returns tour steps for ${role}`, () => {
        const tour = getOnboardingTour(role);
        expect(tour.length).toBeGreaterThan(0);

        // All tours start with welcome
        expect(tour[0].id).toBe("welcome");

        // Each step has required fields
        for (const step of tour) {
          expect(step.id).toBeDefined();
          expect(step.title).toBeDefined();
          expect(step.content).toBeDefined();
          expect(step.placement).toBeDefined();
        }
      });
    }

    it("admin tour includes energy and billing steps", () => {
      const tour = getOnboardingTour("admin");
      const ids = tour.map(s => s.id);
      expect(ids).toContain("energy");
      expect(ids).toContain("billing");
    });

    it("member tour includes savings and voting", () => {
      const tour = getOnboardingTour("member");
      const ids = tour.map(s => s.id);
      expect(ids).toContain("savings");
      expect(ids).toContain("voting");
    });
  });
});
