import { useCallback, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { getImageUrl } from '@/lib/image'
import type { SanityImage } from '@/types/post'

export function useImageHandler(editor: Editor | null, setError: (error: string | null) => void) {
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const handleSetImage = useCallback(() => {
    if (!editor) return

    // If image is selected, remove it
    if (editor.isActive('image')) {
      // Delete the selected image
      editor.chain().focus().deleteSelection().run()
      return
    }

    // Show image upload
    setShowImageUpload(true)
    setError(null)
  }, [editor, setError])

  const handleImageUpload = useCallback(async (file: File, alt: string) => {
    if (!editor) return

    setIsUploading(true)
    setError(null)

    try {
      // Create form data
      const formData = new FormData()
      formData.append('file', file)
      if (alt.trim()) {
        formData.append('alt', alt.trim())
      }

      // Upload to Sanity
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to upload image')
      }

      const data = await response.json()
      const imageDocument = data.image as SanityImage

      // Get the image URL for display in the editor
      const imageUrl = getImageUrl(imageDocument, 800)

      if (!imageUrl) {
        throw new Error('Failed to get image URL')
      }

      // Insert image into editor
      editor.chain().focus().setImage({
        src: imageUrl,
        alt: imageDocument.alt || alt || undefined,
      }).run()

      // Attach Sanity metadata to the image node
      // Use multiple attempts to ensure metadata is attached reliably
      await new Promise<void>((resolve) => {
        const tryAttachMetadata = () => {
          const { state } = editor
          let imagePos: number | null = null

          // Find the image node by matching src
          state.doc.descendants((node, pos) => {
            if (node.type.name === 'image' && node.attrs.src === imageUrl && !node.attrs['data-sanity-ref']) {
              imagePos = pos
              return false
            }
          })

          if (imagePos !== null) {
            const tr = state.tr
            const nodeAtPos = state.doc.nodeAt(imagePos)
            if (nodeAtPos?.type.name === 'image') {
              tr.setNodeMarkup(imagePos, undefined, {
                ...nodeAtPos.attrs,
                'data-sanity-ref': imageDocument.asset._ref,
                'data-sanity-image': JSON.stringify(imageDocument),
              })
              editor.view.dispatch(tr)
              resolve()
              return true
            }
          }
          return false
        }

        // Try multiple times to ensure metadata is attached
        if (tryAttachMetadata()) return

        requestAnimationFrame(() => {
          if (tryAttachMetadata()) return

          setTimeout(() => {
            if (!tryAttachMetadata() && editor.isActive('image')) {
              // Fallback: update currently selected image
              editor.chain().focus().updateAttributes('image', {
                'data-sanity-ref': imageDocument.asset._ref,
                'data-sanity-image': JSON.stringify(imageDocument),
              }).run()
            }
            resolve()
          }, 50)
        })
      })

      // Close upload dialog
      setShowImageUpload(false)
      setError(null)
      editor.commands.focus()
    } catch (error) {
      console.error('Error uploading image:', error)
      setError(error instanceof Error ? error.message : 'Failed to upload image')
    } finally {
      setIsUploading(false)
    }
  }, [editor, setError])

  const handleImageCancel = useCallback(() => {
    setShowImageUpload(false)
    setError(null)
    editor?.commands.focus()
  }, [editor, setError])

  return {
    showImageUpload,
    isUploading,
    handleSetImage,
    handleImageUpload,
    handleImageCancel,
  }
}
