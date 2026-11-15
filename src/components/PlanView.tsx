import type { Plan } from "@/lib/types";
import { SLOT_LABELS } from "@/lib/venues";
import { Avatar, PrimaryButton } from "./ui";

export function PlanView({
  plan,
  week,
  previousMemberIds,
  onDebrief,
}: {
  plan: Plan;
  week: number;
  previousMemberIds: string[];
  onDebrief: () => void;
}) {
  // The headline "why": what Bee learned (week 2+) or her stated preference (week 1).
  const headline = plan.reasons.filter((r) => r.kind === "learned" || r.kind === "preference" || r.kind === "returning");
  const details = plan.reasons.filter((r) => r.kind === "balance" || r.kind === "intent");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">
        <div className="mt-2 flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">{week === 1 ? "This week's Plan" : "Next week's Plan"}</h1>
          <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-semibold text-honey">Week {week}</span>
        </div>
        <p className="mt-1 text-sm text-muted">Hey Maya, Bee put together a group for you.</p>

        <section className="mt-4 rounded-3xl bg-honey p-5" data-testid="plan-card">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink/60">{SLOT_LABELS[plan.slot]}</p>
          <h2 className="mt-1 text-xl leading-snug font-bold" data-testid="plan-activity">
            {plan.venue.activity}
          </h2>
          <p className="mt-1 text-sm text-ink/70">{plan.venue.area} · {plan.members.length + 1} people</p>
        </section>

        <section className="mt-4 rounded-2xl border-2 border-ink bg-white p-4" data-testid="why">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Why this group</p>
          <ul className="mt-2 space-y-2">
            {headline.map((r) => (
              <li key={r.text} className="text-[15px] leading-snug font-medium">
                {r.text}
              </li>
            ))}
          </ul>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {details.map((r) => (
              <li key={r.text} className="rounded-full bg-honey-soft px-2.5 py-1 text-xs text-ink/80">
                {r.text}
              </li>
            ))}
          </ul>
        </section>

        <h3 className="mt-5 text-sm font-semibold">Who&apos;s going</h3>
        <ul className="mt-2 space-y-2" data-testid="members">
          {plan.members.map((m) => {
            const isBack = previousMemberIds.includes(m.id);
            const isNew = previousMemberIds.length > 0 && !isBack;
            return (
              <li key={m.id} className="flex gap-3 rounded-2xl bg-white p-3">
                <Avatar user={m} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {m.name}, {m.age}
                    {isBack && <span className="ml-2 rounded-full bg-ink px-2 py-0.5 text-[10px] font-semibold text-honey">Back</span>}
                    {isNew && <span className="ml-2 rounded-full bg-honey px-2 py-0.5 text-[10px] font-semibold">New</span>}
                  </p>
                  <p className="text-xs text-muted">{m.job}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-ink/80">{m.chapter}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="border-t border-ink/10 px-5 pt-3 pb-2">
        <p className="mb-2 text-center text-xs text-muted">After the hangout</p>
        <PrimaryButton onClick={onDebrief}>Debrief with Bee</PrimaryButton>
      </div>
    </div>
  );
}
