'use client'

import { memo } from 'react'
import type { Editor } from '@tiptap/react'
import { ToolbarButton } from './ToolbarButton'

interface ListButtonsProps {
  editor: Editor
  onBulletList: () => void
  onOrderedList: () => void
  onBlockquote: () => void
}

function ListButtonsComponent({
  editor,
  onBulletList,
  onOrderedList,
  onBlockquote,
}: ListButtonsProps) {
  // Compute editor.isActive calls once per render to avoid repeated checks
  const isBulletListActive = editor.isActive('bulletList')
  const isOrderedListActive = editor.isActive('orderedList')
  const isBlockquoteActive = editor.isActive('blockquote')
  return (
    <>
      <ToolbarButton
        onClick={onBulletList}
        isActive={isBulletListActive}
        title="Bullet List"
        aria-label="Bullet list"
        aria-pressed={isBulletListActive}
      >
        •
      </ToolbarButton>
      <ToolbarButton
        onClick={onOrderedList}
        isActive={isOrderedListActive}
        title="Numbered List"
        aria-label="Numbered list"
        aria-pressed={isOrderedListActive}
      >
        1.
      </ToolbarButton>
      <ToolbarButton
        onClick={onBlockquote}
        isActive={isBlockquoteActive}
        title="Blockquote (Click to toggle on/off)"
        aria-label="Blockquote"
        aria-pressed={isBlockquoteActive}
      >
        &quot;
      </ToolbarButton>
    </>
  )
}

export const ListButtons = memo(ListButtonsComponent)
