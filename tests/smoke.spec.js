import { test, expect } from '@playwright/test';

/**
 * SMOKE TESTS - Railway Deployment Verification
 *
 * Quick sanity checks to verify the Railway deployment is working.
 * These tests run against the live production environment.
 *
 * Keep these tests:
 * - Fast (< 30 seconds total)
 * - Simple (no complex flows or mocks)
 * - Reliable (no flaky assertions)
 */

test.describe('Smoke Tests @smoke', () => {

  test('deployment is accessible', async ({ page }) => {
    const response = await page.goto('/');

    // Should get a successful response
    expect(response?.status()).toBeLessThan(400);
  });

  test('app loads and renders', async ({ page }) => {
    await page.goto('/');

    // Wait for the page to be fully loaded
    await page.waitForLoadState('domcontentloaded');

    // Should have some content (not a blank page)
    const body = await page.locator('body').textContent();
    expect(body?.length).toBeGreaterThan(0);
  });

  test('employee login page loads', async ({ page }) => {
    const response = await page.goto('/login/employee');

    expect(response?.status()).toBeLessThan(400);

    // Should see a form or login-related content
    const hasForm = await page.locator('form, input[type="email"], input[type="password"]').first().isVisible({ timeout: 10000 }).catch(() => false);
    expect(hasForm).toBeTruthy();
  });

  test('IC login page loads', async ({ page }) => {
    const response = await page.goto('/login/ic');

    expect(response?.status()).toBeLessThan(400);

    // Should see a form or login-related content
    const hasForm = await page.locator('form, input[type="email"], input[type="password"]').first().isVisible({ timeout: 10000 }).catch(() => false);
    expect(hasForm).toBeTruthy();
  });

  test('admin login page loads', async ({ page }) => {
    const response = await page.goto('/login/admin');

    expect(response?.status()).toBeLessThan(400);

    // Should see a form or login-related content
    const hasForm = await page.locator('form, input[type="email"], input[type="password"]').first().isVisible({ timeout: 10000 }).catch(() => false);
    expect(hasForm).toBeTruthy();
  });

  test('static assets load correctly', async ({ page }) => {
    // Listen for failed requests
    const failedRequests = [];
    page.on('requestfailed', request => {
      failedRequests.push(request.url());
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // No critical asset failures (ignore external resources)
    const criticalFailures = failedRequests.filter(url =>
      !url.includes('analytics') &&
      !url.includes('tracking') &&
      !url.includes('external')
    );

    expect(criticalFailures.length).toBe(0);
  });

  test('no console errors on page load', async ({ page }) => {
    const consoleErrors = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Filter out known/acceptable errors
    const criticalErrors = consoleErrors.filter(error =>
      !error.includes('favicon') &&
      !error.includes('404') &&
      !error.includes('Failed to load resource')
    );

    // Should have no critical console errors
    expect(criticalErrors.length).toBe(0);
  });

  test('API health endpoint responds', async ({ request }) => {
    // Try common health check endpoints
    const healthEndpoints = ['/api/health', '/health', '/api'];

    let foundHealthy = false;
    for (const endpoint of healthEndpoints) {
      try {
        const response = await request.get(endpoint);
        if (response.status() < 500) {
          foundHealthy = true;
          break;
        }
      } catch (e) {
        // Continue to next endpoint
      }
    }

    // At least one endpoint should not return 5xx
    expect(foundHealthy).toBeTruthy();
  });
});
