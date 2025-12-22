import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/lib/sanity'
import { PortableTextBlock } from '@portabletext/types'

export async function POST(request: NextRequest) {
  // Only allow in development mode for security
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development mode' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const { id, title, excerpt, content } = body

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }

    const patchOperations: Record<string, unknown> = {}

    if (title !== undefined) {
      patchOperations.title = title
    }

    if (excerpt !== undefined) {
      patchOperations.excerpt = excerpt
    }

    if (content !== undefined) {
      if (Array.isArray(content)) {
        patchOperations.content = content as PortableTextBlock[]

        // Extract the first image from content and set it as mainImage
        const imageBlocks = content.filter((block: unknown) =>
          typeof block === 'object' && block !== null && '_type' in block && block._type === 'image'
        )

        if (imageBlocks.length > 0) {
          const firstImage = imageBlocks[0] as {
            _type: 'image'
            asset?: { _ref?: string; _type?: string }
            alt?: string
          }

          if (firstImage.asset?._ref) {
            patchOperations.mainImage = {
              _type: 'image',
              asset: {
                _type: 'reference',
                _ref: firstImage.asset._ref,
              },
              ...(firstImage.alt ? { alt: firstImage.alt } : {}),
            }
          }
        }
      } else {
        return NextResponse.json(
          { error: 'Content must be in PortableText array format' },
          { status: 400 }
        )
      }
    }

    const updated = await client
      .patch(id)
      .set(patchOperations)
      .commit({ autoGenerateArrayKeys: true })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Error updating post:', error)

    // Provide more detailed error information
    let errorMessage = 'Failed to update post'
    let errorDetails = error instanceof Error ? error.message : 'Unknown error'

    // Check for common Sanity errors
    if (error instanceof Error) {
      if (error.message.includes('document not found')) {
        errorMessage = 'Post not found'
        errorDetails = 'The post you are trying to update does not exist'
      } else if (error.message.includes('reference')) {
        errorMessage = 'Invalid image reference'
        errorDetails = 'One or more images in the content have invalid references. Please try removing and re-adding the images.'
      } else if (error.message.includes('validation')) {
        errorMessage = 'Validation error'
        errorDetails = error.message
      }
    }

    return NextResponse.json(
      { error: errorMessage, details: errorDetails },
      { status: 500 }
    )
  }
}

