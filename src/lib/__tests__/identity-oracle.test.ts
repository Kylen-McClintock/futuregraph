import { describe, expect, it } from "vitest";
import { buildProfileForIdentity, deriveIdentityFromAuthUser, hasVerifiedX, sanitizeHandle } from "@/lib/identity";
import { safeRedirectPath, withBasePath } from "@/lib/paths";
import { parseMetaculusPost, parsePolymarketMarket } from "@/lib/oracle-sync";
import type { Profile } from "@/types/futuregraph";

describe("Identity mapping (X + AGIFutures linked accounts)", () => {
  const linkedUser = {
    id: "1b2c3d4e-0000-4000-8000-123456789abc",
    email: "ada@agifutures.org",
    identities: [
      { provider: "email", identity_data: { email: "ada@agifutures.org" } },
      {
        provider: "x",
        created_at: "2026-11-01T00:00:00Z",
        identity_data: {
          user_name: "AdaForecasts",
          name: "Ada L.",
          provider_id: "998877",
          avatar_url: "https://pbs.twimg.com/profile_images/1/abc_normal.jpg",
        },
      },
    ],
  };

  it("derives the verified X handle only from the OAuth identity payload", () => {
    const id = deriveIdentityFromAuthUser(linkedUser);
    expect(id.xHandle).toBe("AdaForecasts");
    expect(id.xUserId).toBe("998877");
    expect(id.xAvatarUrl).toBe("https://pbs.twimg.com/profile_images/1/abc_400x400.jpg");
    expect(id.linkedProviders).toEqual(["x", "agifutures"]);
    expect(id.primaryProvider).toBe("x");
    expect(id.baseHandle).toBe("AdaForecasts");
  });

  it("falls back to an email-derived handle for AGIFutures-only accounts", () => {
    const id = deriveIdentityFromAuthUser({ id: "abc-123", email: "grace.h@example.com", identities: [{ provider: "email" }] });
    expect(id.xHandle).toBeUndefined();
    expect(id.linkedProviders).toEqual(["agifutures"]);
    expect(id.baseHandle).toBe("grace_h");
  });

  it("never lets a new user take an existing handle", () => {
    const existing: Profile[] = [
      { id: "prof-x", handle: "AdaForecasts", displayName: "Someone", role: "user", participantType: "human", bio: "", joinedAt: "" },
    ];
    const profile = buildProfileForIdentity(deriveIdentityFromAuthUser(linkedUser), existing);
    expect(profile.handle).not.toBe("AdaForecasts");
    expect(profile.handle.startsWith("AdaForecasts_")).toBe(true);
    expect(profile.xHandle).toBe("AdaForecasts");
    expect(hasVerifiedX(profile)).toBe(true);
  });

  it("treats demo X identities as unverified", () => {
    expect(hasVerifiedX({ xHandle: "demo", xUserId: "demo-demo", isSandbox: true })).toBe(false);
    expect(sanitizeHandle("@weird handle!!")).toBe("weird_handle");
  });
});

describe("Post-auth redirect safety", () => {
  it("only allows same-site paths and strips the basePath", () => {
    expect(safeRedirectPath("/futuregraph/q/node-1?restoreDraft=1")).toBe("/q/node-1?restoreDraft=1");
    expect(safeRedirectPath("/u/ada")).toBe("/u/ada");
    expect(safeRedirectPath("https://evil.example")).toBe("/");
    expect(safeRedirectPath("//evil.example")).toBe("/");
    expect(safeRedirectPath("/\\evil.example")).toBe("/");
    expect(withBasePath("/api/og")).toBe("/futuregraph/api/og");
    expect(withBasePath("/futuregraph/api/og")).toBe("/futuregraph/api/og");
  });
});

describe("Oracle parsers", () => {
  it("parses an open Polymarket market with stringified arrays", () => {
    const snap = parsePolymarketMarket({ question: "Q?", closed: false, outcomes: '["Yes","No"]', outcomePrices: '["0.23","0.77"]' });
    expect(snap.status).toBe("open");
    expect(snap.outcome).toBeNull();
    expect(snap.probability).toBeCloseTo(0.23);
  });

  it("parses resolved Polymarket markets, including NO and multi-outcome labels", () => {
    expect(parsePolymarketMarket({ closed: true, umaResolutionStatus: "resolved", outcomes: ["Yes", "No"], outcomePrices: ["0", "1"] }).outcome).toBe(0);
    const multi = parsePolymarketMarket([{ closed: true, outcomes: '["Alpha","Beta"]', outcomePrices: '["1","0"]' }], "Alpha");
    expect(multi.status).toBe("resolved");
    expect(multi.outcome).toBe(1);
  });

  it("parses Metaculus posts (new API), legacy questions, and annulments", () => {
    const open = parseMetaculusPost({
      title: "Will X?",
      question: { type: "binary", status: "open", resolution: null, aggregations: { recency_weighted: { latest: { centers: [0.31] } } } },
    });
    expect(open.status).toBe("open");
    expect(open.probability).toBeCloseTo(0.31);

    expect(parseMetaculusPost({ question: { type: "binary", status: "resolved", resolution: "yes" } }).outcome).toBe(1);
    expect(parseMetaculusPost({ question: { type: "binary", status: "resolved", resolution: "annulled" } }).status).toBe("annulled");
    expect(parseMetaculusPost({ resolution: 0, community_prediction: { full: { q2: 0.12 } } }).outcome).toBe(0);

    const mc = parseMetaculusPost(
      {
        question: {
          type: "multiple_choice",
          status: "resolved",
          resolution: "Futurama",
          options: ["AI-Fizzle", "Futurama", "AI-Dystopia"],
          aggregations: { recency_weighted: { latest: { forecast_values: [0.03, 0.45, 0.24] } } },
        },
      },
      "Futurama"
    );
    expect(mc.outcome).toBe(1);
    expect(mc.probability).toBeCloseTo(0.45);
  });
});
