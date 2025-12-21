/**
 * API endpoint for importing markdown content from AI models
 * POST /api/import-markdown
 * Body: { markdown: string, postId?: string, title?: string, excerpt?: string }
 */

import { NextRequest } from 'next/server';
import { checkRateLimit, RATE_LIMITS, isBot } from '@/lib/rate-limit';
import { secureCompare } from '@/lib/security';
import { successResponse, ApiErrors } from '@/lib/api-response';
import { importPost } from '@/lib/import-post';

// Maximum request body size (10MB)
const MAX_BODY_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    // Block bots
    const userAgent = request.headers.get('user-agent');
    if (isBot(userAgent)) {
      return ApiErrors.forbidden();
    }

    // Rate limiting
    const rateLimit = checkRateLimit(request, RATE_LIMITS.IMPORT);
    if (!rateLimit.allowed) {
      const retryAfter = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
      const response = ApiErrors.tooManyRequests(retryAfter);
      // Add rate limit headers
      response.headers.set('Retry-After', String(retryAfter));
      response.headers.set('X-RateLimit-Limit', String(RATE_LIMITS.IMPORT.maxRequests));
      response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
      response.headers.set('X-RateLimit-Reset', String(rateLimit.resetTime));
      return response;
    }

    // Require API key authentication for this sensitive endpoint
    const apiKey = request.headers.get('x-api-key');
    const expectedApiKey = process.env.API_KEY;

    if (!expectedApiKey) {
      return ApiErrors.internalError('Server configuration error: API_KEY not set');
    }

    if (!apiKey || !secureCompare(apiKey, expectedApiKey)) {
      return ApiErrors.unauthorized();
    }

    // Validate request body size - read as text first to prevent header spoofing
    // Note: We read as text, validate size, then parse as JSON
    const bodyText = await request.text();

    // Validate actual body size (not just header)
    if (bodyText.length > MAX_BODY_SIZE) {
      return ApiErrors.badRequest('Request body too large (max 10MB)');
    }

    // Parse JSON body
    let body: {
      markdown?: string;
      postId?: string;
      title?: string;
      excerpt?: string;
      categoryIds?: string[];
      tagIds?: string[];
    };

    try {
      body = JSON.parse(bodyText);
    } catch {
      return ApiErrors.badRequest('Invalid JSON in request body');
    }

    const { markdown, postId, title, excerpt, categoryIds, tagIds } = body;

    // Validate markdown is provided (required)
    if (!markdown || typeof markdown !== 'string') {
      return ApiErrors.badRequest('Markdown content is required');
    }

    // Validate postId format if provided
    if (postId && (typeof postId !== 'string' || postId.length > 100)) {
      return ApiErrors.badRequest('Invalid postId format');
    }

    // Use shared import function instead of duplicating logic
    const result = await importPost({
      markdown,
      postId,
      title,
      excerpt,
      categoryIds,
      tagIds,
    });

    return successResponse(result.post, result.message);
  } catch (error) {
    // Don't expose internal error details in production
    if (process.env.NODE_ENV === 'development') {
      console.error('Error importing markdown:', error);
    }
    return ApiErrors.internalError('Failed to process request',
      process.env.NODE_ENV === 'development' ? error : undefined
    );
  }
}

