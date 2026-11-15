// STAND-IN for Bumble's existing Plans matcher. Deliberately simple: filters + a weighted score.
// Bee Loop's pitch is the learning layer that feeds it (preference weights + outcome signals),
// so any real matcher with this interface could be dropped in.
import { ATTRIBUTES, ATTRIBUTE_ADJECTIVES } from "./types";
import type { Attribute, DemoUser, Gender, Intent, OutcomeSignal, Plan, Reason, Slot, User, Weights } from "./types";
import { SLOT_LABELS, VENUES } from "./venues";

const ROMANTIC_SLOTS = 3;
const FRIEND_SLOTS = 2;

// Which intents can share a Plan with a given intent.
const COMPATIBLE: Record<Intent, Intent[]> = {
  serious: ["serious", "open"],
  open: ["serious", "open", "casual"],
  casual: ["open", "casual"],
  "friends-only": ["friends-only"],
};

const seeks = (u: User): Gender[] =>
  u.orientation === "bi" ? ["woman", "man", "nonbinary"] : u.orientation === "gay" ? [u.gender] : [u.gender === "woman" ? "man" : "woman"];

const mutualInterest = (a: User, b: User) => seeks(a).includes(b.gender) && seeks(b).includes(a.gender);

// 1 = identical trait profile, 0 = opposite.
const similarity = (a: Weights, b: Weights) =>
  1 - ATTRIBUTES.reduce((sum, k) => sum + Math.abs(a[k] - b[k]), 0) / ATTRIBUTES.length;

function averageTraits(people: User[]): Weights {
  const avg = Object.fromEntries(ATTRIBUTES.map((k) => [k, 0])) as Weights;
  for (const p of people) for (const k of ATTRIBUTES) avg[k] += p.traits[k] / people.length;
  return avg;
}

/**
 * Score one candidate for the user. Higher is a better fit.
 *   preference fit: Σ weight[attribute] × candidate.trait[attribute]
 *   + 0.15 per shared interest (max 2), + 0.1 for the same neighborhood
 *   + 0.8 × similarity to people she had real chemistry with (from the debrief)
 */
export function scoreCandidate(user: User, c: User, weights: Weights, likedProfile: Weights | null): number {
  const fit = ATTRIBUTES.reduce((sum, k) => sum + weights[k] * c.traits[k], 0);
  const shared = Math.min(2, c.interests.filter((i) => user.interests.includes(i)).length);
  const sameHood = c.neighborhood === user.neighborhood ? 0.1 : 0;
  const learned = likedProfile ? 0.8 * similarity(c.traits, likedProfile) : 0;
  return fit + 0.15 * shared + sameHood + learned;
}

// A group is balanced if no gender is more than 60% of it (avoids the 80/20 party problem).
export function isBalanced(people: User[]): boolean {
  const counts = new Map<Gender, number>();
  for (const p of people) counts.set(p.gender, (counts.get(p.gender) ?? 0) + 1);
  return Math.max(...counts.values()) / people.length <= 0.6;
}

// The attribute where this group stands out most versus the whole pool.
function groupLean(members: User[], pool: User[]): Attribute[] {
  const g = averageTraits(members);
  const p = averageTraits(pool);
  return [...ATTRIBUTES].sort((a, b) => g[b] - p[b] - (g[a] - p[a])).slice(0, 2);
}

export function getGroup(user: DemoUser, weights: Weights, outcomeSignals: OutcomeSignal[], pool: User[]): Plan {
  const byId = new Map(pool.map((u) => [u.id, u]));
  const signals = outcomeSignals.filter((s) => byId.has(s.personId)); // ignore unknown people
  const excluded = new Set(signals.filter((s) => s.wantsToSeeAgain === "no").map((s) => s.personId));
  const returning = signals.filter((s) => s.wantsToSeeAgain === "yes").map((s) => byId.get(s.personId)!);
  const liked = signals.filter((s) => s.chemistry >= 4 && s.vibe === "romantic").map((s) => byId.get(s.personId)!);
  const likedProfile = liked.length ? averageTraits(liked) : null;

  // Hard filters: age range, intent, availability overlap, not someone she said no to.
  const eligible = pool.filter(
    (c) =>
      c.id !== user.id &&
      !excluded.has(c.id) &&
      c.age >= user.ageRange[0] &&
      c.age <= user.ageRange[1] &&
      c.availability.some((s) => user.availability.includes(s)),
  );
  const romanticPool = eligible.filter((c) => mutualInterest(user, c) && COMPATIBLE[user.intent].includes(c.intent));
  // Friend slots: same gender as the user, intent-aligned or explicitly here for friends.
  const friendPool = eligible.filter(
    (c) => c.gender === user.gender && !mutualInterest(user, c) && (COMPATIBLE[user.intent].includes(c.intent) || c.intent === "friends-only"),
  );

  const ranked = (list: User[]) =>
    [...list].sort((a, b) => scoreCandidate(user, b, weights, likedProfile) - scoreCandidate(user, a, weights, likedProfile));
  // People she asked to see again keep their seat; the rest are filled by score.
  const fill = (list: User[], n: number) => {
    const back = returning.filter((r) => list.some((c) => c.id === r.id)).slice(0, n);
    const rest = ranked(list).filter((c) => !back.some((b) => b.id === c.id));
    return [...back, ...rest].slice(0, n);
  };
  const members = [...fill(romanticPool, ROMANTIC_SLOTS), ...fill(friendPool, FRIEND_SLOTS)];

  // Venue: the one whose vibe best matches her current weights.
  const venueScore = (v: (typeof VENUES)[number]) => ATTRIBUTES.reduce((sum, k) => sum + weights[k] * (v.vibe[k] ?? 0), 0);
  const venue = [...VENUES].filter((v) => v.slots.some((s) => user.availability.includes(s))).sort((a, b) => venueScore(b) - venueScore(a))[0];
  // Time: the venue slot she's free for that the most members can make.
  const slot = venue.slots
    .filter((s) => user.availability.includes(s))
    .sort((a, b) => members.filter((m) => m.availability.includes(b)).length - members.filter((m) => m.availability.includes(a)).length)[0] as Slot;

  const everyone = [user, ...members];
  const women = everyone.filter((p) => p.gender === "woman").length;
  const lean = groupLean(members, pool).map((k) => ATTRIBUTE_ADJECTIVES[k]);

  // Reasons are templates filled from real inputs only. The LLM never writes these.
  const reasons: Reason[] = [];
  const topLiked = signals.filter((s) => s.vibe === "romantic").sort((a, b) => b.chemistry - a.chemistry)[0];
  if (topLiked && topLiked.chemistry >= 4) {
    reasons.push({ kind: "learned", text: `Last week you clicked with ${topLiked.name} ("${topLiked.evidence}"), so this group leans ${lean.join(" & ")}.` });
  } else {
    const top = [...ATTRIBUTES].sort((a, b) => weights[b] - weights[a])[0];
    reasons.push({ kind: "preference", text: `Leans ${ATTRIBUTE_ADJECTIVES[top]}, because your profile says that's what you're looking for.` });
  }
  const back = returning.filter((r) => members.some((m) => m.id === r.id)).map((r) => r.name);
  if (back.length) {
    reasons.push({ kind: "returning", text: `${back.join(" and ")} ${back.length > 1 ? "are" : "is"} back: you said you'd want to see them again.` });
  }
  if (isBalanced(everyone)) {
    reasons.push({ kind: "balance", text: `${women} women, ${everyone.length - women} men, so nobody's outnumbered.` });
  }
  const intents = [...new Set(members.map((m) => m.intent))];
  reasons.push({ kind: "intent", text: `Intent-aligned: everyone is ${intents.join(" or ")}, which fits your "${user.intent}".` });

  return {
    members,
    venue,
    slot,
    description: `${venue.activity}. ${everyone.length} people, ${SLOT_LABELS[slot]}.`,
    reasons,
  };
}
