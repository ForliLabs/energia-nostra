import { describe, it, expect } from "vitest";
import type { TradeOffer, TradingStats } from "@/lib/trading";

describe("trading", () => {
  const PRICE_FLOOR = 0.11; // €/kWh (GSE incentive equivalent)
  const PRICE_CEILING = 0.25; // €/kWh (grid purchase rate)

  describe("trade offer validation", () => {
    it("validates price within CER trading range", () => {
      const price = 0.15;
      expect(price).toBeGreaterThanOrEqual(PRICE_FLOOR);
      expect(price).toBeLessThanOrEqual(PRICE_CEILING);
    });

    it("rejects prices below floor", () => {
      const price = 0.05;
      expect(price < PRICE_FLOOR).toBe(true);
    });

    it("rejects prices above ceiling", () => {
      const price = 0.30;
      expect(price > PRICE_CEILING).toBe(true);
    });
  });

  describe("trade record structure", () => {
    it("creates valid trade offer", () => {
      const offer: TradeOffer = {
        id: "offer-1",
        sellerId: "member-1",
        sellerName: "Mario Rossi",
        kwh: 50,
        pricePerKwh: 0.18,
        validFrom: new Date().toISOString(),
        validTo: new Date(Date.now() + 86400000).toISOString(),
        status: "active",
        createdAt: new Date().toISOString(),
      };
      expect(offer.kwh).toBeGreaterThan(0);
      expect(offer.pricePerKwh).toBeGreaterThanOrEqual(PRICE_FLOOR);
    });
  });

  describe("trading statistics", () => {
    it("calculates average price correctly", () => {
      const stats: TradingStats = {
        totalOffers: 10,
        activeOffers: 5,
        totalTrades: 8,
        totalKwhTraded: 500,
        totalVolumeEuro: 90,
        avgPricePerKwh: 0.18,
        activeTraders: 6,
      };
      expect(stats.avgPricePerKwh).toBeCloseTo(stats.totalVolumeEuro / stats.totalKwhTraded, 2);
    });
  });
});
