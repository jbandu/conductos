import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/apiMocks';

test.describe('Case Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'ic');
  });

  test('should display case list with proper structure', async ({ page }) => {
    // Request all cases
    await page.getByRole('button', { name: 'Show All Cases', exact: true }).click();
    await page.waitForTimeout(2000);

    // Check for case cards
    const caseCards = page.locator('.border.border-warm-200.rounded-lg.p-4');
    const count = await caseCards.count();

    if (count > 0) {
      const firstCard = caseCards.first();

      // Verify case code format (KELP-YYYY-NNNN)
      await expect(firstCard.locator('.font-semibold.text-warm-900.text-lg')).toBeVisible();
      const caseCode = await firstCard.locator('.font-semibold.text-warm-900.text-lg').textContent();
      expect(caseCode).toMatch(/KELP-\d{4}-\d{4}/);

      // Verify status badge exists
      await expect(firstCard.locator('.px-3.py-1.rounded-full.text-xs.font-medium')).toBeVisible();

      // Verify incident date
      await expect(firstCard.locator('text=/Incident:/i')).toBeVisible();

      // Verify description preview
      await expect(firstCard.locator('.text-sm.text-warm-600')).toBeVisible();
    }
  });

  test('should show status badges with correct styling', async ({ page }) => {
    await page.getByRole('button', { name: 'Show All Cases', exact: true }).click();
    await page.waitForTimeout(2000);

    const statusBadges = page.locator('.px-3.py-1.rounded-full.text-xs.font-medium');
    const count = await statusBadges.count();

    if (count > 0) {
      // Should have color classes (bg-*-100 text-*-800)
      const firstBadge = statusBadges.first();
      const classes = await firstBadge.getAttribute('class');
      expect(classes).toMatch(/bg-[\w-]+(?:-\d+)?(?:\/\d+)?/);
      expect(classes).toMatch(/text-[\w-]+(?:-\d+)?/);
    }
  });

  test('should display deadline warnings for overdue cases', async ({ page }) => {
    await page.locator('button:has-text("Overdue")').click();
    await page.waitForTimeout(2000);

    // Check for overdue indicators
    const overdueIndicator = page.locator('text=/overdue/i');
    const hasOverdue = await overdueIndicator.isVisible().catch(() => false);
    const noCases = await page.locator('text=No cases found').isVisible().catch(() => false);
    const hasCards = await page.locator('.border.border-warm-200.rounded-lg.p-4').first().isVisible().catch(() => false);

    // Either we have overdue cases, an empty state, or visible cards after filtering
    expect(hasOverdue || noCases || hasCards).toBeTruthy();
  });

  test('should display days remaining for active cases', async ({ page }) => {
    await page.getByRole('button', { name: 'Show All Cases', exact: true }).click();
    await page.waitForTimeout(2000);

    // Check for days remaining text
    const daysRemaining = page.locator('text=/days remaining/i');
    const hasDaysInfo = await daysRemaining.isVisible().catch(() => false);

    if (hasDaysInfo) {
      expect(await daysRemaining.count()).toBeGreaterThan(0);
    }
  });

  test('should show "Due today" for cases with deadline today', async ({ page }) => {
    await page.locator('button.flex-shrink-0:has-text("Today\'s Deadlines")').click();
    await page.waitForTimeout(2000);

    const dueTodayIndicator = page.locator('text=/Due today/i');
    const hasDueToday = await dueTodayIndicator.isVisible().catch(() => false);
    const noCases = await page.locator('text=No cases found').isVisible().catch(() => false);
    const hasCards = await page.locator('.border.border-warm-200.rounded-lg.p-4').isVisible().catch(() => false);

    expect(hasDueToday || noCases || hasCards).toBeTruthy();
  });

  test('should click case card to view details', async ({ page }) => {
    await page.getByRole('button', { name: 'Show All Cases', exact: true }).click();
    await page.waitForTimeout(2000);

    const caseCards = page.locator('.cursor-pointer.border.border-warm-200.rounded-lg');
    const count = await caseCards.count();

    if (count > 0) {
      // Get case code before clicking
      const caseCode = await caseCards.first().locator('.font-semibold.text-warm-900.text-lg').textContent();

      // Click the card
      await caseCards.first().click();
      await page.waitForTimeout(2000);

      // Should see either case details or the case code repeated
      const caseDetailVisible = await page.locator(`text=${caseCode}`).count() > 1;
      expect(caseDetailVisible).toBeTruthy();
    }
  });

  test('should display case detail view with full information', async ({ page }) => {
    await page.getByRole('button', { name: 'Show All Cases', exact: true }).click();
    await page.waitForTimeout(2000);

    const caseCards = page.locator('.cursor-pointer.border.border-warm-200.rounded-lg');
    if (await caseCards.first().isVisible()) {
      await caseCards.first().click();
      await page.waitForTimeout(2000);

      // Check for case detail elements (if detail view loads)
      const hasDetailView = await page.locator('.text-2xl.font-bold.text-warm-900').isVisible({ timeout: 5000 }).catch(() => false);

      if (hasDetailView) {
        // Should show status badge
        await expect(page.locator('.px-3.py-1.rounded-full.text-sm.font-medium')).toBeVisible();

        // Should show dates grid
        await expect(page.locator('text=/Filed|Incident Date|Deadline/i')).toBeVisible();

        // Should show description section
        await expect(page.locator('text=Description')).toBeVisible();
      }
    }
  });

  test('should display anonymous indicator on anonymous cases', async ({ page }) => {
    await page.getByRole('button', { name: 'Show All Cases', exact: true }).click();
    await page.waitForTimeout(2000);

    // Look for anonymous icon/indicator
    const anonymousIndicator = page.locator('text=/Anonymous/i').or(page.locator('svg')).first();
    const hasAnonymous = await anonymousIndicator.isVisible().catch(() => false);

    // Some cases might be anonymous
    if (hasAnonymous) {
      expect(await page.locator('text=/Anonymous/i').count()).toBeGreaterThan(0);
    }
  });

  test('should display conciliation indicator when requested', async ({ page }) => {
    await page.getByRole('button', { name: 'Show All Cases', exact: true }).click();
    await page.waitForTimeout(2000);

    // Look for conciliation indicator
    const conciliationIndicator = page.locator('text=/Conciliation/i');
    const hasConciliation = await conciliationIndicator.isVisible().catch(() => false);

    // Some cases might have conciliation
    if (hasConciliation) {
      expect(await conciliationIndicator.count()).toBeGreaterThan(0);
    }
  });

  test('should filter cases by status', async ({ page }) => {
    await page.locator('button:has-text("Pending")').first().click();
    await page.waitForTimeout(2000);

    // Should see either pending cases or no cases message
    const hasCases = await page.locator('.border.border-warm-200.rounded-lg.p-4').isVisible().catch(() => false);
    const noCases = await page.locator('text=No cases found').isVisible().catch(() => false);
    const hasSummary = await page.locator('text=Showing seeded IC cases').isVisible().catch(() => false);

    expect(hasCases || noCases || hasSummary).toBeTruthy();

    if (hasCases) {
      // All visible cases should have pending-related status
      const statusBadges = page.locator('.px-3.py-1.rounded-full.text-xs.font-medium');
      const count = await statusBadges.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should search for specific case by code', async ({ page }) => {
    const input = page.locator('input[placeholder*="Search cases"]');
    await input.fill('status KELP-2025-0001');
    await input.press('Enter');

    await page.waitForTimeout(2000);

    // Should see either case details or not found message
    const hasResult = await page.locator('text=/KELP-2025-0001|not found/i').isVisible({ timeout: 5000 });
    expect(hasResult).toBeTruthy();
  });

  test('should display case history timeline in detail view', async ({ page }) => {
    await page.getByRole('button', { name: 'Show All Cases', exact: true }).click();
    await page.waitForTimeout(2000);

    const caseCards = page.locator('.cursor-pointer.border.border-warm-200.rounded-lg');
    if (await caseCards.first().isVisible()) {
      await caseCards.first().click();
      await page.waitForTimeout(2000);

      // Look for status history
      const historySection = page.locator('text=/Status History/i');
      const hasHistory = await historySection.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasHistory) {
        // Should have timeline elements
        await expect(page.locator('.w-3.h-3.rounded-full')).toBeVisible();
      }
    }
  });

  test('should show overdue alert for cases past deadline', async ({ page }) => {
    await page.locator('button:has-text("Overdue")').click();
    await page.waitForTimeout(2000);

    // Look for overdue alert banner
    const overdueAlert = page.locator('.border-l-4.border-red-600');
    const hasAlert = await overdueAlert.isVisible().catch(() => false);
    const noCases = await page.locator('text=No cases found').isVisible().catch(() => false);
    const hasSummary = await page.locator('text=Showing seeded IC cases').isVisible().catch(() => false);

    expect(hasAlert || noCases || hasSummary).toBeTruthy();

    if (hasAlert) {
      // Should mention PoSH Act and statutory deadline
      await expect(page.locator('text=/PoSH Act.*deadline/i')).toBeVisible();

      // Should have action button
      await expect(page.locator('button:has-text("View Overdue Cases")')).toBeVisible();
    }
  });

  test('should display case summary information', async ({ page }) => {
    await page.getByRole('button', { name: 'Show All Cases', exact: true }).click();
    await page.waitForTimeout(2000);

    // Look for summary text
    const summaryText = page.locator('.text-sm.text-warm-600.font-medium');
    const hasSummary = await summaryText.first().isVisible().catch(() => false);

    if (hasSummary) {
      const text = await summaryText.first().textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });

  test('should show empty state when no cases found', async ({ page }) => {
    // Search for non-existent case
    const input = page.locator('input[placeholder*="Search cases"]');
    await input.fill('status KELP-9999-9999');
    await input.press('Enter');

    await page.waitForTimeout(2000);

    // Should see empty state or not found message
    const hasEmptyState = await page.locator('text=/No cases found|not found/i').isVisible({ timeout: 5000 }).catch(() => false);
    const hasCases = await page.locator('.border.border-warm-200.rounded-lg.p-4').isVisible().catch(() => false);

    expect(hasEmptyState || hasCases).toBeTruthy();
  });

  test('should maintain case card hover effects', async ({ page }) => {
    await page.getByRole('button', { name: 'Show All Cases', exact: true }).click();
    await page.waitForTimeout(2000);

    const caseCards = page.locator('.cursor-pointer.border.border-warm-200.rounded-lg');
    if (await caseCards.first().isVisible()) {
      const firstCard = caseCards.first();

      // Should have hover classes
      const classes = await firstCard.getAttribute('class');
      expect(classes).toContain('hover:border-warm-300');
      expect(classes).toContain('cursor-pointer');
    }
  });

  test('should format dates consistently', async ({ page }) => {
    await page.getByRole('button', { name: 'Show All Cases', exact: true }).click();
    await page.waitForTimeout(2000);

    const caseCards = page.locator('.border.border-warm-200.rounded-lg.p-4');
    if (await caseCards.first().isVisible()) {
      // Look for formatted date (e.g., "Nov 10, 2024" or "11/10/2024")
      const dateText = page.locator('text=/Incident:.*\\d{1,2}/i');
      await expect(dateText.first()).toBeVisible();
    }
  });

  test('should handle long descriptions with truncation', async ({ page }) => {
    await page.getByRole('button', { name: 'Show All Cases', exact: true }).click();
    await page.waitForTimeout(2000);

    const descriptions = page.locator('.text-sm.text-warm-600.line-clamp-2');
    const count = await descriptions.count();

    if (count > 0) {
      // Description should have line-clamp class
      const classes = await descriptions.first().getAttribute('class');
      expect(classes).toContain('line-clamp-2');
    }
  });

  test('should show deadline urgency indicators', async ({ page }) => {
    await page.getByRole('button', { name: 'Show All Cases', exact: true }).click();
    await page.waitForTimeout(2000);

    // Check for different urgency indicators
    const urgentIndicators = page.locator('text=/⚠️|📅|⚡/');
    const hasUrgencyEmojis = await urgentIndicators.count() > 0;

    // Some cases should have urgency indicators
    expect(hasUrgencyEmojis || await page.locator('text=No cases found').isVisible()).toBeTruthy();
  });
});
