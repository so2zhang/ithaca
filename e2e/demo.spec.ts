import { expect, test, type Page } from "@playwright/test";

const MOCK = "http://localhost:3100";
const LIVE = "http://localhost:3101";
const shot = (page: Page, name: string) => page.screenshot({ path: `evidence/${name}.png` });

async function runVoiceDebrief(page: Page) {
  await page.getByRole("button", { name: "Debrief with Bee" }).click();
  await expect(page.getByTestId("transcript")).toContainText("rooftop drinks");
  await expect(page.getByTestId("transcript")).toContainText("Ethan", { timeout: 15_000 });
  await shot(page, "02-voice-call");
  await page.getByRole("button", { name: "End" }).click();
}

test("S1/S3/S4 scripted demo: Plan → voice debrief → learned → next Plan", async ({ page }) => {
  await page.goto(MOCK);
  await expect(page.getByRole("heading", { name: "This week's Plan" })).toBeVisible();
  const members = page.getByTestId("members").getByRole("listitem");
  await expect(members).toHaveCount(5);
  await expect(page.getByTestId("members")).toContainText("Jordan");
  await expect(page.getByTestId("why")).toContainText("3 women, 3 men");
  await expect(page.getByText("Concept prototype by Sophia Zhang, not affiliated with Bumble.")).toBeVisible();
  await shot(page, "01-week1-plan");

  await runVoiceDebrief(page);

  await expect(page.getByRole("heading", { name: "What Bee learned" })).toBeVisible();
  await expect(page.getByTestId("stated-vs-revealed")).toContainText("I miss being outside");
  await expect(page.getByTestId("before-after")).toContainText("90 → 50");
  await expect(page.getByTestId("people")).toContainText("Jordan");
  await shot(page, "03-learned");

  await page.getByRole("button", { name: "See next week's Plan" }).click();
  await expect(page.getByRole("heading", { name: "Next week's Plan" })).toBeVisible();
  await expect(page.getByTestId("why")).toContainText('Last week you clicked with Jordan ("I was laughing the whole time")');
  await expect(page.getByTestId("plan-activity")).toContainText("Mount Bonnell");
  await expect(page.getByTestId("members")).not.toContainText("Ethan");
  await expect(page.getByTestId("members")).toContainText("Back");
  await shot(page, "04-week2-plan");
});

test("S8 progress survives a refresh, and Reset demo restores week 1", async ({ page }) => {
  await page.goto(MOCK);
  await runVoiceDebrief(page);
  await page.getByRole("button", { name: "See next week's Plan" }).click();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Next week's Plan" })).toBeVisible();
  await page.getByRole("button", { name: "Reset demo" }).click();
  await expect(page.getByRole("heading", { name: "This week's Plan" })).toBeVisible();
  await expect(page.getByTestId("plan-activity")).toContainText("Rooftop");
  await page.reload();
  await expect(page.getByRole("heading", { name: "This week's Plan" })).toBeVisible();
});

test("S7 text fallback reaches the same Learned screen (demo mode)", async ({ page }) => {
  await page.goto(MOCK);
  await page.getByRole("button", { name: "Debrief with Bee" }).click();
  await page.getByRole("button", { name: "Switch to text" }).click();
  await expect(page.getByTestId("chat")).toContainText("How'd it go?");
  // Tap Maya's recorded replies; Bee answers with her recorded lines in order.
  for (const beeReply of ["Let's start with Ethan", "What about Marcus?", "And Jordan, the sound engineer?"]) {
    await page.getByRole("button", { name: /^Suggested:/ }).click();
    await expect(page.getByTestId("chat")).toContainText(beeReply);
  }
  await shot(page, "05-text-fallback");
  await page.getByRole("button", { name: "Finish debrief" }).click();
  await expect(page.getByRole("heading", { name: "What Bee learned" })).toBeVisible();
});

test("S6 extraction failure shows an error with 'Use recorded debrief'", async ({ page }) => {
  await page.route("**/api/extract", (route) => route.fulfill({ status: 502, json: { error: "boom" } }));
  await page.goto(MOCK);
  await runVoiceDebrief(page);
  await expect(page.getByText("Bee couldn't process that debrief.")).toBeVisible();
  await shot(page, "06-extract-error");
  await page.getByRole("button", { name: "Use recorded debrief" }).click();
  await expect(page.getByRole("heading", { name: "What Bee learned" })).toBeVisible();
});

test("S7 live mode with no keys: voice fails gracefully, text still works", async ({ page }) => {
  // The live server has no keys, so voice-session returns 503. Stand in for Claude on the text path.
  let turn = 0;
  await page.route("**/api/chat", (route) => route.fulfill({ json: { reply: turn++ === 0 ? "Hey Maya! How'd it go?" : "Love that. Anything else?" } }));
  await page.goto(LIVE);
  await page.getByRole("button", { name: "Debrief with Bee" }).click();
  await expect(page.getByText("Couldn't start the voice call")).toBeVisible();
  await shot(page, "07-voice-unavailable");
  await page.getByRole("button", { name: "Switch to text" }).click();
  await expect(page.getByTestId("chat")).toContainText("How'd it go?");
  await page.getByLabel("Message Bee").fill("Jordan was great, Ethan not so much.");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByTestId("chat")).toContainText("Anything else?");
  await page.getByRole("button", { name: "Finish debrief" }).click();
  // No ANTHROPIC_API_KEY on this server → extraction fails → recoverable error screen.
  await expect(page.getByText("Bee couldn't process that debrief.")).toBeVisible();
});
