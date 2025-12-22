'use client'

interface LinkInputProps {
  linkUrl: string
  showLinkInput: boolean
  onLinkUrlChange: (url: string) => void
  onSubmit: () => void
  onCancel: () => void
  onErrorClear: () => void
}

export function LinkInput({
  linkUrl,
  showLinkInput,
  onLinkUrlChange,
  onSubmit,
  onCancel,
  onErrorClear,
}: LinkInputProps) {
  if (!showLinkInput) return null

  return (
    <div className="sticky top-[60px] z-20 p-3 bg-[var(--card-bg)] border-x border-[var(--border-color)] flex gap-2 items-center">
      <input
        type="url"
        value={linkUrl}
        onChange={(e) => {
          onLinkUrlChange(e.target.value)
          onErrorClear()
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            onSubmit()
          } else if (e.key === 'Escape') {
            e.preventDefault()
            onCancel()
          }
        }}
        placeholder="Enter URL"
        className="flex-1 px-3 py-1.5 bg-[var(--background)] border border-[var(--border-color)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--electric-blue)]"
        autoFocus
        aria-label="Link URL"
      />
      <button
        onClick={onSubmit}
        className="px-3 py-1.5 bg-[var(--electric-blue)] text-white text-sm hover:opacity-90"
        type="button"
        aria-label="Apply link"
      >
        Apply
      </button>
      <button
        onClick={onCancel}
        className="px-3 py-1.5 bg-[var(--background)] border border-[var(--border-color)] text-[var(--foreground)] text-sm hover:bg-[var(--card-bg)]"
        type="button"
        aria-label="Cancel link"
      >
        Cancel
      </button>
    </div>
  )
}

