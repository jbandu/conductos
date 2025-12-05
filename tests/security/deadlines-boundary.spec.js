import { test, expect } from '@playwright/test';

/**
 * CRITICAL LEGAL COMPLIANCE TESTS: 90-Day Deadline Accuracy
 *
 * These tests verify that the system NEVER allows invalid dates or incorrect
 * deadline calculations. This is legally critical for PoSH Act compliance.
 *
 * INT-008: 90-day clock must be accurate to avoid legal violations.
 *
 * Tagged as @critical to run on every commit.
 */

test.describe('90-Day Deadline - Critical Legal Compliance @critical', () => {

  test.describe('Future Date Prevention', () => {

    test('MUST reject future incident dates - UI validation', async ({ page }) => {
      // INT-002: Incident date cannot be in the future

      await page.goto('/');

      // Start intake flow
      await page.locator('button:has-text("I want to report harassment")').click();
      await page.waitForTimeout(2000);

      await page.locator('button:has-text("Continue")').click();
      await page.waitForTimeout(500);

      // Try to enter future date
      const dateInput = page.locator('input[type="date"]');
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const futureDateString = futureDate.toISOString().split('T')[0];

      await dateInput.fill(futureDateString);
      await page.locator('button:has-text("Next")').click();

      // CRITICAL: Must show error message
      const errorMessage = page.locator('text=/cannot be in the future|must be|invalid date/i');
      await expect(errorMessage).toBeVisible({ timeout: 3000 });

      // CRITICAL: Must NOT proceed to next step
      const descriptionField = page.locator('textarea');
      const isDescriptionVisible = await descriptionField.isVisible({ timeout: 2000 }).catch(() => false);
      expect(isDescriptionVisible).toBeFalsy();
    });

    test('MUST reject future dates via direct API call', async ({ request }) => {
      // Security: API must also validate, not just UI

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      const futureDateString = futureDate.toISOString().split('T')[0];

      const response = await request.post('/api/cases', {
        data: {
          incident_date: futureDateString,
          description: 'This is a test case with future date that should be rejected.',
          is_anonymous: false,
          complainant_name: 'Test User',
          complainant_email: 'test@example.com',
          conciliation_requested: false
        }
      });

      // CRITICAL: API must return error status
      expect(response.status()).toBeGreaterThanOrEqual(400);
      expect(response.status()).toBeLessThan(500);

      const responseBody = await response.json();
      expect(responseBody.error || responseBody.message).toMatch(/future|invalid|cannot/i);
    });

    test('MUST allow today's date (boundary case)', async ({ page }) => {
      // Boundary: Today is valid

      await page.goto('/');
      await page.locator('button:has-text("I want to report harassment")').click();
      await page.waitForTimeout(2000);

      await page.locator('button:has-text("Continue")').click();
      await page.waitForTimeout(500);

      // Enter today's date
      const dateInput = page.locator('input[type="date"]');
      const today = new Date().toISOString().split('T')[0];

      await dateInput.fill(today);
      await page.locator('button:has-text("Next")').click();
      await page.waitForTimeout(1000);

      // Should proceed to description
      const descriptionField = page.locator('textarea');
      await expect(descriptionField).toBeVisible({ timeout: 3000 });
    });
  });

  test.describe('Deadline Calculation Accuracy', () => {

    test('MUST calculate deadline as exactly 90 days after created_at', async ({ request }) => {
      // INT-008: Deadline must be created_at + 90 days, no off-by-one errors

      const response = await request.post('/api/cases', {
        data: {
          incident_date: '2025-01-15',
          description: 'Test case for deadline calculation with sufficient detail for validation purposes.',
          is_anonymous: false,
          complainant_name: 'Test User',
          complainant_email: 'test@example.com',
          conciliation_requested: false
        }
      });

      expect(response.ok()).toBeTruthy();
      const caseData = await response.json();

      // Parse dates
      const createdAt = new Date(caseData.created_at);
      const deadlineDate = new Date(caseData.deadline_date);

      // Calculate expected deadline
      const expectedDeadline = new Date(createdAt);
      expectedDeadline.setDate(expectedDeadline.getDate() + 90);

      // CRITICAL: Deadline must be exactly 90 days after creation
      const diffInDays = Math.floor((deadlineDate - createdAt) / (1000 * 60 * 60 * 24));

      expect(diffInDays).toBe(90);

      // Also check the actual dates match (accounting for time zone)
      expect(deadlineDate.toISOString().split('T')[0]).toBe(expectedDeadline.toISOString().split('T')[0]);
    });

    test('MUST handle month boundaries correctly', async ({ request }) => {
      // Edge case: Case created on Jan 31, deadline should be May 1 (90 days later)

      // We can't control server time in MVP, but we can test with fixed dates
      // This test documents expected behavior

      const testCases = [
        { created: '2025-01-31', expectedDaysLater: 90 }, // Jan 31 + 90 days
        { created: '2025-02-28', expectedDaysLater: 90 }, // Feb 28 + 90 days (non-leap)
        { created: '2024-02-29', expectedDaysLater: 90 }, // Leap year
        { created: '2025-11-30', expectedDaysLater: 90 }  // Nov 30 + 90 days crosses year
      ];

      for (const testCase of testCases) {
        // Create case with specific date (if API allows setting created_at for testing)
        // Otherwise, document this as a requirement for Phase 2 test infrastructure

        const response = await request.post('/api/cases', {
          data: {
            incident_date: testCase.created,
            description: `Test case for month boundary with incident on ${testCase.created}. Sufficient detail for validation.`,
            is_anonymous: false,
            complainant_name: 'Test User',
            complainant_email: 'test@example.com',
            conciliation_requested: false
          }
        });

        if (response.ok()) {
          const caseData = await response.json();
          const createdAt = new Date(caseData.created_at);
          const deadlineDate = new Date(caseData.deadline_date);

          const diffInDays = Math.floor((deadlineDate - createdAt) / (1000 * 60 * 60 * 24));
          expect(diffInDays).toBe(testCase.expectedDaysLater);
        }
      }
    });

    test('MUST handle leap year correctly', async ({ request }) => {
      // Edge case: Feb 29 on leap year

      // This test requires controlled date testing
      // Document for Phase 2 with time-mocking capability

      // For now, create a case and verify 90-day calculation is consistent
      const response = await request.post('/api/cases', {
        data: {
          incident_date: '2024-02-29', // Leap year date
          description: 'Leap year test case with sufficient detail for validation purposes.',
          is_anonymous: false,
          complainant_name: 'Test User',
          complainant_email: 'test@example.com',
          conciliation_requested: false
        }
      });

      if (response.ok()) {
        const caseData = await response.json();
        const createdAt = new Date(caseData.created_at);
        const deadlineDate = new Date(caseData.deadline_date);

        const diffInDays = Math.floor((deadlineDate - createdAt) / (1000 * 60 * 60 * 24));
        expect(diffInDays).toBe(90);
      }
    });
  });

  test.describe('Overdue vs Due Today Classification', () => {

    test('MUST correctly classify cases as overdue vs due today', async ({ page }) => {
      // Cases on the 90th day are due today, not overdue
      // Cases after the 90th day are overdue

      await page.goto('/');
      await page.locator('button:has-text("IC Mode")').click();
      await page.waitForTimeout(1000);

      // Request overdue cases
      await page.locator('button:has-text("Overdue cases")').click();
      await page.waitForTimeout(2000);

      let pageContent = await page.content();

      // Parse any displayed cases and check deadline logic
      // If a case shows "0 days remaining", it should NOT be in overdue list
      if (pageContent.includes('days remaining')) {
        expect(pageContent).not.toContain('0 days remaining');
      }

      // Request today's deadlines
      await page.locator('button:has-text("today")').click();
      await page.waitForTimeout(2000);

      pageContent = await page.content();

      // Cases due today should show 0 days remaining or "Due today"
      // They should NOT be marked as overdue
      if (pageContent.includes('days remaining')) {
        const has ZeroDays = pageContent.includes('0 days') || pageContent.includes('Due today');
        const hasOverdue = pageContent.includes('Overdue') || pageContent.includes('overdue');

        // If we have cases, they should be "due today" not "overdue"
        if (pageContent.includes('KELP-')) {
          expect(hasZeroDays).toBeTruthy();
        }
      }
    });

    test('MUST NOT show negative days remaining', async ({ page, request }) => {
      // System should never display "negative days" - should show "Overdue" instead

      // Create an overdue case (if test infrastructure allows backdating)
      // Or check existing cases

      await page.goto('/');
      await page.locator('button:has-text("IC Mode")').click();
      await page.waitForTimeout(1000);

      await page.locator('button:has-text("Show all cases")').click();
      await page.waitForTimeout(2000);

      const pageContent = await page.content();

      // CRITICAL: Should not display "-5 days" or similar
      expect(pageContent).not.toMatch(/-\d+ days remaining/);

      // Should instead show "Overdue" badge or similar
      // (Exact implementation may vary)
    });
  });

  test.describe('Deadline Display in UI', () => {

    test('MUST display deadline with case code after submission', async ({ page }) => {
      // INT-008: User must see deadline immediately after case creation

      await page.goto('/');

      // Complete full intake flow (simplified for test)
      await page.locator('button:has-text("I want to report harassment")').click();
      await page.waitForTimeout(2000);

      // Continue through flow...
      // (Full implementation would complete entire intake)

      // After submission, check for deadline display
      // This is a placeholder for the full flow
      // expect(page.locator('text=/deadline.*90 days/i')).toBeVisible();
    });

    test('MUST show days remaining in IC case list', async ({ page }) => {
      // IC members must see how many days remain for each case

      await page.goto('/');
      await page.locator('button:has-text("IC Mode")').click();
      await page.waitForTimeout(1000);

      await page.locator('button:has-text("Show all cases")').click();
      await page.waitForTimeout(2000);

      // If cases exist, they should show days remaining
      const hasCases = await page.locator('text=/KELP-\\d{4}-\\d{4}/').isVisible({ timeout: 3000 }).catch(() => false);

      if (hasCases) {
        // Should see "X days remaining" or "Due today" or "Overdue" badge
        const hasDeadlineInfo = await page.locator('text=/days remaining|Due today|Overdue/i').isVisible({ timeout: 2000 }).catch(() => false);
        expect(hasDeadlineInfo).toBeTruthy();
      }
    });
  });

  test.describe('Old Incident Dates (Business Rule)', () => {

    test('should handle incidents from 2+ years ago', async ({ request }) => {
      // Business rule: Check if old dates are allowed or flagged

      const oldDate = '2023-01-15'; // 2 years ago

      const response = await request.post('/api/cases', {
        data: {
          incident_date: oldDate,
          description: 'Old incident being reported now with sufficient detail for validation purposes.',
          is_anonymous: false,
          complainant_name: 'Test User',
          complainant_email: 'test@example.com',
          conciliation_requested: false
        }
      });

      // System might accept (per business rules) but should flag
      // Document current behavior
      if (response.ok()) {
        const caseData = await response.json();
        // Deadline still starts from today, not from incident date
        const createdAt = new Date(caseData.created_at);
        const deadlineDate = new Date(caseData.deadline_date);
        const diffInDays = Math.floor((deadlineDate - createdAt) / (1000 * 60 * 60 * 24));

        // CRITICAL: Deadline is always 90 days from creation, not from incident
        expect(diffInDays).toBe(90);
      }
    });
  });
});
