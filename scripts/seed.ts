// Regenerates the synthetic user pool: `npm run seed`. Output is deterministic (seeded).
import { writeFileSync } from "node:fs";
import { buildSeedFile } from "../src/lib/seed";

writeFileSync("src/data/users.json", JSON.stringify(buildSeedFile(), null, 2) + "\n");
console.log("Wrote src/data/users.json");
