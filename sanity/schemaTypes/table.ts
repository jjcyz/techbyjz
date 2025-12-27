import { defineType, defineField } from 'sanity'
import { TablePreview } from '../components/TablePreview'

export default defineType({
  name: 'table',
  title: 'Table',
  type: 'object',
  description: 'Table content. Use the rich text editor on the frontend for editing.',
  components: {
    preview: TablePreview,
  },
  fields: [
    defineField({
      name: 'rows',
      title: 'Rows',
      description: 'Table rows. Use the rich text editor on the frontend for editing.',
      type: 'array',
      options: {
        layout: 'grid',
      },
      of: [
        {
          type: 'object',
          name: 'tableRow',
          title: 'Row',
          fields: [
            {
              name: 'cells',
              title: 'Cells',
              description: 'Cells in this row.',
              type: 'array',
              options: {
                layout: 'grid',
              },
              of: [
                {
                  type: 'object',
                  name: 'tableCell',
                  title: 'Cell',
                  fields: [
                    {
                      name: 'content',
                      title: 'Content',
                      type: 'array',
                      of: [
                        {
                          type: 'block',
                          styles: [
                            { title: 'Normal', value: 'normal' },
                          ],
                          marks: {
                            decorators: [
                              { title: 'Strong', value: 'strong' },
                              { title: 'Emphasis', value: 'em' },
                              { title: 'Code', value: 'code' },
                            ],
                            annotations: [
                              {
                                title: 'URL',
                                name: 'link',
                                type: 'object',
                                fields: [
                                  {
                                    title: 'URL',
                                    name: 'href',
                                    type: 'url',
                                  },
                                ],
                              },
                            ],
                          },
                        },
                      ],
                    },
                    {
                      name: 'isHeader',
                      title: 'Header Cell',
                      type: 'boolean',
                      initialValue: false,
                    },
                  ],
                  options: {
                    collapsible: true,
                    collapsed: false,
                  },
                  preview: {
                    select: {
                      content: 'content',
                      isHeader: 'isHeader',
                    },
                    prepare({ content, isHeader }) {
                      const text = content?.[0]?.children?.[0]?.text || 'Empty cell'
                      return {
                        title: isHeader ? `Header: ${text}` : text,
                        subtitle: isHeader ? 'Header cell' : 'Cell',
                      }
                    },
                  },
                },
              ],
            },
          ],
          preview: {
            select: {
              cells: 'cells',
            },
            prepare({ cells }) {
              const cellCount = cells?.length || 0
              const firstCellText = cells?.[0]?.content?.[0]?.children?.[0]?.text || ''
              return {
                title: firstCellText || 'Empty row',
                subtitle: `${cellCount} cell${cellCount !== 1 ? 's' : ''}`,
              }
            },
          },
        },
      ],
    }),
  ],
  preview: {
    select: {
      rows: 'rows',
    },
  },
})

