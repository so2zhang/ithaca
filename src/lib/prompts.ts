// Server-only: loads prompt templates from prompts/*.md and fills {{placeholders}}.
import { readFileSync } from "node:fs";
import path from "node:path";
import { ATTRIBUTES, ATTRIBUTE_LABELS } from "./types";
import type { DemoUser, Plan, TranscriptLine, Weights } from "./types";
import { SLOT_LABELS } from "./venues";

export function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    if (!(key in vars)) throw new Error(`Prompt variable {{${key}}} has no value`);
    return vars[key];
  });
}

const load = (name: string) => readFileSync(path.join(process.cwd(), "prompts", name), "utf8");

const describeMembers = (plan: Plan) =>
  plan.members.map((m) => `- ${m.name}, ${m.age}, ${m.job}. Into ${m.interests.join(", ")}. "${m.chapter}"`).join("\n");

const describeWeights = (w: Weights) => ATTRIBUTES.map((k) => `- ${k}: ${w[k]}`).join("\n");

export function beeDebriefPrompt(user: DemoUser, plan: Plan, channel: "voice" | "text") {
  const top = [...ATTRIBUTES].sort((a, b) => user.statedWeights[b] - user.statedWeights[a]).slice(0, 2);
  return fillTemplate(load("bee-debrief.md"), {
    user_name: user.name,
    channel: channel === "voice" ? "voice call" : "text",
    plan: `${plan.venue.activity} (${plan.venue.area}), ${SLOT_LABELS[plan.slot]}.`,
    members: describeMembers(plan),
    stated_preferences: top.map((k) => ATTRIBUTE_LABELS[k].toLowerCase()).join(" and "),
    channel_note:
      channel === "voice"
        ? "- This is a voice call: no lists, no emoji, speak naturally."
        : "- This is a text chat: keep each message under 30 words, lowercase-casual is fine, at most one emoji.",
  });
}

export function beeFirstMessage(user: DemoUser, plan: Plan) {
  return `Hey ${user.name}! So, ${plan.venue.name.toLowerCase()} last night. How'd it go? Give me the honest version.`;
}

export function extractionPrompt(user: DemoUser, plan: Plan, weights: Weights, transcript: TranscriptLine[]) {
  return fillTemplate(load("extract-debrief.md"), {
    user_name: user.name,
    members: describeMembers(plan),
    weights: describeWeights(weights),
    transcript: transcript.map((l) => `${l.role === "bee" ? "Bee" : user.name}: ${l.text}`).join("\n"),
  });
}
