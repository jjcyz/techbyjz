'use client'

import type { Editor } from '@tiptap/react'
import { ToolbarButton } from './ToolbarButton'

interface HeadingButtonsProps {
  editor: Editor
  onHeading: (level: 1 | 2 | 3) => void
}

export function HeadingButtons({ editor, onHeading }: HeadingButtonsProps) {
  return (
    <>
      <ToolbarButton
        onClick={() => onHeading(1)}
        isActive={editor.isActive('heading', { level: 1 })}
        title="Heading 1"
        aria-label="Heading 1"
        aria-pressed={editor.isActive('heading', { level: 1 })}
      >
        H1
      </ToolbarButton>
      <ToolbarButton
        onClick={() => onHeading(2)}
        isActive={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
        aria-label="Heading 2"
        aria-pressed={editor.isActive('heading', { level: 2 })}
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        onClick={() => onHeading(3)}
        isActive={editor.isActive('heading', { level: 3 })}
        title="Heading 3"
        aria-label="Heading 3"
        aria-pressed={editor.isActive('heading', { level: 3 })}
      >
        H3
      </ToolbarButton>
    </>
  )
}

