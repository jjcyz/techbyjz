'use client'

import { memo } from 'react'
import type { Editor } from '@tiptap/react'
import { ToolbarButton } from './ToolbarButton'

interface FormattingButtonsProps {
  editor: Editor
  onBold: () => void
  onItalic: () => void
  onLink: () => void
  onImage: () => void
}

function FormattingButtonsComponent({
  editor,
  onBold,
  onItalic,
  onLink,
  onImage,
}: FormattingButtonsProps) {
  // Compute editor.isActive calls once per render to avoid repeated checks
  const isBoldActive = editor.isActive('bold')
  const isItalicActive = editor.isActive('italic')
  const isLinkActive = editor.isActive('link')
  const isImageActive = editor.isActive('image')
  return (
    <>
      <ToolbarButton
        onClick={onBold}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        isActive={isBoldActive}
        title="Bold (Ctrl+B)"
        aria-label="Bold"
        aria-pressed={isBoldActive}
      >
        <strong>B</strong>
      </ToolbarButton>
      <ToolbarButton
        onClick={onItalic}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        isActive={isItalicActive}
        title="Italic (Ctrl+I)"
        aria-label="Italic"
        aria-pressed={isItalicActive}
      >
        <em>I</em>
      </ToolbarButton>
      <ToolbarButton
        onClick={onLink}
        isActive={isLinkActive}
        title="Insert/Edit Link (Ctrl+K)"
        aria-label="Insert or edit link"
        aria-pressed={isLinkActive}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
        </svg>
      </ToolbarButton>
      <ToolbarButton
        onClick={onImage}
        isActive={isImageActive}
        title="Insert Image"
        aria-label="Insert image"
        aria-pressed={isImageActive}
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

export const FormattingButtons = memo(FormattingButtonsComponent)
