import { describe, expect, it } from "vitest";
import { demoExtraction, maya, pool } from "@/lib/data";
import { getGroup, isBalanced } from "@/lib/matcher";
import { applyExtraction } from "@/lib/profile";
import type { OutcomeSignal } from "@/lib/types";

const week1 = getGroup(maya, maya.statedWeights, [], pool);
const learned = applyExtraction(maya.statedWeights, demoExtraction, week1.members);
const week2 = getGroup(maya, learned.weights, learned.signals, pool);
const names = (p: typeof week1) => p.members.map((m) => m.name);

describe("S1 week 1 Plan from stated preferences", () => {
  it("is 6 people, balanced, intent-compatible, with a venue and time, and includes Jordan", () => {
    expect(week1.members).toHaveLength(5);
    expect(isBalanced([maya, ...week1.members])).toBe(true);
    for (const m of week1.members) expect(["serious", "open", "friends-only"]).toContain(m.intent);
    expect(week1.venue.name).toBeTruthy();
    expect(maya.availability).toContain(week1.slot);
    expect(names(week1)).toEqual(["Marcus", "Ethan", "Jordan", "Priya", "Claire"]);
  });

  it("explains itself from her stated preference", () => {
    expect(week1.reasons.map((r) => r.kind)).toContain("preference");
    expect(week1.reasons.find((r) => r.kind === "preference")?.text).toContain("career-driven");
  });
});

describe("S4 next week's Plan after the debrief", () => {
  it("changes at least 2 members, drops Ethan, brings Jordan back", () => {
    const changed = week2.members.filter((m) => !week1.members.some((o) => o.id === m.id));
    expect(changed.length).toBeGreaterThanOrEqual(2);
    expect(names(week2)).not.toContain("Ethan");
    expect(names(week2)).toContain("Jordan");
    expect(isBalanced([maya, ...week2.members])).toBe(true);
  });

  it("moves to an outdoorsy venue", () => {
    expect(week2.venue.vibe.outdoors ?? 0).toBeGreaterThan(0.5);
    expect(week2.venue.name).not.toBe(week1.venue.name);
  });

  it("has a why line naming Jordan and quoting Maya's own words", () => {
    const why = week2.reasons.find((r) => r.kind === "learned")?.text ?? "";
    const jordan = demoExtraction.people.find((p) => p.name === "Jordan")!;
    expect(why).toContain("Jordan");
    expect(why).toContain(jordan.evidence);
    expect(week2.reasons.some((r) => r.kind === "returning" && r.text.includes("Jordan"))).toBe(true);
  });
});

describe("S5 outcome-signal edge cases", () => {
  it("ignores signals about people who aren't in the pool", () => {
    const ghost: OutcomeSignal = { personId: "nobody", name: "Ghost", chemistry: 5, wantsToSeeAgain: "yes", vibe: "romantic", evidence: "x" };
    expect(names(getGroup(maya, maya.statedWeights, [ghost], pool))).toEqual(names(week1));
  });

  it("never seats the same person twice, even with duplicate signals", () => {
    const jordan: OutcomeSignal = { personId: "jordan", name: "Jordan", chemistry: 5, wantsToSeeAgain: "yes", vibe: "romantic", evidence: "x" };
    const plan = getGroup(maya, learned.weights, [jordan, jordan], pool);
    expect(new Set(plan.members.map((m) => m.id)).size).toBe(plan.members.length);
    expect(plan.reasons.find((r) => r.kind === "returning")?.text).toBe("Jordan is back: you said you'd want to see them again.");
  });

  it("still fills a balanced group when she says no to everyone", () => {
    const allNo = week1.members.map((m): OutcomeSignal => ({ personId: m.id, name: m.name, chemistry: 1, wantsToSeeAgain: "no", vibe: "neither", evidence: "x" }));
    const plan = getGroup(maya, maya.statedWeights, allNo, pool);
    expect(plan.members).toHaveLength(5);
    expect(plan.members.some((m) => week1.members.some((o) => o.id === m.id))).toBe(false);
    expect(isBalanced([maya, ...plan.members])).toBe(true);
  });
});
