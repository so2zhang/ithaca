"use client";
// Text fallback: the same debrief as a chat. Backup for when voice fails live.
import { useEffect, useRef, useState } from "react";
import { demoTranscript } from "@/lib/data";
import type { TranscriptLine } from "@/lib/types";
import { PrimaryButton } from "./ui";

export function TextDebrief({
  planInput,
  mock,
  onFinish,
}: {
  planInput: object;
  mock: boolean;
  onFinish: (t: TranscriptLine[]) => void;
}) {
  const [lines, setLines] = useState<TranscriptLine[]>([]);
  const [draft, setDraft] = useState("");
  const [waiting, setWaiting] = useState(true);
  const [error, setError] = useState<string>();
  const opened = useRef(false);
  const bottom = useRef<HTMLDivElement>(null);

  async function askBee(transcript: TranscriptLine[]) {
    setWaiting(true);
    setError(undefined);
    const res = await fetch("/api/chat", { method: "POST", body: JSON.stringify({ ...planInput, transcript }) }).catch(() => null);
    const data = res?.ok ? await res.json() : null;
    setWaiting(false);
    if (typeof data?.reply !== "string") {
      setError("Bee couldn't reply. Try again, or tap Finish to use what you've said so far.");
      return;
    }
    setLines([...transcript, { role: "bee", text: data.reply }]);
  }

  useEffect(() => {
    if (opened.current) return;
    opened.current = true;
    void askBee([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open the chat exactly once
  }, []);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines.length, waiting]);

  const send = (text: string) => {
    if (!text.trim() || waiting) return;
    const next: TranscriptLine[] = [...lines, { role: "user", text: text.trim() }];
    setLines(next);
    setDraft("");
    void askBee(next);
  };

  // In demo mode, offer Maya's recorded reply for this turn as a one-tap suggestion.
  const userTurns = lines.filter((l) => l.role === "user").length;
  const suggestion = mock ? demoTranscript.filter((l) => l.role === "user")[userTurns]?.text : undefined;
  const canFinish = userTurns >= 1 && !waiting;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between px-5 pb-2">
        <h1 className="text-lg font-bold">Debrief with Bee</h1>
        <span className="text-xs text-muted">Text mode</span>
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-5" data-testid="chat">
        {lines.map((l, i) => (
          <p
            key={i}
            className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-[14px] leading-snug ${
              l.role === "bee" ? "bg-honey" : "ml-auto bg-ink text-cream"
            }`}
          >
            {l.text}
          </p>
        ))}
        {waiting && <p className="w-14 rounded-2xl bg-honey/60 px-3.5 py-2 text-sm">…</p>}
        {error && (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
        <div ref={bottom} />
      </div>
      <div className="space-y-2 border-t border-ink/10 px-5 pt-3 pb-2">
        {suggestion && !waiting && (
          <button onClick={() => send(suggestion)} className="w-full rounded-2xl border border-ink/20 bg-white px-3 py-2 text-left text-xs text-ink/80">
            <span className="font-semibold">Suggested: </span>
            {suggestion}
          </button>
        )}
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send(draft);
          }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Message Bee"
            aria-label="Message Bee"
            className="min-w-0 flex-1 rounded-full border border-ink/20 bg-white px-4 py-2.5 text-sm outline-none focus:border-ink"
          />
          <button type="submit" disabled={waiting || !draft.trim()} className="rounded-full bg-ink px-4 text-sm font-semibold text-honey disabled:opacity-40">
            Send
          </button>
        </form>
        <PrimaryButton onClick={() => onFinish(lines)} disabled={!canFinish}>
          Finish debrief
        </PrimaryButton>
      </div>
    </div>
  );
}
