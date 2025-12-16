'use client'

/**
 * This route is responsible for rendering the Sanity Studio.
 * It's a catch-all route that handles all studio paths.
 *
 * Access the studio at: http://localhost:3000/studio
 */

import { NextStudio } from 'next-sanity/studio'
import config from '../../../sanity.config'

export default function StudioPage() {
  return <NextStudio config={config} />
}
