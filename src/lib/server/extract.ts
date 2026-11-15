// Turns a debrief transcript into structured updates with Claude, validated, with one retry.
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { ExtractionSchema, checkExtraction, type Extraction } from "../extraction-schema";

// Calls the model and returns whatever it produced (validated by the caller).
export type ModelCall = (prompt: string) => Promise<unknown>;

export const callClaude: ModelCall = async (prompt) => {
  const client = new Anthropic(); // reads ANTHROPIC_API_KEY on the server
  const res = await client.beta.messages.parse({
    model: "claude-opus-5-5",
    max_tokens: 4000,
    // If a safety classifier declines, the API re-runs on a fallback model instead of failing.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { format: betaZodOutputFormat(ExtractionSchema) },
    messages: [{ role: "user", content: prompt }],
  });
  if (res.stop_reason === "refusal") throw new Error("Claude declined to process this debrief");
  return res.parsed_output;
};

// Validate → on failure, retry once with the problems listed → still bad: throw.
export async function extractDebrief({ prompt, memberNames, call }: { prompt: string; memberNames: string[]; call: ModelCall }): Promise<Extraction> {
  let feedback = "";
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const parsed = ExtractionSchema.safeParse(await call(prompt + feedback));
      const problems = parsed.success
        ? checkExtraction(parsed.data, memberNames)
        : parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
      if (parsed.success && problems.length === 0) return parsed.data;
      feedback = `\n\nYour previous answer had these problems. Fix them:\n- ${problems.join("\n- ")}`;
    } catch (err) {
      if (attempt === 2) throw err;
    }
  }
  throw new Error(`Extraction failed validation twice.${feedback}`);
}
