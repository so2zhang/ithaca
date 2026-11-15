// Builds the synthetic Austin user pool. Pure and seeded, so the output is reproducible:
// `npm run seed` writes it to src/data/users.json, and a test checks the file matches.
import type { DemoUser, Gender, Intent, Orientation, Slot, User, Weights } from "./types";

// mulberry32: tiny seeded random number generator (same seed → same sequence).
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NEIGHBORHOODS = ["East Austin", "South Congress", "Hyde Park", "Mueller", "Zilker", "Downtown", "Travis Heights", "North Loop", "Clarksville", "Holly"];
const INTERESTS = ["live music", "coffee", "tennis", "travel", "climbing", "trail running", "cooking", "film", "books", "startups", "yoga", "board games", "photography", "paddleboarding", "wine", "art galleries", "basketball", "podcasts", "ceramics", "hiking"];
const JOBS = ["UX designer", "nurse", "software engineer", "teacher", "data analyst", "chef", "physical therapist", "architect", "product manager", "grad student", "brewer", "marketing lead", "electrician", "photographer", "accountant", "barista & DJ"];
const SLOTS: Slot[] = ["thu-evening", "fri-evening", "sat-day", "sat-evening", "sun-day"];
const WOMEN = ["Ava", "Mia", "Zoe", "Lena", "Nora", "Isla", "Ruby", "Tess", "Maren", "Jade", "Elena", "Kira", "Lucia", "Naomi", "Sadie", "Willa", "Anika", "Rosa", "Imani", "Freya", "June", "Celeste", "Margo", "Leah", "Vera", "Alma", "Daphne", "Iris", "Talia", "Greta"];
const MEN = ["Noah", "Caleb", "Owen", "Mateo", "Eli", "Theo", "Rafael", "Gabe", "Isaac", "Malik", "Ben", "Luca", "Dev", "Simon", "Andre", "Felix", "Wes", "Tyler", "Omar", "Nate", "Cole", "Sam", "Hugo", "Jonah", "Kai", "Marco", "Pablo", "Reid", "Victor"];
const NONBINARY = ["River", "Sky", "Rowan", "Quinn", "Ash", "Emery", "Sage", "Remy", "Ari"];

const weights = (career: number, outdoors: number, creative: number, nightlife: number, bookish: number): Weights => ({ career, outdoors, creative, nightlife, bookish });

// Maya's stated preferences say "ambitious, finance-type, big nights out".
// Her debrief will reveal she actually clicks with outdoorsy, creative people.
export const MAYA: DemoUser = {
  id: "maya",
  name: "Maya",
  age: 27,
  gender: "woman",
  orientation: "straight",
  intent: "serious",
  neighborhood: "East Austin",
  job: "Product marketing manager",
  interests: ["live music", "coffee", "tennis", "travel"],
  traits: weights(0.8, 0.4, 0.6, 0.6, 0.5),
  availability: ["thu-evening", "sat-day", "sat-evening"],
  chapter: "Moved to Austin for a startup job, stayed for the breakfast tacos. Looking for someone ambitious who keeps up with me.",
  ageRange: [26, 34],
  statedWeights: weights(0.9, 0.2, 0.4, 0.6, 0.5),
};

// Hand-written characters the demo story depends on.
const STORY: User[] = [
  { id: "ethan", name: "Ethan", age: 29, gender: "man", orientation: "straight", intent: "serious", neighborhood: "Downtown", job: "Investment banker", interests: ["travel", "tennis", "wine"], traits: weights(0.95, 0.1, 0.2, 0.9, 0.4), availability: ["thu-evening", "fri-evening", "sat-evening"], chapter: "Chapter 1: Wall Street. Chapter 2: Austin, still in a quarter-zip. Chapter 3: hopefully you." },
  { id: "marcus", name: "Marcus", age: 31, gender: "man", orientation: "straight", intent: "open", neighborhood: "South Congress", job: "Fintech founder", interests: ["startups", "coffee", "travel"], traits: weights(0.9, 0.2, 0.3, 0.75, 0.6), availability: ["thu-evening", "sat-day", "sat-evening"], chapter: "Building my second company. Will ask about your five-year plan, but in a fun way." },
  { id: "jordan", name: "Jordan", age: 30, gender: "man", orientation: "straight", intent: "serious", neighborhood: "East Austin", job: "Sound engineer, plays bass in a band", interests: ["live music", "coffee", "hiking"], traits: weights(0.5, 0.9, 0.95, 0.5, 0.4), availability: ["thu-evening", "sat-day", "sat-evening"], chapter: "Mixes records by day, plays bass in a soul band by night. Sunrise on the Greenbelt is my reset button." },
  { id: "priya", name: "Priya", age: 28, gender: "woman", orientation: "straight", intent: "serious", neighborhood: "Mueller", job: "Strategy consultant", interests: ["coffee", "tennis", "books"], traits: weights(0.85, 0.5, 0.4, 0.6, 0.6), availability: ["thu-evening", "sat-day", "sat-evening"], chapter: "Consultant who reads three books at once. Looking for a tennis partner and, eventually, a person." },
  { id: "claire", name: "Claire", age: 30, gender: "woman", orientation: "straight", intent: "serious", neighborhood: "Clarksville", job: "Corporate lawyer", interests: ["travel", "wine", "yoga"], traits: weights(0.9, 0.2, 0.2, 0.7, 0.5), availability: ["thu-evening", "sat-evening"], chapter: "Lawyer, wine-list over-thinker, planning a trip to Lisbon I will absolutely over-plan." },
  { id: "leo", name: "Leo", age: 29, gender: "man", orientation: "straight", intent: "serious", neighborhood: "Holly", job: "Climbing-gym route setter & guitarist", interests: ["live music", "climbing", "coffee"], traits: weights(0.45, 0.95, 0.85, 0.35, 0.5), availability: ["sat-day", "sat-evening", "sun-day"], chapter: "Sets routes at a climbing gym, writes songs badly on purpose. Will drag you to a barbecue line at 9am." },
  { id: "diego", name: "Diego", age: 31, gender: "man", orientation: "bi", intent: "serious", neighborhood: "Travis Heights", job: "Landscape photographer", interests: ["photography", "hiking", "travel"], traits: weights(0.4, 0.9, 0.8, 0.25, 0.6), availability: ["sat-day", "sat-evening", "sun-day"], chapter: "Former park ranger, now photographing Texas Hill Country. Ask me about the best swimming holes." },
  { id: "hana", name: "Hana", age: 27, gender: "woman", orientation: "bi", intent: "open", neighborhood: "North Loop", job: "Ceramicist & trail runner", interests: ["trail running", "ceramics", "coffee"], traits: weights(0.5, 0.9, 0.7, 0.3, 0.6), availability: ["sat-day", "sun-day", "thu-evening"], chapter: "Throws pots, runs trails, makes too much sourdough. New to Austin and collecting friends." },
];

export function generatePool(seed = 2026, count = 53): User[] {
  const rand = rng(seed);
  const pick = <T,>(xs: readonly T[]) => xs[Math.floor(rand() * xs.length)];
  const pickSome = <T,>(xs: readonly T[], n: number) => {
    const copy = [...xs];
    const out: T[] = [];
    while (out.length < n) out.push(copy.splice(Math.floor(rand() * copy.length), 1)[0]);
    return out;
  };
  // Background users get middling trait scores (0.05–0.6) so the story characters stand out.
  const trait = () => Math.round((0.05 + rand() * 0.55) * 100) / 100;
  const used = new Set<string>();

  const users: User[] = [];
  for (let i = 0; i < count; i++) {
    const r = rand();
    const gender: Gender = r < 0.45 ? "woman" : r < 0.9 ? "man" : "nonbinary";
    const names = gender === "woman" ? WOMEN : gender === "man" ? MEN : NONBINARY;
    let name = pick(names);
    while (used.has(name)) name = pick(names);
    used.add(name);
    const o = rand();
    const orientation: Orientation = o < 0.7 ? "straight" : o < 0.85 ? "gay" : "bi";
    const intent: Intent = pick(["serious", "serious", "open", "open", "casual", "friends-only"] as const);
    const interests = pickSome(INTERESTS, 3);
    const job = pick(JOBS);
    users.push({
      id: `u${String(i + 1).padStart(2, "0")}`,
      name,
      age: 22 + Math.floor(rand() * 14),
      gender,
      orientation,
      intent,
      neighborhood: pick(NEIGHBORHOODS),
      job,
      interests,
      traits: weights(trait(), trait(), trait(), trait(), trait()),
      availability: pickSome(SLOTS, 2 + Math.floor(rand() * 3)),
      chapter: `${job[0].toUpperCase()}${job.slice(1)} by day. Weekends are for ${interests[0]} and ${interests[1]}. Currently obsessed with ${interests[2]}.`,
    });
  }
  return [...STORY, ...users];
}

export function buildSeedFile() {
  return { maya: MAYA, pool: generatePool() };
}
