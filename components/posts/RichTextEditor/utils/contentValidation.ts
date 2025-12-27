import type { PortableTextBlock } from '@portabletext/types'
import type { PortableTextContent } from '../types'

/**
 * Validates that image blocks have proper Sanity references
 */
export function validateImageReferences(blocks: PortableTextContent[]): {
  isValid: boolean
  invalidCount: number
  errorMessage?: string
} {
  const imagesWithoutRefs = blocks.filter((block): boolean => {
    if (block._type === 'image') {
      const imageBlock = block as { _type: 'image'; asset?: { _ref?: string } }
      const ref = imageBlock.asset?._ref
      return !ref || typeof ref !== 'string' || ref.startsWith('http')
    }
    return false
  })

  if (imagesWithoutRefs.length > 0) {
    return {
      isValid: false,
      invalidCount: imagesWithoutRefs.length,
      errorMessage: `Some images are missing valid Sanity references. ` +
        `Please remove and re-upload ${imagesWithoutRefs.length === 1 ? 'the image' : 'the images'} using the image upload button.`,
    }
  }

  return { isValid: true, invalidCount: 0 }
}

/**
 * Filters out invalid blocks and ensures content has meaningful data
 */
export function filterValidBlocks(blocks: PortableTextContent[]): PortableTextContent[] {
  return blocks.filter((block): block is PortableTextContent => {
    if (block._type === 'image') {
      return true
    }

    if (block._type === 'table' && 'rows' in block) {
      const tableBlock = block as { _type: 'table'; rows?: Array<{ cells: unknown[] }> }
      if (!tableBlock.rows || tableBlock.rows.length === 0) {
        return false
      }
      const hasValidCells = tableBlock.rows.some(row =>
        row &&
        Array.isArray(row.cells) &&
        row.cells.length > 0
      )
      return hasValidCells
    }

    if (block._type !== 'block' || !('children' in block) || !block.children || block.children.length === 0) {
      return false
    }

    return block.children.some((child: { _type?: string; text?: string | null }) => {
      return child._type === 'span' && 'text' in child && child.text !== undefined && child.text !== null
    })
  })
}

