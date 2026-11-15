import { describe, expect, it } from "vitest";
import { demoExtraction, demoTranscript } from "@/lib/data";
import { checkExtraction } from "@/lib/extraction-schema";
import { extractDebrief, type ModelCall } from "@/lib/server/extract";

const userText = demoTranscript.filter((l) => l.role === "user").map((l) => l.text).join("\n");
const bad = { ...demoExtraction, people: [{ ...demoExtraction.people[0], chemistry: 7 }] };

function scripted(...outputs: unknown[]) {
  const prompts: string[] = [];
  const call: ModelCall = async (p) => {
    prompts.push(p);
    const next = outputs.shift();
    if (next instanceof Error) throw next;
    return next;
  };
  return { call, prompts };
}

describe("S6 extraction validation and retry", () => {
  it("the recorded fixture passes validation", () => {
    expect(checkExtraction(demoExtraction, userText)).toEqual([]);
  });

  it("flags out-of-range chemistry", () => {
    expect(checkExtraction(bad, userText)).toEqual(["Ethan: chemistry must be an integer 1-5"]);
  });

  it("allows people outside the group (S5: applyExtraction ignores them)", () => {
    const stranger = { ...demoExtraction, people: [{ ...demoExtraction.people[0], name: "Zed" }] };
    expect(checkExtraction(stranger, userText)).toEqual([]);
  });

  it("flags a person or attribute listed twice", () => {
    const dupes = {
      ...demoExtraction,
      people: [demoExtraction.people[2], demoExtraction.people[2]],
      preference_updates: [demoExtraction.preference_updates[0], demoExtraction.preference_updates[0]],
    };
    expect(checkExtraction(dupes, userText)).toEqual(["Jordan is listed twice", "career is updated twice"]);
  });

  it("flags evidence that isn't her own words (made up, or Bee's line)", () => {
    const madeUp = { ...demoExtraction, people: [{ ...demoExtraction.people[2], evidence: "Jordan is my soulmate" }] };
    expect(checkExtraction(madeUp, userText)[0]).toContain("not an exact quote");
    const beesWords = { ...demoExtraction, people: [{ ...demoExtraction.people[2], evidence: "the guy who isn't your 'type' was the highlight" }] };
    expect(checkExtraction(beesWords, userText)[0]).toContain("not an exact quote");
  });

  it("rejects one-word quotes that only match inside other words", () => {
    const tiny = { ...demoExtraction, people: [{ ...demoExtraction.people[2], evidence: "he" }] };
    expect(checkExtraction(tiny, userText)[0]).toContain("not an exact quote");
  });

  it("after the retry, drops only the items with unverifiable quotes", async () => {
    const paraphrased = { ...demoExtraction, people: [...demoExtraction.people.slice(0, 2), { ...demoExtraction.people[2], evidence: "Jordan made me laugh a lot" }] };
    const { call, prompts } = scripted(paraphrased, paraphrased);
    const result = await extractDebrief({ prompt: "P", userText, call });
    expect(prompts).toHaveLength(2);
    expect(result.people.map((p) => p.name)).toEqual(["Ethan", "Marcus"]);
    expect(result.preference_updates).toEqual(demoExtraction.preference_updates);
  });

  it("accepts quotes with different punctuation or curly apostrophes", () => {
    const curly = { ...demoExtraction, people: [{ ...demoExtraction.people[4], evidence: "Claire was sweet but we didn’t really connect" }] };
    expect(checkExtraction(curly, userText)).toEqual([]);
  });

  it("retries once with the problems listed, then succeeds", async () => {
    const { call, prompts } = scripted(bad, demoExtraction);
    await expect(extractDebrief({ prompt: "P", userText, call })).resolves.toEqual(demoExtraction);
    expect(prompts).toHaveLength(2);
    expect(prompts[1]).toContain("chemistry must be an integer 1-5");
  });

  it("retries once after malformed JSON (schema failure)", async () => {
    const { call, prompts } = scripted({ people: "nope" }, demoExtraction);
    await expect(extractDebrief({ prompt: "P", userText, call })).resolves.toEqual(demoExtraction);
    expect(prompts).toHaveLength(2);
  });

  it("gives up after two bad answers", async () => {
    const { call, prompts } = scripted(bad, bad, demoExtraction);
    await expect(extractDebrief({ prompt: "P", userText, call })).rejects.toThrow(/2 attempts/);
    expect(prompts).toHaveLength(2);
  });

  it("gives up after two API errors", async () => {
    const { call } = scripted(new Error("network"), new Error("network"));
    await expect(extractDebrief({ prompt: "P", userText, call })).rejects.toThrow("network");
  });
});
