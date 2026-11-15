// Request bodies the browser sends to our API routes, validated on arrival.
import { z } from "zod";
import { TranscriptSchema } from "./data";

const weight = z.number().min(0).max(1);
export const WeightsSchema = z.object({ career: weight, outdoors: weight, creative: weight, nightlife: weight, bookish: weight });

export const SignalSchema = z.object({
  personId: z.string(),
  name: z.string(),
  chemistry: z.number().int().min(1).max(5),
  wantsToSeeAgain: z.enum(["yes", "no", "maybe"]),
  vibe: z.enum(["romantic", "friend", "neither"]),
  evidence: z.string(),
});

// What produced the Plan being debriefed. The server rebuilds the Plan from this
// instead of trusting member details sent by the browser.
export const PlanInputSchema = z.object({ weights: WeightsSchema, signals: z.array(SignalSchema).max(20) });

export const ExtractRequestSchema = PlanInputSchema.extend({ transcript: TranscriptSchema.min(1).max(80) });
export const ChatRequestSchema = PlanInputSchema.extend({ transcript: TranscriptSchema.max(40) });
