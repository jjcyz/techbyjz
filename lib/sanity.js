import { createClient } from '@sanity/client'
import { sanityConfig } from './sanity.config'

export const client = createClient({
  projectId: sanityConfig.projectId,
  dataset: sanityConfig.dataset,
  apiVersion: sanityConfig.apiVersion,
  useCdn: sanityConfig.useCdn,
  // Add token for write operations (only when SANITY_API_TOKEN is set)
  token: process.env.SANITY_API_TOKEN,
})

