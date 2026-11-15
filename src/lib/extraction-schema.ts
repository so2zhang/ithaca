// The strict JSON shape Claude must return after a debrief. Shared by the server route,
// the mock fixture, and tests. Safe to import from the browser (no API calls here).
import { z } from "zod";
import { ATTRIBUTES } from "./types";

export const ExtractionSchema = z.object({
  people: z.array(
    z.object({
      name: z.string(),
      chemistry: z.number(),
      wants_to_see_again: z.enum(["yes", "no", "maybe"]),
      vibe: z.enum(["romantic", "friend", "neither"]),
      evidence: z.string(),
    }),
  ),
  preference_updates: z.array(
    z.object({
      attribute: z.enum(ATTRIBUTES),
      old_weight: z.number(),
      new_weight: z.number(),
      direction: z.enum(["up", "down"]),
      evidence: z.string(),
      stated_vs_revealed: z.boolean(),
    }),
  ),
  summary: z.string(),
});
export type Extraction = z.infer<typeof ExtractionSchema>;

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

// True if `quote` is at least 2 whole words of what the user actually said.
export function isQuoted(quote: string, userText: string) {
  const q = normalize(quote);
  return q.split(" ").length >= 2 && ` ${normalize(userText)} `.includes(` ${q} `);
}

// Last resort after the retry: keep only the items whose quote is verified.
export function dropUnquoted(e: Extraction, userText: string): Extraction {
  return {
    ...e,
    people: e.people.filter((p) => isQuoted(p.evidence, userText)),
    preference_updates: e.preference_updates.filter((u) => isQuoted(u.evidence, userText)),
  };
}

// Checks the schema can't express (structured outputs don't enforce number ranges).
// `userText` is everything the user said: every evidence quote must appear in it, because
// quotes are shown to her as her own words. People outside the group are allowed here;
// applyExtraction drops them. Returns a list of problems; empty means valid.
export function checkExtraction(e: Extraction, userText: string): string[] {
  const problems: string[] = [];
  const quoted = (q: string) => isQuoted(q, userText);
  const seenPeople = new Set<string>();
  for (const p of e.people) {
    if (!Number.isInteger(p.chemistry) || p.chemistry < 1 || p.chemistry > 5) problems.push(`${p.name}: chemistry must be an integer 1-5`);
    if (seenPeople.has(normalize(p.name))) problems.push(`${p.name} is listed twice`);
    seenPeople.add(normalize(p.name));
    if (!quoted(p.evidence)) problems.push(`${p.name}: evidence "${p.evidence}" is not an exact quote of what the user said`);
  }
  const seenAttrs = new Set<string>();
  for (const u of e.preference_updates) {
    if (u.new_weight < 0 || u.new_weight > 1) problems.push(`${u.attribute}: new_weight must be between 0 and 1`);
    if (seenAttrs.has(u.attribute)) problems.push(`${u.attribute} is updated twice`);
    seenAttrs.add(u.attribute);
    if (!quoted(u.evidence)) problems.push(`${u.attribute}: evidence "${u.evidence}" is not an exact quote of what the user said`);
  }
  if (!e.summary.trim()) problems.push("summary is empty");
  return problems;
}
