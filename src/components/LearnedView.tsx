import type { DemoState } from "@/lib/demo-state";
import { ATTRIBUTES, ATTRIBUTE_LABELS, type Weights } from "@/lib/types";
import { PrimaryButton } from "./ui";

type Learned = NonNullable<DemoState["learned"]>;

const VIBE_LABEL = { romantic: "Romantic spark", friend: "Friend vibes", neither: "No spark" } as const;
const AGAIN_LABEL = { yes: "Wants to see again", maybe: "Maybe", no: "Not again" } as const;

function Bar({ value, tone }: { value: number; tone: "before" | "after" }) {
  return (
    <div className="h-2 flex-1 rounded-full bg-ink/10">
      <div className={`h-2 rounded-full ${tone === "before" ? "bg-ink/30" : "bg-ink"}`} style={{ width: `${value * 100}%` }} />
    </div>
  );
}

export function LearnedView({ learned, weightsAfter, onNext }: { learned: Learned; weightsAfter: Weights; onNext: () => void }) {
  const gaps = learned.changes.filter((c) => c.statedVsRevealed);
  const changed = new Set(learned.changes.map((c) => c.attribute));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">
        <h1 className="mt-2 text-2xl font-bold tracking-tight">What Bee learned</h1>
        <p className="mt-2 text-[15px] leading-snug" data-testid="summary">
          {learned.summary}
        </p>

        {gaps.length > 0 && (
          <section className="mt-4 rounded-3xl bg-ink p-4 text-cream" data-testid="stated-vs-revealed">
            <p className="text-xs font-semibold uppercase tracking-wider text-honey">Stated vs. revealed</p>
            <ul className="mt-2 space-y-3">
              {gaps.map((c) => (
                <li key={c.attribute}>
                  <p className="text-sm font-semibold">
                    {ATTRIBUTE_LABELS[c.attribute]}: you said {c.before >= 0.6 ? "it matters a lot" : c.before <= 0.4 ? "it doesn't matter much" : "it matters some"}, but
                    the debrief showed {c.after > c.before ? "more" : "less"} interest.
                  </p>
                  <p className="mt-1 text-sm text-cream/75 italic">&ldquo;{c.evidence}&rdquo;</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-4 rounded-2xl bg-white p-4" data-testid="before-after">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Your preferences</p>
            <p className="flex items-center gap-3 text-[10px] text-muted">
              <span className="flex items-center gap-1">
                <span className="h-2 w-3 rounded-full bg-ink/30" /> before
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-3 rounded-full bg-ink" /> after
              </span>
            </p>
          </div>
          <ul className="mt-3 space-y-3">
            {ATTRIBUTES.map((a) => {
              const change = learned.changes.find((c) => c.attribute === a);
              return (
                <li key={a} className={changed.has(a) ? "" : "opacity-50"}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{ATTRIBUTE_LABELS[a]}</span>
                    {change && (
                      <span className="text-xs font-semibold">
                        {change.after > change.before ? "▲" : "▼"} {Math.round(change.before * 100)} → {Math.round(change.after * 100)}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 space-y-1">
                    <Bar value={learned.weightsBefore[a]} tone="before" />
                    <Bar value={weightsAfter[a]} tone="after" />
                  </div>
                  {change && !change.statedVsRevealed && <p className="mt-1 text-xs text-muted italic">&ldquo;{change.evidence}&rdquo;</p>}
                </li>
              );
            })}
          </ul>
        </section>

        <section className="mt-4" data-testid="people">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">The group</p>
          <ul className="mt-2 space-y-2">
            {learned.people.map((p) => (
              <li key={p.personId} className="rounded-2xl bg-white p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{p.name}</span>
                  <span aria-label={`Chemistry ${p.chemistry} of 5`} className="text-sm tracking-widest">
                    {"●".repeat(p.chemistry)}
                    <span className="text-ink/20">{"●".repeat(5 - p.chemistry)}</span>
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-1.5 text-[11px]">
                  <span className={`rounded-full px-2 py-0.5 ${p.vibe === "romantic" ? "bg-honey" : "bg-ink/5"}`}>{VIBE_LABEL[p.vibe]}</span>
                  <span className="rounded-full bg-ink/5 px-2 py-0.5">{AGAIN_LABEL[p.wantsToSeeAgain]}</span>
                </div>
                <p className="mt-1.5 text-xs text-ink/70 italic">&ldquo;{p.evidence}&rdquo;</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <div className="border-t border-ink/10 px-5 pt-3 pb-2">
        <PrimaryButton onClick={onNext}>See next week&apos;s Plan</PrimaryButton>
      </div>
    </div>
  );
}
