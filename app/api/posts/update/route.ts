import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/lib/sanity'
import { PortableTextBlock } from '@portabletext/types'

// Only allow in development mode for security
export async function POST(request: NextRequest) {
  // Only allow in development
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

    // Build the patch operations
    const patchOperations: Record<string, unknown> = {}

    if (title !== undefined) {
      patchOperations.title = title
    }

    if (excerpt !== undefined) {
      patchOperations.excerpt = excerpt
    }

    if (content !== undefined) {
      // Content should always be PortableText blocks from the rich text editor
      if (Array.isArray(content)) {
        patchOperations.content = content as PortableTextBlock[]
      } else {
        return NextResponse.json(
          { error: 'Content must be in PortableText array format' },
          { status: 400 }
        )
      }
    }

    // Update the document in Sanity
    // Use unset() first to clear the field, then set() to ensure clean update
    const updated = await client
      .patch(id)
      .set(patchOperations)
      .commit({ autoGenerateArrayKeys: true })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Error updating post:', error)
    return NextResponse.json(
      { error: 'Failed to update post', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

