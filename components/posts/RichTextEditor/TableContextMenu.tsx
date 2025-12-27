'use client'

import { useState, useEffect, useRef } from 'react'
import type { Editor } from '@tiptap/react'
import { createTableMenuItems } from './components/TableMenu/tableMenuItems'
import { TableMenuContent } from './components/TableMenu/TableMenuContent'
import type { TableMenuHandlers } from './components/TableMenu/types'

interface TableContextMenuProps extends TableMenuHandlers {
  editor: Editor
}

export function TableContextMenu({
  editor,
  onInsertTable,
  onAddColumnBefore,
  onAddColumnAfter,
  onDeleteColumn,
  onAddRowBefore,
  onAddRowAfter,
  onDeleteRow,
  onDeleteTable,
  onMergeCells,
  onSplitCell,
  onToggleHeaderColumn,
  onToggleHeaderRow,
  onToggleHeaderCell,
  onClearFormatting,
}: TableContextMenuProps) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleContextMenu = (event: MouseEvent) => {
      if (!editor) return

      const target = event.target as HTMLElement
      const isInTable = target.closest('table') || target.closest('.ProseMirror table')

      if (isInTable) {
        event.preventDefault()
        const x = Math.min(event.clientX, window.innerWidth - 220)
        const y = Math.min(event.clientY, window.innerHeight - 400)
        setPosition({ x: Math.max(10, x), y: Math.max(10, y) })
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    const handleClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsVisible(false)
      }
    }

    const editorElement = editor.view.dom
    editorElement.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('click', handleClick)

    return () => {
      editorElement.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('click', handleClick)
    }
  }, [editor])

  if (!isVisible || !position) return null

  const handlers: TableMenuHandlers = {
    onInsertTable,
    onAddColumnBefore,
    onAddColumnAfter,
    onDeleteColumn,
    onAddRowBefore,
    onAddRowAfter,
    onDeleteRow,
    onDeleteTable,
    onMergeCells,
    onSplitCell,
    onToggleHeaderColumn,
    onToggleHeaderRow,
    onToggleHeaderCell,
    onClearFormatting,
  }

  const menuItems = createTableMenuItems(editor, handlers, () => setIsVisible(false))

  return (
    <div
      ref={menuRef}
      className="fixed bg-[var(--card-bg)] border border-[var(--border-color)] rounded shadow-lg p-2 min-w-[200px] z-50"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <TableMenuContent items={menuItems} />
    </div>
  )
}
