import { defineConfig, devices } from "@playwright/test";

// Runs against the production build (`npm run build` first). Two servers:
//   :3100 DEMO_MODE=mock (the scripted demo)   :3101 live mode with no API keys (failure paths)
export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  use: { ...devices["iPhone 13"], browserName: "chromium", trace: "off" },
  webServer: [
    { command: "npx next start -p 3100", port: 3100, env: { DEMO_MODE: "mock" }, reuseExistingServer: false },
    { command: "npx next start -p 3101", port: 3101, env: { DEMO_MODE: "", ANTHROPIC_API_KEY: "", ELEVENLABS_API_KEY: "" }, reuseExistingServer: false },
  ],
});
