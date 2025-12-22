/**
 * Converts PortableText to HTML for Tiptap editor
 * Preserves all formatting including bold, italic, headings, lists, etc.
 */

import { PortableTextBlock } from '@portabletext/types'
import { getImageUrl } from './image'
import type { SanityImage } from '@/types/post'

export function portableTextToHtml(blocks: PortableTextBlock[] | null | undefined): string {
  if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
    return ''
  }

  const html: string[] = []
  let currentList: { type: 'bullet' | 'number'; items: string[] } | null = null

  const flushList = () => {
    if (currentList) {
      const tag = currentList.type === 'bullet' ? 'ul' : 'ol'
      html.push(`<${tag}>${currentList.items.map(item => `<li>${item}</li>`).join('')}</${tag}>`)
      currentList = null
    }
  }

  blocks.forEach((block) => {
    if (block._type === 'image') {
      // Handle image blocks
      const imageBlock = block as { _type: 'image'; asset?: { _ref?: string; _type?: string } | string; alt?: string }
      let imageUrl: string | null = null
      let sanityRef: string | null = null
      let sanityImageData: string | null = null

      // Handle different image formats
      if (typeof imageBlock.asset === 'string') {
        // Legacy: direct URL
        imageUrl = imageBlock.asset
      } else if (imageBlock.asset && typeof imageBlock.asset === 'object') {
        // Sanity image reference
        const ref = imageBlock.asset._ref
        if (ref) {
          sanityRef = ref
          // Convert to SanityImage format and get URL
          const sanityImage: SanityImage = {
            _type: 'image',
            asset: {
              _type: 'reference',
              _ref: ref,
            },
            alt: imageBlock.alt,
          }

          // Get the image URL from Sanity
          imageUrl = getImageUrl(sanityImage, 800)

          // Store the full image data as JSON for saving back
          sanityImageData = JSON.stringify(sanityImage)
        }
      }

      if (imageUrl) {
        const alt = imageBlock.alt || ''
        // Include Sanity metadata as data attributes so we can save it back
        const dataAttrs: string[] = []
        if (sanityRef) {
          dataAttrs.push(`data-sanity-ref="${escapeHtml(sanityRef)}"`)
        }
        if (sanityImageData) {
          dataAttrs.push(`data-sanity-image="${escapeHtml(sanityImageData)}"`)
        }
        const dataAttrStr = dataAttrs.length > 0 ? ` ${dataAttrs.join(' ')}` : ''
        html.push(`<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(alt)}"${dataAttrStr} />`)
      }
      return
    }

    if (block._type !== 'block') {
      return
    }

    const children = processChildren(block.children || [], block.markDefs || [])
    const text = children.join('')

    // Handle lists - group consecutive list items
    if (block.listItem === 'bullet') {
      if (!currentList || currentList.type !== 'bullet') {
        flushList()
        currentList = { type: 'bullet', items: [] }
      }
      currentList.items.push(text)
      return
    } else if (block.listItem === 'number') {
      if (!currentList || currentList.type !== 'number') {
        flushList()
        currentList = { type: 'number', items: [] }
      }
      currentList.items.push(text)
      return
    } else {
      // Not a list item, flush any current list
      flushList()
    }

    // Handle different block styles
    if (block.style === 'h1') {
      html.push(`<h1>${text}</h1>`)
    } else if (block.style === 'h2') {
      html.push(`<h2>${text}</h2>`)
    } else if (block.style === 'h3') {
      html.push(`<h3>${text}</h3>`)
    } else if (block.style === 'h4') {
      html.push(`<h4>${text}</h4>`)
    } else if (block.style === 'blockquote') {
      html.push(`<blockquote>${text}</blockquote>`)
    } else {
      html.push(`<p>${text}</p>`)
    }
  })

  // Flush any remaining list
  flushList()

  return html.join('')
}

function processChildren(
  children: Array<{ _type?: string; text?: string; marks?: string[] }>,
  markDefs: Array<{ _key?: string; _type?: string; href?: string }>
): string[] {
  return children.map((child) => {
    if (child._type !== 'span' || !child.text) {
      return ''
    }

    let text = escapeHtml(child.text)
    const marks = child.marks || []

    // Apply marks in order (inner to outer)
    // First apply code, then links, then formatting
    marks.forEach((mark) => {
      // Check if it's a link annotation
      const linkDef = markDefs.find((def) => def._key === mark)
      if (linkDef && linkDef._type === 'link' && linkDef.href) {
        text = `<a href="${escapeHtml(linkDef.href)}">${text}</a>`
      } else if (mark === 'strong') {
        text = `<strong>${text}</strong>`
      } else if (mark === 'em') {
        text = `<em>${text}</em>`
      } else if (mark === 'code') {
        text = `<code>${text}</code>`
      }
    })

    return text
  })
}

function escapeHtml(text: string): string {
  const div = typeof document !== 'undefined' ? document.createElement('div') : null
  if (div) {
    div.textContent = text
    return div.innerHTML
  }
  // Fallback for SSR
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

