import { test, expect } from '@playwright/test';

test.describe('Admin Features', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login/admin');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard');
  });

  test.describe('Admin Dashboard', () => {
    test('should display dashboard stats', async ({ page }) => {
      await expect(page.locator('text=Admin Dashboard')).toBeVisible();
      await expect(page.locator('text=Total Users')).toBeVisible();
      await expect(page.locator('text=Active Cases')).toBeVisible();
      await expect(page.locator('text=IC Members')).toBeVisible();
    });

    test('should have navigation to all admin pages', async ({ page }) => {
      await expect(page.locator('a[href="/admin/users"]')).toBeVisible();
      await expect(page.locator('a[href="/admin/ic-composition"]')).toBeVisible();
      await expect(page.locator('a[href="/admin/audit-log"]')).toBeVisible();
      await expect(page.locator('a[href="/admin/organization"]')).toBeVisible();
    });
  });

  test.describe('Audit Log Viewer', () => {
    test('should display audit log page', async ({ page }) => {
      await page.goto('/admin/audit-log');

      await expect(page.locator('h1:has-text("Audit Log")')).toBeVisible();
      await expect(page.locator('text=Track all administrative actions')).toBeVisible();
    });

    test('should show statistics cards', async ({ page }) => {
      await page.goto('/admin/audit-log');

      await expect(page.locator('text=Total Actions (30d)')).toBeVisible();
      await expect(page.locator('text=Active Admins')).toBeVisible();
      await expect(page.locator('text=Action Types')).toBeVisible();
      await expect(page.locator('text=Latest Activity')).toBeVisible();
    });

    test('should have filter options', async ({ page }) => {
      await page.goto('/admin/audit-log');

      await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
      await expect(page.locator('select').first()).toBeVisible(); // Action type filter
      await expect(page.locator('input[type="date"]').first()).toBeVisible(); // Start date
      await expect(page.locator('input[type="date"]').last()).toBeVisible(); // End date
    });

    test('should display audit log table', async ({ page }) => {
      await page.goto('/admin/audit-log');

      // Check for table headers
      await expect(page.locator('th:has-text("Timestamp")')).toBeVisible();
      await expect(page.locator('th:has-text("Admin")')).toBeVisible();
      await expect(page.locator('th:has-text("Action")')).toBeVisible();
      await expect(page.locator('th:has-text("Target")')).toBeVisible();
      await expect(page.locator('th:has-text("Details")')).toBeVisible();
    });
  });

  test.describe('Organization Settings', () => {
    test('should display organization settings page', async ({ page }) => {
      await page.goto('/admin/organization');

      await expect(page.locator('h1:has-text("Organization Settings")')).toBeVisible();
      await expect(page.locator('text=Manage your organization details')).toBeVisible();
    });

    test('should show organization statistics', async ({ page }) => {
      await page.goto('/admin/organization');

      await expect(page.locator('text=Total Users')).toBeVisible();
      await expect(page.locator('text=Total Cases')).toBeVisible();
      await expect(page.locator('text=IC Members')).toBeVisible();
    });

    test('should display organization details form', async ({ page }) => {
      await page.goto('/admin/organization');

      await expect(page.locator('text=Organization Name')).toBeVisible();
      await expect(page.locator('text=Domain')).toBeVisible();
      await expect(page.locator('text=Industry')).toBeVisible();
      await expect(page.locator('text=Employee Count')).toBeVisible();
      await expect(page.locator('text=District Officer Email')).toBeVisible();
    });

    test('should have edit organization button', async ({ page }) => {
      await page.goto('/admin/organization');

      const editButton = page.locator('button:has-text("Edit Organization Details")');
      await expect(editButton).toBeVisible();

      // Click to enter edit mode
      await editButton.click();

      // Should show form inputs
      await expect(page.locator('input[name="name"]')).toBeVisible();
      await expect(page.locator('button:has-text("Save Changes")')).toBeVisible();
      await expect(page.locator('button:has-text("Cancel")')).toBeVisible();
    });

    test('should display user role breakdown', async ({ page }) => {
      await page.goto('/admin/organization');

      await expect(page.locator('text=User Role Breakdown')).toBeVisible();
    });
  });
});
