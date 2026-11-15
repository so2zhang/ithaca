// The demo's state, saved in the browser so a refresh mid-demo doesn't lose progress.
// "Reset demo" goes back to INITIAL_STATE.
import { z } from "zod";
import { SignalSchema, WeightsSchema } from "./api-schema";
import { maya } from "./data";
import { ATTRIBUTES } from "./types";

const ChangeSchema = z.object({
  attribute: z.enum(ATTRIBUTES),
  before: z.number(),
  after: z.number(),
  evidence: z.string(),
  statedVsRevealed: z.boolean(),
});

export const DemoStateSchema = z.object({
  week: z.number().int().min(1),
  weights: WeightsSchema, // inputs that produce this week's Plan
  signals: z.array(SignalSchema),
  previousMemberIds: z.array(z.string()), // last week's group, to badge "New" / "Back"
  learned: z
    .object({
      summary: z.string(),
      people: z.array(SignalSchema),
      changes: z.array(ChangeSchema),
      weightsBefore: WeightsSchema,
    })
    .nullable(),
});
export type DemoState = z.infer<typeof DemoStateSchema>;

export const INITIAL_STATE: DemoState = {
  week: 1,
  weights: maya.statedWeights,
  signals: [],
  previousMemberIds: [],
  learned: null,
};

const KEY = "bee-loop-demo-v1";

export function loadState(): DemoState {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = DemoStateSchema.safeParse(raw ? JSON.parse(raw) : null);
    return parsed.success ? parsed.data : INITIAL_STATE;
  } catch {
    return INITIAL_STATE;
  }
}

export function saveState(state: DemoState) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Private mode / storage blocked: the demo still works, it just won't survive a refresh.
  }
}
