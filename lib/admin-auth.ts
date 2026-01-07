/**
 * Simple admin authentication for private admin interface
 * Uses password-based authentication via environment variable
 */

import { NextRequest, NextResponse } from 'next/server';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';
const ADMIN_SESSION_COOKIE = 'admin_session';
const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || 'change-me-in-production';

/**
 * Verify admin password
 */
export function verifyAdminPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

/**
 * Create admin session
 */
export function createAdminSession(): string {
  // Simple session token (in production, use proper JWT or session management)
  const sessionToken = Buffer.from(`${Date.now()}-${ADMIN_SESSION_SECRET}`).toString('base64');
  return sessionToken;
}

/**
 * Verify admin session
 */
export function verifyAdminSession(sessionToken: string): boolean {
  try {
    const decoded = Buffer.from(sessionToken, 'base64').toString('utf-8');
    const [timestamp, secret] = decoded.split('-');

    // Check if secret matches
    if (secret !== ADMIN_SESSION_SECRET) {
      return false;
    }

    // Check if session is not too old (24 hours)
    const sessionAge = Date.now() - parseInt(timestamp, 10);
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    return sessionAge < maxAge;
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
    sameSite: 'lax',
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

