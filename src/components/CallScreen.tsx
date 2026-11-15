"use client";
// The voice debrief screen. Two drivers share one UI:
//   LiveCall  - real ElevenLabs Agents session (signed URL from our server)
//   MockCall  - replays the recorded debrief (DEMO_MODE=mock), so the demo never depends on wifi
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { useEffect, useRef, useState } from "react";
import { demoTranscript } from "@/lib/data";
import type { PlanInputSchema } from "@/lib/api-schema";
import type { TranscriptLine } from "@/lib/types";
import type { z } from "zod";
import { Orb } from "./ui";

type PlanInput = z.infer<typeof PlanInputSchema>;
type CallProps = { planInput: PlanInput; onEnd: (t: TranscriptLine[]) => void; onSwitchToText: () => void };

function CallLayout({
  status,
  speaking,
  level,
  lines,
  muted,
  onToggleMute,
  onEnd,
  onSwitchToText,
  error,
  badge,
}: {
  status: string;
  speaking: boolean;
  level: number;
  lines: TranscriptLine[];
  muted: boolean;
  onToggleMute: () => void;
  onEnd: () => void;
  onSwitchToText: () => void;
  error?: string;
  badge?: string;
}) {
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines.length]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-ink text-cream">
      <div className="flex flex-col items-center pt-4">
        {badge && <span className="mb-1 rounded-full bg-cream/10 px-2.5 py-0.5 text-[10px] text-cream/70">{badge}</span>}
        <Orb level={level} speaking={speaking} size={130} />
        <p className="text-sm text-cream/70" data-testid="call-status">
          {status}
        </p>
      </div>

      <div className="mt-3 min-h-0 flex-1 overflow-y-auto px-5" data-testid="transcript">
        {lines.map((l, i) => (
          <p key={i} className={`mb-2.5 text-[14px] leading-snug ${l.role === "bee" ? "text-honey" : "text-cream/90"}`}>
            <span className="mr-1.5 text-[11px] font-semibold uppercase tracking-wider opacity-60">{l.role === "bee" ? "Bee" : "You"}</span>
            {l.text}
          </p>
        ))}
        <div ref={bottom} />
      </div>

      {error && (
        <div className="mx-5 mb-2 rounded-xl bg-red-500/15 p-3 text-sm text-red-100" role="alert">
          {error}
        </div>
      )}

      <div className="flex items-center justify-center gap-5 px-5 pt-3 pb-2">
        <button
          onClick={onToggleMute}
          aria-pressed={muted}
          className={`h-14 w-14 rounded-full text-xs font-semibold ${muted ? "bg-cream text-ink" : "bg-cream/15 text-cream"}`}
        >
          {muted ? "Unmute" : "Mute"}
        </button>
        <button onClick={onEnd} className="h-16 w-16 rounded-full bg-red-500 text-xs font-bold text-white">
          End
        </button>
        <button onClick={onSwitchToText} className="h-14 w-14 rounded-full bg-cream/15 text-[11px] leading-tight font-semibold text-cream">
          Switch to text
        </button>
      </div>
    </div>
  );
}

// ---------- Live: ElevenLabs Agents ----------

export function LiveCall(props: CallProps) {
  return (
    <ConversationProvider>
      <LiveCallInner {...props} />
    </ConversationProvider>
  );
}

function LiveCallInner({ planInput, onEnd, onSwitchToText }: CallProps) {
  const [lines, setLines] = useState<TranscriptLine[]>([]);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState<string>();
  const [level, setLevel] = useState(0);
  const linesRef = useRef<TranscriptLine[]>([]);
  const started = useRef(false);
  const ended = useRef(false);

  const finish = () => {
    if (ended.current) return;
    ended.current = true;
    onEnd(linesRef.current);
  };

  const conversation = useConversation({
    micMuted: muted,
    onMessage: ({ message, role }) => {
      linesRef.current = [...linesRef.current, { role: role === "user" ? "user" : "bee", text: message }];
      setLines(linesRef.current);
    },
    onDisconnect: () => {
      // Bee hung up on her own (she wraps up when done): treat it like pressing End.
      if (linesRef.current.some((l) => l.role === "user")) finish();
    },
    onError: (message) => setError(`Voice error: ${message}. You can switch to text.`),
  });
  const { startSession, endSession, status, isSpeaking, getOutputVolume, getInputVolume } = conversation;

  // Start once (a ref guard stops React's dev double-run from opening two sessions).
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      const res = await fetch("/api/voice-session", { method: "POST", body: JSON.stringify(planInput) }).catch(() => null);
      const data = res?.ok ? await res.json() : null;
      if (!data?.signedUrl) {
        setError("Couldn't start the voice call. Switch to text to keep going.");
        return;
      }
      startSession({
        signedUrl: data.signedUrl,
        overrides: { agent: { prompt: { prompt: data.prompt }, firstMessage: data.firstMessage } },
      });
    })();
  }, [planInput, startSession]);

  // Leaving this screen any other way (e.g. Reset demo) hangs up.
  useEffect(() => () => endSession(), [endSession]);

  // Drive the orb from the real audio level.
  useEffect(() => {
    let frame = 0;
    const tick = () => {
      setLevel(Math.min(1, (isSpeaking ? getOutputVolume() : getInputVolume()) * 2));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isSpeaking, getOutputVolume, getInputVolume]);

  const statusText =
    status === "connecting" ? "Connecting to Bee…" : status === "connected" ? (isSpeaking ? "Bee is talking" : "Listening…") : error ? "Not connected" : "Starting…";

  return (
    <CallLayout
      status={statusText}
      speaking={isSpeaking}
      level={level}
      lines={lines}
      muted={muted}
      onToggleMute={() => setMuted((m) => !m)}
      onEnd={() => {
        endSession();
        finish();
      }}
      onSwitchToText={() => {
        ended.current = true;
        endSession();
        onSwitchToText();
      }}
      error={error}
    />
  );
}

// ---------- Mock: recorded debrief ----------

export function MockCall({ onEnd, onSwitchToText }: CallProps) {
  const [count, setCount] = useState(0); // how many recorded lines have been "spoken"
  const [muted, setMuted] = useState(false);
  const [level, setLevel] = useState(0);
  const lines = demoTranscript.slice(0, count);
  const current = demoTranscript[count];
  const speaking = current?.role === "bee";

  // Pace each line like speech (~55ms per character), with a short pause between turns.
  useEffect(() => {
    if (!current) return;
    const t = setTimeout(() => setCount((c) => c + 1), 700 + current.text.length * 55);
    return () => clearTimeout(t);
  }, [count, current]);

  useEffect(() => {
    let frame = 0;
    const tick = (ms: number) => {
      setLevel(current ? 0.35 + 0.3 * Math.sin(ms / 90) * Math.sin(ms / 230) : 0);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [current]);

  const transcriptSoFar = current ? [...lines, current] : lines;
  return (
    <CallLayout
      badge="Recorded debrief · demo mode"
      status={current ? (speaking ? "Bee is talking" : "Maya is talking") : "Call complete"}
      speaking={speaking}
      level={level}
      lines={transcriptSoFar}
      muted={muted}
      onToggleMute={() => setMuted((m) => !m)}
      onEnd={() => onEnd(demoTranscript)}
      onSwitchToText={onSwitchToText}
    />
  );
}
