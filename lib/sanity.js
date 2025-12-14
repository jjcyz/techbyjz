import { createClient } from '@sanity/client'

export const client = createClient({
  projectId: 'uusrx3n3',
  dataset: 'blogs',
  apiVersion: '2025-11-29',
  useCdn: true,
})

