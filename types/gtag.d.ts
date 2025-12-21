// TypeScript definitions for Google Analytics gtag

interface Window {
  gtag?: (
    command: 'config' | 'event' | 'set' | 'js' | 'consent',
    targetId: string | Date | 'update' | 'default',
    config?: Record<string, unknown> | {
      analytics_storage?: 'granted' | 'denied';
      ad_storage?: 'granted' | 'denied';
    }
  ) => void
  dataLayer?: unknown[]
}

