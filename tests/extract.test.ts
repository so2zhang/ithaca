import { describe, expect, it } from "vitest";
import { demoExtraction } from "@/lib/data";
import { checkExtraction } from "@/lib/extraction-schema";
import { extractDebrief, type ModelCall } from "@/lib/server/extract";

const names = ["Ethan", "Marcus", "Jordan", "Priya", "Claire"];
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
    expect(checkExtraction(demoExtraction, names)).toEqual([]);
  });

  it("flags out-of-range chemistry and unknown people", () => {
    expect(checkExtraction(bad, names)).toHaveLength(1);
    const stranger = { ...demoExtraction, people: [{ ...demoExtraction.people[0], name: "Zed" }] };
    expect(checkExtraction(stranger, names)[0]).toContain("Zed");
  });

  it("retries once with the problems listed, then succeeds", async () => {
    const { call, prompts } = scripted(bad, demoExtraction);
    await expect(extractDebrief({ prompt: "P", memberNames: names, call })).resolves.toEqual(demoExtraction);
    expect(prompts).toHaveLength(2);
    expect(prompts[1]).toContain("chemistry must be an integer 1-5");
  });

  it("retries once after malformed JSON (schema failure)", async () => {
    const { call, prompts } = scripted({ people: "nope" }, demoExtraction);
    await expect(extractDebrief({ prompt: "P", memberNames: names, call })).resolves.toEqual(demoExtraction);
    expect(prompts).toHaveLength(2);
  });

  it("gives up after two bad answers", async () => {
    const { call, prompts } = scripted(bad, bad, demoExtraction);
    await expect(extractDebrief({ prompt: "P", memberNames: names, call })).rejects.toThrow(/twice/);
    expect(prompts).toHaveLength(2);
  });

  it("gives up after two API errors", async () => {
    const { call } = scripted(new Error("network"), new Error("network"));
    await expect(extractDebrief({ prompt: "P", memberNames: names, call })).rejects.toThrow("network");
  });
});
