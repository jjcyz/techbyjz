/**
 * Standardized API Response Utilities
 * Provides consistent error and success response formats
 */

import { NextResponse } from 'next/server';

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

/**
 * Creates a standardized error response
 */
export function errorResponse(
  status: number,
  message: string,
  code?: string,
  details?: unknown
): NextResponse<ApiError> {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return NextResponse.json(
    {
      code: code || `ERROR_${status}`,
      message,
      ...(isDevelopment && details ? { details } : {}),
    },
    { status }
  );
}

/**
 * Creates a standardized success response
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message ? { message } : {}),
    },
    { status }
  );
}

/**
 * Common error responses
 */
export const ApiErrors = {
  unauthorized: (message = 'Unauthorized') =>
    errorResponse(401, message, 'UNAUTHORIZED'),

  forbidden: (message = 'Access denied') =>
    errorResponse(403, message, 'FORBIDDEN'),

  notFound: (message = 'Resource not found') =>
    errorResponse(404, message, 'NOT_FOUND'),

  badRequest: (message = 'Invalid request', details?: unknown) =>
    errorResponse(400, message, 'BAD_REQUEST', details),

  tooManyRequests: (retryAfter?: number) =>
    errorResponse(429, 'Too many requests', 'TOO_MANY_REQUESTS', retryAfter ? { retryAfter } : undefined),

  internalError: (message = 'Internal server error', details?: unknown) =>
    errorResponse(500, message, 'INTERNAL_ERROR', details),

  serviceUnavailable: (message = 'Service temporarily unavailable') =>
    errorResponse(503, message, 'SERVICE_UNAVAILABLE'),
};

