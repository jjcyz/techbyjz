import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/lib/sanity'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const alt = formData.get('alt') as string | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // Validate file size (Sanity limit is 10MB, but we'll use 9MB to be safe)
    const maxSize = 9 * 1024 * 1024 // 9MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `Image is too large. Maximum size is 9MB. Your image is ${(file.size / 1024 / 1024).toFixed(2)}MB.` },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Sanity
    const asset = await client.assets.upload('image', buffer, {
      filename: file.name,
      contentType: file.type,
    })

    // Create image document with alt text
    const imageDocument = {
      _type: 'image',
      asset: {
        _type: 'reference',
        _ref: asset._id,
      },
      ...(alt && alt.trim() ? { alt: alt.trim() } : {}),
    }

    return NextResponse.json({
      success: true,
      image: imageDocument,
      assetId: asset._id,
      url: asset.url,
    })
  } catch (error) {
    console.error('Error uploading image to Sanity:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload image' },
      { status: 500 }
    )
  }
}

