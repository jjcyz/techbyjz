import React from 'react'
import type { PreviewProps } from 'sanity'

interface TableCell {
  content: Array<{
    _type: 'block'
    _key: string
    style: 'normal'
    children: Array<{ _type: 'span'; _key: string; text: string; marks?: string[] }>
    markDefs?: Array<{ _key: string; _type: 'link'; href: string }>
  }>
  isHeader: boolean
}

interface TableRow {
  cells: TableCell[]
}

function PortableTextToText({ blocks }: { blocks: TableCell['content'] }) {
  if (!blocks || blocks.length === 0) return <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Empty</span>

  return (
    <div style={{ fontSize: '0.875rem', color: 'inherit' }}>
      {blocks.map((block) => {
        if (!block.children || block.children.length === 0) return null
        return (
          <div key={block._key} style={{ color: 'inherit' }}>
            {block.children.map((child) => {
              if (child._type === 'span' && child.text) {
                const textStyle: React.CSSProperties = { color: 'inherit' }
                if (child.marks) {
                  if (child.marks.includes('strong')) {
                    textStyle.fontWeight = 'bold'
                  }
                  if (child.marks.includes('em')) {
                    textStyle.fontStyle = 'italic'
                  }
                  if (child.marks.includes('code')) {
                    textStyle.fontFamily = 'monospace'
                    textStyle.backgroundColor = '#f3f4f6'
                    textStyle.padding = '0.125rem 0.25rem'
                    textStyle.borderRadius = '0.25rem'
                  }
                }
                return <span key={child._key} style={textStyle}>{child.text}</span>
              }
              return null
            })}
          </div>
        )
      })}
    </div>
  )
}

export function TablePreview(props: PreviewProps) {
  const rows = (props as PreviewProps & { rows?: TableRow[] }).rows ||
               ((props as PreviewProps & { [key: string]: unknown })['rows'] as TableRow[] | undefined)
  if (!rows || rows.length === 0) {
    return (
      <div style={{ padding: '1rem', color: '#6b7280', fontStyle: 'italic', border: '1px solid #e5e7eb', borderRadius: '0.25rem' }}>
        Empty table
      </div>
    )
  }

  const maxCols = Math.max(...rows.map((row: TableRow) => row.cells?.length || 0))

  const getTableText = () => {
    return rows.map((row: TableRow) => {
      return Array.from({ length: maxCols })
        .map((_, colIndex) => {
          const cell = row.cells?.[colIndex]
          if (!cell || !cell.content || cell.content.length === 0) return ''
          return cell.content
            .map(block =>
              block.children
                ?.map((child: { _type?: string; text?: string }) => child.text || '')
                .join('') || ''
            )
            .join(' ')
        })
        .join('\t')
    }).join('\n')
  }

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const text = getTableText()
    navigator.clipboard.writeText(text).then(() => {
      const button = e.currentTarget as HTMLButtonElement
      const originalText = button.textContent
      button.textContent = 'Copied!'
      setTimeout(() => {
        button.textContent = originalText
      }, 2000)
    }).catch(err => {
      console.error('Failed to copy:', err)
    })
  }

  return (
    <div style={{ overflowX: 'auto', margin: '1rem 0', userSelect: 'text' }}>
      <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
          {rows.length} row{rows.length !== 1 ? 's' : ''} × {maxCols} column{maxCols !== 1 ? 's' : ''}
        </div>
        <button
          onClick={handleCopy}
          style={{
            padding: '0.25rem 0.5rem',
            fontSize: '0.75rem',
            backgroundColor: '#f3f4f6',
            border: '1px solid #d1d5db',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            color: '#374151',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#e5e7eb'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6'
          }}
        >
          Copy Table
        </button>
      </div>
      <table style={{
        minWidth: '100%',
        borderCollapse: 'collapse',
        border: '1px solid #d1d5db',
        fontSize: '0.875rem',
        backgroundColor: '#ffffff',
        userSelect: 'text',
      }}>
        <tbody>
          {rows.map((row: TableRow, rowIndex: number) => (
            <tr key={rowIndex} style={{ borderBottom: '1px solid #e5e7eb' }}>
              {Array.from({ length: maxCols }).map((_, colIndex) => {
                const cell = row.cells?.[colIndex]
                const CellTag = cell?.isHeader ? 'th' : 'td'
                const cellStyle: React.CSSProperties = {
                  border: '1px solid #d1d5db',
                  padding: '0.5rem 0.75rem',
                  verticalAlign: 'top',
                  backgroundColor: cell?.isHeader ? '#f3f4f6' : cell ? '#ffffff' : '#f9fafb',
                  fontWeight: cell?.isHeader ? '600' : 'normal',
                  textAlign: 'left',
                  color: cell?.isHeader ? '#111827' : '#374151',
                  userSelect: 'text',
                }

                return (
                  <CellTag
                    key={colIndex}
                    style={cellStyle}
                  >
                    {cell ? (
                      <PortableTextToText blocks={cell.content} />
                    ) : (
                      <span style={{ color: '#9ca3af' }}>—</span>
                    )}
                  </CellTag>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

