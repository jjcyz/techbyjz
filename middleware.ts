import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isBot } from '@/lib/rate-limit';

/**
 * Middleware for security, bot detection, and rate limiting
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userAgent = request.headers.get('user-agent') || '';

  // Redirect www to non-www is handled by Vercel domain settings
  // Configure in Vercel Dashboard → Project → Settings → Domains

  // Block bots from API endpoints (except allowed search engines and AI search bots)
  if (pathname.startsWith('/api/')) {
    // Allow traditional search engines and AI search bots to access public API endpoints
    // These help users discover content through search
    const isSearchEngine = /googlebot|bingbot|slurp|duckduckbot|chatgpt-user|anthropic-ai|claude-web|perplexitybot|perplexity-ai/i.test(userAgent);

    // Block all other bots from API (training/scraping bots)
    if (isBot(userAgent) && !isSearchEngine) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }
  }

  // Security headers
  const response = NextResponse.next();

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );

  // Content Security Policy
  // Note: 'unsafe-inline' is required for Next.js and Tailwind CSS
  // TODO: Consider implementing nonce-based CSP for better security
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://pagead2.googlesyndication.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://cdn.sanity.io https://*.sanity.io https://www.google-analytics.com https://*.googlesyndication.com",
    "font-src 'self' data:",
    "connect-src 'self' https://*.sanity.io https://api.openai.com https://www.google-analytics.com https://*.google-analytics.com",
    "frame-src 'self' https://tpc.googlesyndication.com https://googleads.g.doubleclick.net",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);

  // Add robots meta tag hint (for dynamic pages)
  if (pathname.startsWith('/posts/') || pathname.startsWith('/category/') || pathname.startsWith('/tag/')) {
    // This will be handled by the page component, but we can add headers here too
    response.headers.set('X-Robots-Tag', 'index, follow');
  }

  return response;
}

// Match all routes except static files and Next.js internals
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)',
  ],
};

