// Applies what Bee learned in a debrief to Maya's profile.
import type { Extraction } from "./extraction-schema";
import type { Attribute, OutcomeSignal, User, Weights } from "./types";

// One debrief can move a weight at most this far, so a single bad night can't rewrite a profile.
export const MAX_STEP = 0.5;

export type WeightChange = {
  attribute: Attribute;
  before: number;
  after: number;
  evidence: string;
  statedVsRevealed: boolean;
};

const round = (n: number) => Math.round(n * 100) / 100;

export function applyExtraction(weights: Weights, extraction: Extraction, members: User[]) {
  const next = { ...weights };
  const changes: WeightChange[] = [];
  // One update per attribute (last wins), so repeating an attribute can't stack past MAX_STEP.
  const updates = new Map(extraction.preference_updates.map((u) => [u.attribute, u]));
  for (const u of updates.values()) {
    // `old_weight` comes from the real profile, never from the LLM (it can misremember).
    const before = weights[u.attribute];
    const target = Math.min(1, Math.max(0, u.new_weight));
    const after = round(before + Math.max(-MAX_STEP, Math.min(MAX_STEP, target - before)));
    if (after === before) continue;
    next[u.attribute] = after;
    changes.push({ attribute: u.attribute, before, after, evidence: u.evidence, statedVsRevealed: u.stated_vs_revealed });
  }

  // Match people by first name to the members of last week's group; anyone else is dropped.
  // One signal per person (last wins).
  const byPerson = new Map<string, OutcomeSignal>();
  for (const p of extraction.people) {
    const m = members.find((x) => x.name.toLowerCase() === p.name.trim().toLowerCase());
    if (!m) continue;
    byPerson.set(m.id, {
      personId: m.id,
      name: m.name,
      chemistry: Math.min(5, Math.max(1, Math.round(p.chemistry))),
      wantsToSeeAgain: p.wants_to_see_again,
      vibe: p.vibe,
      evidence: p.evidence,
    });
  }
  return { weights: next, changes, signals: [...byPerson.values()] };
}
