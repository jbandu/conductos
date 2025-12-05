# ConductOS Test Strategy

This document outlines the comprehensive test strategy for ConductOS, with emphasis on **security, privacy, and legal compliance** testing beyond happy-path scenarios.

## Test Philosophy

> **"Test what must never be allowed"** - especially for a PoSH compliance system where privacy breaches and legal violations have serious consequences.

## Test Structure (5 Layers)

### Layer 1: Smoke & Setup
Basic app functionality, mode toggle, minimal regressions.
- **Location**: `tests/employee-mode.spec.js`, `tests/ic-mode.spec.js`
- **Run frequency**: Every commit

### Layer 2: Core Functional Flows
Happy-path end-to-end scenarios.
- **Location**: `tests/intake-flow.spec.js`, `tests/case-management.spec.js`

### Layer 3: Negative & Boundary Tests ⚠️ **CRITICAL**
**What must NEVER be allowed** - the most important layer.
- **Location**: `tests/security/`
- **Tagged**: `@critical`
- **Run frequency**: Every commit, blocking deployment

### Layer 4: Security & Data Handling
API behavior with malformed/hostile requests.
- **Location**: `tests/security/` (API tests)

### Layer 5: Non-Functional
Mobile viewport, performance.
- **Location**: `tests/mobile.spec.js`

## Critical Security Tests

### 1. Privacy & Anonymity (`privacy-anonymity.spec.js`)
Tests ensure anonymous contact details are NEVER visible.

### 2. 90-Day Deadlines (`deadlines-boundary.spec.js`)
Tests ensure legal compliance with PoSH Act deadlines.

### 3. Mode Visibility (`mode-visibility-abuse.spec.js`)
Tests ensure Employee mode cannot access IC-only features.

## Running Tests

```bash
# All tests
npm test

# Critical tests only
npx playwright test --grep "@critical"

# Specific suite
npm run test:employee
npm run test:ic
npm run test:intake
```

See full documentation at https://playwright.dev
