import { expect, test } from "@playwright/test";

test("login success redirects to dashboard", async ({ page }) => {
  await page.route("**/oauth/token", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        access_token: "test-access-token",
        refresh_token: "test-refresh-token",
        token_type: "Bearer",
        expires_in: 900,
        scope: "read write",
      }),
    });
  });

  await page.route("**/dashboard/summary", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        realizedRevenue: "300000",
        operatingProfit: "120000",
        realNetProfit: "120000",
        monthlyBurn: "80000",
        requiredBuffer: "160000",
        distributablePool: "-40000",
        remainingPool: "-40000",
        safeWithdrawalCeiling: "0",
        runwayMonths: "2.5",
        partnerBreakdown: [],
        riskStatus: {
          profitHealth: "caution",
          withdrawalHealth: "safe",
          runwayHealth: "monitor",
          overdrawn: true,
        },
        partnerMaxWithdrawal: {
          partner_a: "0.00",
          partner_b: "0.00",
        },
        clientMargin: {},
      }),
    });
  });

  await page.goto("/login");
  await page.fill("#email", "owner@axioma.local");
  await page.fill("#password", "Owner@12345");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL("/");
  await expect(page.getByText("Decision Dashboard")).toBeVisible();
  await expect(page.getByText("Real Net Profit")).toBeVisible();
  await expect(page.getByText("₹120000").first()).toBeVisible();
  await expect(page.getByText("Runway Months")).toBeVisible();
  await expect(page.getByText("2.5")).toBeVisible();
  await expect(page.getByText("partner_a")).toBeVisible();
});

test("login failure shows explicit error", async ({ page }) => {
  await page.route("**/oauth/token", async (route) => {
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ message: "Unauthorized" }),
    });
  });

  await page.goto("/login");
  await page.fill("#email", "owner@axioma.local");
  await page.fill("#password", "wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByText("Login failed. Verify credentials and try again.")).toBeVisible();
});
