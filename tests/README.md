# E2E Testing Suite for ConductOS

Comprehensive end-to-end testing suite built with Playwright for the KelpHR ConductOS application.

## Setup

### Install Dependencies

```bash
npm install
```

### Install Playwright Browsers

```bash
npx playwright install
```

If you encounter system dependency issues on Linux, install them with:

```bash
sudo npx playwright install-deps
```

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Tests with UI Mode (Recommended for Development)

```bash
npm run test:ui
```

This opens an interactive UI where you can:
- See all tests
- Run specific tests
- View test execution in real-time
- Debug failures with time-travel debugging
- View traces and screenshots

### Run Tests in Headed Mode (See Browser)

```bash
npm run test:headed
```

### Debug a Specific Test

```bash
npm run test:debug
```

### Run Specific Test Suites

```bash
# Employee mode tests only
npm run test:employee

# IC mode tests only
npm run test:ic

# Intake flow tests only
npm run test:intake

# Case management tests only
npm run test:cases

# Mobile tests only
npm run test:mobile
```

### View Test Report

After running tests, view the HTML report:

```bash
npm run test:report
```

## Test Structure

### `employee-mode.spec.js`
Tests for employee portal functionality:
- Employee interface and navigation
- Quick action chips
- Message sending (input, Enter key, chips)
- Input validation
- Chat history
- Timestamps
- Accessibility features

**Key Tests:**
- 15+ tests covering employee-specific UI
- Input field validation
- Send button state management
- Quick chip interactions
- Message display and formatting

### `ic-mode.spec.js`
Tests for Investigation Committee dashboard:
- IC dashboard interface
- Case filtering (All, Pending, Overdue, Today's Deadlines)
- Case search functionality
- Case list display
- Deadline indicators
- IC-specific quick actions

**Key Tests:**
- 14+ tests for IC mode features
- Case filtering and search
- Dashboard layout and badges
- Accessibility features

### `intake-flow.spec.js`
Tests for the complaint intake process:
- Multi-step form flow
- Pre-intake consent
- Incident date selection and validation
- Description textarea with character count
- Conciliation options
- Anonymity selection
- Contact information collection
- Summary and submission

**Key Tests:**
- 20+ tests covering the entire 8-step intake flow
- Field validation (date, description length)
- Navigation (Next, Back buttons)
- Form state management
- Future date prevention
- Minimum description length

### `case-management.spec.js`
Tests for case listing and detail views:
- Case card structure and formatting
- Case code format (KELP-YYYY-NNNN)
- Status badges with color coding
- Deadline warnings and urgency indicators
- Case detail view
- Status history timeline
- Overdue alerts
- Case search and filtering
- Anonymous/conciliation indicators

**Key Tests:**
- 24+ tests for comprehensive case management
- Case card hover effects
- Clickable case cards
- Detail view with full information
- Timeline visualization
- Empty states
- Date formatting consistency

### `mobile.spec.js`
Tests for mobile and tablet optimization:
- Mobile viewport (iPhone 12)
- Touch-friendly targets (48x48px minimum)
- Safe area padding for notch
- Font size minimum (16px to prevent zoom)
- Hamburger menu visibility
- Message width optimization (90% on mobile)
- Touch feedback (scale, color)
- Horizontal chip scrolling
- Native date picker
- Landscape orientation
- Tablet-specific layouts (iPad Pro)

**Key Tests:**
- 30+ tests across mobile, landscape, and tablet
- Touch target size validation
- Viewport-specific behavior
- Safe area insets
- Emoji display on mobile
- Smooth scrolling
- Keyboard handling

## Test Configuration

### Playwright Configuration (`playwright.config.js`)

The test suite runs across multiple browsers and devices:

**Desktop Browsers:**
- Chromium (Chrome/Edge)
- Firefox
- WebKit (Safari)

**Mobile Devices:**
- Pixel 5 (Android)
- iPhone 12 (iOS)

**Tablet:**
- iPad Pro

### Key Configuration Options:

```javascript
{
  baseURL: 'http://localhost:5173',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  }
}
```

## Test Coverage

### Total Tests: 100+

- **Employee Mode:** 15 tests
- **IC Mode:** 14 tests
- **Intake Flow:** 20 tests
- **Case Management:** 24 tests
- **Mobile/Tablet:** 30 tests

### Coverage Areas:

✅ User Interface & Layout
✅ Navigation & Routing
✅ Form Validation
✅ Data Display & Formatting
✅ Interactive Elements
✅ Accessibility (ARIA labels, keyboard)
✅ Mobile Responsiveness
✅ Touch Interactions
✅ Error Handling
✅ Empty States

## Best Practices

### When Writing New Tests:

1. **Use Descriptive Test Names**
   ```javascript
   test('should display overdue alert for cases past deadline', async ({ page }) => {
     // ...
   });
   ```

2. **Wait for Elements Properly**
   ```javascript
   await expect(element).toBeVisible({ timeout: 5000 });
   ```

3. **Handle Conditional Elements**
   ```javascript
   const hasElement = await element.isVisible().catch(() => false);
   if (hasElement) {
     // test logic
   }
   ```

4. **Use Page Object Pattern for Complex Flows**
   ```javascript
   const loginPage = new LoginPage(page);
   await loginPage.login('user', 'pass');
   ```

5. **Test Mobile-First**
   - Always consider mobile viewports
   - Verify touch targets
   - Check for safe area padding

## Debugging Tests

### Visual Debugging with UI Mode

```bash
npm run test:ui
```

- Time-travel through test execution
- Inspect DOM at any point
- View network requests
- See console logs

### Debug Single Test

```bash
npx playwright test --debug tests/employee-mode.spec.js:15
```

### View Traces

When a test fails, Playwright captures a trace. View it with:

```bash
npx playwright show-trace trace.zip
```

## CI/CD Integration

### GitHub Actions Example:

```yaml
- name: Install dependencies
  run: npm install

- name: Install Playwright browsers
  run: npx playwright install --with-deps

- name: Run tests
  run: npm test
```

### Environment Variables:

- `CI=true` - Enables retries and optimized settings
- `PLAYWRIGHT_JUNIT_OUTPUT_NAME` - JUnit report path

## Troubleshooting

### Tests Fail with "Target Closed" Error

Ensure the dev server is running:
```bash
npm run dev
```

### Timeout Errors

Increase timeout in specific tests:
```javascript
test('slow operation', async ({ page }) => {
  await expect(element).toBeVisible({ timeout: 30000 });
});
```

### Flaky Tests

- Add explicit waits
- Use `toBeVisible()` instead of `isVisible()`
- Ensure proper test isolation
- Check for race conditions

### Browser Dependencies Missing

Install system dependencies:
```bash
sudo npx playwright install-deps
```

## Useful Commands

```bash
# Run tests in specific browser
npx playwright test --project=chromium

# Run tests matching pattern
npx playwright test employee

# Generate test code
npx playwright codegen http://localhost:5173

# List all tests
npx playwright test --list

# Run tests in parallel workers
npx playwright test --workers=4
```

## Contributing

When adding new features:

1. Write tests first (TDD approach)
2. Ensure tests cover happy path and edge cases
3. Test mobile and desktop viewports
4. Verify accessibility
5. Run full test suite before committing

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Test Selectors](https://playwright.dev/docs/selectors)
- [Debugging Guide](https://playwright.dev/docs/debug)
