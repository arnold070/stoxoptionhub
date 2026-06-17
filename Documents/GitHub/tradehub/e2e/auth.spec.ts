import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("redirects unauthenticated user from dashboard to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("register page loads correctly", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: /create your/i })).toBeVisible();
    await expect(page.getByLabel(/full name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test("login page loads correctly", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test("shows error for invalid login credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("nobody@example.com");
    await page.getByLabel(/password/i).fill("WrongPass123!");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText(/invalid/i)).toBeVisible({ timeout: 5000 });
  });

  test("shows error for weak password on register", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel(/full name/i).fill("Test User");
    await page.getByLabel(/email/i).fill(`test${Date.now()}@example.com`);
    await page.getByLabel(/password/i).fill("weak");
    await page.getByRole("button", { name: /create account/i }).click();
    await expect(page.getByText(/password/i)).toBeVisible({ timeout: 5000 });
  });

  test("full registration flow", async ({ page }) => {
    const email = `e2e_${Date.now()}@tradehub.test`;
    await page.goto("/register");
    await page.getByLabel(/full name/i).fill("E2E Tester");
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill("SecurePass123!");
    await page.getByRole("button", { name: /create account/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.getByText(/welcome/i)).toBeVisible();
  });

  test("sign out clears session and redirects", async ({ page }) => {
    // Login first
    const email = `logout_${Date.now()}@tradehub.test`;
    await page.goto("/register");
    await page.getByLabel(/full name/i).fill("Logout Test");
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill("SecurePass123!");
    await page.getByRole("button", { name: /create account/i }).click();
    await page.waitForURL(/\/dashboard/);

    await page.getByRole("button", { name: /sign out/i }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
