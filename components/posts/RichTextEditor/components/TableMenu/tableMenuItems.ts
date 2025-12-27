import type { Editor } from '@tiptap/react'
import type { TableMenuContent, TableMenuHandlers } from './types'

export function createTableMenuItems(
  editor: Editor,
  handlers: TableMenuHandlers,
  onClose: () => void
): TableMenuContent[] {
  const wrapHandler = (handler: () => void) => () => {
    handler()
    onClose()
  }

  return [
    {
      type: 'item',
      item: {
        label: 'Insert Table',
        onClick: wrapHandler(handlers.onInsertTable),
        disabled: false,
      },
    },
    {
      type: 'section',
      section: {
        section: 'Columns',
        items: [
          {
            label: 'Add Column Before',
            onClick: wrapHandler(handlers.onAddColumnBefore),
            disabled: !editor.can().addColumnBefore(),
          },
          {
            label: 'Add Column After',
            onClick: wrapHandler(handlers.onAddColumnAfter),
            disabled: !editor.can().addColumnAfter(),
          },
          {
            label: 'Delete Column',
            onClick: wrapHandler(handlers.onDeleteColumn),
            disabled: !editor.can().deleteColumn(),
          },
        ],
      },
    },
    {
      type: 'section',
      section: {
        section: 'Rows',
        items: [
          {
            label: 'Add Row Before',
            onClick: wrapHandler(handlers.onAddRowBefore),
            disabled: !editor.can().addRowBefore(),
          },
          {
            label: 'Add Row After',
            onClick: wrapHandler(handlers.onAddRowAfter),
            disabled: !editor.can().addRowAfter(),
          },
          {
            label: 'Delete Row',
            onClick: wrapHandler(handlers.onDeleteRow),
            disabled: !editor.can().deleteRow(),
          },
        ],
      },
    },
    {
      type: 'section',
      section: {
        section: 'Cells',
        items: [
          {
            label: 'Merge Cells',
            onClick: wrapHandler(handlers.onMergeCells),
            disabled: !editor.can().mergeCells(),
          },
          {
            label: 'Split Cell',
            onClick: wrapHandler(handlers.onSplitCell),
            disabled: !editor.can().splitCell(),
          },
        ],
      },
    },
    ...(handlers.onClearFormatting ? [
      {
        type: 'section' as const,
        section: {
          section: 'Formatting',
          items: [
            {
              label: 'Clear Formatting',
              onClick: wrapHandler(handlers.onClearFormatting),
              disabled: false,
            },
          ],
        },
      },
    ] : []),
    {
      type: 'section',
      section: {
        section: 'Headers',
        items: [
          {
            label: 'Toggle Header Row',
            onClick: wrapHandler(handlers.onToggleHeaderRow),
            disabled: !editor.can().toggleHeaderRow(),
          },
          {
            label: 'Toggle Header Column',
            onClick: wrapHandler(handlers.onToggleHeaderColumn),
            disabled: !editor.can().toggleHeaderColumn(),
          },
          {
            label: 'Toggle Header Cell',
            onClick: wrapHandler(handlers.onToggleHeaderCell),
            disabled: !editor.can().toggleHeaderCell(),
          },
        ],
      },
    },
    {
      type: 'item',
      item: {
        label: 'Delete Table',
        onClick: wrapHandler(handlers.onDeleteTable),
        disabled: !editor.can().deleteTable(),
        danger: true,
      },
    },
  ]
}

