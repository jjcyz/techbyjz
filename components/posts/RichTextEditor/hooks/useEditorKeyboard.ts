import { useEffect } from 'react'
import type { Editor } from '@tiptap/react'

interface UseEditorKeyboardProps {
  editor: Editor | null
  isSaving: boolean
  showLinkInput: boolean
  showImageInput: boolean
  onSave: () => void
  onLinkCancel: () => void
  onImageCancel: () => void
  onCancel?: () => void
}

export function useEditorKeyboard({
  editor,
  isSaving,
  showLinkInput,
  showImageInput,
  onSave,
  onLinkCancel,
  onImageCancel,
  onCancel,
}: UseEditorKeyboardProps) {
  useEffect(() => {
    if (!editor) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + S to save
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault()
        if (!isSaving) {
          onSave()
        }
      }
      // Escape to cancel link input, image input, or cancel editing
      if (event.key === 'Escape') {
        if (showLinkInput) {
          onLinkCancel()
        } else if (showImageInput) {
          onImageCancel()
        } else if (onCancel) {
          onCancel()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [editor, isSaving, showLinkInput, showImageInput, onSave, onLinkCancel, onImageCancel, onCancel])
}

