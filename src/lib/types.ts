// The preference attributes Bee can learn about. Every user has a 0–1 score on each,
// and Maya's profile has a 0–1 weight on each (how much she cares about it).
export const ATTRIBUTES = ["career", "outdoors", "creative", "nightlife", "bookish"] as const;
export type Attribute = (typeof ATTRIBUTES)[number];

export const ATTRIBUTE_LABELS: Record<Attribute, string> = {
  career: "Career-driven",
  outdoors: "Outdoorsy",
  creative: "Creative / musical",
  nightlife: "Big nights out",
  bookish: "Bookish",
};

// Short forms for sentences ("this group leans outdoorsy & creative").
export const ATTRIBUTE_ADJECTIVES: Record<Attribute, string> = {
  career: "career-driven",
  outdoors: "outdoorsy",
  creative: "creative",
  nightlife: "going-out",
  bookish: "bookish",
};

export type Weights = Record<Attribute, number>;

export type Gender = "woman" | "man" | "nonbinary";
export type Orientation = "straight" | "gay" | "bi";
export type Intent = "serious" | "open" | "casual" | "friends-only";
export type Slot = "thu-evening" | "fri-evening" | "sat-day" | "sat-evening" | "sun-day";

export type User = {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  orientation: Orientation;
  intent: Intent;
  neighborhood: string;
  job: string;
  interests: string[];
  traits: Weights; // 0–1 score per attribute
  availability: Slot[];
  chapter: string; // short story-style bio
};

export type DemoUser = User & {
  ageRange: [number, number];
  statedWeights: Weights;
};

// What the debrief says about one person from the hangout.
export type OutcomeSignal = {
  personId: string;
  name: string;
  chemistry: number; // 1–5
  wantsToSeeAgain: "yes" | "no" | "maybe";
  vibe: "romantic" | "friend" | "neither";
  evidence: string;
};

export type Reason = {
  kind: "balance" | "intent" | "preference" | "learned" | "returning";
  text: string;
};

export type Venue = { name: string; area: string; activity: string; vibe: Partial<Weights> };

export type Plan = {
  members: User[]; // not including the user herself
  venue: Venue;
  slot: Slot;
  description: string;
  reasons: Reason[];
};

export type TranscriptLine = { role: "bee" | "user"; text: string };
