import { test, expect } from "@playwright/test";

async function registerAndLogin(page: import("@playwright/test").Page, suffix = "") {
  const email = `dash_${Date.now()}${suffix}@tradehub.test`;
  await page.goto("/register");
  await page.getByLabel(/full name/i).fill("Dashboard Tester");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill("SecurePass123!");
  await page.getByRole("button", { name: /create account/i }).click();
  await page.waitForURL(/\/dashboard/);
  return email;
}

test.describe("Dashboard", () => {
  test("shows welcome message with user name", async ({ page }) => {
    await registerAndLogin(page);
    await expect(page.getByText(/welcome back/i)).toBeVisible();
    await expect(page.getByText(/dashboard tester/i)).toBeVisible();
  });

  test("shows wallet balance stat card", async ({ page }) => {
    await registerAndLogin(page, "b");
    await expect(page.getByText(/wallet balance/i)).toBeVisible();
    await expect(page.getByText(/\$0\.00/)).toBeVisible();
  });

  test("sidebar navigation links are present", async ({ page }) => {
    await registerAndLogin(page, "c");
    await expect(page.getByRole("link", { name: /memberships/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /copy trading/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /wallet/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /content library/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /live sessions/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /community/i })).toBeVisible();
  });

  test("navigates to memberships page", async ({ page }) => {
    await registerAndLogin(page, "d");
    await page.getByRole("link", { name: /memberships/i }).click();
    await expect(page).toHaveURL(/\/memberships/);
    await expect(page.getByRole("heading", { name: /mentorship memberships/i })).toBeVisible();
  });

  test("navigates to wallet page", async ({ page }) => {
    await registerAndLogin(page, "e");
    await page.getByRole("link", { name: /wallet/i }).click();
    await expect(page).toHaveURL(/\/wallet/);
    await expect(page.getByText(/available balance/i)).toBeVisible();
  });

  test("navigates to copy trading page", async ({ page }) => {
    await registerAndLogin(page, "f");
    await page.getByRole("link", { name: /copy trading/i }).click();
    await expect(page).toHaveURL(/\/copy-trading/);
    await expect(page.getByRole("heading", { name: /copy trading/i })).toBeVisible();
  });
});
