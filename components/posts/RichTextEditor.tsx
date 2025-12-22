'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { TextSelection } from '@tiptap/pm/state'
import type { Transaction } from '@tiptap/pm/state'
import { useCallback, useMemo, useState, useEffect } from 'react'
import { PortableTextBlock } from '@portabletext/types'
import { portableTextToHtml } from '@/lib/portable-text-to-html'
import { tiptapToPortableText } from '@/lib/tiptap-to-portable-text'

interface RichTextEditorProps {
  initialContent: PortableTextBlock[] | null | undefined
  onSave: (content: PortableTextBlock[]) => void
  onCancel: () => void
  isSaving: boolean
}

// Helper to validate URL
function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
  } catch {
    return false
  }
}

// Helper to normalize URL
function normalizeUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return ''

  // If it already has a protocol, return as-is
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }

  // Otherwise, add https://
  return `https://${trimmed}`
}

export default function RichTextEditor({
  initialContent,
  onSave,
  onCancel,
  isSaving,
}: RichTextEditorProps) {
  const [linkUrl, setLinkUrl] = useState('')
  const [showLinkInput, setShowLinkInput] = useState(false)
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
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
        bulletList: {
          HTMLAttributes: {
            class: 'list-disc',
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: 'list-decimal',
          },
        },
        blockquote: {
          HTMLAttributes: {
            class: 'border-l-4 border-[var(--electric-blue)] pl-3 my-4 italic text-[var(--foreground-low)] bg-[var(--card-bg)]/30 py-2',
          },
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-[var(--electric-blue)] underline',
        },
        autolink: true,
        defaultProtocol: 'https',
      }),
      Placeholder.configure({
        placeholder: 'Start typing...',
      }),
    ],
    content: initialHtml,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[400px] px-4 py-3',
        'aria-label': 'Rich text editor',
      },
    },
  })

  const handleSave = useCallback(() => {
    if (!editor || isSaving) return

    // Get JSON from editor (more reliable than HTML)
    const json = editor.getJSON()

    // Convert Tiptap JSON to PortableText
    try {
      const blocks = tiptapToPortableText(json)

      // Preserve all blocks, including those with only whitespace (blank lines)
      // Only filter out blocks that are truly empty (no children or null/undefined text)
      const filteredBlocks = blocks.filter((block) => {
        if (block._type !== 'block' || !block.children || block.children.length === 0) {
          return false
        }
        // Keep block if it has at least one child with text (including whitespace-only text)
        // This preserves blank lines and spaces
        return block.children.some((child) => {
          if (child._type === 'span' && 'text' in child) {
            // Preserve blocks with text, even if it's only whitespace
            // This allows blank lines and spaces to be saved
            return child.text !== undefined && child.text !== null
          }
          return false
        })
      })

      if (filteredBlocks.length === 0) {
        setError('Cannot save empty content')
        return
      }

      setError(null)
      onSave(filteredBlocks.length > 0 ? filteredBlocks : blocks)
    } catch (error) {
      console.error('Error converting Tiptap to PortableText:', error)
      setError('Error saving content. Please try again.')
    }
  }, [editor, onSave, isSaving])

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!editor) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + S to save
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault()
        if (!isSaving) {
          handleSave()
        }
      }
      // Escape to cancel link input or cancel editing
      if (event.key === 'Escape') {
        if (showLinkInput) {
          setShowLinkInput(false)
          setLinkUrl('')
          editor.commands.focus()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [editor, isSaving, showLinkInput, handleSave])

  // Memoize button class name logic
  const getButtonClassName = useCallback((isActive: boolean) => {
    return `px-3 py-1.5 rounded text-sm transition-colors ${
      isActive
        ? 'bg-[var(--electric-blue)] text-white'
        : 'bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--card-bg)]'
    }`
  }, [])

  // Helper function to wrap selected text in block-level format
  const wrapSelection = useCallback((
    currentEditor: typeof editor,
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

  // Memoized handlers to prevent unnecessary re-renders
  const handleBold = useCallback(() => {
    editor?.chain().focus().toggleBold().run()
  }, [editor])

  const handleItalic = useCallback(() => {
    editor?.chain().focus().toggleItalic().run()
  }, [editor])

  const handleHeading = useCallback((level: 1 | 2 | 3) => {
    editor?.chain().focus().toggleHeading({ level }).run()
  }, [editor])

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

  const handleSetLink = useCallback(() => {
    if (!editor) return

    // If link is already active, remove it
    if (editor.isActive('link')) {
      editor.chain().focus().unsetLink().run()
      return
    }

    // Show link input
    const previousUrl = editor.getAttributes('link').href || ''
    setLinkUrl(previousUrl)
    setShowLinkInput(true)
    setError(null)
  }, [editor])

  const handleLinkSubmit = useCallback(() => {
    if (!editor || !linkUrl.trim()) {
      setShowLinkInput(false)
      setLinkUrl('')
      return
    }

    const normalizedUrl = normalizeUrl(linkUrl)

    if (!isValidUrl(normalizedUrl)) {
      setError('Please enter a valid URL')
      return
    }

    // If text is selected, apply link to selection
    // Otherwise, insert the URL as link text
    if (editor.state.selection.empty) {
      editor.chain().focus().insertContent(`<a href="${normalizedUrl}">${normalizedUrl}</a>`).run()
    } else {
      editor.chain().focus().setLink({ href: normalizedUrl }).run()
    }

    setShowLinkInput(false)
    setLinkUrl('')
    setError(null)
    editor.commands.focus()
  }, [editor, linkUrl])

  const handleLinkCancel = useCallback(() => {
    setShowLinkInput(false)
    setLinkUrl('')
    setError(null)
    editor?.commands.focus()
  }, [editor])

  const handleUndo = useCallback(() => {
    editor?.chain().focus().undo().run()
  }, [editor])

  const handleRedo = useCallback(() => {
    editor?.chain().focus().redo().run()
  }, [editor])

  if (!editor) {
    return (
      <div className="mb-8 flex items-center justify-center min-h-[400px] bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg">
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
        <div className="mb-2 p-2 bg-red-500/10 border border-red-500/50 text-red-400 text-sm rounded" role="alert">
          {displayError}
        </div>
      )}

      {/* Toolbar - Sticky at top */}
      <div className="sticky top-0 z-10 flex flex-wrap gap-2 p-3 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-t-lg shadow-sm" role="toolbar" aria-label="Text formatting toolbar">
        <button
          onClick={handleBold}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={getButtonClassName(editor.isActive('bold'))}
          title="Bold (Ctrl+B)"
          type="button"
          aria-label="Bold"
          aria-pressed={editor.isActive('bold')}
        >
          <strong>B</strong>
        </button>
        <button
          onClick={handleItalic}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={getButtonClassName(editor.isActive('italic'))}
          title="Italic (Ctrl+I)"
          type="button"
          aria-label="Italic"
          aria-pressed={editor.isActive('italic')}
        >
          <em>I</em>
        </button>
        <button
          onClick={handleSetLink}
          className={getButtonClassName(editor.isActive('link'))}
          title="Insert/Edit Link (Ctrl+K)"
          type="button"
          aria-label="Insert or edit link"
          aria-pressed={editor.isActive('link')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
          </svg>
        </button>
        <div className="w-px bg-[var(--border-color)] mx-1" aria-hidden="true" />
        <button
          onClick={() => handleHeading(1)}
          className={getButtonClassName(editor.isActive('heading', { level: 1 }))}
          title="Heading 1"
          type="button"
          aria-label="Heading 1"
          aria-pressed={editor.isActive('heading', { level: 1 })}
        >
          H1
        </button>
        <button
          onClick={() => handleHeading(2)}
          className={getButtonClassName(editor.isActive('heading', { level: 2 }))}
          title="Heading 2"
          type="button"
          aria-label="Heading 2"
          aria-pressed={editor.isActive('heading', { level: 2 })}
        >
          H2
        </button>
        <button
          onClick={() => handleHeading(3)}
          className={getButtonClassName(editor.isActive('heading', { level: 3 }))}
          title="Heading 3"
          type="button"
          aria-label="Heading 3"
          aria-pressed={editor.isActive('heading', { level: 3 })}
        >
          H3
        </button>
        <div className="w-px bg-[var(--border-color)] mx-1" aria-hidden="true" />
        <button
          onClick={handleBulletList}
          className={getButtonClassName(editor.isActive('bulletList'))}
          title="Bullet List"
          type="button"
          aria-label="Bullet list"
          aria-pressed={editor.isActive('bulletList')}
        >
          •
        </button>
        <button
          onClick={handleOrderedList}
          className={getButtonClassName(editor.isActive('orderedList'))}
          title="Numbered List"
          type="button"
          aria-label="Numbered list"
          aria-pressed={editor.isActive('orderedList')}
        >
          1.
        </button>
        <button
          onClick={handleBlockquote}
          className={getButtonClassName(editor.isActive('blockquote'))}
          title="Blockquote (Click to toggle on/off)"
          type="button"
          aria-label="Blockquote"
          aria-pressed={editor.isActive('blockquote')}
        >
          &quot;
        </button>
        <div className="w-px bg-[var(--border-color)] mx-1" aria-hidden="true" />
        <button
          onClick={handleUndo}
          disabled={!editor.can().undo()}
          className={getButtonClassName(false)}
          title="Undo (Ctrl+Z)"
          type="button"
          aria-label="Undo"
        >
          ↶
        </button>
        <button
          onClick={handleRedo}
          disabled={!editor.can().redo()}
          className={getButtonClassName(false)}
          title="Redo (Ctrl+Y)"
          type="button"
          aria-label="Redo"
        >
          ↷
        </button>
        <div className="w-px bg-[var(--border-color)] mx-1" aria-hidden="true" />
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-3 py-1.5 bg-[var(--electric-blue)] text-white rounded text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          type="button"
          title="Save & Publish (Ctrl+S)"
          aria-label="Save and publish"
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="px-3 py-1.5 bg-[var(--background)] border border-[var(--border-color)] text-[var(--foreground)] rounded hover:bg-[var(--card-bg)] disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
          type="button"
          title="Cancel (Esc)"
          aria-label="Cancel editing"
        >
          Cancel
        </button>
      </div>

      {/* Link input modal */}
      {showLinkInput && (
        <div className="sticky top-[60px] z-20 p-3 bg-[var(--card-bg)] border-x border-[var(--border-color)] flex gap-2 items-center">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => {
              setLinkUrl(e.target.value)
              setError(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleLinkSubmit()
              } else if (e.key === 'Escape') {
                e.preventDefault()
                handleLinkCancel()
              }
            }}
            placeholder="Enter URL"
            className="flex-1 px-3 py-1.5 bg-[var(--background)] border border-[var(--border-color)] rounded text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--electric-blue)]"
            autoFocus
            aria-label="Link URL"
          />
          <button
            onClick={handleLinkSubmit}
            className="px-3 py-1.5 bg-[var(--electric-blue)] text-white rounded text-sm hover:opacity-90"
            type="button"
            aria-label="Apply link"
          >
            Apply
          </button>
          <button
            onClick={handleLinkCancel}
            className="px-3 py-1.5 bg-[var(--background)] border border-[var(--border-color)] text-[var(--foreground)] rounded text-sm hover:bg-[var(--card-bg)]"
            type="button"
            aria-label="Cancel link"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Editor - Scrollable */}
      <div className="bg-[var(--card-bg)] border-x border-b border-[var(--border-color)] rounded-b-lg max-h-[600px] overflow-y-auto min-h-[400px]">
        <style dangerouslySetInnerHTML={{ __html: `
          .ProseMirror blockquote {
            border-left: 4px solid var(--electric-blue) !important;
            padding-left: 0.75rem !important;
            margin: 1rem 0 !important;
            font-style: italic !important;
            color: var(--foreground-low) !important;
            background-color: rgba(13, 20, 33, 0.3) !important;
            padding-top: 0.5rem !important;
            padding-bottom: 0.5rem !important;
          }
        `}} />
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
