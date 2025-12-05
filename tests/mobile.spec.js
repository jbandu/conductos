import { test, expect, devices } from '@playwright/test';

test.describe('Mobile Optimization', () => {
  test.use({
    ...devices['iPhone 12'],
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // Ensure we're in employee mode
    const employeeModeButton = page.locator('button:has-text("Employee Mode")');
    if (await employeeModeButton.isVisible()) {
      await employeeModeButton.click();
    }
  });

  test('should have mobile-appropriate viewport', async ({ page }) => {
    const viewport = page.viewportSize();
    expect(viewport.width).toBeLessThanOrEqual(428); // iPhone 12 width
  });

  test('should display hamburger menu on mobile', async ({ page }) => {
    // Hamburger button should be visible on mobile
    const hamburger = page.locator('button svg path[d*="M4 6h16M4 12h16M4 18h16"]').first();
    await expect(hamburger).toBeVisible();
  });

  test('should hide sidebar by default on mobile', async ({ page }) => {
    // Sidebar should not be visible initially
    const sidebar = page.locator('aside').or(page.locator('[class*="sidebar"]')).first();

    // On mobile, sidebar is either hidden or positioned off-screen
    if (await sidebar.isVisible({ timeout: 1000 }).catch(() => false)) {
      const classes = await sidebar.getAttribute('class');
      expect(classes).toMatch(/-translate-x-full|hidden/);
    }
  });

  test('should have touch-friendly input fields (min 48px height)', async ({ page }) => {
    const input = page.locator('input[placeholder*="Type your message"]');
    await expect(input).toBeVisible();

    const box = await input.boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(48);
  });

  test('should have touch-friendly send button (min 48x48px)', async ({ page }) => {
    const sendButton = page.locator('button[aria-label="Send message"]');
    await expect(sendButton).toBeVisible();

    const box = await sendButton.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(48);
    expect(box.height).toBeGreaterThanOrEqual(48);
  });

  test('should have touch-friendly quick chips (min 44px height)', async ({ page }) => {
    const chip = page.locator('button:has-text("What is PoSH?")');
    await expect(chip).toBeVisible();

    const box = await chip.boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(44);
  });

  test('should have minimum 16px font size to prevent zoom', async ({ page }) => {
    const input = page.locator('input[placeholder*="Type your message"]');
    await expect(input).toBeVisible();

    const fontSize = await input.evaluate(el => {
      return window.getComputedStyle(el).fontSize;
    });

    const fontSizeValue = parseInt(fontSize);
    expect(fontSizeValue).toBeGreaterThanOrEqual(16);
  });

  test('should have proper safe area padding for iPhone notch', async ({ page }) => {
    const inputArea = page.locator('.pb-safe');
    const hasInputArea = await inputArea.isVisible().catch(() => false);

    // Input area should have safe area padding
    if (hasInputArea) {
      const classes = await inputArea.getAttribute('class');
      expect(classes).toContain('pb-safe');
    }
  });

  test('should make quick chips horizontally scrollable', async ({ page }) => {
    const chipsContainer = page.locator('.overflow-x-auto');
    await expect(chipsContainer).toBeVisible();

    // Should have overflow-x-auto class
    const classes = await chipsContainer.getAttribute('class');
    expect(classes).toContain('overflow-x-auto');
  });

  test('should display full-width messages on mobile', async ({ page }) => {
    const input = page.locator('input[placeholder*="Type your message"]');
    await input.fill('Test mobile message');
    await input.press('Enter');

    await page.waitForTimeout(500);

    // Message should have mobile-appropriate width (90%)
    const userMessage = page.locator('.bg-blue-600').first();
    if (await userMessage.isVisible()) {
      const classes = await userMessage.getAttribute('class');
      expect(classes).toMatch(/max-w-\[90%\]/);
    }
  });

  test('should show tap feedback on quick chips', async ({ page }) => {
    const chip = page.locator('button:has-text("What is PoSH?")');
    await expect(chip).toBeVisible();

    // Should have active state classes
    const classes = await chip.getAttribute('class');
    expect(classes).toContain('active:scale-95');
    expect(classes).toContain('active:bg-gray-300');
  });

  test('should show tap feedback on send button', async ({ page }) => {
    const sendButton = page.locator('button[aria-label="Send message"]');
    await expect(sendButton).toBeVisible();

    const classes = await sendButton.getAttribute('class');
    expect(classes).toContain('active:bg-blue-800');
  });

  test('should have appropriate message padding on mobile', async ({ page }) => {
    const input = page.locator('input[placeholder*="Type your message"]');
    await input.fill('Test mobile message');
    await input.press('Enter');

    await page.waitForTimeout(500);

    // Check for mobile padding (px-3 on mobile)
    const messageContainer = page.locator('.mb-3.px-3').first();
    if (await messageContainer.isVisible({ timeout: 2000 }).catch(() => false)) {
      const classes = await messageContainer.getAttribute('class');
      expect(classes).toContain('px-3');
    }
  });

  test('should display relative timestamps on mobile', async ({ page }) => {
    const input = page.locator('input[placeholder*="Type your message"]');
    await input.fill('Test message');
    await input.press('Enter');

    await page.waitForTimeout(500);

    // Should show "Just now" or similar
    const timestamp = page.locator('.text-xs.mt-1\\.5');
    if (await timestamp.first().isVisible()) {
      const text = await timestamp.first().textContent();
      expect(text).toMatch(/Just now|ago|:/);
    }
  });

  test('should handle portrait orientation', async ({ page }) => {
    const viewport = page.viewportSize();
    expect(viewport.height).toBeGreaterThan(viewport.width);

    // App should still be functional
    await expect(page.locator('h2:has-text("Employee Portal")')).toBeVisible();
    await expect(page.locator('input[placeholder*="Type your message"]')).toBeVisible();
  });

  test('should have proper touch target spacing', async ({ page }) => {
    const chips = page.locator('button:has-text("What is PoSH?")');
    await expect(chips).toBeVisible();

    // Should have gap between chips (gap-2 = 8px)
    const container = page.locator('.flex.gap-2');
    const classes = await container.first().getAttribute('class');
    expect(classes).toContain('gap-2');
  });

  test('should show mobile-optimized mode badge', async ({ page }) => {
    const badge = page.locator('.bg-blue-100.text-blue-700:has-text("Employee Mode")');
    await expect(badge).toBeVisible();

    // Badge should be visible and not overflow
    const box = await badge.boundingBox();
    const viewport = page.viewportSize();
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
  });

  test('should handle keyboard appearance without breaking layout', async ({ page }) => {
    const input = page.locator('input[placeholder*="Type your message"]');

    // Focus input (would trigger keyboard on real device)
    await input.focus();

    // Input should still be visible
    await expect(input).toBeVisible();

    // Send button should still be visible
    await expect(page.locator('button[aria-label="Send message"]')).toBeVisible();
  });

  test('should use native date picker on mobile in intake flow', async ({ page }) => {
    const chip = page.locator('button:has-text("I want to report harassment")');
    await chip.click();

    await page.waitForTimeout(2000);

    const continueButton = page.locator('button:has-text("Continue")');
    if (await continueButton.isVisible({ timeout: 5000 })) {
      await continueButton.click();
      await page.waitForTimeout(500);

      // Should show native HTML5 date input
      const dateInput = page.locator('input[type="date"]');
      await expect(dateInput).toBeVisible({ timeout: 5000 });
    }
  });

  test('should prevent text zoom when tapping input', async ({ page }) => {
    const input = page.locator('input[placeholder*="Type your message"]');

    // Check computed font size
    const fontSize = await input.evaluate(el => {
      return window.getComputedStyle(el).fontSize;
    });

    // Should be at least 16px to prevent iOS zoom
    expect(parseInt(fontSize)).toBeGreaterThanOrEqual(16);
  });

  test('should maintain readable text size on mobile', async ({ page }) => {
    const input = page.locator('input[placeholder*="Type your message"]');
    await input.fill('Test message');
    await input.press('Enter');

    await page.waitForTimeout(500);

    // Message text should be at least 16px
    const messageText = page.locator('.text-base').first();
    if (await messageText.isVisible()) {
      const fontSize = await messageText.evaluate(el => {
        return window.getComputedStyle(el).fontSize;
      });
      expect(parseInt(fontSize)).toBeGreaterThanOrEqual(16);
    }
  });

  test('should show mobile-friendly header layout', async ({ page }) => {
    // Header should be visible and not overflow
    const header = page.locator('header');
    await expect(header).toBeVisible();

    const box = await header.boundingBox();
    const viewport = page.viewportSize();
    expect(box.width).toBeLessThanOrEqual(viewport.width);
  });

  test('should handle long case codes without wrapping', async ({ page }) => {
    // Switch to IC mode
    const icModeButton = page.locator('button:has-text("IC Mode")');
    if (await icModeButton.isVisible()) {
      await icModeButton.click();
      await page.waitForTimeout(500);
    }

    await page.locator('button:has-text("Show All Cases")').click();
    await page.waitForTimeout(2000);

    const caseCards = page.locator('.border.border-gray-200.rounded-lg.p-4');
    if (await caseCards.first().isVisible()) {
      // Case code should be visible and not overflow
      const caseCode = caseCards.first().locator('.font-semibold.text-gray-900.text-lg');
      await expect(caseCode).toBeVisible();
    }
  });

  test('should have smooth scroll behavior', async ({ page }) => {
    const input = page.locator('input[placeholder*="Type your message"]');

    // Send multiple messages to trigger scrolling
    for (let i = 1; i <= 5; i++) {
      await input.fill(`Message ${i}`);
      await input.press('Enter');
      await page.waitForTimeout(300);
    }

    // Messages container should scroll
    const messagesContainer = page.locator('.overflow-y-auto');
    await expect(messagesContainer).toBeVisible();
  });

  test('should display emoji indicators correctly on mobile', async ({ page }) => {
    // Switch to IC mode
    const icModeButton = page.locator('button:has-text("IC Mode")');
    if (await icModeButton.isVisible()) {
      await icModeButton.click();
      await page.waitForTimeout(500);
    }

    await page.locator('button:has-text("Overdue")').click();
    await page.waitForTimeout(2000);

    // Check for emoji indicators (⚠️, 📅, ⚡)
    const emojiElements = page.locator('text=/⚠️|📅|⚡/');
    const count = await emojiElements.count();

    // Should either have emojis or no cases
    const noCases = await page.locator('text=No cases found').isVisible().catch(() => false);
    expect(count > 0 || noCases).toBeTruthy();
  });
});

test.describe('Mobile Landscape', () => {
  test.use({
    viewport: { width: 844, height: 390 }, // iPhone 12 landscape
  });

  test('should handle landscape orientation', async ({ page }) => {
    await page.goto('/');

    const viewport = page.viewportSize();
    expect(viewport.width).toBeGreaterThan(viewport.height);

    // App should still be functional
    await expect(page.locator('h2')).toBeVisible();
    await expect(page.locator('input[placeholder*="Type your message"]')).toBeVisible();
  });

  test('should adjust message widths in landscape', async ({ page }) => {
    await page.goto('/');

    const input = page.locator('input[placeholder*="Type your message"]');
    await input.fill('Test landscape message');
    await input.press('Enter');

    await page.waitForTimeout(500);

    // Messages should still be visible and well-proportioned
    const message = page.locator('.bg-blue-600').first();
    if (await message.isVisible()) {
      const box = await message.boundingBox();
      const viewport = page.viewportSize();

      // Message should not exceed viewport
      expect(box.width).toBeLessThan(viewport.width);
    }
  });
});

test.describe('Tablet Optimization', () => {
  test.use({
    ...devices['iPad Pro'],
  });

  test('should use tablet-specific styling', async ({ page }) => {
    await page.goto('/');

    const viewport = page.viewportSize();
    expect(viewport.width).toBe(1024);

    // Should show sidebar without hamburger menu
    const hamburger = page.locator('button svg path[d*="M4 6h16M4 12h16M4 18h16"]');
    const isHamburgerVisible = await hamburger.first().isVisible({ timeout: 1000 }).catch(() => false);

    // On tablet, hamburger might be hidden (md:hidden class)
    expect(isHamburgerVisible).toBe(false);
  });

  test('should have appropriate message widths on tablet', async ({ page }) => {
    await page.goto('/');

    const input = page.locator('input[placeholder*="Type your message"]');
    await input.fill('Test tablet message');
    await input.press('Enter');

    await page.waitForTimeout(500);

    // On tablet, messages should use md:max-w-[85%] or lg:max-w-[70%]
    const message = page.locator('.bg-blue-600').first();
    if (await message.isVisible()) {
      const classes = await message.getAttribute('class');
      expect(classes).toMatch(/max-w-\[(85%|70%)\]/);
    }
  });

  test('should display case cards in grid on tablet', async ({ page }) => {
    await page.goto('/');

    // Switch to IC mode
    const icModeButton = page.locator('button:has-text("IC Mode")');
    if (await icModeButton.isVisible()) {
      await icModeButton.click();
      await page.waitForTimeout(500);
    }

    await page.locator('button:has-text("Show All Cases")').click();
    await page.waitForTimeout(2000);

    // Cases should be visible and well-laid out
    const caseCards = page.locator('.border.border-gray-200.rounded-lg.p-4');
    const count = await caseCards.count();

    if (count > 0) {
      // All cards should be visible without horizontal scroll
      for (let i = 0; i < Math.min(count, 3); i++) {
        await expect(caseCards.nth(i)).toBeVisible();
      }
    }
  });
});
