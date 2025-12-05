import { test, expect } from '@playwright/test';

test.describe('Employee Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // Ensure we're in employee mode
    const employeeModeButton = page.locator('button:has-text("Employee Mode")');
    if (await employeeModeButton.isVisible()) {
      await employeeModeButton.click();
    }
  });

  test('should display employee portal header', async ({ page }) => {
    await expect(page.locator('h2:has-text("Employee Portal")')).toBeVisible();
    await expect(page.locator('text=Submit and track your cases')).toBeVisible();
    await expect(page.locator('text=Employee Mode')).toBeVisible();
  });

  test('should display welcome message when no messages', async ({ page }) => {
    await expect(page.locator('h3:has-text("Welcome to ConductOS")')).toBeVisible();
    await expect(page.locator('text=How can I help you today?')).toBeVisible();
  });

  test('should display employee quick action chips', async ({ page }) => {
    await expect(page.locator('button:has-text("I want to report harassment")')).toBeVisible();
    await expect(page.locator('button:has-text("Check my case status")')).toBeVisible();
    await expect(page.locator('button:has-text("What is PoSH?")')).toBeVisible();
    await expect(page.locator('button:has-text("I need help with workplace conduct")')).toBeVisible();
  });

  test('should have functional input field', async ({ page }) => {
    const input = page.locator('input[placeholder*="Type your message"]');
    await expect(input).toBeVisible();
    await expect(input).toBeEditable();

    await input.fill('Test message');
    await expect(input).toHaveValue('Test message');
  });

  test('should enable send button when input has text', async ({ page }) => {
    const input = page.locator('input[placeholder*="Type your message"]');
    const sendButton = page.locator('button[aria-label="Send message"]');

    // Send button should be disabled initially
    await expect(sendButton).toBeDisabled();

    // Type text
    await input.fill('Hello');
    await expect(sendButton).toBeEnabled();

    // Clear text
    await input.clear();
    await expect(sendButton).toBeDisabled();
  });

  test('should send message when send button clicked', async ({ page }) => {
    const input = page.locator('input[placeholder*="Type your message"]');
    const sendButton = page.locator('button[aria-label="Send message"]');

    await input.fill('What is PoSH?');
    await sendButton.click();

    // User message should appear
    await expect(page.locator('text=What is PoSH?').first()).toBeVisible();

    // Input should be cleared
    await expect(input).toHaveValue('');

    // Typing indicator should appear
    await expect(page.locator('.animate-pulse')).toBeVisible({ timeout: 5000 });
  });

  test('should send message when Enter key pressed', async ({ page }) => {
    const input = page.locator('input[placeholder*="Type your message"]');

    await input.fill('What is PoSH?');
    await input.press('Enter');

    // User message should appear
    await expect(page.locator('text=What is PoSH?').first()).toBeVisible();

    // Input should be cleared
    await expect(input).toHaveValue('');
  });

  test('should send message when quick chip clicked', async ({ page }) => {
    const chip = page.locator('button:has-text("What is PoSH?")');
    await chip.click();

    // User message should appear
    await expect(page.locator('text=What is PoSH?').first()).toBeVisible();

    // System response should appear
    await expect(page.locator('.bg-white.border.border-gray-200')).toBeVisible({ timeout: 10000 });
  });

  test('should trigger intake flow when report harassment clicked', async ({ page }) => {
    const chip = page.locator('button:has-text("I want to report harassment")');
    await chip.click();

    // Wait for intake flow to start
    await page.waitForTimeout(2000);

    // Check if intake flow started (either message or flow UI)
    const hasIntakeMessage = await page.locator('text=/would you like to proceed|tell me more/i').isVisible({ timeout: 5000 }).catch(() => false);
    const hasIntakeForm = await page.locator('text=/incident date|description/i').isVisible({ timeout: 5000 }).catch(() => false);

    expect(hasIntakeMessage || hasIntakeForm).toBeTruthy();
  });

  test('should display timestamps on messages', async ({ page }) => {
    const input = page.locator('input[placeholder*="Type your message"]');
    await input.fill('Test message');
    await input.press('Enter');

    // Wait for message to appear
    await page.waitForTimeout(500);

    // Check for timestamp text (e.g., "Just now" or time)
    const timestamps = page.locator('.text-xs.mt-1\\.5');
    await expect(timestamps.first()).toBeVisible();
  });

  test('should maintain chat history as user interacts', async ({ page }) => {
    const input = page.locator('input[placeholder*="Type your message"]');

    // Send first message
    await input.fill('First message');
    await input.press('Enter');
    await page.waitForTimeout(500);

    // Send second message
    await input.fill('Second message');
    await input.press('Enter');
    await page.waitForTimeout(500);

    // Both messages should be visible
    await expect(page.locator('text=First message').first()).toBeVisible();
    await expect(page.locator('text=Second message').first()).toBeVisible();
  });

  test('should have accessible input with aria-label', async ({ page }) => {
    const input = page.locator('input[aria-label*="Type your message"]');
    await expect(input).toBeVisible();
  });

  test('should have accessible send button with aria-label', async ({ page }) => {
    const button = page.locator('button[aria-label="Send message"]');
    await expect(button).toBeVisible();
  });

  test('should support Shift+Enter for multiline (not send)', async ({ page }) => {
    const input = page.locator('input[placeholder*="Type your message"]');

    await input.fill('Line 1');
    await input.press('Shift+Enter');

    // Input should still have text (not sent)
    await expect(input).toHaveValue('Line 1');

    // No message should appear in chat
    const messageCount = await page.locator('text=Line 1').count();
    expect(messageCount).toBe(0);
  });

  test('should display mode badge', async ({ page }) => {
    const badge = page.locator('.bg-blue-100.text-blue-700:has-text("Employee Mode")');
    await expect(badge).toBeVisible();
  });
});
