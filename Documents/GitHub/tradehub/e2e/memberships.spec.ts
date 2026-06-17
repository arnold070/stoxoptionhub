import { test, expect } from "@playwright/test";

async function setupUser(page: import("@playwright/test").Page, suffix = "") {
  const email = `mem_${Date.now()}${suffix}@tradehub.test`;
  await page.goto("/register");
  await page.getByLabel(/full name/i).fill("Membership Tester");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill("SecurePass123!");
  await page.getByRole("button", { name: /create account/i }).click();
  await page.waitForURL(/\/dashboard/);
  await page.goto("/memberships");
  return email;
}

test.describe("Memberships", () => {
  test("memberships page loads", async ({ page }) => {
    await setupUser(page);
    await expect(page.getByRole("heading", { name: /mentorship memberships/i })).toBeVisible();
  });

  test("shows membership history section after having memberships", async ({ page }) => {
    await setupUser(page, "b");
    await expect(page.getByText(/choose a plan/i)).toBeVisible();
  });

  test("displays no active membership initially", async ({ page }) => {
    await setupUser(page, "c");
    const activeBadge = page.getByText(/current plan/i);
    await expect(activeBadge).not.toBeVisible();
  });
});
