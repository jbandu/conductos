# Continuous Integration Setup

This document explains the GitHub Actions CI pipeline for running Playwright tests.

## Overview

The CI pipeline automatically runs Playwright tests on:
- **Push to main branch** - When code is directly pushed to main
- **Push to render-deployment branch** - When code is pushed to deployment branch
- **Pull Requests** - When PRs are created targeting main or render-deployment

## Workflow Configuration

The workflow is defined in `.github/workflows/playwright-tests.yml`

### Key Features

1. **PostgreSQL Database**
   - A PostgreSQL 15 service container is automatically started
   - Database: `conductos_test`
   - Credentials: `postgres/postgres`
   - Health checks ensure database is ready before tests run

2. **Browser Testing**
   - **Chromium only** - To keep CI fast and avoid dependency issues
   - Mobile Safari/WebKit skipped due to system dependency requirements
   - Can be extended to test other browsers if needed

3. **Environment Setup**
   - Node.js 18
   - All npm dependencies installed
   - Playwright browsers installed automatically
   - Test environment variables configured

4. **Test Artifacts**
   - Test reports uploaded and available for 30 days
   - Screenshots and videos of failures automatically captured
   - Download artifacts from the Actions tab in GitHub

## Viewing Test Results

### On GitHub

1. Go to your repository on GitHub
2. Click the "Actions" tab
3. Click on the workflow run you want to inspect
4. View the test summary and download artifacts

### Test Reports

After each run, two artifacts are uploaded:

- **playwright-report** - HTML report with detailed test results
- **test-results** - Raw test results, screenshots, and videos

To view the HTML report:
1. Download the `playwright-report` artifact
2. Unzip the file
3. Open `index.html` in a browser

## Running Tests Locally

To run the same tests that run in CI:

```bash
# Run only Chromium tests (like CI)
npx playwright test --project=chromium

# Run with visible browser
npx playwright test --project=chromium --headed

# Run specific test file
npx playwright test tests/admin/admin-features.spec.js --project=chromium
```

## Configuration Files

- `.github/workflows/playwright-tests.yml` - GitHub Actions workflow
- `playwright.config.js` - Playwright configuration
- `.env.example` - Example environment variables (copied in CI)

## Test Environment Variables

The CI pipeline uses these environment variables:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/conductos_test
NODE_ENV=test
PORT=3001
JWT_SECRET=test-secret-key-for-ci
CI=true
```

## Troubleshooting

### Tests Timeout
- Default timeout is 60 minutes for entire workflow
- Individual test timeout is 30 seconds
- Check the Playwright report for specific failing tests

### Database Connection Errors
- PostgreSQL service container should start automatically
- Health checks verify database is ready
- Check workflow logs for "Verify database connection" step

### Missing Dependencies
- Chromium dependencies installed via `--with-deps` flag
- If you add new browsers, update the install command

## Extending the Pipeline

### Add More Browsers

To test on Firefox or WebKit, update the workflow:

```yaml
- name: Install Playwright Browsers
  run: npx playwright install --with-deps chromium firefox webkit

- name: Run Playwright tests
  run: npx playwright test --project=chromium --project=firefox
```

### Add Code Coverage

Add a coverage step after tests:

```yaml
- name: Generate coverage report
  run: npm run test:coverage

- name: Upload coverage
  uses: codecov/codecov-action@v3
```

### Run on Multiple Node Versions

Add a matrix strategy:

```yaml
strategy:
  matrix:
    node-version: [16, 18, 20]
```

## Performance Optimization

Current optimizations:
- ✅ npm cache enabled
- ✅ Only Chromium browser installed
- ✅ Tests run in parallel (default Playwright behavior)
- ✅ PostgreSQL health checks prevent premature test execution

Potential improvements:
- Add dependency caching for Playwright browsers
- Split test suites into separate jobs for parallel execution
- Use sharding for very large test suites

## Status Badge

Add this to your README.md to show test status:

```markdown
![Playwright Tests](https://github.com/YOUR_USERNAME/conductos/actions/workflows/playwright-tests.yml/badge.svg)
```

Replace `YOUR_USERNAME` with your GitHub username.
