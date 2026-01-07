'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import { useMemo, useState, useEffect } from 'react'
import { portableTextToHtml } from '@/lib/portable-text-to-html'
import type { PortableTextBlock } from '@portabletext/types'
import type { RichTextEditorProps } from './types'
import { editorExtensions, editorProps } from './editorConfig'
import { Toolbar } from './Toolbar'
import { LinkInput } from './LinkInput'
import { ImageUpload } from './ImageUpload'
import { EditorStyles } from './EditorStyles'
import { TableContextMenu } from './TableContextMenu'
import { useTextFormatHandlers } from './hooks/useTextFormatHandlers'
import { useTableHandlers } from './hooks/useTableHandlers'
import { useEditorKeyboard } from './hooks/useEditorKeyboard'
import { useLinkHandler } from './hooks/useLinkHandler'
import { useImageHandler } from './hooks/useImageHandler'
import { useEditorSave } from './hooks/useEditorSave'

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
      // portableTextToHtml handles images internally, so we cast to the expected type
      return portableTextToHtml(initialContent as PortableTextBlock[])
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

    // Check if content has actual blocks with children (excluding images)
    const hasContent = initialContent.some(block =>
      block._type === 'block' && 'children' in block && block.children && block.children.length > 0
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

  // Update editor content when initialContent changes (e.g., after save)
  useEffect(() => {
    if (!editor) return

    const currentHtml = editor.getHTML()

    // Only update if content has actually changed
    if (initialHtml && initialHtml !== currentHtml) {
      editor.commands.setContent(initialHtml)
    }
  }, [editor, initialHtml])

  // Get text formatting handlers
  const {
    handleBold,
    handleItalic,
    handleHeading,
    handleBulletList,
    handleOrderedList,
    handleBlockquote,
    handleClearFormatting,
  } = useTextFormatHandlers(editor)

  // Get table handlers
  const tableHandlers = useTableHandlers(editor)

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

  // Get save handler
  const { handleSave } = useEditorSave({
    editor,
    isSaving,
    onSave,
    setError,
  })

  // Setup keyboard shortcuts
  useEditorKeyboard({
    editor,
    isSaving,
    showLinkInput,
    showImageInput: showImageUpload,
    onSave: handleSave,
    onLinkCancel: handleLinkCancel,
    onImageCancel: handleImageCancel,
    onCancel,
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
        onSave={handleSave}
        onCancel={onCancel}
        isSaving={isSaving}
        tableHandlers={tableHandlers}
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

      {/* Table Context Menu (Right-click) */}
      <TableContextMenu
        editor={editor}
        {...tableHandlers}
        onClearFormatting={handleClearFormatting}
      />

      {/* Editor - Scrollable */}
      <div className="bg-[var(--card-bg)] border-x border-b border-[var(--border-color)] max-h-[1000px] overflow-y-auto min-h-[400px]">
        <EditorStyles />
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
