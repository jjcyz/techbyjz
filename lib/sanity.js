import { createClient } from '@sanity/client'
import { sanityConfig } from './sanity.config'

// CDN is read-only - disable it when we have a token for write operations
// This ensures write operations work correctly
const hasToken = !!process.env.SANITY_API_TOKEN;

export const client = createClient({
  projectId: sanityConfig.projectId,
  dataset: sanityConfig.dataset,
  apiVersion: sanityConfig.apiVersion,
  // Disable CDN when token is present (for write operations)
  // CDN is read-only and doesn't support mutations
  useCdn: hasToken ? false : sanityConfig.useCdn,
  // Add token for write operations (only when SANITY_API_TOKEN is set)
  token: process.env.SANITY_API_TOKEN,
})

