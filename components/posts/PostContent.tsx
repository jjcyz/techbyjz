'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PortableText } from '@portabletext/react'
import RichTextEditor from './RichTextEditor'
import { portableTextComponents } from './PostContent/portableTextComponents'
import type { Post } from '@/types/post'
import type { PortableTextBlock } from '@portabletext/types'

type PortableTextContent = PortableTextBlock | { _type: 'image'; _key: string; asset: { _type: 'reference'; _ref: string }; alt?: string }

interface PostContentProps {
  initialData: Post
}

export default function PostContent({ initialData }: PostContentProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Only show edit in development mode
  const canEdit = process.env.NODE_ENV === 'development'

  const content = initialData?.content || initialData?.body

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = async (blocks: PortableTextContent[]) => {
    if (!canEdit) return

    setIsSaving(true)
    try {
      const response = await fetch('/api/posts/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: initialData._id, content: blocks }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.details
          ? `${errorData.error || 'Failed to update content'}: ${errorData.details}`
          : errorData.error || 'Failed to update content'
        throw new Error(errorMessage)
      }

      // Refresh the page data using Next.js router
      setIsEditing(false)
      router.refresh()

      // Also do a hard reload after a short delay to ensure fresh data
      // This is needed because ISR cache might not be immediately updated
      setTimeout(() => {
        window.location.reload()
      }, 500)
    } catch (error) {
      console.error('Error saving content:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert(`Failed to save content: ${errorMessage}`)
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  if (!content && !canEdit) {
    return (
      <div className="text-[var(--foreground-muted)] italic mb-8">
        <p>This post does not have any content yet.</p>
      </div>
    )
  }

  if (!canEdit) {
    if (!Array.isArray(content) || content.length === 0) {
      return (
        <div className="text-[var(--foreground-muted)] italic mb-8">
          <p>No content available for this post.</p>
        </div>
      )
    }

    return (
      <div className="max-w-none">
        <PortableText
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          value={content as any}
          components={portableTextComponents}
        />
      </div>
    )
  }

  if (isEditing) {
    return (
      <RichTextEditor
        initialContent={Array.isArray(content) ? content : null}
        onSave={handleSave}
        onCancel={handleCancel}
        isSaving={isSaving}
      />
    )
  }

  if (!Array.isArray(content) || content.length === 0) {
    return (
      <div className="relative group">
        <div className="text-[var(--foreground-muted)] italic mb-8">
          <p>No content available for this post.</p>
        </div>
        <button
          onClick={handleEdit}
          className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 bg-[var(--electric-blue)] text-white text-xs hover:opacity-90"
          title="Edit content"
        >
          Edit
        </button>
      </div>
    )
  }

  return (
    <div className="relative group max-w-none">
      <PortableText
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        value={content as any}
        components={portableTextComponents}
      />
      <button
        onClick={handleEdit}
        className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 bg-[var(--electric-blue)] text-white text-xs hover:opacity-90 shadow-lg"
        title="Edit content"
      >
        Edit
      </button>
    </div>
  )
}
