import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { sanityConfig } from './lib/sanity.config'
import { schemaTypes } from './sanity/schemaTypes'

export default defineConfig({
  name: 'techbyjz',
  title: 'Tech by JZ',

  projectId: sanityConfig.projectId,
  dataset: sanityConfig.dataset,

  basePath: '/studio',

  plugins: [
    structureTool({
      // Optimize structure tool performance
      defaultDocumentNode: undefined,
    }),
    visionTool(), // Adds GROQ query interface
    // Removed presentationTool - it can cause performance issues
  ],

  schema: {
    types: schemaTypes,
  },

  // Performance optimizations
  document: {
    // Limit the number of documents fetched initially
    productionUrl: undefined, // Disable preview URL generation (can be slow)
  },
})
