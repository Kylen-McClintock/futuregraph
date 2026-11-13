import { beforeAll, describe, expect, it } from "vitest";
import { findForecastableNode, getStore, recordForecastEvent } from "@/lib/store";
import {
  attachSocialLink,
  createWorldviewSnapshot,
  getLedgerForHandle,
  getReputationState,
  getScorecard,
  settleResolvedQuestion,
} from "@/lib/reputation-store";
import { verifyAuditReceipt } from "@/lib/audit-receipt";
import { syncOracles } from "@/lib/oracle-sync";
import type { Profile } from "@/types/futuregraph";

const tester: Profile = {
  id: "prof-test-ada",
  handle: "ada_test",
  displayName: "Ada Test",
  role: "user",
  participantType: "human",
  bio: "test",
  joinedAt: "2026-11-01T00:00:00Z",
  xHandle: "AdaTest",
  xUserId: "12345",
};

describe("Settlement integration (store → ledger → scorecard)", () => {
  beforeAll(() => {
    getReputationState();
  });

  it("seeds sandbox drills and settles them into verified scorecards", () => {
    const elena = getScorecard("elena_vance");
    expect(elena?.isVerified).toBe(true);
    expect(elena?.includesSandboxDrills).toBe(true);
    expect(getLedgerForHandle("elena_vance").length).toBeGreaterThanOrEqual(5);
  });

  it("seals crowd snapshot + conviction in the receipt and settles a contrarian win", () => {
    const nodeId = "node-cp-2027-us-frontier-ai-statute";
    const node = findForecastableNode(nodeId)!;
    const { event, receipt } = recordForecastEvent({
      nodeId,
      probability: 0.7,
      rationale: "Bipartisan frontier-model bill momentum after incident disclosures.",
      sessionProfile: tester,
      authProvider: "x",
      confidenceMultiplier: 1.5,
      crowdProbSnapshot: 0.2,
      projectedRpIfYes: 100,
      projectedRpIfNo: -50,
      serverTimestampOverride: "2026-11-12T00:00:00Z",
      skipPersistence: true,
    });
    expect(receipt.canonicalPayload.crowdProbSnapshot).toBe(0.2);
    expect(receipt.canonicalPayload.confidenceMultiplier).toBe(1.5);
    expect(receipt.canonicalPayload.forecasterXHandle).toBe("AdaTest");
    expect(verifyAuditReceipt(receipt).verified).toBe(true);
    expect(event.accuracyCategory).toBe("governance_geopolitics");

    const { resolution, entries } = settleResolvedQuestion(nodeId, 1, {
      source: "editorial",
      resolvedBy: "test_editor",
      evidenceUrl: "https://www.congress.gov/",
    });
    expect(resolution.outcome).toBe(1);
    const mine = entries.find((e) => e.forecasterHandle === "ada_test")!;
    expect(mine.rpDelta).toBeGreaterThan(150);
    expect(mine.isContrarianHit).toBe(true);
    expect(node.question?.resolvedOutcome).toBe(1);

    const resolutionReceipt = getStore().auditReceipts.find((r) => r.eventId === resolution.receiptId)!;
    expect(resolutionReceipt.entityType).toBe("question_resolution");
    expect(verifyAuditReceipt(resolutionReceipt).verified).toBe(true);

    expect(() =>
      settleResolvedQuestion(nodeId, 0, { source: "editorial", resolvedBy: "x", evidenceUrl: "https://example.com" })
    ).toThrow(/already resolved/);
  });

  it("refuses to resolve authored scenario milestones", () => {
    expect(() =>
      settleResolvedQuestion("node-jun-2027-self-improving-ai", 1, { source: "editorial", resolvedBy: "x", evidenceUrl: "https://example.com" })
    ).toThrow();
  });

  it("blocks agent credentials from writing into a human's record", () => {
    expect(() =>
      recordForecastEvent({
        nodeId: "node-cp-2027-metr-workweek-horizon",
        probability: 0.5,
        rationale: "Impersonation attempt via agent API",
        forecasterHandle: "elena_vance",
        forecasterType: "ai_agent",
        skipPersistence: true,
      })
    ).toThrow(/cannot submit forecasts on behalf of a human/);
  });

  it("only lets the owner attach an X post that matches their verified handle", () => {
    const ev = getStore().forecastEvents.find((e) => e.forecasterHandle === "ada_test")!;
    expect(() => attachSocialLink({ eventId: ev.id, profile: tester, xPostUrl: "https://x.com/SomeoneElse/status/1234567890" })).toThrow(/belongs to @SomeoneElse/);
    const link = attachSocialLink({ eventId: ev.id, profile: tester, xPostUrl: "https://twitter.com/AdaTest/status/1234567890?s=20" });
    expect(link.xPostUrl).toBe("https://x.com/AdaTest/status/1234567890");
    const elena = getStore().profiles.find((p) => p.handle === "elena_vance")!;
    expect(() => attachSocialLink({ eventId: ev.id, profile: elena, xPostUrl: "https://x.com/elena/status/1234567890" })).toThrow(/Only the forecaster/);
  });

  it("creates receipt-backed worldview snapshots", () => {
    const wv = createWorldviewSnapshot({
      profile: tester,
      scenarioSlug: "ai-2050",
      outcomes: [
        { label: "Futurama", probability: 0.5 },
        { label: "Paperclipalypse", probability: 0.1 },
      ],
    });
    expect(wv.receiptId).toBe(wv.id);
    expect(wv.scenarioTitle).toContain("AI 2050");
  });

  it("auto-settles questions when a linked Polymarket oracle resolves", async () => {
    const nodeId = "node-cp-2027-us-unemployment-5pct";
    const node = findForecastableNode(nodeId)!;
    node.question!.oracleProvider = "polymarket";
    node.question!.oracleExternalId = "123456";
    recordForecastEvent({
      nodeId,
      probability: 0.2,
      rationale: "Labor market resilient; AI diffusion slower than headlines.",
      sessionProfile: tester,
      authProvider: "x",
      crowdProbSnapshot: 0.35,
      serverTimestampOverride: "2026-11-12T01:00:00Z",
      skipPersistence: true,
    });
    const fakeFetch = (async () =>
      new Response(JSON.stringify({ closed: true, umaResolutionStatus: "resolved", outcomes: '["Yes","No"]', outcomePrices: '["0","1"]' }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })) as unknown as typeof fetch;
    const reports = await syncOracles({ nodeIds: [nodeId], fetchImpl: fakeFetch });
    expect(reports[0].status).toBe("settled");
    expect(node.question?.resolvedOutcome).toBe(0);
    expect(getLedgerForHandle("ada_test").some((e) => e.questionNodeId === nodeId && e.rpDelta > 0)).toBe(true);
  });
});
