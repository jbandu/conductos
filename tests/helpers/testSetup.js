/**
 * Test Setup Helpers
 * Provides utilities for handling different test environments (CI vs local)
 */

import { test as base } from '@playwright/test';

/**
 * Check if the backend API server is available
 * @param {string} baseUrl - Base URL to check
 * @returns {Promise<boolean>}
 */
export async function isBackendAvailable(baseUrl = 'http://localhost:3001') {
  try {
    const response = await fetch(`${baseUrl}/api/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    return response.ok;
  } catch (error) {
    // Server not available
    return false;
  }
}

/**
 * Extended test fixture that provides backend availability check
 */
export const test = base.extend({
  /**
   * Whether the backend API is available for real API tests
   */
  backendAvailable: async ({}, use) => {
    const available = await isBackendAvailable();
    await use(available);
  }
});

/**
 * Skip test if running in CI without backend server
 * Use this for tests that require real API calls
 */
export function skipInCIWithoutBackend() {
  if (process.env.CI && !process.env.BACKEND_AVAILABLE) {
    return true;
  }
  return false;
}

/**
 * Environment flags
 */
export const isCI = !!process.env.CI;
export const hasBackend = !!process.env.BACKEND_AVAILABLE;
