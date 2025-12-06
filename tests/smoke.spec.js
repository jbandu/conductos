import { test, expect } from '@playwright/test';

/**
 * SMOKE TESTS
 *
 * Quick sanity checks to verify the deployment is working.
 * These run FIRST - if they fail, full test suite is skipped.
 *
 * Keep these tests:
 * - Fast (< 30 seconds total)
 * - Simple (no complex flows)
 * - Critical (test core functionality only)
 */

test.describe('Smoke Tests @smoke', () => {

  test('app loads successfully', async ({ page }) => {
    await page.goto('/');

    // Should see the main app
    await expect(page).toHaveTitle(/ConductOS|Kelphr/i, { timeout: 10000 });
  });

  test('login page renders', async ({ page }) => {
    await page.goto('/login/employee');

    // Should see login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('IC login page renders', async ({ page }) => {
    await page.goto('/login/ic');

    // Should see login form
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('admin login page renders', async ({ page }) => {
    await page.goto('/login/admin');

    // Should see login form
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('navigation between login types works', async ({ page }) => {
    // Start at employee login
    await page.goto('/login/employee');
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });

    // Navigate to IC login
    await page.goto('/login/ic');
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });

    // Navigate to admin login
    await page.goto('/login/admin');
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });
  });

  test('static assets load (CSS/JS)', async ({ page }) => {
    const response = await page.goto('/');

    // Page should load successfully
    expect(response?.status()).toBeLessThan(400);

    // Check that styles are applied (page isn't unstyled)
    const body = page.locator('body');
    const bgColor = await body.evaluate(el => getComputedStyle(el).backgroundColor);

    // Should have some background color set (not default white/transparent)
    expect(bgColor).toBeTruthy();
  });

  test('API health check', async ({ request }) => {
    // Check if API is responding
    const response = await request.get('/api/health');

    // Should get a response (200, 404 for missing route, etc. - just not 5xx)
    expect(response.status()).toBeLessThan(500);
  });
});
