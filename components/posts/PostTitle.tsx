'use client'

import { useState } from 'react'
import type { Post } from '@/types/post'

interface PostTitleProps {
  initialData: Post
}

export default function PostTitle({ initialData }: PostTitleProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(initialData?.title || '')
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
        body: JSON.stringify({ id: initialData._id, title }),
      })

      if (!response.ok) {
        throw new Error('Failed to update title')
      }

      setIsEditing(false)
      // Optionally refresh the page to see updated content
      // window.location.reload()
    } catch (error) {
      console.error('Error saving title:', error)
      alert('Failed to save title. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setTitle(initialData?.title || '')
    setIsEditing(false)
  }

  if (!canEdit) {
    return (
      <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-3 leading-tight">
        {title}
      </h1>
    )
  }

  if (isEditing) {
    return (
      <div className="mb-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-xl md:text-2xl lg:text-3xl font-bold text-foreground bg-[var(--card-bg)] border-2 border-[var(--electric-blue)] px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-[var(--electric-blue)]"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSave()
            } else if (e.key === 'Escape') {
              handleCancel()
            }
          }}
        />
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-1.5 bg-[var(--electric-blue)] text-white rounded hover:opacity-90 disabled:opacity-50 text-sm"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="px-4 py-1.5 bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--foreground)] rounded hover:bg-[var(--background)] disabled:opacity-50 text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative group">
      <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-3 leading-tight">
        {title}
      </h1>
      <button
        onClick={() => setIsEditing(true)}
        className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 bg-[var(--electric-blue)] text-white text-xs rounded hover:opacity-90"
        title="Edit title"
      >
        Edit
      </button>
    </div>
  )
}

