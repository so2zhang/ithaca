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

// Checks the schema can't express (structured outputs don't enforce number ranges).
// Returns a list of problems; empty means valid.
export function checkExtraction(e: Extraction, memberNames: string[]): string[] {
  const problems: string[] = [];
  const known = new Set(memberNames.map((n) => n.toLowerCase()));
  for (const p of e.people) {
    if (!Number.isInteger(p.chemistry) || p.chemistry < 1 || p.chemistry > 5) problems.push(`${p.name}: chemistry must be an integer 1-5`);
    if (!known.has(p.name.toLowerCase())) problems.push(`${p.name} was not in the group (${memberNames.join(", ")})`);
  }
  for (const u of e.preference_updates) {
    if (u.new_weight < 0 || u.new_weight > 1) problems.push(`${u.attribute}: new_weight must be between 0 and 1`);
  }
  if (!e.summary.trim()) problems.push("summary is empty");
  return problems;
}
