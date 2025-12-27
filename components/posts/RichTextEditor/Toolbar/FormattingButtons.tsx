'use client'

import type { Editor } from '@tiptap/react'
import { ToolbarButton } from './ToolbarButton'

interface FormattingButtonsProps {
  editor: Editor
  onBold: () => void
  onItalic: () => void
  onLink: () => void
  onImage: () => void
}

export function FormattingButtons({
  editor,
  onBold,
  onItalic,
  onLink,
  onImage,
}: FormattingButtonsProps) {
  return (
    <>
      <ToolbarButton
        onClick={onBold}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="Bold (Ctrl+B)"
        aria-label="Bold"
        aria-pressed={editor.isActive('bold')}
      >
        <strong>B</strong>
      </ToolbarButton>
      <ToolbarButton
        onClick={onItalic}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="Italic (Ctrl+I)"
        aria-label="Italic"
        aria-pressed={editor.isActive('italic')}
      >
        <em>I</em>
      </ToolbarButton>
      <ToolbarButton
        onClick={onLink}
        isActive={editor.isActive('link')}
        title="Insert/Edit Link (Ctrl+K)"
        aria-label="Insert or edit link"
        aria-pressed={editor.isActive('link')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
        </svg>
      </ToolbarButton>
      <ToolbarButton
        onClick={onImage}
        isActive={editor.isActive('image')}
        title="Insert Image"
        aria-label="Insert image"
        aria-pressed={editor.isActive('image')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <path d="M21 15l-5-5L5 21"></path>
        </svg>
      </ToolbarButton>
    </>
  )
}

