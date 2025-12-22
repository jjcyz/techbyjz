import { useCallback } from 'react'
import type { Editor } from '@tiptap/react'
import { TextSelection } from '@tiptap/pm/state'
import type { Transaction } from '@tiptap/pm/state'

export function useEditorHandlers(editor: Editor | null) {
  const handleBold = useCallback(() => {
    editor?.chain().focus().toggleBold().run()
  }, [editor])

  const handleItalic = useCallback(() => {
    editor?.chain().focus().toggleItalic().run()
  }, [editor])

  const handleHeading = useCallback((level: 1 | 2 | 3) => {
    editor?.chain().focus().toggleHeading({ level }).run()
  }, [editor])

  const wrapSelection = useCallback((
    currentEditor: Editor,
    toggleFn: () => void,
    isActive: boolean
  ) => {
    if (!currentEditor) return

    if (isActive) {
      toggleFn()
      return
    }

    const { state } = currentEditor
    const { selection } = state
    const { from, to, empty } = selection

    if (!empty) {
      // Text is selected - expand to full blocks and wrap
      const $from = state.doc.resolve(from)
      const $to = state.doc.resolve(to)
      const start = $from.start($from.depth)
      const end = $to.end($to.depth)

      // First expand selection, then apply toggle
      currentEditor.chain()
        .focus()
        .command(({ tr }: { tr: Transaction }) => {
          tr.setSelection(TextSelection.create(tr.doc, start, end))
          return true
        })
        .run()

      // Then apply the toggle
      toggleFn()
    } else {
      toggleFn()
    }
  }, [])

  const handleBulletList = useCallback(() => {
    if (!editor) return
    wrapSelection(
      editor,
      () => editor.chain().focus().toggleBulletList().run(),
      editor.isActive('bulletList')
    )
  }, [editor, wrapSelection])

  const handleOrderedList = useCallback(() => {
    if (!editor) return
    wrapSelection(
      editor,
      () => editor.chain().focus().toggleOrderedList().run(),
      editor.isActive('orderedList')
    )
  }, [editor, wrapSelection])

  const handleBlockquote = useCallback(() => {
    if (!editor) return

    // Check if cursor is in a blockquote
    const isInBlockquote = editor.isActive('blockquote')

    if (isInBlockquote) {
      // If already in blockquote, just toggle it off
      editor.chain().focus().toggleBlockquote().run()
      return
    }

    // If not in blockquote, wrap selection in blockquote
    const { state } = editor
    const { selection } = state
    const { from, to, empty } = selection

    if (!empty) {
      // Text is selected - expand to full blocks and wrap
      const $from = state.doc.resolve(from)
      const $to = state.doc.resolve(to)
      const start = $from.start($from.depth)
      const end = $to.end($to.depth)

      // First expand selection, then apply toggle
      editor.chain()
        .focus()
        .command(({ tr }: { tr: Transaction }) => {
          tr.setSelection(TextSelection.create(tr.doc, start, end))
          return true
        })
        .toggleBlockquote()
        .run()
    } else {
      // No selection, just toggle blockquote for current block
      editor.chain().focus().toggleBlockquote().run()
    }
  }, [editor])

  const handleUndo = useCallback(() => {
    editor?.chain().focus().undo().run()
  }, [editor])

  const handleRedo = useCallback(() => {
    editor?.chain().focus().redo().run()
  }, [editor])

  return {
    handleBold,
    handleItalic,
    handleHeading,
    handleBulletList,
    handleOrderedList,
    handleBlockquote,
    handleUndo,
    handleRedo,
  }
}

