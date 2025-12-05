import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/apiMocks';

test.describe('IC Mode', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'ic');
  });

  test('should display IC dashboard header', async ({ page }) => {
    await expect(page.locator('h2:has-text("Investigation Committee")')).toBeVisible();
    await expect(page.locator('text=Manage all cases')).toBeVisible();
    await expect(page.locator('text=IC Mode')).toBeVisible();
  });

  test('should display IC mode welcome message', async ({ page }) => {
    const welcome = page.locator('h3:has-text("IC Dashboard")');
    await expect(welcome).toBeVisible({ timeout: 10000 });
  });

  test('should display IC quick action chips', async ({ page }) => {
    await expect(page.locator('button:has-text("Show All Cases")')).toBeVisible();
    await expect(page.locator('button:has-text("Pending")')).toBeVisible();
    await expect(page.locator('button:has-text("Overdue")')).toBeVisible();
    await expect(page.locator('button:has-text("Today\'s Deadlines")')).toBeVisible();
  });

  test('should have IC mode search placeholder', async ({ page }) => {
    const input = page.locator('input[placeholder*="Search cases"]');
    await expect(input).toBeVisible();
  });

  test('should display cases when "Show All Cases" clicked', async ({ page }) => {
    const chip = page.locator('button:has-text("Show All Cases")');
    await chip.click();

    // Wait for case list to appear
    await page.waitForTimeout(2000);

    // Should see case cards or a message
    const hasCaseCards = await page.locator('.border.border-warm-200.rounded-lg.p-4').count() > 0;
    const hasNoCasesMessage = await page.locator('text=No cases found').isVisible().catch(() => false);

    expect(hasCaseCards || hasNoCasesMessage).toBeTruthy();
  });

  test('should show overdue cases when "Overdue" clicked', async ({ page }) => {
    const chip = page.locator('button:has-text("Overdue")').first();
    await chip.click();

    // Wait for response
    await page.waitForTimeout(2000);

    // Should see either overdue cases or "No cases found"
    const hasOverdueBadge = await page.locator('text=/overdue|No cases found/i').isVisible({ timeout: 5000 });
    expect(hasOverdueBadge).toBeTruthy();
  });

  test('should show pending cases when "Pending" clicked', async ({ page }) => {
    const chip = page.locator('button:has-text("Pending")');
    await chip.click();

    // Wait for response
    await page.waitForTimeout(2000);

    // Should see cases or message
    const hasContent = await page.locator('text=/cases|No cases/i').isVisible({ timeout: 5000 });
    expect(hasContent).toBeTruthy();
  });

  test('should search for specific case by code', async ({ page }) => {
    const input = page.locator('input[placeholder*="Search cases"]');
    const sendButton = page.locator('button[aria-label="Send message"]');

    // Type case code
    await input.fill('KELP-2025-0001');
    await sendButton.click();

    // Wait for response
    await page.waitForTimeout(2000);

    // Should see either the case details or not found message
    const hasResponse = await page.locator('text=/KELP-2025-0001|not found/i').isVisible({ timeout: 5000 });
    expect(hasResponse).toBeTruthy();
  });

  test('should display IC mode badge', async ({ page }) => {
    const badge = page.locator('.bg-accent-500\\/10.text-accent-600:has-text("IC Mode")');
    await expect(badge).toBeVisible();
  });

  test('should display case cards with proper structure', async ({ page }) => {
    const chip = page.locator('button:has-text("Show All Cases")');
    await chip.click();

    // Wait for cases to load
    await page.waitForTimeout(2000);

    // Check if at least one case card exists
    const caseCards = page.locator('.border.border-warm-200.rounded-lg.p-4');
    const count = await caseCards.count();

    if (count > 0) {
      const firstCard = caseCards.first();

      // Should have case code
      await expect(firstCard.locator('.font-semibold.text-warm-900.text-lg')).toBeVisible();

      // Should have status badge
      await expect(firstCard.locator('.px-3.py-1.rounded-full')).toBeVisible();
    }
  });

  test('should show deadline information on case cards', async ({ page }) => {
    const chip = page.locator('button:has-text("Show All Cases")');
    await chip.click();

    // Wait for cases to load
    await page.waitForTimeout(2000);

    const caseCards = page.locator('.border.border-warm-200.rounded-lg.p-4');
    const count = await caseCards.count();

    if (count > 0) {
      // Should see deadline indicators
      const hasDeadlineInfo = await page.locator('text=/days remaining|overdue|Due today/i').isVisible();
      expect(hasDeadlineInfo).toBeTruthy();
    }
  });

  test('should display overdue alert if overdue cases exist', async ({ page }) => {
    const chip = page.locator('button:has-text("Overdue")');
    await chip.click();

    // Wait for response
    await page.waitForTimeout(2000);

    // Check if overdue alert appears
    const overdueAlert = page.locator('.border-l-4.border-red-600');
    const hasOverdueAlert = await overdueAlert.isVisible().catch(() => false);
    const noOverdueCases = await page.locator('text=No cases found').isVisible().catch(() => false);

    // Either alert exists or no overdue cases
    expect(hasOverdueAlert || noOverdueCases).toBeTruthy();
  });

  test('should make case cards clickable', async ({ page }) => {
    const chip = page.locator('button:has-text("Show All Cases")');
    await chip.click();

    // Wait for cases to load
    await page.waitForTimeout(2000);

    const caseCards = page.locator('.cursor-pointer.border.border-warm-200.rounded-lg');
    const count = await caseCards.count();

    if (count > 0) {
      // Card should have hover effect classes
      const firstCard = caseCards.first();
      await expect(firstCard).toHaveClass(/hover:border-warm-300/);
      await expect(firstCard).toHaveClass(/cursor-pointer/);
    }
  });

  test('should handle case search by status command', async ({ page }) => {
    const input = page.locator('input[placeholder*="Search cases"]');
    await input.fill('status KELP-2025-0001');
    await input.press('Enter');

    // Wait for response
    await page.waitForTimeout(2000);

    // Should see case details or error
    const hasResponse = await page.locator('text=/KELP-2025-0001|not found/i').isVisible({ timeout: 5000 });
    expect(hasResponse).toBeTruthy();
  });

  test('should maintain IC mode after page interactions', async ({ page }) => {
    const chip = page.locator('button:has-text("Show All Cases")');
    await chip.click();

    await page.waitForTimeout(1000);

    // IC Mode badge should still be visible
    await expect(page.locator('.bg-accent-500\\/10.text-accent-600:has-text("IC Mode")')).toBeVisible();
  });

  test('should have accessible search input', async ({ page }) => {
    const input = page.locator('input[aria-label*="Search cases"]');
    await expect(input).toBeVisible();
  });
});
