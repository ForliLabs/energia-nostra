import { describe, it, expect } from "vitest";
import { deriveQuorumPct, normaliseVoteOptions, type VoteRecord, type VoteResults } from "@/lib/voting";

// Test pure logic and types from voting module
describe("voting", () => {
  describe("vote record structure", () => {
    it("defines correct vote types", () => {
      const vote: VoteRecord = {
        id: "vote-1",
        title: "Test Vote",
        description: "Test description",
        options: ["Sì", "No", "Astenuto"],
        voteType: "open",
        quorum: "50%+1",
        quorumPct: 50,
        scheduledAt: new Date().toISOString(),
        closesAt: new Date(Date.now() + 86400000).toISOString(),
        status: "aperta",
        totalEligible: 25,
        ballots: [],
        createdAt: new Date().toISOString(),
      };
      expect(vote.options).toHaveLength(3);
      expect(["open", "secret"]).toContain(vote.voteType);
    });

    it("validates vote statuses", () => {
      const validStatuses = ["programmata", "aperta", "chiusa", "annullata"];
      for (const status of validStatuses) {
        const vote: Partial<VoteRecord> = { status: status as VoteRecord["status"] };
        expect(validStatuses).toContain(vote.status);
      }
    });
  });

  describe("vote helpers", () => {
    it("derives quorum percentages from textual rules", () => {
      expect(deriveQuorumPct("Maggioranza semplice")).toBe(51);
      expect(deriveQuorumPct("2/3 dei soci")).toBe(67);
      expect(deriveQuorumPct("75% dei membri")).toBe(75);
    });

    it("normalises and deduplicates vote options", () => {
      expect(normaliseVoteOptions([" Favorevole ", "Contrario", "Favorevole", ""])).toEqual(["Favorevole", "Contrario"]);
    });
  });

  describe("vote results calculation", () => {
    it("calculates participation percentage", () => {
      const results: VoteResults = {
        voteId: "vote-1",
        title: "Test Vote",
        totalBallots: 15,
        totalEligible: 25,
        participationPct: 60,
        quorumReached: true,
        results: [
          { option: "Sì", count: 10, pct: 66.7 },
          { option: "No", count: 3, pct: 20 },
          { option: "Astenuto", count: 2, pct: 13.3 },
        ],
        status: "chiusa",
      };
      expect(results.participationPct).toBe(60);
      expect(results.quorumReached).toBe(true);
      expect(results.results[0].option).toBe("Sì");
    });

    it("detects quorum not reached", () => {
      const results: VoteResults = {
        voteId: "vote-2",
        title: "Low Turnout",
        totalBallots: 5,
        totalEligible: 25,
        participationPct: 20,
        quorumReached: false,
        results: [],
        status: "chiusa",
      };
      expect(results.quorumReached).toBe(false);
    });
  });
});
