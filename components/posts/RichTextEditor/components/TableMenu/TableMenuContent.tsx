'use client'

import type { TableMenuContent } from './types'

interface TableMenuContentProps {
  items: TableMenuContent[]
}

export function TableMenuContent({ items }: TableMenuContentProps) {
  return (
    <>
      {items.map((item, index) => {
        if (item.type === 'section') {
          return (
            <div key={`section-${index}`}>
              <div className="text-xs font-semibold text-[var(--foreground-muted)] px-2 py-1 mb-1">
                {item.section.section}
              </div>
              {item.section.items.map((subItem, subIndex) => (
                <button
                  key={`${index}-${subIndex}`}
                  onClick={subItem.onClick}
                  disabled={subItem.disabled}
                  className={`w-full text-left px-2 py-1.5 text-sm hover:bg-[var(--background)] rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                    subItem.danger ? 'text-red-400 hover:bg-red-500/10' : ''
                  }`}
                  type="button"
                >
                  {subItem.label}
                </button>
              ))}
            </div>
          )
        }

        if (item.type === 'item') {
          return (
            <button
              key={`item-${index}`}
              onClick={item.item.onClick}
              disabled={item.item.disabled}
              className={`w-full text-left px-2 py-1.5 text-sm hover:bg-[var(--background)] rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                item.item.danger ? 'text-red-400 hover:bg-red-500/10' : ''
              }`}
              type="button"
            >
              {item.item.label}
            </button>
          )
        }

        return null
      })}
    </>
  )
}

