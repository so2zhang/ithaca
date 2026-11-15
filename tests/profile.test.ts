import { describe, expect, it } from "vitest";
import { demoExtraction, maya, pool } from "@/lib/data";
import type { Extraction } from "@/lib/extraction-schema";
import { getGroup } from "@/lib/matcher";
import { MAX_STEP, applyExtraction } from "@/lib/profile";

const members = getGroup(maya, maya.statedWeights, [], pool).members;
const update = (u: Partial<Extraction["preference_updates"][number]>): Extraction => ({
  people: [],
  summary: "s",
  preference_updates: [{ attribute: "outdoors", old_weight: 0.2, new_weight: 0.7, direction: "up", evidence: "e", stated_vs_revealed: true, ...u }],
});

describe("S3 applying the recorded debrief", () => {
  it("produces before/after changes with at least one stated-vs-revealed flag and a quote", () => {
    const { changes, signals } = applyExtraction(maya.statedWeights, demoExtraction, members);
    expect(changes.length).toBeGreaterThan(0);
    const gap = changes.find((c) => c.statedVsRevealed);
    expect(gap).toBeDefined();
    expect(gap!.evidence.length).toBeGreaterThan(5);
    expect(signals.map((s) => s.name).sort()).toEqual(["Claire", "Ethan", "Jordan", "Marcus", "Priya"]);
  });
});

describe("S5 guarding against bad LLM output", () => {
  it("uses the real current weight, not the LLM's old_weight", () => {
    const { changes } = applyExtraction(maya.statedWeights, update({ old_weight: 0.99 }), members);
    expect(changes[0].before).toBe(maya.statedWeights.outdoors);
  });

  it("clamps weights to 0–1 and limits a single jump", () => {
    const up = applyExtraction(maya.statedWeights, update({ new_weight: 5 }), members);
    expect(up.weights.outdoors).toBeCloseTo(maya.statedWeights.outdoors + MAX_STEP);
    const down = applyExtraction(maya.statedWeights, update({ attribute: "career", new_weight: -3 }), members);
    expect(down.weights.career).toBeCloseTo(maya.statedWeights.career - MAX_STEP);
  });

  it("drops people who weren't in the group and clamps chemistry", () => {
    const e: Extraction = {
      preference_updates: [],
      summary: "s",
      people: [
        { name: "Zed", chemistry: 5, wants_to_see_again: "yes", vibe: "romantic", evidence: "x" },
        { name: "jordan", chemistry: 9, wants_to_see_again: "yes", vibe: "romantic", evidence: "x" },
      ],
    };
    const { signals } = applyExtraction(maya.statedWeights, e, members);
    expect(signals).toHaveLength(1);
    expect(signals[0]).toMatchObject({ personId: "jordan", chemistry: 5 });
  });
});
