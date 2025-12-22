import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { presentationTool } from 'sanity/presentation'
import { sanityConfig } from './lib/sanity.config'
import { schemaTypes } from './sanity/schemaTypes'

export default defineConfig({
  name: 'techbyjz',
  title: 'Tech by JZ',

  projectId: sanityConfig.projectId,
  dataset: sanityConfig.dataset,

  basePath: '/studio',

  plugins: [
    structureTool(),
    visionTool(), // Adds GROQ query interface
    presentationTool({
      previewUrl: {
        draftMode: {
          enable: '/api/draft',
        },
      },
    }),
  ],

  schema: {
    types: schemaTypes,
  },
})
