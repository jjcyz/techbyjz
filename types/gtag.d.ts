// TypeScript definitions for Google Analytics gtag

interface Window {
  gtag?: (
    command: 'config' | 'event' | 'set' | 'js',
    targetId: string | Date,
    config?: Record<string, unknown>
  ) => void
  dataLayer?: unknown[]
}

