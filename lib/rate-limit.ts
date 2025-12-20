/**
 * Simple in-memory rate limiting utility
 * For production, consider using Redis or a dedicated rate limiting service
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

/**
 * Default rate limits
 */
export const RATE_LIMITS = {
  // View count endpoint - prevent abuse
  VIEW_COUNT: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 requests per minute per IP
  },
  // API endpoints
  API: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 requests per minute per IP
  },
  // Import endpoint - very restrictive
  IMPORT: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 requests per hour per IP
  },
} as const;

/**
 * Get client identifier from request
 */
function getClientId(request: Request): string {
  // Try to get IP from various headers (for proxies/load balancers)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');

  const ip = cfConnectingIp || realIp || (forwarded ? forwarded.split(',')[0].trim() : null);

  // Fallback to user agent if no IP available
  const userAgent = request.headers.get('user-agent') || 'unknown';

  return ip || userAgent;
}

/**
 * Check if request should be rate limited
 * @returns { allowed: boolean, remaining: number, resetTime: number }
 */
export function checkRateLimit(
  request: Request,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  const clientId = getClientId(request);
  const now = Date.now();
  const key = `${clientId}:${config.windowMs}`;

  // Clean up old entries periodically (every 1000 requests)
  if (Math.random() < 0.001) {
    cleanupExpiredEntries();
  }

  const entry = store[key];

  // No entry or expired
  if (!entry || now > entry.resetTime) {
    store[key] = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    };
  }

  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  // Increment count
  entry.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Clean up expired rate limit entries
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}

/**
 * Check if user agent is a bot
 */
export function isBot(userAgent: string | null): boolean {
  if (!userAgent) return true; // No user agent = likely a bot

  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
    /go-http-client/i,
    /httpclient/i,
    /scrapy/i,
    /gptbot/i,
    /chatgpt/i,
    /claude/i,
    /anthropic/i,
    /perplexity/i,
    /ccbot/i,
    /google-extended/i,
    /applebot-extended/i,
    /bytespider/i,
    /diffbot/i,
    /mj12bot/i,
    /ahrefs/i,
    /semrush/i,
    /dotbot/i,
  ];

  // Allow legitimate search engines and AI search bots
  // These help users discover content, so we want them to crawl
  const allowedBots = [
    /googlebot/i,
    /bingbot/i,
    /slurp/i, // Yahoo
    /duckduckbot/i,
    // AI Search Bots - allow for discoverability
    /chatgpt-user/i, // ChatGPT browsing
    /anthropic-ai/i, // Claude
    /claude-web/i, // Claude web browsing
    /perplexitybot/i, // Perplexity search
    /perplexity-ai/i, // Perplexity AI
  ];

  // Check if it's an allowed bot first
  if (allowedBots.some((pattern) => pattern.test(userAgent))) {
    return false; // Not a bot we want to block
  }

  // Check if it's a blocked bot (training/scraping bots)
  return botPatterns.some((pattern) => pattern.test(userAgent));
}

