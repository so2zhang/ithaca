// Drive the core loop like Maya would, screenshotting every step. Usage:
//   node .claude/skills/verify/journey.mjs [baseUrl=http://127.0.0.1:3300] [voice|text]
// Evidence: evidence/verify/<timestamp>/ (screenshots + state.json = what the app saved in localStorage).
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium, devices } = require("playwright");

const base = process.argv[2] ?? "http://127.0.0.1:3300";
const path = process.argv[3] ?? "voice";
const out = `evidence/verify/${new Date().toISOString().replace(/[:.]/g, "-")}-${path}`;
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ ...devices["iPhone 13"], deviceScaleFactor: 2 });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const shot = (n) => page.screenshot({ path: `${out}/${n}.png` });
const step = (msg) => console.log(`- ${msg}`);

try {
  await page.goto(base);
  await page.getByRole("button", { name: "Reset demo" }).click();
  await page.getByRole("heading", { name: "This week's Plan" }).waitFor();
  step(`week 1: ${await page.getByTestId("plan-activity").innerText()}`);
  await shot("1-week1");
  await page.getByRole("button", { name: "Debrief with Bee" }).click();
  if (path === "text") {
    await page.getByRole("button", { name: "Switch to text" }).click();
    for (let i = 0; i < 3; i++) {
      await page.getByRole("button", { name: /^Suggested:/ }).click();
      await page.getByRole("button", { name: /^Suggested:/ }).waitFor();
    }
    await shot("2-text");
    await page.getByRole("button", { name: "Finish debrief" }).click();
  } else {
    await page.getByTestId("transcript").getByText("Ethan").first().waitFor({ timeout: 15000 });
    await shot("2-call");
    await page.getByRole("button", { name: "End" }).click();
  }
  await page.getByRole("heading", { name: "What Bee learned" }).waitFor({ timeout: 30000 });
  step(`learned: ${await page.getByTestId("summary").innerText()}`);
  await shot("3-learned");
  await page.getByRole("button", { name: "See next week's Plan" }).click();
  await page.getByRole("heading", { name: "Next week's Plan" }).waitFor();
  step(`week 2: ${await page.getByTestId("plan-activity").innerText()}`);
  step(`why: ${await page.getByTestId("why").locator("li").first().innerText()}`);
  await shot("4-week2");
  writeFileSync(`${out}/state.json`, await page.evaluate(() => localStorage.getItem("bee-loop-demo-v1") ?? "null"));
} catch (e) {
  await shot("failure");
  console.error(`FAILED: ${e.message}`);
  process.exitCode = 1;
} finally {
  if (errors.length) { console.error(`page errors: ${errors.join(" | ")}`); process.exitCode = 1; }
  console.log(`evidence: ${out}`);
  await browser.close();
}
