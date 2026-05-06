import { describe, expect, it } from "vitest";
import { calculateDispatchReadiness, getMoonshotVppDashboard } from "@/lib/moonshot-vpp";
import { estimateHostingCapacity, getDigitalTwinDashboard } from "@/lib/energy-digital-twin";
import { calculateAutonomyHours, getResilienceDashboard } from "@/lib/resilience-mesh";
import { calculateNegotiationLeverage, getEnergyAgentsDashboard } from "@/lib/energy-agents";
import { calculateCapitalVelocity, getCommunityCapitalDashboard } from "@/lib/community-capital";
import { calculateFederationScore, getFederatedIntelligenceDashboard } from "@/lib/federated-intelligence";

describe("moonshots", () => {
  it("computes VPP readiness within bounds", () => {
    const readiness = calculateDispatchReadiness(180, 420, 72);
    expect(readiness).toBeGreaterThanOrEqual(35);
    expect(readiness).toBeLessThanOrEqual(97);
  });

  it("estimates hosting capacity from territory inputs", () => {
    expect(estimateHostingCapacity(24000, 25, 0.7)).toBeGreaterThan(200);
  });

  it("calculates resilience autonomy hours", () => {
    expect(calculateAutonomyHours(600, 75)).toBe(8);
  });

  it("calculates negotiation leverage for energy agents", () => {
    expect(calculateNegotiationLeverage(24000, 12, 84)).toBeGreaterThan(600);
  });

  it("calculates capital velocity as percent", () => {
    expect(calculateCapitalVelocity(250000, 500000, 10)).toBe(60);
  });

  it("scores federation maturity", () => {
    expect(calculateFederationScore(82, 75, 4)).toBeGreaterThan(50);
  });

  it("builds the VPP dashboard from repository data", async () => {
    const dashboard = await getMoonshotVppDashboard();
    expect(dashboard.nodes.length).toBeGreaterThanOrEqual(4);
    expect(dashboard.bids.length).toBe(3);
    expect(dashboard.summary.controllableKw).toBeGreaterThan(0);
  });

  it("builds the digital twin dashboard from repository data", async () => {
    const dashboard = await getDigitalTwinDashboard();
    expect(dashboard.zones.length).toBeGreaterThan(0);
    expect(dashboard.scenarios.length).toBe(3);
    expect(dashboard.summary.hostingCapacityKw).toBeGreaterThan(0);
  });

  it("builds the resilience dashboard from repository data", async () => {
    const dashboard = await getResilienceDashboard();
    expect(dashboard.criticalSites.length).toBe(4);
    expect(dashboard.islandClusters.length).toBe(3);
    expect(dashboard.summary.protectedCitizens).toBeGreaterThan(0);
  });

  it("builds the energy agents dashboard from repository data", async () => {
    const dashboard = await getEnergyAgentsDashboard();
    expect(dashboard.agents.length).toBeGreaterThan(0);
    expect(dashboard.negotiationWindows.length).toBe(3);
    expect(dashboard.summary.activeAgents).toBeGreaterThan(0);
  });

  it("builds the capital dashboard from repository data", async () => {
    const dashboard = await getCommunityCapitalDashboard();
    expect(dashboard.instruments.length).toBe(3);
    expect(dashboard.campaigns.length).toBe(3);
    expect(dashboard.summary.capitalRaisedEuro).toBeGreaterThan(0);
  });

  it("builds the federated intelligence dashboard from repository data", async () => {
    const dashboard = await getFederatedIntelligenceDashboard();
    expect(dashboard.benchmarkClusters.length).toBe(3);
    expect(dashboard.policySimulations.length).toBe(3);
    expect(dashboard.summary.federatedCers).toBeGreaterThan(1);
  });
});
