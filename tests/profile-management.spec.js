import { test, expect } from '@playwright/test';

test.describe('Profile Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as employee
    await page.goto('/login/employee');
    await page.fill('input[type="email"]', 'employee@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/chat');
  });

  test('should navigate to profile page', async ({ page }) => {
    await page.goto('/profile');

    await expect(page.locator('h1:has-text("My Profile")')).toBeVisible();
  });

  test('should display user information', async ({ page }) => {
    await page.goto('/profile');

    // Check for profile sections
    await expect(page.locator('text=Profile Information')).toBeVisible();
    await expect(page.locator('text=Full Name')).toBeVisible();
    await expect(page.locator('text=Email')).toBeVisible();
    await expect(page.locator('text=Role')).toBeVisible();
    await expect(page.locator('text=Member Since')).toBeVisible();
  });

  test('should have edit profile button', async ({ page }) => {
    await page.goto('/profile');

    const editButton = page.locator('button:has-text("Edit Profile")');
    await expect(editButton).toBeVisible();

    // Click to enter edit mode
    await editButton.click();

    // Should show form
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await expect(page.locator('button:has-text("Save Changes")')).toBeVisible();
    await expect(page.locator('button:has-text("Cancel")')).toBeVisible();
  });

  test('should cancel edit mode', async ({ page }) => {
    await page.goto('/profile');

    await page.click('button:has-text("Edit Profile")');
    await page.click('button:has-text("Cancel")');

    // Should return to view mode
    await expect(page.locator('button:has-text("Edit Profile")')).toBeVisible();
  });

  test('should have change password section', async ({ page }) => {
    await page.goto('/profile');

    await expect(page.locator('h2:has-text("Change Password")')).toBeVisible();
    await expect(page.locator('button:has-text("Change Password")')).toBeVisible();
  });

  test('should show password form when clicked', async ({ page }) => {
    await page.goto('/profile');

    await page.click('button:has-text("Change Password")');

    // Should show password fields
    await expect(page.locator('label:has-text("Current Password")')).toBeVisible();
    await expect(page.locator('label:has-text("New Password")')).toBeVisible();
    await expect(page.locator('label:has-text("Confirm New Password")')).toBeVisible();
    await expect(page.locator('button:has-text("Update Password")')).toBeVisible();
  });

  test('should validate password requirements', async ({ page }) => {
    await page.goto('/profile');

    await page.click('button:has-text("Change Password")');

    // Check for validation message
    await expect(page.locator('text=Minimum 8 characters')).toBeVisible();
  });

  test('should have danger zone with logout', async ({ page }) => {
    await page.goto('/profile');

    await expect(page.locator('h2:has-text("Danger Zone")')).toBeVisible();
    await expect(page.locator('button:has-text("Log Out")')).toBeVisible();
    await expect(page.locator('text=Once you log out')).toBeVisible();
  });

  test('should have back button', async ({ page }) => {
    await page.goto('/profile');

    const backButton = page.locator('button:has-text("Back")');
    await expect(backButton).toBeVisible();
  });

  test('logout button should redirect to landing', async ({ page }) => {
    await page.goto('/profile');

    await page.click('button:has-text("Log Out")');

    // Should redirect to landing page
    await page.waitForURL('/');
  });
});
