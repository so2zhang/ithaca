import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildSeedFile } from "@/lib/seed";

describe("S2 seed data", () => {
  it("is reproducible and matches the committed src/data/users.json", () => {
    const a = JSON.stringify(buildSeedFile(), null, 2) + "\n";
    const b = JSON.stringify(buildSeedFile(), null, 2) + "\n";
    expect(a).toBe(b);
    expect(readFileSync("src/data/users.json", "utf8")).toBe(a);
  });

  it("has ~60 users aged 22–35 with every field filled in", () => {
    const { pool } = buildSeedFile();
    expect(pool.length).toBeGreaterThanOrEqual(55);
    expect(pool.length).toBeLessThanOrEqual(65);
    expect(new Set(pool.map((u) => u.id)).size).toBe(pool.length);
    for (const u of pool) {
      expect(u.age).toBeGreaterThanOrEqual(22);
      expect(u.age).toBeLessThanOrEqual(35);
      expect(u.name && u.neighborhood && u.job && u.chapter).toBeTruthy();
      expect(u.interests.length).toBeGreaterThan(0);
      expect(u.availability.length).toBeGreaterThan(0);
    }
  });
});
