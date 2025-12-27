import type { Editor } from '@tiptap/react'

export interface TableMenuHandlers {
  onInsertTable: () => void
  onAddColumnBefore: () => void
  onAddColumnAfter: () => void
  onDeleteColumn: () => void
  onAddRowBefore: () => void
  onAddRowAfter: () => void
  onDeleteRow: () => void
  onDeleteTable: () => void
  onMergeCells: () => void
  onSplitCell: () => void
  onToggleHeaderColumn: () => void
  onToggleHeaderRow: () => void
  onToggleHeaderCell: () => void
  onClearFormatting?: () => void
}

export interface TableMenuItem {
  label: string
  onClick: () => void
  disabled: boolean
  danger?: boolean
}

export interface TableMenuSection {
  section: string
  items: TableMenuItem[]
}

export type TableMenuContent =
  | { type: 'item'; item: TableMenuItem }
  | { type: 'section'; section: TableMenuSection }

