/**
 * Converts Tiptap JSON to PortableText format
 */

import { PortableTextBlock } from '@portabletext/types'

interface TiptapNode {
  type: string
  content?: TiptapNode[]
  text?: string
  attrs?: Record<string, unknown>
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>
}

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

interface TableBlock {
  _type: 'table'
  _key: string
  rows: TableRow[]
}

interface PortableTextBlockWithIndent extends PortableTextBlock {
  indentLevel?: number
}

function generateKey(): string {
  return Math.random().toString(36).substring(2, 15)
}

function convertTableToStructured(tableNode: TiptapNode, linkMap: Map<string, string>): TableRow[] | null {
  if (!tableNode.content || !Array.isArray(tableNode.content)) {
    return null
  }

  const rows: TableRow[] = []

  tableNode.content.forEach((rowNode) => {
    if (rowNode.type !== 'tableRow' || !rowNode.content) {
      return
    }

    const cells: TableCell[] = []
    rowNode.content.forEach((cellNode) => {
      if ((cellNode.type !== 'tableCell' && cellNode.type !== 'tableHeader') || !cellNode.content) {
        return
      }

      const isHeader = cellNode.type === 'tableHeader'
      const cellContent: TableCell['content'] = []

      cellNode.content.forEach((paraNode) => {
        if (paraNode.type === 'paragraph') {
          // Handle both paragraphs with content and empty paragraphs
          if (paraNode.content && paraNode.content.length > 0) {
            const result = processInlineContent(paraNode, linkMap)

          // Ensure children are properly structured
          const validChildren = result.children.length > 0
            ? result.children.filter(child =>
                child &&
                child._type === 'span' &&
                typeof child._key === 'string' &&
                child._key.length > 0 &&
                typeof child.text === 'string'
              )
            : []

          // Always ensure at least one child exists
          if (validChildren.length === 0) {
            validChildren.push({ _type: 'span', _key: generateKey(), text: '' })
          }

          const block: TableCell['content'][0] = {
            _type: 'block',
            _key: generateKey(),
            style: 'normal',
            children: validChildren,
          }

          // Only add markDefs if they exist and are valid
          if (result.markDefs && Array.isArray(result.markDefs) && result.markDefs.length > 0) {
            // Filter out any invalid markDefs and ensure href is a valid URL string
            const validMarkDefs = result.markDefs
              .filter(def =>
                def &&
                typeof def === 'object' &&
                typeof def._key === 'string' &&
                def._key.length > 0 &&
                def._type === 'link' &&
                typeof def.href === 'string' &&
                def.href.trim().length > 0
              )
              .map(def => ({
                _key: String(def._key),
                _type: 'link' as const,
                href: String(def.href).trim(),
              }))

            if (validMarkDefs.length > 0) {
              block.markDefs = validMarkDefs
            }
          }

            cellContent.push(block)
          } else {
            // Empty paragraph - still create a block with empty text
            // Ensure the structure is valid
            cellContent.push({
              _type: 'block' as const,
              _key: generateKey(),
              style: 'normal' as const,
              children: [{
                _type: 'span' as const,
                _key: generateKey(),
                text: ''
              }],
            })
          }
        }
      })

      // Always ensure at least one block exists
      if (cellContent.length === 0) {
        cellContent.push({
          _type: 'block',
          _key: generateKey(),
          style: 'normal',
          children: [{ _type: 'span', _key: generateKey(), text: '' }],
        })
      }

      // Ensure content array is not empty and all blocks have required fields
      const validContent = cellContent
        .filter(block => {
          return block._type === 'block' &&
                 typeof block._key === 'string' &&
                 block._key.length > 0 &&
                 typeof block.style === 'string' &&
                 Array.isArray(block.children) &&
                 block.children.length > 0 &&
                 block.children.every(child =>
                   child._type === 'span' &&
                   typeof child._key === 'string' &&
                   typeof child.text === 'string'
                 )
        })
        .map(block => {
          // Clean up the block structure
          const cleanedBlock: TableCell['content'][0] = {
            _type: 'block',
            _key: block._key,
            style: block.style,
            children: block.children.map(child => ({
              _type: 'span',
              _key: child._key,
              text: child.text || '',
              ...(child.marks && Array.isArray(child.marks) && child.marks.length > 0
                ? { marks: child.marks.filter(m => typeof m === 'string') }
                : {}),
            })),
          }

          // Only include markDefs if they're valid
          if (block.markDefs && Array.isArray(block.markDefs) && block.markDefs.length > 0) {
            const validMarkDefs = block.markDefs.filter(def =>
              def &&
              typeof def._key === 'string' &&
              def._type === 'link' &&
              typeof def.href === 'string' &&
              def.href.trim().length > 0
            )
            if (validMarkDefs.length > 0) {
              cleanedBlock.markDefs = validMarkDefs.map(def => ({
                _key: def._key,
                _type: 'link',
                href: def.href.trim(),
              }))
            }
          }

          return cleanedBlock
        })

      if (validContent.length > 0) {
        cells.push({
          content: validContent,
          isHeader: Boolean(isHeader),
        })
      }
    })

    if (cells.length > 0) {
      rows.push({ cells })
    }
  })

  return rows.length > 0 ? rows : null
}

function processInlineContent(
  node: TiptapNode,
  linkMap: Map<string, string>
): {
  children: Array<{ _type: 'span'; _key: string; text: string; marks?: string[] }>
  markDefs: Array<{ _key: string; _type: 'link'; href: string }>
} {
  const children: Array<{ _type: 'span'; _key: string; text: string; marks?: string[] }> = []
  const markDefs: Array<{ _key: string; _type: 'link'; href: string }> = []

  if (node.type === 'text') {
    const marks: string[] = []
    let linkKey: string | null = null

    if (node.marks) {
      node.marks.forEach((mark) => {
        if (mark.type === 'bold' || mark.type === 'strong') {
          marks.push('strong')
        } else if (mark.type === 'italic' || mark.type === 'em') {
          marks.push('em')
        } else if (mark.type === 'code') {
          marks.push('code')
        } else if (mark.type === 'link' && mark.attrs?.href) {
          const href = mark.attrs.href as string
          // Validate href is a non-empty string
          if (href && typeof href === 'string' && href.trim().length > 0) {
            const normalizedHref = href.trim()
            // Reuse existing link key if this href was already seen
            if (linkMap.has(normalizedHref)) {
              linkKey = linkMap.get(normalizedHref)!
            } else {
              linkKey = generateKey()
              linkMap.set(normalizedHref, linkKey)
              markDefs.push({
                _key: linkKey,
                _type: 'link',
                href: normalizedHref,
              })
            }
            marks.push(linkKey)
          }
        }
      })
    }

    // Preserve all text, including spaces and empty strings
    // Use empty string if text is undefined/null to preserve structure
    const text = node.text ?? ''
    children.push({
      _type: 'span',
      _key: generateKey(),
      text: text,
      marks: marks.length > 0 ? marks : undefined,
    })
  } else if (node.content) {
    node.content.forEach((child) => {
      const result = processInlineContent(child, linkMap)
      children.push(...result.children)
      // Only add unique markDefs (deduplicate by _key)
      result.markDefs.forEach((def) => {
        if (!markDefs.find((d) => d._key === def._key)) {
          markDefs.push(def)
        }
      })
    })
  }

  return { children, markDefs }
}

export function tiptapToPortableText(tiptapJson: { type: string; content?: TiptapNode[] }): Array<PortableTextBlock | { _type: 'image'; _key: string; asset: { _type: 'reference'; _ref: string }; alt?: string } | TableBlock> {
  if (!tiptapJson.content || !Array.isArray(tiptapJson.content)) {
    return []
  }

  const blocks: Array<PortableTextBlock | { _type: 'image'; _key: string; asset: { _type: 'reference'; _ref: string }; alt?: string } | TableBlock> = []
  // Track all link annotations globally to deduplicate by href
  const linkMap = new Map<string, string>() // href -> _key mapping

  tiptapJson.content.forEach((node) => {
    if (node.type === 'table') {
      // Convert table to structured format
      const tableRows = convertTableToStructured(node, linkMap)
      if (tableRows && tableRows.length > 0) {
        // Ensure all rows have valid cells
        const validRows = tableRows.filter(row =>
          row &&
          Array.isArray(row.cells) &&
          row.cells.length > 0 &&
          row.cells.every(cell =>
            cell &&
            Array.isArray(cell.content) &&
            cell.content.length > 0 &&
            typeof cell.isHeader === 'boolean'
          )
        )

        if (validRows.length > 0) {
          const tableBlock: TableBlock = {
            _type: 'table',
            _key: generateKey(),
            rows: validRows,
          }
          blocks.push(tableBlock)
        }
      }
    } else if (node.type === 'image') {
      // Handle image nodes - convert to PortableText image block
      const attrs = node.attrs || {}
      const alt = attrs.alt as string | undefined
      const sanityImageJson = attrs['data-sanity-image'] as string | undefined
      const sanityRef = attrs['data-sanity-ref'] as string | undefined

      // If we have a Sanity image reference stored in data attributes, use it
      if (sanityImageJson) {
        try {
          const sanityImage = JSON.parse(sanityImageJson)
          blocks.push({
            _type: 'image',
            _key: generateKey(),
            asset: {
              _type: 'reference',
              _ref: sanityImage.asset._ref,
            },
            alt: sanityImage.alt || alt || undefined,
          })
        } catch (error) {
          console.error('Error parsing Sanity image data:', error)
          // Fallback to using ref directly if parsing fails
          if (sanityRef) {
            blocks.push({
              _type: 'image',
              _key: generateKey(),
              asset: {
                _type: 'reference',
                _ref: sanityRef,
              },
              alt: alt || undefined,
            })
          }
        }
      } else if (sanityRef) {
        // Fallback: use the ref directly
        blocks.push({
          _type: 'image',
          _key: generateKey(),
          asset: {
            _type: 'reference',
            _ref: sanityRef,
          },
          alt: alt || undefined,
        })
      } else {
        // Legacy: if no Sanity ref, check if src is a Sanity CDN URL
        // This handles old images that might have been added via URL
        const src = attrs.src as string | undefined
        if (src) {
          // Try to extract asset ID from Sanity CDN URL
          // NOTE: In many cases we can't reliably recover the Sanity asset _id from the URL
          // and sending an invalid reference will cause the post update to fail.
          // Instead of creating a broken reference, we skip these legacy images.
          //
          // If you need to preserve these images, please re-insert them using the new image
          // upload flow so they get proper Sanity metadata.
          console.warn('Skipping image without valid Sanity reference when converting from Tiptap:', src)
        }
      }
    } else if (node.type === 'paragraph') {
      const result = processInlineContent(node, linkMap)
      const indentLevel = node.attrs?.indentLevel as number | undefined

      const block: PortableTextBlock = {
        _type: 'block',
        _key: generateKey(),
        style: 'normal',
        children: result.children.length > 0 ? result.children : [{ _type: 'span', _key: generateKey(), text: '' }],
      }

      if (result.markDefs.length > 0) {
        block.markDefs = result.markDefs
      }

      // Preserve indentLevel if present
      if (indentLevel !== undefined && indentLevel > 0) {
        ;(block as PortableTextBlockWithIndent).indentLevel = indentLevel
      }

      blocks.push(block)
    } else if (node.type === 'heading') {
      const level = node.attrs?.level as number || 1
      const style = `h${Math.min(level, 4)}` as 'h1' | 'h2' | 'h3' | 'h4'
      const indentLevel = node.attrs?.indentLevel as number | undefined

      const result = processInlineContent(node, linkMap)

      const block: PortableTextBlock = {
        _type: 'block',
        _key: generateKey(),
        style,
        children: result.children.length > 0 ? result.children : [{ _type: 'span', _key: generateKey(), text: '' }],
      }

      if (result.markDefs.length > 0) {
        block.markDefs = result.markDefs
      }

      // Preserve indentLevel if present
      if (indentLevel !== undefined && indentLevel > 0) {
        ;(block as PortableTextBlockWithIndent).indentLevel = indentLevel
      }

      blocks.push(block)
    } else if (node.type === 'blockquote') {
      const result = processInlineContent(node, linkMap)

      const block: PortableTextBlock = {
        _type: 'block',
        _key: generateKey(),
        style: 'blockquote',
        children: result.children.length > 0 ? result.children : [{ _type: 'span', _key: generateKey(), text: '' }],
      }

      if (result.markDefs.length > 0) {
        block.markDefs = result.markDefs
      }

      blocks.push(block)
    } else if (node.type === 'bulletList' || node.type === 'orderedList') {
      const isOrdered = node.type === 'orderedList'

      if (node.content) {
        node.content.forEach((listItem) => {
          if (listItem.type === 'listItem' && listItem.content) {
            listItem.content.forEach((paragraph) => {
              const result = processInlineContent(paragraph, linkMap)

              const block: PortableTextBlock = {
                _type: 'block',
                _key: generateKey(),
                style: 'normal',
                listItem: isOrdered ? 'number' : 'bullet',
                children: result.children.length > 0 ? result.children : [{ _type: 'span', _key: generateKey(), text: '' }],
              }

              if (result.markDefs.length > 0) {
                block.markDefs = result.markDefs
              }

              blocks.push(block)
            })
          }
        })
      }
    }
  })

  return blocks
}

