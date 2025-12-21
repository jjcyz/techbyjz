/**
 * Security utilities for safe operations
 */

import { timingSafeEqual } from 'crypto';

/**
 * Constant-time string comparison to prevent timing attacks
 * Use this instead of === or !== for comparing secrets, API keys, etc.
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  // Convert to Buffer for constant-time comparison
  const aBuffer = Buffer.from(a, 'utf8');
  const bBuffer = Buffer.from(b, 'utf8');

  // Use crypto.timingSafeEqual for constant-time comparison
  try {
    return timingSafeEqual(aBuffer, bBuffer);
  } catch {
    // Fallback if buffers are different lengths (shouldn't happen due to check above)
    return false;
  }
}

/**
 * Sanitizes markdown content by removing potentially dangerous patterns
 * This is a basic sanitization - for production, consider using a library like DOMPurify
 */
export function sanitizeMarkdown(markdown: string): string {
  if (!markdown || typeof markdown !== 'string') {
    return '';
  }

  let sanitized = markdown;

  // Remove script tags and event handlers (in case markdown contains HTML)
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');

  // Remove javascript: and data: URLs in links (basic check)
  sanitized = sanitized.replace(/\[([^\]]+)\]\(javascript:[^)]+\)/gi, '[$1](#)');
  sanitized = sanitized.replace(/\[([^\]]+)\]\(data:[^)]+\)/gi, '[$1](#)');

  // Limit maximum length to prevent DoS
  const MAX_LENGTH = 10 * 1024 * 1024; // 10MB
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LENGTH);
  }

  return sanitized;
}

/**
 * Validates URL to ensure it's safe
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

