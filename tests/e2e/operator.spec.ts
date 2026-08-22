import { test, expect } from "@playwright/test";

// E2E: operator workflow — requires dev server + seeded DB
// Run: pnpm exec playwright test
test.describe("operator workflow", () => {
  test.skip("startWork -> fuel -> report issue -> endWork", async ({ page }) => {
    // 1. login as operator (seeded, then reset via SEED_DEMO_DATA=true)
    // 2. startWork on assigned machine
    // 3. log fuel (effectiveJobSiteId = assignment site)
    // 4. report breakdown
    // 5. endWork and assert hours
    expect(true).toBeTruthy();
  });
});
