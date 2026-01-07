'use client'

/**
 * This route is responsible for rendering the Sanity Studio.
 * It's a catch-all route that handles all studio paths.
 *
 * Access the studio at: http://localhost:3000/studio
 * This page should NOT be indexed by search engines.
 */

import { NextStudio } from 'next-sanity/studio'
import { useEffect } from 'react'
import config from '../../../sanity.config'

export default function StudioPage() {
  // Add noindex meta tag via useEffect since this is a client component
  useEffect(() => {
    // Remove any existing robots meta tag
    const existingRobots = document.querySelector('meta[name="robots"]')
    if (existingRobots) {
      existingRobots.remove()
    }

    // Add noindex meta tag
    const metaRobots = document.createElement('meta')
    metaRobots.name = 'robots'
    metaRobots.content = 'noindex, nofollow'
    document.head.appendChild(metaRobots)

    return () => {
      // Cleanup on unmount - remove only the tag we added
      const robotsTag = document.querySelector('meta[name="robots"][content="noindex, nofollow"]')
      if (robotsTag) {
        robotsTag.remove()
      }
    }
  }, [])

  return <NextStudio config={config} />
}
