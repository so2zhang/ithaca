# Bee Loop

A concept prototype of a learning layer for Bee + Plans. After a group hangout, Bee debriefs you by voice, learns what actually worked (including where what you *said* you want differs from what you *showed*), and next week's Plan reflects it, with an honest "why".

*Concept prototype by Sophia Zhang, not affiliated with Bumble. All users are synthetic.*

## Run it locally

You need Node.js 20+ installed. In a terminal, from this folder:

```bash
npm install
```

```bash
cp .env.example .env.local
```

```bash
npm run dev
```

Open http://localhost:3000. `.env.example` starts with `DEMO_MODE=mock`, so the whole flow works with no API keys.

## Demo mode vs. live mode

| `DEMO_MODE` | What happens | Costs |
|---|---|---|
| `mock` | The voice call replays a recorded debrief (labeled "Recorded debrief · demo mode"); extraction returns the recorded result; the text chat replays Bee's recorded lines and offers Maya's replies as one-tap suggestions. No network calls. | $0 |
| empty | Real voice call with ElevenLabs, real Claude extraction and text chat. | see below |

After changing `.env.local`, stop the dev server (Ctrl+C) and run `npm run dev` again.

**On the call:** use live mode for the debrief if wifi is good. If anything fails, every error screen has a way out: "Switch to text" during the call, and "Use recorded debrief" if extraction fails. "Reset demo" (top right) always returns to week 1.

## Set up the Bee voice agent (ElevenLabs), step by step

The ElevenLabs dashboard changes often, so labels may differ slightly from these.

1. Sign up at elevenlabs.io and open **Agents** (also called ElevenAgents / Conversational AI) in the left sidebar.
2. **Create agent** → **Blank template**. Name it `Bee`.
3. **System prompt**: paste `You are Bee, a warm matchmaker.` **First message**: `Hey! How'd it go?` Both are placeholders: the app replaces them on every call with `prompts/bee-debrief.md` (filled in with the real group's names), so you edit Bee's personality in that file, not in the dashboard.
4. **Voice**: open the voice picker and preview a few. Look for something warm, young and conversational (the library has filters for age and use case). Pick one you like hearing for 2 minutes.
5. **LLM**: choose a fast model from the agent's LLM dropdown (a Claude Sonnet or Haiku model if listed). Fast matters more than smart here: it controls how quickly Bee answers.
6. **Security** tab (this step matters):
   - Turn on **Enable authentication**. The browser can then only connect with a signed URL from our server, so nobody can use your agent with just its ID.
   - Under **Overrides**, turn on **System prompt** and **First message**. Without this, the app can't give Bee the group's names. (Trade-off: whoever holds a signed URL can set the prompt for that one call. Signed URLs are short-lived and only our server hands them out, which is fine for a demo.)
7. Save. Copy the **Agent ID** (shown in the agent's settings; starts with `agent_`).
8. Go to **Settings → API Keys → Create API key**. If it asks for permissions, give it access to Agents / Conversational AI. Copy the key (you only see it once).
9. In `.env.local`, set `ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID`, `ANTHROPIC_API_KEY` (from console.anthropic.com → API keys), and set `DEMO_MODE=` (empty). Restart `npm run dev`.
10. Click **Debrief with Bee**, allow the microphone, and talk.

### What each test costs (roughly)

- **One voice debrief**: 2–3 minutes of agent time. ElevenLabs bills agent minutes against your plan (check their pricing page for your plan; it's on the order of 10¢ a minute on paid plans, and the free tier includes a small monthly allowance). Budget **2–3 minutes per test**. Do one or two real calls total; use demo mode for everything else.
- **One extraction** (Claude reads the transcript): about 3¢.
- **One text-chat turn**: well under 1¢.

## Deploy to Vercel (shareable link)

1. Push this repo to GitHub (already done if you're reading this there).
2. vercel.com → **Add New… → Project** → import the repo → **Deploy**. Vercel detects Next.js automatically.
3. Project → **Settings → Environment Variables**: add `DEMO_MODE` = `mock` for the public link, so strangers can click through without spending your API credits. (To demo live from the deployed site, add the three keys and leave `DEMO_MODE` empty, then redeploy.)

## How it works

```
Plan (week N)  ──Debrief with Bee──▶  voice call (ElevenLabs) or text chat (Claude)
     ▲                                          │ transcript
     │                                          ▼
getGroup(user, weights, outcomeSignals)   /api/extract: Claude → strict JSON → zod validation (retry once)
     ▲                                          │
     └──── applyExtraction(): new weights + per-person signals ◀──┘
```

| File | What it does |
|---|---|
| `src/lib/matcher.ts` | **Stand-in for Bumble's existing matcher.** Filters (age, intent, availability, "not again"), a weighted score, a 60% gender-balance cap, venue + time, and template "why" reasons built only from real inputs. |
| `src/lib/profile.ts` | Applies what Bee learned: uses the real current weight (not the LLM's), clamps to 0–1, moves at most 0.5 per debrief, maps people by name to last week's group. |
| `src/lib/extraction-schema.ts` | The JSON shape Claude must return, plus checks the schema can't express (chemistry 1–5, only people who were there). |
| `src/lib/server/extract.ts` | The Claude call (structured outputs) and the validate-and-retry-once loop. |
| `src/app/api/*` | Server routes. Keys only live here. `voice-session` hands the browser a short-lived signed URL. |
| `prompts/*.md` | Bee's personality/questions and the extraction instructions. Plain text, edit freely. |
| `src/lib/seed.ts` | Seeded generator for the ~60 synthetic Austin users (`npm run seed` rewrites `src/data/users.json`). The story characters (Ethan, Marcus, Jordan, Priya, Claire, Leo, Diego, Hana) are hand-written so the demo is reproducible. |
| `fixtures/demo/` | Maya's recorded debrief and its extraction (used by demo mode and tests). |

## Suggested 3–4 minute demo

1. **(30s) Week 1.** "Maya told the app she wants ambitious, career-driven people. Bumble's matcher (here a simple stand-in) built a balanced, intent-aligned group: rooftop drinks downtown." Point at the "why" box.
2. **(75s) Debrief.** Tap Debrief with Bee. Let it run 3–4 exchanges, then End. Point out Bee knows the names.
3. **(60s) What Bee learned.** The black "Stated vs. revealed" card is the punchline: she said career matters a lot, but lit up with the outdoorsy musician. Every change carries her own words.
4. **(45s) Week 2.** New group, new venue, and the why line quotes her: "Last week you clicked with Jordan…". Ethan is gone; Jordan and Priya are back.
5. **(close)** "The learning layer plugs into whatever matcher Bumble already runs: `getGroup(user, weights, outcomeSignals)`."

## Checks

```bash
bash scripts/verify.sh
```

Runs types + lint, unit tests, a production build, and browser tests (demo mode, plus a no-keys live server to test failure paths). Screenshots land in `evidence/`.

```bash
ANTHROPIC_API_KEY=sk-... npm run eval
```

Runs the extraction quality eval: 3 real Claude calls, about 10¢ total.
