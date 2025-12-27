'use client'

import { memo } from 'react'
import type { Editor } from '@tiptap/react'
import { ToolbarButton } from './ToolbarButton'

interface HeadingButtonsProps {
  editor: Editor
  onHeading: (level: 1 | 2 | 3) => void
}

function HeadingButtonsComponent({ editor, onHeading }: HeadingButtonsProps) {
  // Compute editor.isActive calls once per render to avoid repeated checks
  const isHeading1Active = editor.isActive('heading', { level: 1 })
  const isHeading2Active = editor.isActive('heading', { level: 2 })
  const isHeading3Active = editor.isActive('heading', { level: 3 })
  return (
    <>
      <ToolbarButton
        onClick={() => onHeading(1)}
        isActive={isHeading1Active}
        title="Heading 1"
        aria-label="Heading 1"
        aria-pressed={isHeading1Active}
      >
        H1
      </ToolbarButton>
      <ToolbarButton
        onClick={() => onHeading(2)}
        isActive={isHeading2Active}
        title="Heading 2"
        aria-label="Heading 2"
        aria-pressed={isHeading2Active}
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        onClick={() => onHeading(3)}
        isActive={isHeading3Active}
        title="Heading 3"
        aria-label="Heading 3"
        aria-pressed={isHeading3Active}
      >
        H3
      </ToolbarButton>
    </>
  )
}

export const HeadingButtons = memo(HeadingButtonsComponent)
