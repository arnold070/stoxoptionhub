import { test, expect } from "@playwright/test";

async function setupUser(page: import("@playwright/test").Page, suffix = "") {
  const email = `wallet_${Date.now()}${suffix}@tradehub.test`;
  await page.goto("/register");
  await page.getByLabel(/full name/i).fill("Wallet Tester");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill("SecurePass123!");
  await page.getByRole("button", { name: /create account/i }).click();
  await page.waitForURL(/\/dashboard/);
  await page.goto("/wallet");
  return email;
}

test.describe("Wallet", () => {
  test("shows zero balance for new user", async ({ page }) => {
    await setupUser(page);
    await expect(page.getByText(/\$0\.00/)).toBeVisible();
  });

  test("deposit tab is shown by default", async ({ page }) => {
    await setupUser(page, "b");
    await expect(page.getByRole("button", { name: /deposit/i })).toBeVisible();
    await expect(page.getByPlaceholder(/min \$10/i)).toBeVisible();
  });

  test("switching to withdraw tab shows withdrawal form", async ({ page }) => {
    await setupUser(page, "c");
    await page.getByRole("button", { name: /withdraw/i }).click();
    await expect(page.getByPlaceholder(/min \$20/i)).toBeVisible();
    await expect(page.getByPlaceholder(/wallet address/i)).toBeVisible();
  });

  test("shows error when deposit amount is too low", async ({ page }) => {
    await setupUser(page, "d");
    await page.getByPlaceholder(/min \$10/i).fill("5");
    await page.getByPlaceholder(/transaction reference/i).fill("TXN123");
    await page.getByRole("button", { name: /submit deposit/i }).click();
    await expect(page.getByText(/minimum/i)).toBeVisible({ timeout: 5000 });
  });

  test("successful deposit request shows confirmation", async ({ page }) => {
    await setupUser(page, "e");
    await page.getByPlaceholder(/min \$10/i).fill("100");
    await page.getByPlaceholder(/transaction reference/i).fill("TXN_E2E_001");
    await page.getByRole("button", { name: /submit deposit/i }).click();
    await expect(page.getByText(/submitted/i)).toBeVisible({ timeout: 5000 });
  });

  test("shows transaction history table", async ({ page }) => {
    await setupUser(page, "f");
    await expect(page.getByText(/transaction history/i)).toBeVisible();
  });
});
