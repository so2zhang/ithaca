// POST /api/voice-session: returns a short-lived ElevenLabs signed URL plus Bee's prompt for this Plan.
// The ElevenLabs API key never leaves the server; the browser only gets the signed URL.
import { PlanInputSchema } from "@/lib/api-schema";
import { maya, pool } from "@/lib/data";
import { getGroup } from "@/lib/matcher";
import { beeDebriefPrompt, beeFirstMessage } from "@/lib/prompts";
import { isMock } from "@/lib/server/mode";

export async function POST(request: Request) {
  const body = PlanInputSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  if (isMock()) return Response.json({ mock: true });

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  if (!apiKey || !agentId) return Response.json({ error: "Voice isn't configured on the server" }, { status: 503 });

  const res = await fetch(`https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(agentId)}`, {
    headers: { "xi-api-key": apiKey },
  }).catch(() => null);
  if (!res?.ok) {
    console.error("elevenlabs signed url failed", res?.status);
    return Response.json({ error: "Couldn't start the voice session" }, { status: 502 });
  }
  const { signed_url } = await res.json();
  const plan = getGroup(maya, body.data.weights, body.data.signals, pool);
  return Response.json({ signedUrl: signed_url, prompt: beeDebriefPrompt(maya, plan, "voice"), firstMessage: beeFirstMessage(maya, plan) });
}
