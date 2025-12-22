'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import { useCallback, useMemo, useState } from 'react'
import { portableTextToHtml } from '@/lib/portable-text-to-html'
import { tiptapToPortableText } from '@/lib/tiptap-to-portable-text'
import type { RichTextEditorProps, PortableTextContent } from './types'
import { editorExtensions, editorProps } from './editorConfig'
import { Toolbar } from './Toolbar'
import { LinkInput } from './LinkInput'
import { ImageUpload } from './ImageUpload'
import { EditorStyles } from './EditorStyles'
import { useEditorHandlers } from './hooks/useEditorHandlers'
import { useEditorKeyboard } from './hooks/useEditorKeyboard'
import { useLinkHandler } from './hooks/useLinkHandler'
import { useImageHandler } from './hooks/useImageHandler'

export default function RichTextEditor({
  initialContent,
  onSave,
  onCancel,
  isSaving,
}: RichTextEditorProps) {
  const [error, setError] = useState<string | null>(null)

  // Memoize HTML conversion to avoid recalculating on every render
  const initialHtml = useMemo(() => {
    if (!initialContent || !Array.isArray(initialContent)) {
      return ''
    }
    try {
      return portableTextToHtml(initialContent)
    } catch (error) {
      console.error('Error converting PortableText to HTML:', error)
      return ''
    }
  }, [initialContent])

  // Derive conversion error - only show if we have content but conversion failed
  const conversionError = useMemo(() => {
    if (!initialContent || !Array.isArray(initialContent) || initialContent.length === 0) {
      return null
    }

    // Check if content has actual blocks with children
    const hasContent = initialContent.some(block =>
      block._type === 'block' && block.children && block.children.length > 0
    )

    // If we have content but got empty HTML, conversion likely failed
    if (hasContent && initialHtml === '') {
      return 'Failed to load content'
    }

    return null
  }, [initialContent, initialHtml])

  const editor = useEditor({
    extensions: editorExtensions,
    content: initialHtml,
    immediatelyRender: false,
    editorProps,
    // Performance optimizations
    enableInputRules: true,
    enablePasteRules: true,
    autofocus: false,
  })

  // Get editor handlers
  const {
    handleBold,
    handleItalic,
    handleHeading,
    handleBulletList,
    handleOrderedList,
    handleBlockquote,
    handleUndo,
    handleRedo,
  } = useEditorHandlers(editor)

  // Get link handler
  const {
    linkUrl,
    showLinkInput,
    setLinkUrl,
    handleSetLink,
    handleLinkSubmit,
    handleLinkCancel,
  } = useLinkHandler(editor, setError)

  // Get image handler
  const {
    showImageUpload,
    isUploading,
    handleSetImage,
    handleImageUpload,
    handleImageCancel,
  } = useImageHandler(editor, setError)

  const handleSave = useCallback(() => {
    if (!editor || isSaving) return

    const json = editor.getJSON()

    try {
      const blocks = tiptapToPortableText(json)

      // Validate images have proper Sanity references before saving
      const imagesWithoutRefs = blocks.filter((block): boolean => {
        if (block._type === 'image') {
          const imageBlock = block as { _type: 'image'; asset?: { _ref?: string } }
          const ref = imageBlock.asset?._ref
          // Treat missing refs or URL-like refs as invalid
          return !ref || typeof ref !== 'string' || ref.startsWith('http')
        }
        return false
      })

      if (imagesWithoutRefs.length > 0) {
        setError(
          `Some images are missing valid Sanity references. ` +
          `Please remove and re-upload ${imagesWithoutRefs.length === 1 ? 'the image' : 'the images'} using the image upload button.`
        )
        return
      }

      // Filter out empty blocks while preserving images and whitespace
      const filteredBlocks = blocks.filter((block): block is PortableTextContent => {
        if (block._type === 'image') {
          return true
        }

        if (block._type !== 'block' || !('children' in block) || !block.children || block.children.length === 0) {
          return false
        }

        // Keep blocks with at least one child containing text (including whitespace)
        return block.children.some((child: { _type?: string; text?: string | null }) => {
          return child._type === 'span' && 'text' in child && child.text !== undefined && child.text !== null
        })
      })

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
  }, [editor, onSave, isSaving])

  // Setup keyboard shortcuts
  useEditorKeyboard({
    editor,
    isSaving,
    showLinkInput,
    showImageInput: showImageUpload,
    onSave: handleSave,
    onLinkCancel: handleLinkCancel,
    onImageCancel: handleImageCancel,
  })

  if (!editor) {
    return (
      <div className="mb-8 flex items-center justify-center min-h-[400px] bg-[var(--card-bg)] border border-[var(--border-color)]">
        <div className="text-[var(--foreground-muted)]" role="status" aria-live="polite">
          Loading editor...
        </div>
      </div>
    )
  }

  // Combine conversion errors with runtime errors
  const displayError = error || conversionError

  return (
    <div className="mb-8">
      {/* Error message */}
      {displayError && (
        <div className="mb-2 p-2 bg-red-500/10 border border-red-500/50 text-red-400 text-sm" role="alert">
          {displayError}
        </div>
      )}

      {/* Toolbar */}
      <Toolbar
        editor={editor}
        onBold={handleBold}
        onItalic={handleItalic}
        onHeading={handleHeading}
        onBulletList={handleBulletList}
        onOrderedList={handleOrderedList}
        onBlockquote={handleBlockquote}
        onLink={handleSetLink}
        onImage={handleSetImage}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onSave={handleSave}
        onCancel={onCancel}
        isSaving={isSaving}
      />

      {/* Link input */}
      <LinkInput
        linkUrl={linkUrl}
        showLinkInput={showLinkInput}
        onLinkUrlChange={setLinkUrl}
        onSubmit={handleLinkSubmit}
        onCancel={handleLinkCancel}
        onErrorClear={() => setError(null)}
      />

      {/* Image upload */}
      <ImageUpload
        key={showImageUpload ? 'open' : 'closed'}
        showImageUpload={showImageUpload}
        onUpload={handleImageUpload}
        onCancel={handleImageCancel}
        isUploading={isUploading}
      />

      {/* Editor - Scrollable */}
      <div className="bg-[var(--card-bg)] border-x border-b border-[var(--border-color)] max-h-[600px] overflow-y-auto min-h-[400px]">
        <EditorStyles />
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

