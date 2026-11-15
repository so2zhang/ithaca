import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as chat } from "@/app/api/chat/route";
import { POST as extract } from "@/app/api/extract/route";
import { POST as voiceSession } from "@/app/api/voice-session/route";
import { demoExtraction, demoTranscript, maya } from "@/lib/data";

const planInput = { weights: maya.statedWeights, signals: [] };
const post = (body: unknown) => new Request("http://test/api", { method: "POST", body: JSON.stringify(body) });

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("mock mode (DEMO_MODE=mock)", () => {
  it("extract returns the recorded extraction without calling Claude", async () => {
    vi.stubEnv("DEMO_MODE", "mock");
    const res = await extract(post({ ...planInput, transcript: demoTranscript }));
    expect(res.status).toBe(200);
    expect((await res.json()).extraction).toEqual(demoExtraction);
  });

  it("chat replays Bee's recorded lines in order", async () => {
    vi.stubEnv("DEMO_MODE", "mock");
    const open = await (await chat(post({ ...planInput, transcript: [] }))).json();
    expect(open.reply).toBe(demoTranscript[0].text);
    const second = await (await chat(post({ ...planInput, transcript: demoTranscript.slice(0, 2) }))).json();
    expect(second.reply).toBe(demoTranscript[2].text);
  });

  it("voice-session tells the browser to use the recorded call", async () => {
    vi.stubEnv("DEMO_MODE", "mock");
    expect(await (await voiceSession(post(planInput))).json()).toEqual({ mock: true });
  });
});

describe("live mode failures (S6, S7)", () => {
  it("rejects malformed bodies with 400", async () => {
    expect((await extract(post({ weights: { career: 7 } }))).status).toBe(400);
    expect((await chat(new Request("http://test", { method: "POST", body: "not json" }))).status).toBe(400);
  });

  it("returns 503 with a clear message when keys are missing", async () => {
    vi.stubEnv("DEMO_MODE", "");
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    vi.stubEnv("ELEVENLABS_API_KEY", "");
    expect((await extract(post({ ...planInput, transcript: demoTranscript }))).status).toBe(503);
    expect((await voiceSession(post(planInput))).status).toBe(503);
  });

  it("returns 502 when ElevenLabs refuses", async () => {
    vi.stubEnv("DEMO_MODE", "");
    vi.stubEnv("ELEVENLABS_API_KEY", "key");
    vi.stubEnv("ELEVENLABS_AGENT_ID", "agent");
    vi.stubGlobal("fetch", async () => new Response("nope", { status: 401 }));
    expect((await voiceSession(post(planInput))).status).toBe(502);
  });
});

describe("S9 voice session keeps the key server-side", () => {
  it("returns only the signed URL and Bee's prompt for this group", async () => {
    vi.stubEnv("DEMO_MODE", "");
    vi.stubEnv("ELEVENLABS_API_KEY", "secret-key-123");
    vi.stubEnv("ELEVENLABS_AGENT_ID", "agent_1");
    let sentKey = "";
    vi.stubGlobal("fetch", async (_url: string, init: RequestInit) => {
      sentKey = new Headers(init.headers).get("xi-api-key") ?? "";
      return Response.json({ signed_url: "wss://signed.example/abc" });
    });
    const res = await voiceSession(post(planInput));
    const text = await res.text();
    expect(sentKey).toBe("secret-key-123");
    expect(text).not.toContain("secret-key-123");
    const body = JSON.parse(text);
    expect(body.signedUrl).toBe("wss://signed.example/abc");
    expect(body.prompt).toContain("Jordan");
    expect(body.prompt).not.toMatch(/\{\{\w+\}\}/);
  });
});
