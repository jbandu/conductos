/**
 * SSO Encryption Utilities
 * Handles encryption/decryption of sensitive SSO data like tokens and secrets
 */

import crypto from 'crypto';
import { config } from '../../config.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 64;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

// Derive encryption key from JWT_SECRET (or use dedicated SSO_ENCRYPTION_KEY if available)
function getEncryptionKey() {
  const secret = process.env.SSO_ENCRYPTION_KEY || config.JWT_SECRET;
  const salt = process.env.SSO_ENCRYPTION_SALT || 'conductos-sso-default-salt';
  return crypto.pbkdf2Sync(secret, salt, ITERATIONS, KEY_LENGTH, 'sha512');
}

/**
 * Encrypt sensitive data
 * @param {string} plaintext - Data to encrypt
 * @returns {string} - Base64 encoded encrypted data
 */
export function encrypt(plaintext) {
  if (!plaintext) return null;

  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = getEncryptionKey();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Combine IV + AuthTag + Encrypted data
    const combined = Buffer.concat([
      iv,
      authTag,
      Buffer.from(encrypted, 'hex')
    ]);

    return combined.toString('base64');
  } catch (error) {
    console.error('Encryption error:', error.message);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt sensitive data
 * @param {string} encryptedData - Base64 encoded encrypted data
 * @returns {string} - Decrypted plaintext
 */
export function decrypt(encryptedData) {
  if (!encryptedData) return null;

  try {
    const combined = Buffer.from(encryptedData, 'base64');

    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error.message);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Generate a secure random token
 * @param {number} length - Token length in bytes
 * @returns {string} - Hex encoded token
 */
export function generateSecureToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash a value for storage (one-way)
 * @param {string} value - Value to hash
 * @returns {string} - Hashed value
 */
export function hashValue(value) {
  if (!value) return null;
  return crypto.createHash('sha256').update(value).digest('hex');
}

/**
 * Generate a state parameter for OAuth/SAML flows
 * @returns {object} - { state, stateHash }
 */
export function generateState() {
  const state = generateSecureToken(32);
  const stateHash = hashValue(state);
  return { state, stateHash };
}

/**
 * Generate a nonce for OIDC flows
 * @returns {string} - Nonce value
 */
export function generateNonce() {
  return generateSecureToken(16);
}

/**
 * Generate code verifier and challenge for PKCE
 * @returns {object} - { codeVerifier, codeChallenge }
 */
export function generatePKCE() {
  const codeVerifier = crypto.randomBytes(32)
    .toString('base64url')
    .substring(0, 128);

  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');

  return { codeVerifier, codeChallenge };
}

/**
 * Verify PKCE code challenge
 * @param {string} codeVerifier - Original code verifier
 * @param {string} codeChallenge - Challenge to verify
 * @returns {boolean} - Whether the challenge is valid
 */
export function verifyPKCE(codeVerifier, codeChallenge) {
  const computed = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');

  return crypto.timingSafeEqual(
    Buffer.from(computed),
    Buffer.from(codeChallenge)
  );
}

export default {
  encrypt,
  decrypt,
  generateSecureToken,
  hashValue,
  generateState,
  generateNonce,
  generatePKCE,
  verifyPKCE
};
