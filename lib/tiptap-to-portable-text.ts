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

function generateKey(): string {
  return Math.random().toString(36).substring(2, 15)
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
          // Reuse existing link key if this href was already seen
          if (linkMap.has(href)) {
            linkKey = linkMap.get(href)!
          } else {
            linkKey = generateKey()
            linkMap.set(href, linkKey)
            markDefs.push({
              _key: linkKey,
              _type: 'link',
              href: href,
            })
          }
          marks.push(linkKey)
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

export function tiptapToPortableText(tiptapJson: { type: string; content?: TiptapNode[] }): Array<PortableTextBlock | { _type: 'image'; _key: string; asset: { _type: 'reference'; _ref: string }; alt?: string }> {
  if (!tiptapJson.content || !Array.isArray(tiptapJson.content)) {
    return []
  }

  const blocks: Array<PortableTextBlock | { _type: 'image'; _key: string; asset: { _type: 'reference'; _ref: string }; alt?: string }> = []
  // Track all link annotations globally to deduplicate by href
  const linkMap = new Map<string, string>() // href -> _key mapping

  tiptapJson.content.forEach((node) => {
    if (node.type === 'image') {
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
        ;(block as any).indentLevel = indentLevel
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
        ;(block as any).indentLevel = indentLevel
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

