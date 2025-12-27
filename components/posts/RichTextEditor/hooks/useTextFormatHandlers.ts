import { useCallback } from 'react'
import type { Editor } from '@tiptap/react'
import { TextSelection } from '@tiptap/pm/state'
import type { Transaction } from '@tiptap/pm/state'

export function useTextFormatHandlers(editor: Editor | null) {
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
      const $from = state.doc.resolve(from)
      const $to = state.doc.resolve(to)
      const start = $from.start($from.depth)
      const end = $to.end($to.depth)

      currentEditor.chain()
        .focus()
        .command(({ tr }: { tr: Transaction }) => {
          tr.setSelection(TextSelection.create(tr.doc, start, end))
          return true
        })
        .run()

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

    const isInBlockquote = editor.isActive('blockquote')

    if (isInBlockquote) {
      editor.chain().focus().toggleBlockquote().run()
      return
    }

    const { state } = editor
    const { selection } = state
    const { from, to, empty } = selection

    if (!empty) {
      const $from = state.doc.resolve(from)
      const $to = state.doc.resolve(to)
      const start = $from.start($from.depth)
      const end = $to.end($to.depth)

      editor.chain()
        .focus()
        .command(({ tr }: { tr: Transaction }) => {
          tr.setSelection(TextSelection.create(tr.doc, start, end))
          return true
        })
        .toggleBlockquote()
        .run()
    } else {
      editor.chain().focus().toggleBlockquote().run()
    }
  }, [editor])

  const handleClearFormatting = useCallback(() => {
    if (!editor) return
    editor.chain().focus().unsetAllMarks().run()
  }, [editor])

  return {
    handleBold,
    handleItalic,
    handleHeading,
    handleBulletList,
    handleOrderedList,
    handleBlockquote,
    handleClearFormatting,
  }
}

