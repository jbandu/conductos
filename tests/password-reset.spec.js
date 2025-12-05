import { test, expect } from '@playwright/test';

test.describe('Password Reset Flow', () => {
  const testEmail = 'testuser@example.com';

  test('should display forgot password page', async ({ page }) => {
    await page.goto('/forgot-password');

    await expect(page.locator('h2:has-text("Forgot Your Password?")')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button:has-text("Send Reset Link")')).toBeVisible();
  });

  test('should show success message after requesting reset', async ({ page }) => {
    await page.goto('/forgot-password');

    await page.fill('input[type="email"]', testEmail);
    await page.click('button:has-text("Send Reset Link")');

    // Should show success message
    await expect(page.locator('h2:has-text("Check Your Email")')).toBeVisible();
    await expect(page.locator(`text=${testEmail}`)).toBeVisible();
  });

  test('should have back to login link', async ({ page }) => {
    await page.goto('/forgot-password');

    const backLink = page.locator('a:has-text("Back to Login")');
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute('href', '/login');
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/forgot-password');

    await page.fill('input[type="email"]', 'invalid-email');
    await page.click('button:has-text("Send Reset Link")');

    // HTML5 validation should prevent submission
    const emailInput = page.locator('input[type="email"]');
    const validationMessage = await emailInput.evaluate(el => el.validationMessage);
    expect(validationMessage).toBeTruthy();
  });

  test('reset password page should validate token', async ({ page }) => {
    // Visit with invalid token
    await page.goto('/reset-password?token=invalid-token-123');

    // Should show validation loading
    await expect(page.locator('text=Verifying reset link')).toBeVisible();

    // Should show error after validation
    await expect(page.locator('h2:has-text("Invalid Reset Link")')).toBeVisible({ timeout: 10000 });
  });

  test('reset password page should show request new link option', async ({ page }) => {
    await page.goto('/reset-password?token=invalid-token');

    await page.waitForSelector('h2:has-text("Invalid Reset Link")', { timeout: 10000 });

    await expect(page.locator('a:has-text("Request New Reset Link")')).toBeVisible();
    await expect(page.locator('a:has-text("Back to Login")')).toBeVisible();
  });

  test('should require token parameter', async ({ page }) => {
    await page.goto('/reset-password');

    await expect(page.locator('text=Invalid reset link')).toBeVisible();
  });
});
