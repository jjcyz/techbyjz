/**
 * Admin authentication endpoint
 */

import { NextRequest } from 'next/server';
import { verifyAdminPassword, createAdminSessionResponse, createLogoutResponse } from '@/lib/admin-auth';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

// Stricter rate limit for admin auth (prevent brute force)
const ADMIN_AUTH_RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // Only 5 attempts per 15 minutes per IP
};

export async function POST(request: NextRequest) {
  try {
    // Rate limiting to prevent brute force attacks
    const rateLimit = checkRateLimit(request, ADMIN_AUTH_RATE_LIMIT);
    if (!rateLimit.allowed) {
      const retryAfter = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
      return Response.json(
        {
          success: false,
          error: 'Too many login attempts. Please try again later.',
          retryAfter
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
            'X-RateLimit-Limit': String(ADMIN_AUTH_RATE_LIMIT.maxRequests),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': String(rateLimit.resetTime),
          }
        }
      );
    }

    const { password } = await request.json();

    if (!password) {
      return Response.json(
        { success: false, error: 'Password is required' },
        { status: 400 }
      );
    }

    if (!verifyAdminPassword(password)) {
      return Response.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      );
    }

    return createAdminSessionResponse({
      success: true,
      message: 'Authentication successful',
    });
  } catch (error) {
    console.error('Authentication error:', error);
    return Response.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  return createLogoutResponse();
}
