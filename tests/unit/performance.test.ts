import { describe, it, expect } from "vitest";
import {
  cache,
  cacheAside,
  CACHE_TTL,
  getIndexRecommendations,
  getMaterializedViews,
  getPerformanceBudgets,
} from "@/lib/performance";

describe("performance", () => {
  describe("cache layer", () => {
    it("stores and retrieves values", async () => {
      await cache.set("test-key", { data: "hello" }, 60000);
      const result = await cache.get<{ data: string }>("test-key");
      expect(result).toEqual({ data: "hello" });
    });

    it("returns null for missing keys", async () => {
      const result = await cache.get("nonexistent");
      expect(result).toBeNull();
    });

    it("expires entries after TTL", async () => {
      await cache.set("short-ttl", "value", 1); // 1ms TTL
      await new Promise((resolve) => setTimeout(resolve, 10));
      const result = await cache.get("short-ttl");
      expect(result).toBeNull();
    });

    it("invalidates by key", async () => {
      await cache.set("to-delete", "value", 60000);
      await cache.invalidate("to-delete");
      const result = await cache.get("to-delete");
      expect(result).toBeNull();
    });

    it("invalidates by tag", async () => {
      await cache.set("tagged-1", "v1", 60000, ["energy"]);
      await cache.set("tagged-2", "v2", 60000, ["energy"]);
      await cache.set("tagged-3", "v3", 60000, ["billing"]);
      const count = await cache.invalidateByTag("energy");
      expect(count).toBe(2);
      expect(await cache.get("tagged-3")).toBe("v3");
    });

    it("invalidates by pattern", async () => {
      await cache.set("cer:1:energy", "v1", 60000);
      await cache.set("cer:1:billing", "v2", 60000);
      await cache.set("cer:2:energy", "v3", 60000);
      const count = await cache.invalidateByPattern("cer:1:*");
      expect(count).toBe(2);
    });

    it("tracks hit/miss stats", async () => {
      const stats = cache.getStats();
      expect(stats.hitCount).toBeGreaterThanOrEqual(0);
      expect(stats.missCount).toBeGreaterThanOrEqual(0);
      expect(typeof stats.hitRate).toBe("number");
    });

    it("prunes expired entries", async () => {
      await cache.set("prune-1", "v1", 1); // expired immediately
      await cache.set("prune-2", "v2", 1);
      await new Promise((resolve) => setTimeout(resolve, 10));
      const pruned = cache.prune();
      expect(pruned).toBeGreaterThanOrEqual(2);
    });
  });

  describe("cache-aside pattern", () => {
    it("fetches and caches value", async () => {
      let fetchCount = 0;
      const key = `cache-aside-${Date.now()}`;

      const v1 = await cacheAside(key, 60000, async () => {
        fetchCount++;
        return { computed: true };
      });
      const v2 = await cacheAside(key, 60000, async () => {
        fetchCount++;
        return { computed: true };
      });

      expect(v1).toEqual({ computed: true });
      expect(v2).toEqual({ computed: true });
      expect(fetchCount).toBe(1); // fetched only once
    });
  });

  describe("TTL configuration", () => {
    it("has sensible TTL values", () => {
      expect(CACHE_TTL.ENERGY_AGGREGATES).toBe(15 * 60 * 1000);
      expect(CACHE_TTL.MEMBER_LIST).toBe(5 * 60 * 1000);
      expect(CACHE_TTL.PVGIS_DATA).toBe(24 * 60 * 60 * 1000);
    });
  });

  describe("index recommendations", () => {
    it("returns index recommendations", () => {
      const recs = getIndexRecommendations();
      expect(recs.length).toBeGreaterThanOrEqual(5);
      expect(recs.some((r) => r.priority === "high")).toBe(true);
    });

    it("all recommendations have SQL", () => {
      const recs = getIndexRecommendations();
      for (const rec of recs) {
        expect(rec.sql).toContain("CREATE INDEX");
      }
    });
  });

  describe("materialized views", () => {
    it("returns view definitions", () => {
      const views = getMaterializedViews();
      expect(views.length).toBeGreaterThanOrEqual(2);
      expect(views.every((v) => v.sql.includes("SELECT"))).toBe(true);
    });
  });

  describe("performance budgets", () => {
    it("returns performance budgets", () => {
      const budgets = getPerformanceBudgets();
      expect(budgets.length).toBeGreaterThanOrEqual(5);
      expect(budgets.every((b) => ["passing", "warning", "failing"].includes(b.status))).toBe(true);
    });
  });
});
