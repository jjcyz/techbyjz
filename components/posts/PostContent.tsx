'use client'

import { useState } from 'react'
import { PortableText } from '@portabletext/react'
import Image from 'next/image'
import { getImageUrl } from '@/lib/image'
import RichTextEditor from './RichTextEditor'
import type { Post } from '@/types/post'
import type { PortableTextBlock } from '@portabletext/types'

interface PostContentProps {
  initialData: Post
}

export default function PostContent({ initialData }: PostContentProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Only show edit in development mode
  const canEdit = process.env.NODE_ENV === 'development'

  const post = initialData
  const content = post?.content || post?.body

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = async (blocks: PortableTextBlock[]) => {
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
        throw new Error(errorData.error || 'Failed to update content')
      }

      // Force a hard reload to ensure we get fresh content from Sanity
      setIsEditing(false)
      window.location.reload()
    } catch (error) {
      console.error('Error saving content:', error)
      alert(`Failed to save content: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
          components={{
            block: {
              normal: ({ children, value }) => {
                const blockValue = value as { children?: Array<{ text?: string; _type?: string }> } | undefined;
                const hasEmptyContent = blockValue?.children?.every(child =>
                  !child.text || (typeof child.text === 'string' && child.text.trim() === '')
                ) ?? false;

                if (hasEmptyContent || (!children) || (Array.isArray(children) && children.length === 0)) {
                  return <div className="h-6 max-w-[65ch] mx-auto" aria-hidden="true" />;
                }

                return (
                  <p className="text-xs sm:text-sm md:text-base text-[var(--foreground)] mb-4 leading-relaxed max-w-[65ch] mx-auto">{children}</p>
                );
              },
              h1: ({ children }) => (
                <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-[var(--foreground)] mb-4 mt-8 first:mt-0 max-w-[65ch] mx-auto">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-base md:text-lg lg:text-xl font-bold text-[var(--foreground)] mb-3 mt-6 first:mt-0 max-w-[65ch] mx-auto">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-sm md:text-base lg:text-lg font-bold text-[var(--foreground)] mb-3 mt-5 first:mt-0 max-w-[65ch] mx-auto">{children}</h3>
              ),
              h4: ({ children }) => (
                <h4 className="text-sm md:text-base font-bold text-[var(--foreground)] mb-2 mt-4 first:mt-0 max-w-[65ch] mx-auto">{children}</h4>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-[var(--electric-blue)] pl-3 my-4 italic text-xs sm:text-sm text-[var(--foreground-low)] bg-[var(--card-bg)]/30 py-2 max-w-[65ch] mx-auto leading-relaxed">
                  {children}
                </blockquote>
              ),
            },
            list: {
              bullet: ({ children }) => (
                <ul className="list-disc mb-3 text-xs sm:text-sm md:text-base text-[var(--foreground)] space-y-1.5 max-w-[65ch] mx-auto pl-6 leading-relaxed">{children}</ul>
              ),
              number: ({ children }) => (
                <ol className="list-decimal mb-3 text-xs sm:text-sm md:text-base text-[var(--foreground)] space-y-1.5 max-w-[65ch] mx-auto pl-6 leading-relaxed">{children}</ol>
              ),
            },
            listItem: {
              bullet: ({ children }) => <li className="mb-1 leading-relaxed pl-1">{children}</li>,
              number: ({ children }) => <li className="mb-1 leading-relaxed pl-1">{children}</li>,
            },
            marks: {
              strong: ({ children }) => <strong className="font-bold text-[var(--foreground)]">{children}</strong>,
              em: ({ children }) => <em className="italic">{children}</em>,
              code: ({ children }) => (
                <code className="bg-[var(--card-bg)] px-1.5 py-0.5 text-[var(--electric-blue)] text-xs font-mono">
                  {children}
                </code>
              ),
              link: ({ children, value }) => {
                const href = value?.href || '#';
                return (
                  <a
                    href={href}
                    target={href.startsWith('http') ? '_blank' : undefined}
                    rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="text-[var(--electric-blue)] hover:text-[var(--electric-blue)] underline transition-colors"
                  >
                    {children}
                  </a>
                );
              },
            },
            types: {
              image: ({ value }) => {
                const imageUrl = getImageUrl(value, 800);
                if (!imageUrl) return null;
                return (
                  <div className="my-12 max-w-full">
                    <Image
                      src={imageUrl}
                      alt={value.alt || ''}
                      width={800}
                      height={600}
                      className="mx-auto rounded-lg"
                    />
                  </div>
                );
              },
            },
          }}
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
          className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 bg-[var(--electric-blue)] text-white text-xs rounded hover:opacity-90"
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
        components={{
          block: {
            normal: ({ children, value }) => {
              const blockValue = value as { children?: Array<{ text?: string; _type?: string }> } | undefined;
              const hasEmptyContent = blockValue?.children?.every(child =>
                !child.text || (typeof child.text === 'string' && child.text.trim() === '')
              ) ?? false;

              if (hasEmptyContent || (!children) || (Array.isArray(children) && children.length === 0)) {
                return <div className="h-6 max-w-[65ch] mx-auto" aria-hidden="true" />;
              }

              return (
                <p className="text-xs sm:text-sm md:text-base text-[var(--foreground)] mb-4 leading-relaxed max-w-[65ch] mx-auto">{children}</p>
              );
            },
            h1: ({ children }) => (
              <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-[var(--foreground)] mb-4 mt-8 first:mt-0 max-w-[65ch] mx-auto">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-base md:text-lg lg:text-xl font-bold text-[var(--foreground)] mb-3 mt-6 first:mt-0 max-w-[65ch] mx-auto">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-sm md:text-base lg:text-lg font-bold text-[var(--foreground)] mb-3 mt-5 first:mt-0 max-w-[65ch] mx-auto">{children}</h3>
            ),
            h4: ({ children }) => (
              <h4 className="text-sm md:text-base font-bold text-[var(--foreground)] mb-2 mt-4 first:mt-0 max-w-[65ch] mx-auto">{children}</h4>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-[var(--electric-blue)] pl-3 my-4 italic text-xs sm:text-sm text-[var(--foreground-low)] bg-[var(--card-bg)]/30 py-2 max-w-[65ch] mx-auto leading-relaxed">
                {children}
              </blockquote>
            ),
          },
          list: {
            bullet: ({ children }) => (
              <ul className="list-disc mb-3 text-xs sm:text-sm md:text-base text-[var(--foreground)] space-y-1.5 max-w-[65ch] mx-auto pl-6 leading-relaxed">{children}</ul>
            ),
            number: ({ children }) => (
              <ol className="list-decimal mb-3 text-xs sm:text-sm md:text-base text-[var(--foreground)] space-y-1.5 max-w-[65ch] mx-auto pl-6 leading-relaxed">{children}</ol>
            ),
          },
          listItem: {
            bullet: ({ children }) => <li className="mb-1 leading-relaxed pl-1">{children}</li>,
            number: ({ children }) => <li className="mb-1 leading-relaxed pl-1">{children}</li>,
          },
          marks: {
            strong: ({ children }) => <strong className="font-bold text-[var(--foreground)]">{children}</strong>,
            em: ({ children }) => <em className="italic">{children}</em>,
            code: ({ children }) => (
              <code className="bg-[var(--card-bg)] px-1.5 py-0.5 text-[var(--electric-blue)] text-xs font-mono">
                {children}
              </code>
            ),
            link: ({ children, value }) => {
              const href = value?.href || '#';
              return (
                <a
                  href={href}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="text-[var(--electric-blue)] hover:text-[var(--electric-blue)] underline transition-colors"
                >
                  {children}
                </a>
              );
            },
          },
          types: {
            image: ({ value }) => {
              const imageUrl = getImageUrl(value, 800);
              if (!imageUrl) return null;
              return (
                <div className="my-12 max-w-full">
                  <Image
                    src={imageUrl}
                    alt={value.alt || ''}
                    width={800}
                    height={600}
                    className="mx-auto rounded-lg"
                  />
                </div>
              );
            },
          },
        }}
      />
      <button
        onClick={handleEdit}
        className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 bg-[var(--electric-blue)] text-white text-xs rounded hover:opacity-90 shadow-lg"
        title="Edit content"
      >
        Edit
      </button>
    </div>
  )
}

