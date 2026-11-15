// POST /api/chat: the text-fallback debrief. Returns Bee's next message.
import Anthropic from "@anthropic-ai/sdk";
import { ChatRequestSchema } from "@/lib/api-schema";
import { demoTranscript, maya, pool } from "@/lib/data";
import { getGroup } from "@/lib/matcher";
import { beeDebriefPrompt, beeFirstMessage } from "@/lib/prompts";
import { isMock } from "@/lib/server/mode";

const CLOSING = "Thanks, Maya, I've got a really good picture now. Tap Finish and I'll put together next week's Plan.";

export async function POST(request: Request) {
  const body = ChatRequestSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  const { weights, signals, transcript } = body.data;
  const plan = getGroup(maya, weights, signals, pool);

  // Empty transcript = the chat is opening; Bee speaks first.
  if (transcript.length === 0) {
    return Response.json({ reply: isMock() ? demoTranscript[0].text : beeFirstMessage(maya, plan) });
  }
  if (isMock()) {
    // Replay Bee's recorded lines in order, whatever the user typed.
    const userTurns = transcript.filter((l) => l.role === "user").length;
    const beeLines = demoTranscript.filter((l) => l.role === "bee");
    return Response.json({ reply: beeLines[userTurns]?.text ?? CLOSING });
  }
  if (!process.env.ANTHROPIC_API_KEY) return Response.json({ error: "ANTHROPIC_API_KEY is not set on the server" }, { status: 503 });

  try {
    const client = new Anthropic();
    const res = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 1000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low" }, // chat replies are short; low effort keeps it fast and cheap
      system: beeDebriefPrompt(maya, plan, "text"),
      // The API needs the first message to come from the user, so we note that she opened the chat.
      messages: [
        { role: "user", content: `(${maya.name} opened the debrief chat)` },
        ...transcript.map((l) => ({ role: l.role === "bee" ? ("assistant" as const) : ("user" as const), content: l.text })),
      ],
    });
    const reply = res.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("").trim();
    if (res.stop_reason === "refusal" || !reply) throw new Error(`no reply (stop_reason=${res.stop_reason})`);
    return Response.json({ reply });
  } catch (err) {
    console.error("chat failed", err);
    return Response.json({ error: "Bee couldn't reply" }, { status: 502 });
  }
}
