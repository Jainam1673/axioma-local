import { expect, test } from "@playwright/test";

test("dashboard redirects to login when token is missing", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL("/login");
});

test("dashboard shows session expiration on unauthorized response", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("axioma.accessToken", "stale-token");
  });

  await page.route("**/dashboard/summary", async (route) => {
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ message: "Unauthorized" }),
    });
  });

  await page.goto("/");
  await expect(page.getByText("Session expired. Please sign in again.")).toBeVisible();
});
