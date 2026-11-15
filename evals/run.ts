// Quality eval for debrief extraction (real Claude calls, ~3¢ per case).
// Usage: ANTHROPIC_API_KEY=... npm run eval        (EVAL_SET=holdout to run evals/holdout/)
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { TranscriptSchema, maya, pool } from "../src/lib/data";
import type { Extraction } from "../src/lib/extraction-schema";
import { getGroup } from "../src/lib/matcher";
import { extractionPrompt } from "../src/lib/prompts";
import { callClaude, extractDebrief } from "../src/lib/server/extract";
import { ATTRIBUTES } from "../src/lib/types";

const CaseSchema = z.object({
  name: z.string(),
  transcript: TranscriptSchema,
  expect: z.object({
    people: z.record(z.string(), z.object({ minChemistry: z.number().optional(), maxChemistry: z.number().optional(), wantsToSeeAgain: z.enum(["yes", "no", "maybe"]).optional(), vibe: z.enum(["romantic", "friend", "neither"]).optional() })).default({}),
    notMentioned: z.array(z.string()).default([]), // people who must NOT appear
    weightDirection: z.partialRecord(z.enum(ATTRIBUTES), z.enum(["up", "down", "unchanged"])).default({}),
    statedVsRevealed: z.array(z.enum(ATTRIBUTES)).default([]), // must be flagged
    notStatedVsRevealed: z.array(z.enum(ATTRIBUTES)).default([]), // must NOT be flagged
  }),
});

function grade(e: Extraction, exp: z.infer<typeof CaseSchema>["expect"], transcriptText: string): string[] {
  const fails: string[] = [];
  const person = (n: string) => e.people.find((p) => p.name.toLowerCase() === n.toLowerCase());
  for (const [name, want] of Object.entries(exp.people)) {
    const p = person(name);
    if (!p) { fails.push(`${name} missing`); continue; }
    if (want.minChemistry && p.chemistry < want.minChemistry) fails.push(`${name} chemistry ${p.chemistry} < ${want.minChemistry}`);
    if (want.maxChemistry && p.chemistry > want.maxChemistry) fails.push(`${name} chemistry ${p.chemistry} > ${want.maxChemistry}`);
    if (want.wantsToSeeAgain && p.wants_to_see_again !== want.wantsToSeeAgain) fails.push(`${name} wants_to_see_again=${p.wants_to_see_again}`);
    if (want.vibe && p.vibe !== want.vibe) fails.push(`${name} vibe=${p.vibe}`);
  }
  for (const n of exp.notMentioned) if (person(n)) fails.push(`${n} should not be extracted`);
  for (const [attr, dir] of Object.entries(exp.weightDirection)) {
    const u = e.preference_updates.find((x) => x.attribute === attr);
    const actual = !u || u.new_weight === u.old_weight ? "unchanged" : u.new_weight > u.old_weight ? "up" : "down";
    if (actual !== dir) fails.push(`${attr} went ${actual}, expected ${dir}`);
  }
  for (const a of exp.statedVsRevealed) if (!e.preference_updates.some((u) => u.attribute === a && u.stated_vs_revealed)) fails.push(`${a} not flagged stated-vs-revealed`);
  for (const a of exp.notStatedVsRevealed) if (e.preference_updates.some((u) => u.attribute === a && u.stated_vs_revealed)) fails.push(`${a} wrongly flagged stated-vs-revealed`);
  // Evidence must be real quotes from what she said (loose match: ignore case/punctuation).
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "");
  for (const q of [...e.people.map((p) => p.evidence), ...e.preference_updates.map((u) => u.evidence)]) {
    if (!norm(transcriptText).includes(norm(q).slice(0, 25))) fails.push(`evidence not found in transcript: "${q}"`);
  }
  return fails;
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Set ANTHROPIC_API_KEY to run evals (each case is one real Claude call, about 3 cents).");
    process.exit(1);
  }
  const dir = path.join("evals", process.env.EVAL_SET ?? "cases");
  const plan = getGroup(maya, maya.statedWeights, [], pool);
  let passed = 0;
  const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
  for (const f of files) {
    const c = CaseSchema.parse(JSON.parse(readFileSync(path.join(dir, f), "utf8")));
    const userText = c.transcript.filter((l) => l.role === "user").map((l) => l.text).join(" ");
    const e = await extractDebrief({ prompt: extractionPrompt(maya, plan, maya.statedWeights, c.transcript), memberNames: plan.members.map((m) => m.name), call: callClaude });
    const fails = grade(e, c.expect, userText);
    if (fails.length === 0) passed++;
    console.log(`${fails.length ? "FAIL" : "PASS"}  ${c.name}`);
    for (const x of fails) console.log(`      - ${x}`);
    if (fails.length) console.log(`      raw: ${JSON.stringify(e)}`);
  }
  console.log(`\n${passed}/${files.length} cases passed`);
  if (passed < files.length) process.exitCode = 1;
}

void main();
