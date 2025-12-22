'use client'

import type { Editor } from '@tiptap/react'

interface ToolbarProps {
  editor: Editor
  onBold: () => void
  onItalic: () => void
  onHeading: (level: 1 | 2 | 3) => void
  onBulletList: () => void
  onOrderedList: () => void
  onBlockquote: () => void
  onLink: () => void
  onImage: () => void
  onUndo: () => void
  onRedo: () => void
  onSave: () => void
  onCancel: () => void
  isSaving: boolean
}

function getButtonClassName(isActive: boolean): string {
  return `px-3 py-1.5 text-sm transition-colors ${
    isActive
      ? 'bg-[var(--electric-blue)] text-white'
      : 'bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--card-bg)]'
  }`
}

export function Toolbar({
  editor,
  onBold,
  onItalic,
  onHeading,
  onBulletList,
  onOrderedList,
  onBlockquote,
  onLink,
  onImage,
  onUndo,
  onRedo,
  onSave,
  onCancel,
  isSaving,
}: ToolbarProps) {
  return (
    <div className="sticky top-0 z-10 flex flex-wrap gap-2 p-3 bg-[var(--card-bg)] border border-[var(--border-color)] shadow-sm" role="toolbar" aria-label="Text formatting toolbar">
      <button
        onClick={onBold}
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
        onClick={onItalic}
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
        onClick={onLink}
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
      <button
        onClick={onImage}
        className={getButtonClassName(editor.isActive('image'))}
        title="Insert Image"
        type="button"
        aria-label="Insert image"
        aria-pressed={editor.isActive('image')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <path d="M21 15l-5-5L5 21"></path>
        </svg>
      </button>
      <div className="w-px bg-[var(--border-color)] mx-1" aria-hidden="true" />
      <button
        onClick={() => onHeading(1)}
        className={getButtonClassName(editor.isActive('heading', { level: 1 }))}
        title="Heading 1"
        type="button"
        aria-label="Heading 1"
        aria-pressed={editor.isActive('heading', { level: 1 })}
      >
        H1
      </button>
      <button
        onClick={() => onHeading(2)}
        className={getButtonClassName(editor.isActive('heading', { level: 2 }))}
        title="Heading 2"
        type="button"
        aria-label="Heading 2"
        aria-pressed={editor.isActive('heading', { level: 2 })}
      >
        H2
      </button>
      <button
        onClick={() => onHeading(3)}
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
        onClick={onBulletList}
        className={getButtonClassName(editor.isActive('bulletList'))}
        title="Bullet List"
        type="button"
        aria-label="Bullet list"
        aria-pressed={editor.isActive('bulletList')}
      >
        •
      </button>
      <button
        onClick={onOrderedList}
        className={getButtonClassName(editor.isActive('orderedList'))}
        title="Numbered List"
        type="button"
        aria-label="Numbered list"
        aria-pressed={editor.isActive('orderedList')}
      >
        1.
      </button>
      <button
        onClick={onBlockquote}
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
        onClick={onUndo}
        disabled={!editor.can().undo()}
        className={getButtonClassName(false)}
        title="Undo (Ctrl+Z)"
        type="button"
        aria-label="Undo"
      >
        ↶
      </button>
      <button
        onClick={onRedo}
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
        onClick={onSave}
        disabled={isSaving}
        className="px-3 py-1.5 bg-[var(--electric-blue)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        type="button"
        title="Save & Publish (Ctrl+S)"
        aria-label="Save and publish"
      >
        {isSaving ? 'Saving...' : 'Save'}
      </button>
      <button
        onClick={onCancel}
        disabled={isSaving}
        className="px-3 py-1.5 bg-[var(--background)] border border-[var(--border-color)] text-[var(--foreground)] hover:bg-[var(--card-bg)] disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
        type="button"
        title="Cancel (Esc)"
        aria-label="Cancel editing"
      >
        Cancel
      </button>
    </div>
  )
}

