'use client'

import { useState, useRef, useEffect } from 'react'
import type { Editor } from '@tiptap/react'
import { ToolbarButton } from './ToolbarButton'
import { createTableMenuItems } from '../components/TableMenu/tableMenuItems'
import { TableMenuContent } from '../components/TableMenu/TableMenuContent'
import type { TableMenuHandlers } from '../components/TableMenu/types'

interface TableMenuProps extends TableMenuHandlers {
  editor: Editor
}

export function TableMenu({
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
}: TableMenuProps) {
  const [showTableMenu, setShowTableMenu] = useState(false)
  const tableMenuRef = useRef<HTMLDivElement>(null)
  const isInTable = editor.isActive('table')

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tableMenuRef.current && !tableMenuRef.current.contains(event.target as Node)) {
        setShowTableMenu(false)
      }
    }

    if (showTableMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showTableMenu])

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
  }

  const menuItems = createTableMenuItems(editor, handlers, () => setShowTableMenu(false))

  return (
    <div className="relative" ref={tableMenuRef}>
      <ToolbarButton
        onClick={() => {
          if (isInTable) {
            setShowTableMenu(!showTableMenu)
          } else {
            onInsertTable()
          }
        }}
        isActive={isInTable || showTableMenu}
        title={isInTable ? "Table options" : "Insert Table"}
        aria-label={isInTable ? "Table options" : "Insert table"}
        aria-pressed={isInTable}
        aria-expanded={showTableMenu}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
          <path d="M12 3v18"></path>
          <rect x="4" y="4" width="16" height="16" rx="2"></rect>
          <path d="M4 12h16"></path>
        </svg>
      </ToolbarButton>
      {showTableMenu && isInTable && (
        <div className="absolute top-full left-0 mt-1 bg-[var(--card-bg)] border border-[var(--border-color)] rounded shadow-lg p-2 min-w-[200px] z-20">
          <TableMenuContent items={menuItems} />
        </div>
      )}
    </div>
  )
}

