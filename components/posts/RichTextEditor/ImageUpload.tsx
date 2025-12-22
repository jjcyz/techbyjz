'use client'

import { useCallback, useState, useRef, DragEvent, ChangeEvent } from 'react'

interface ImageUploadProps {
  showImageUpload: boolean
  onUpload: (file: File, alt: string) => Promise<void>
  onCancel: () => void
  isUploading: boolean
}

export function ImageUpload({
  showImageUpload,
  onUpload,
  onCancel,
  isUploading,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      return
    }

    setSelectedFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    try {
      await onUpload(file, '')
    } catch {
      // Reset state on error
      setSelectedFile(null)
      setPreview(null)
    }
  }, [onUpload])

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFile(file)
    }
  }, [handleFile])

  const handleFileInput = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }, [handleFile])

  const handleClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  if (!showImageUpload) return null

  return (
    <div className="sticky top-[60px] z-20 p-4 bg-[var(--card-bg)] border-x border-[var(--border-color)]">
      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          className={`
            border-2 border-dashed p-8 text-center cursor-pointer transition-colors
            ${isDragging
              ? 'border-[var(--electric-blue)] bg-[var(--electric-blue)]/10'
              : 'border-[var(--border-color)] hover:border-[var(--electric-blue)]/50 hover:bg-[var(--card-bg)]/50'
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
            aria-label="Select image file"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-12 h-12 mx-auto mb-4 text-[var(--foreground-muted)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="text-sm text-[var(--foreground)] mb-2">
            Drag and drop an image here, or click to select
          </p>
          <p className="text-xs text-[var(--foreground-muted)]">
            Supports: JPG, PNG, GIF, WebP
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {isUploading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--electric-blue)] mb-4"></div>
              <p className="text-sm text-[var(--foreground-muted)]">Uploading image...</p>
            </div>
          ) : (
            <>
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview || undefined}
                  alt="Preview"
                  className="w-full h-auto max-h-64 object-contain border border-[var(--border-color)]"
                />
                <button
                  onClick={() => {
                    setSelectedFile(null)
                    setPreview(null)
                    onCancel()
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white hover:bg-red-600 transition-colors"
                  type="button"
                  aria-label="Remove image"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-[var(--foreground-muted)] text-center">
                Image uploaded! Click &quot;Save&quot; to save the post.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}

