'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, Suspense } from 'react'

interface PageViewTrackerProps {
  measurementId: string
}

/**
 * Inner component that uses useSearchParams
 * Must be wrapped in Suspense boundary
 */
function PageViewTrackerInner({ measurementId }: PageViewTrackerProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Only track if gtag is available (GA4 is loaded)
    if (typeof window !== 'undefined' && window.gtag && measurementId) {
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')

      window.gtag('config', measurementId, {
        page_path: url,
      })
    }
  }, [pathname, searchParams, measurementId])

  return null
}

/**
 * Tracks page views in Google Analytics when route changes
 * This ensures page views are tracked correctly in Next.js App Router
 * Wrapped in Suspense to handle useSearchParams() requirement
 */
export default function PageViewTracker({ measurementId }: PageViewTrackerProps) {
  return (
    <Suspense fallback={null}>
      <PageViewTrackerInner measurementId={measurementId} />
    </Suspense>
  )
}

