'use client'

import { useState } from 'react'
import type { Post } from '@/types/post'

interface PostExcerptProps {
  initialData: Post
}

export default function PostExcerpt({ initialData }: PostExcerptProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || '')
  const [isSaving, setIsSaving] = useState(false)

  // Only show edit in development mode
  const canEdit = process.env.NODE_ENV === 'development'

  const handleSave = async () => {
    if (!canEdit) return

    setIsSaving(true)
    try {
      const response = await fetch('/api/posts/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: initialData._id, excerpt }),
      })

      if (!response.ok) {
        throw new Error('Failed to update excerpt')
      }

      setIsEditing(false)
    } catch (error) {
      console.error('Error saving excerpt:', error)
      alert('Failed to save excerpt. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setExcerpt(initialData?.excerpt || '')
    setIsEditing(false)
  }

  if (!excerpt && !canEdit) {
    return null
  }

  if (!canEdit) {
    return (
      <p className="text-xs sm:text-sm md:text-base text-[var(--foreground-low)] mb-6 leading-relaxed text-center max-w-3xl mx-auto">
        {excerpt}
      </p>
    )
  }

  if (isEditing) {
    return (
      <div className="mb-6">
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          className="w-full text-xs sm:text-sm md:text-base text-[var(--foreground-low)] bg-[var(--card-bg)] border-2 border-[var(--electric-blue)] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--electric-blue)] resize-y min-h-[80px]"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              handleCancel()
            }
          }}
        />
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-1.5 bg-[var(--electric-blue)] text-white hover:opacity-90 disabled:opacity-50 text-sm"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="px-4 py-1.5 bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--foreground)] hover:bg-[var(--background)] disabled:opacity-50 text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative group">
      <p className="text-xs sm:text-sm md:text-base text-[var(--foreground-low)] mb-6 leading-relaxed text-center max-w-3xl mx-auto">
        {excerpt || <span className="italic text-[var(--foreground-muted)]">No excerpt (click Edit to add one)</span>}
      </p>
      <button
        onClick={() => setIsEditing(true)}
        className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 bg-[var(--electric-blue)] text-white text-xshover:opacity-90"
        title="Edit excerpt"
      >
        Edit
      </button>
    </div>
  )
}

