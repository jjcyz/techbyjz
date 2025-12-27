'use client'

import type { Editor } from '@tiptap/react'
import { FormattingButtons } from './FormattingButtons'
import { HeadingButtons } from './HeadingButtons'
import { ListButtons } from './ListButtons'
import { TableMenu } from './TableMenu'
import { ActionButtons } from './ActionButtons'
import type { TableMenuHandlers } from '../components/TableMenu/types'

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
  onSave: () => void
  onCancel: () => void
  isSaving: boolean
  tableHandlers: TableMenuHandlers
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
  onSave,
  onCancel,
  isSaving,
  tableHandlers,
}: ToolbarProps) {
  return (
    <div className="sticky top-0 z-10 flex flex-wrap gap-2 p-3 bg-[var(--card-bg)] border border-[var(--border-color)] shadow-sm" role="toolbar" aria-label="Text formatting toolbar">
      <FormattingButtons
        editor={editor}
        onBold={onBold}
        onItalic={onItalic}
        onLink={onLink}
        onImage={onImage}
      />
      <HeadingButtons editor={editor} onHeading={onHeading} />
      <ListButtons
        editor={editor}
        onBulletList={onBulletList}
        onOrderedList={onOrderedList}
        onBlockquote={onBlockquote}
      />
      <TableMenu editor={editor} {...tableHandlers} />
      <ActionButtons onSave={onSave} onCancel={onCancel} isSaving={isSaving} />
    </div>
  )
}

