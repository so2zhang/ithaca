"use client";
// The whole demo loop: Plan → debrief (voice or text) → Bee extracts updates → next Plan.
import { useEffect, useMemo, useRef, useState } from "react";
import { demoExtraction, maya, pool } from "@/lib/data";
import { INITIAL_STATE, loadState, saveState, type DemoState } from "@/lib/demo-state";
import { ExtractionSchema, type Extraction } from "@/lib/extraction-schema";
import { getGroup } from "@/lib/matcher";
import { applyExtraction } from "@/lib/profile";
import type { OutcomeSignal, TranscriptLine } from "@/lib/types";
import { LiveCall, MockCall } from "./CallScreen";
import { LearnedView } from "./LearnedView";
import { PlanView } from "./PlanView";
import { TextDebrief } from "./TextDebrief";
import { Orb, PhoneFrame, PrimaryButton, SecondaryButton } from "./ui";

type Screen = "plan" | "voice" | "text" | "thinking" | "learned" | "error";

export function BeeLoopApp({ mode }: { mode: "mock" | "live" }) {
  const [state, setState] = useState<DemoState>(INITIAL_STATE);
  const [screen, setScreen] = useState<Screen>("plan");
  const [lastTranscript, setLastTranscript] = useState<TranscriptLine[]>([]);
  const [loaded, setLoaded] = useState(false);
  const request = useRef(0); // bumped by each extraction and by Reset, so stale answers are dropped

  // Restore saved progress after the first render (localStorage only exists in the browser).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from browser storage
    setState(loadState());
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) saveState(state);
  }, [state, loaded]);

  const planInput = useMemo(() => ({ weights: state.weights, signals: state.signals }), [state.weights, state.signals]);
  const plan = useMemo(() => getGroup(maya, state.weights, state.signals, pool), [state.weights, state.signals]);

  // Fold what Bee learned into the profile, then move to next week.
  function learn(extraction: Extraction) {
    const result = applyExtraction(state.weights, extraction, plan.members);
    // Newer signals about a person replace older ones; everything else is kept (e.g. a "not again").
    const signals: OutcomeSignal[] = [...state.signals.filter((s) => !result.signals.some((n) => n.personId === s.personId)), ...result.signals];
    setState({
      week: state.week + 1,
      weights: result.weights,
      signals,
      previousMemberIds: plan.members.map((m) => m.id),
      learned: { summary: extraction.summary, people: result.signals, changes: result.changes, weightsBefore: state.weights },
    });
    setScreen("learned");
  }

  async function extract(transcript: TranscriptLine[]) {
    const id = ++request.current;
    setLastTranscript(transcript);
    setScreen("thinking");
    const res = await fetch("/api/extract", { method: "POST", body: JSON.stringify({ ...planInput, transcript }) }).catch(() => null);
    const data = res?.ok ? await res.json().catch(() => null) : null;
    if (id !== request.current) return; // the user reset (or retried) meanwhile
    const parsed = ExtractionSchema.safeParse(data?.extraction);
    if (parsed.success) learn(parsed.data);
    else setScreen("error");
  }

  function reset() {
    request.current++;
    setState(INITIAL_STATE);
    setScreen("plan");
  }

  return (
    <PhoneFrame onReset={reset}>
      {screen === "plan" && <PlanView plan={plan} week={state.week} previousMemberIds={state.previousMemberIds} onDebrief={() => setScreen("voice")} />}

      {screen === "voice" &&
        (mode === "mock" ? (
          <MockCall planInput={planInput} onEnd={extract} onSwitchToText={() => setScreen("text")} />
        ) : (
          <LiveCall planInput={planInput} onEnd={extract} onSwitchToText={() => setScreen("text")} />
        ))}

      {screen === "text" && <TextDebrief planInput={planInput} mock={mode === "mock"} onFinish={extract} />}

      {screen === "thinking" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-8 text-center">
          <Orb level={0.3} speaking={false} size={110} />
          <p className="font-semibold">Bee is thinking about what you said…</p>
          <p className="text-sm text-muted">Turning the debrief into updates for next week.</p>
        </div>
      )}

      {screen === "error" && (
        <div className="flex flex-1 flex-col justify-center gap-3 px-6 text-center" role="alert">
          <p className="text-lg font-semibold">Bee couldn&apos;t process that debrief.</p>
          <p className="text-sm text-muted">Usually a network or API hiccup. Nothing was changed.</p>
          <PrimaryButton onClick={() => extract(lastTranscript)}>Try again</PrimaryButton>
          <SecondaryButton onClick={() => learn(demoExtraction)}>Use recorded debrief</SecondaryButton>
        </div>
      )}

      {screen === "learned" && state.learned && <LearnedView learned={state.learned} weightsAfter={state.weights} onNext={() => setScreen("plan")} />}
    </PhoneFrame>
  );
}
