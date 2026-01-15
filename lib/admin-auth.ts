/**
 * Admin authentication for private admin interface
 * Uses password-based authentication via environment variable
 *
 * SECURITY NOTES:
 * - No default password - ADMIN_PASSWORD env var is required
 * - No default session secret - ADMIN_SESSION_SECRET env var is required
 * - Uses constant-time comparison to prevent timing attacks
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomBytes, createHmac } from 'crypto';
import { secureCompare } from './security';

const ADMIN_SESSION_COOKIE = 'admin_session';

/**
 * Get admin password from environment (required, no default)
 */
function getAdminPassword(): string | null {
  return process.env.ADMIN_PASSWORD || null;
}

/**
 * Get session secret from environment (required, no default)
 */
function getSessionSecret(): string | null {
  return process.env.ADMIN_SESSION_SECRET || null;
}

/**
 * Verify admin password using constant-time comparison
 */
export function verifyAdminPassword(password: string): boolean {
  const adminPassword = getAdminPassword();

  // Fail-safe: if password not configured, deny all access
  if (!adminPassword) {
    console.error('ADMIN_PASSWORD not configured - admin access denied');
    return false;
  }

  return secureCompare(password, adminPassword);
}

/**
 * Create admin session with secure token
 */
export function createAdminSession(): string {
  const sessionSecret = getSessionSecret();

  if (!sessionSecret) {
    throw new Error('ADMIN_SESSION_SECRET not configured');
  }

  const timestamp = Date.now().toString();
  const nonce = randomBytes(16).toString('hex');

  // Create HMAC signature for the session data
  const hmac = createHmac('sha256', sessionSecret);
  hmac.update(`${timestamp}:${nonce}`);
  const signature = hmac.digest('hex');

  // Token format: timestamp:nonce:signature
  const sessionToken = Buffer.from(`${timestamp}:${nonce}:${signature}`).toString('base64');
  return sessionToken;
}

/**
 * Verify admin session
 */
export function verifyAdminSession(sessionToken: string): boolean {
  try {
    const sessionSecret = getSessionSecret();

    if (!sessionSecret) {
      console.error('ADMIN_SESSION_SECRET not configured - session verification failed');
      return false;
    }

    const decoded = Buffer.from(sessionToken, 'base64').toString('utf-8');
    const parts = decoded.split(':');

    if (parts.length !== 3) {
      return false;
    }

    const [timestamp, nonce, providedSignature] = parts;

    // Verify HMAC signature
    const hmac = createHmac('sha256', sessionSecret);
    hmac.update(`${timestamp}:${nonce}`);
    const expectedSignature = hmac.digest('hex');

    if (!secureCompare(providedSignature, expectedSignature)) {
      return false;
    }

    // Check if session is not too old (24 hours)
    const sessionAge = Date.now() - parseInt(timestamp, 10);
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    return sessionAge < maxAge && sessionAge >= 0;
  } catch {
    return false;
  }
}

/**
 * Get admin session from request
 */
export function getAdminSession(request: NextRequest): string | null {
  return request.cookies.get(ADMIN_SESSION_COOKIE)?.value || null;
}

/**
 * Check if user is authenticated as admin
 */
export async function isAdminAuthenticated(request: NextRequest): Promise<boolean> {
  const sessionToken = getAdminSession(request);
  if (!sessionToken) {
    return false;
  }
  return verifyAdminSession(sessionToken);
}

/**
 * Create response with admin session cookie
 */
export function createAdminSessionResponse(data: unknown, status = 200): NextResponse {
  const sessionToken = createAdminSession();
  const response = NextResponse.json(data, { status });

  response.cookies.set(ADMIN_SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60, // 24 hours
    path: '/',
  });

  return response;
}

/**
 * Create response that clears admin session
 */
export function createLogoutResponse(): NextResponse {
  const response = NextResponse.json({ success: true, message: 'Logged out' });
  response.cookies.delete(ADMIN_SESSION_COOKIE);
  return response;
}
