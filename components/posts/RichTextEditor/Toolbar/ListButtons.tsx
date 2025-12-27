'use client'

import type { Editor } from '@tiptap/react'
import { ToolbarButton } from './ToolbarButton'

interface ListButtonsProps {
  editor: Editor
  onBulletList: () => void
  onOrderedList: () => void
  onBlockquote: () => void
}

export function ListButtons({
  editor,
  onBulletList,
  onOrderedList,
  onBlockquote,
}: ListButtonsProps) {
  return (
    <>
      <ToolbarButton
        onClick={onBulletList}
        isActive={editor.isActive('bulletList')}
        title="Bullet List"
        aria-label="Bullet list"
        aria-pressed={editor.isActive('bulletList')}
      >
        •
      </ToolbarButton>
      <ToolbarButton
        onClick={onOrderedList}
        isActive={editor.isActive('orderedList')}
        title="Numbered List"
        aria-label="Numbered list"
        aria-pressed={editor.isActive('orderedList')}
      >
        1.
      </ToolbarButton>
      <ToolbarButton
        onClick={onBlockquote}
        isActive={editor.isActive('blockquote')}
        title="Blockquote (Click to toggle on/off)"
        aria-label="Blockquote"
        aria-pressed={editor.isActive('blockquote')}
      >
        &quot;
      </ToolbarButton>
    </>
  )
}

