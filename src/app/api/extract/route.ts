// POST /api/extract: debrief transcript → validated profile updates (Claude, or the recorded fixture in mock mode).
import { ExtractRequestSchema } from "@/lib/api-schema";
import { demoExtraction, maya, pool } from "@/lib/data";
import { getGroup } from "@/lib/matcher";
import { extractionPrompt } from "@/lib/prompts";
import { callClaude, extractDebrief } from "@/lib/server/extract";
import { isMock } from "@/lib/server/mode";

export async function POST(request: Request) {
  const body = ExtractRequestSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  if (isMock()) return Response.json({ extraction: demoExtraction, mock: true });
  if (!process.env.ANTHROPIC_API_KEY) return Response.json({ error: "ANTHROPIC_API_KEY is not set on the server" }, { status: 503 });

  const { weights, signals, transcript } = body.data;
  const plan = getGroup(maya, weights, signals, pool);
  try {
    const extraction = await extractDebrief({
      prompt: extractionPrompt(maya, plan, weights, transcript),
      userText: transcript.filter((l) => l.role === "user").map((l) => l.text).join("\n"),
      call: callClaude,
    });
    return Response.json({ extraction });
  } catch (err) {
    console.error("extract failed", err);
    return Response.json({ error: "Bee couldn't process this debrief" }, { status: 502 });
  }
}
