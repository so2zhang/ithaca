// Single place the app gets its data from. The pool is generated from the seeded script
// (same output as src/data/users.json); the demo fixtures are validated on load.
import { z } from "zod";
import transcriptJson from "../../fixtures/demo/transcript.json";
import extractionJson from "../../fixtures/demo/extraction.json";
import { ExtractionSchema } from "./extraction-schema";
import { MAYA, generatePool } from "./seed";

export const maya = MAYA;
export const pool = generatePool();

export const TranscriptSchema = z.array(z.object({ role: z.enum(["bee", "user"]), text: z.string() }));
export const demoTranscript = TranscriptSchema.parse(transcriptJson);
export const demoExtraction = ExtractionSchema.parse(extractionJson);
