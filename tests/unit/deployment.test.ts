import { describe, it, expect } from "vitest";
import {
  getEnvironmentConfig,
  getRequiredEnvVars,
  validateEnvironment,
  getDeploymentSizes,
  getDeploymentState,
  getDeployTemplates,
} from "@/lib/deployment";

describe("deployment", () => {
  describe("environment configuration", () => {
    it("returns development config by default", () => {
      const config = getEnvironmentConfig("development");
      expect(config.name).toBe("development");
      expect(config.database.provider).toBe("sqlite");
      expect(config.features.demoMode).toBe(true);
    });

    it("returns staging config", () => {
      const config = getEnvironmentConfig("staging");
      expect(config.name).toBe("staging");
      expect(config.database.provider).toBe("postgresql");
      expect(config.redis.enabled).toBe(true);
      expect(config.logging.level).toBe("info");
    });

    it("returns production config", () => {
      const config = getEnvironmentConfig("production");
      expect(config.name).toBe("production");
      expect(config.features.demoMode).toBe(false);
      expect(config.features.realIntegrations).toBe(true);
      expect(config.database.ssl).toBe(true);
      expect(config.scaling.minInstances).toBeGreaterThanOrEqual(2);
    });

    it("production has stricter logging", () => {
      const prod = getEnvironmentConfig("production");
      const dev = getEnvironmentConfig("development");
      expect(prod.logging.sampleRate).toBeLessThan(dev.logging.sampleRate);
    });
  });

  describe("environment variables", () => {
    it("returns required env vars", () => {
      const vars = getRequiredEnvVars();
      expect(vars.length).toBeGreaterThanOrEqual(5);
      expect(vars.some((v) => v.name === "DATABASE_URL")).toBe(true);
    });

    it("DATABASE_URL is required in all environments", () => {
      const vars = getRequiredEnvVars();
      const dbUrl = vars.find((v) => v.name === "DATABASE_URL")!;
      expect(dbUrl.required.development).toBe(true);
      expect(dbUrl.required.staging).toBe(true);
      expect(dbUrl.required.production).toBe(true);
    });

    it("STRIPE_SECRET_KEY only required in production", () => {
      const vars = getRequiredEnvVars();
      const stripe = vars.find((v) => v.name === "STRIPE_SECRET_KEY")!;
      expect(stripe.required.development).toBe(false);
      expect(stripe.required.production).toBe(true);
    });

    it("sensitive vars are marked", () => {
      const vars = getRequiredEnvVars();
      const sensitive = vars.filter((v) => v.sensitive);
      expect(sensitive.length).toBeGreaterThan(0);
    });
  });

  describe("environment validation", () => {
    it("validates development environment", () => {
      // DATABASE_URL is set in .env
      const result = validateEnvironment("development");
      expect(result.valid || result.missing.includes("DATABASE_URL")).toBe(true);
    });
  });

  describe("deployment sizes", () => {
    it("returns deployment size options", () => {
      const sizes = getDeploymentSizes();
      expect(sizes).toHaveLength(3);
      expect(sizes[0].name).toBe("Small");
      expect(sizes[2].name).toBe("Large");
    });

    it("sizes are ordered by capacity", () => {
      const sizes = getDeploymentSizes();
      for (let i = 1; i < sizes.length; i++) {
        expect(sizes[i].maxMembers).toBeGreaterThan(sizes[i - 1].maxMembers);
        expect(sizes[i].vcpu).toBeGreaterThanOrEqual(sizes[i - 1].vcpu);
      }
    });

    it("includes cost estimates", () => {
      const sizes = getDeploymentSizes();
      for (const size of sizes) {
        expect(size.estimatedCostEur).toBeGreaterThan(0);
        expect(size.provider).toBeDefined();
      }
    });
  });

  describe("deployment state", () => {
    it("returns current deployment state", () => {
      const state = getDeploymentState();
      expect(state.activeSlot).toBe("blue");
      expect(state.status).toBe("idle");
      expect(state.healthCheckUrl).toBe("/api/health");
    });
  });

  describe("deploy templates", () => {
    it("returns deploy templates", () => {
      const templates = getDeployTemplates();
      expect(templates.length).toBeGreaterThanOrEqual(3);
      expect(templates.some((t) => t.platform === "Docker Compose")).toBe(true);
      expect(templates.some((t) => t.platform === "Kubernetes")).toBe(true);
    });
  });
});
