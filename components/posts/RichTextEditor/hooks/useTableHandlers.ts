import { useCallback } from 'react'
import type { Editor } from '@tiptap/react'

export function useTableHandlers(editor: Editor | null) {
  const handleInsertTable = useCallback(() => {
    if (!editor) return
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }, [editor])

  const handleAddColumnBefore = useCallback(() => {
    if (!editor) return
    editor.chain().focus().addColumnBefore().run()
  }, [editor])

  const handleAddColumnAfter = useCallback(() => {
    if (!editor) return
    editor.chain().focus().addColumnAfter().run()
  }, [editor])

  const handleDeleteColumn = useCallback(() => {
    if (!editor) return
    editor.chain().focus().deleteColumn().run()
  }, [editor])

  const handleAddRowBefore = useCallback(() => {
    if (!editor) return
    editor.chain().focus().addRowBefore().run()
  }, [editor])

  const handleAddRowAfter = useCallback(() => {
    if (!editor) return
    editor.chain().focus().addRowAfter().run()
  }, [editor])

  const handleDeleteRow = useCallback(() => {
    if (!editor) return
    editor.chain().focus().deleteRow().run()
  }, [editor])

  const handleDeleteTable = useCallback(() => {
    if (!editor) return
    if (editor.isActive('table')) {
      editor.chain().focus().deleteTable().run()
    }
  }, [editor])

  const handleMergeCells = useCallback(() => {
    if (!editor) return
    editor.chain().focus().mergeCells().run()
  }, [editor])

  const handleSplitCell = useCallback(() => {
    if (!editor) return
    editor.chain().focus().splitCell().run()
  }, [editor])

  const handleToggleHeaderColumn = useCallback(() => {
    if (!editor) return
    editor.chain().focus().toggleHeaderColumn().run()
  }, [editor])

  const handleToggleHeaderRow = useCallback(() => {
    if (!editor) return
    editor.chain().focus().toggleHeaderRow().run()
  }, [editor])

  const handleToggleHeaderCell = useCallback(() => {
    if (!editor) return
    editor.chain().focus().toggleHeaderCell().run()
  }, [editor])

  return {
    onInsertTable: handleInsertTable,
    onAddColumnBefore: handleAddColumnBefore,
    onAddColumnAfter: handleAddColumnAfter,
    onDeleteColumn: handleDeleteColumn,
    onAddRowBefore: handleAddRowBefore,
    onAddRowAfter: handleAddRowAfter,
    onDeleteRow: handleDeleteRow,
    onDeleteTable: handleDeleteTable,
    onMergeCells: handleMergeCells,
    onSplitCell: handleSplitCell,
    onToggleHeaderColumn: handleToggleHeaderColumn,
    onToggleHeaderRow: handleToggleHeaderRow,
    onToggleHeaderCell: handleToggleHeaderCell,
  }
}

