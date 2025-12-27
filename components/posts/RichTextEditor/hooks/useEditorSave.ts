import { useCallback } from 'react'
import type { Editor } from '@tiptap/react'
import { tiptapToPortableText } from '@/lib/tiptap-to-portable-text'
import type { PortableTextContent } from '../types'
import { validateImageReferences, filterValidBlocks } from '../utils/contentValidation'

interface UseEditorSaveProps {
  editor: Editor | null
  isSaving: boolean
  onSave: (content: PortableTextContent[]) => void
  setError: (error: string | null) => void
}

export function useEditorSave({
  editor,
  isSaving,
  onSave,
  setError,
}: UseEditorSaveProps) {
  const handleSave = useCallback(() => {
    if (!editor || isSaving) return

    const json = editor.getJSON()

    try {
      const blocks = tiptapToPortableText(json)

      // Validate images have proper Sanity references
      const imageValidation = validateImageReferences(blocks)
      if (!imageValidation.isValid) {
        setError(imageValidation.errorMessage || 'Invalid image references')
        return
      }

      // Filter out invalid blocks
      const filteredBlocks = filterValidBlocks(blocks)

      if (filteredBlocks.length === 0) {
        setError('Cannot save empty content')
        return
      }

      setError(null)
      onSave(filteredBlocks)
    } catch (error) {
      console.error('Error converting Tiptap to PortableText:', error)
      setError('Error saving content. Please try again.')
    }
  }, [editor, onSave, isSaving, setError])

  return { handleSave }
}

