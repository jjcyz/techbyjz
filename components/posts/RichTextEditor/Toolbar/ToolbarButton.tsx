'use client'

interface ToolbarButtonProps {
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  title?: string
  'aria-label'?: string
  'aria-pressed'?: boolean
  'aria-expanded'?: boolean
  children: React.ReactNode
}

export function ToolbarButton({
  onClick,
  isActive = false,
  disabled = false,
  title,
  'aria-label': ariaLabel,
  'aria-pressed': ariaPressed,
  'aria-expanded': ariaExpanded,
  children,
}: ToolbarButtonProps) {
  const className = `px-3 py-1.5 text-sm transition-colors ${
    isActive
      ? 'bg-[var(--electric-blue)] text-white'
      : 'text-[var(--foreground)] hover:bg-[var(--card-bg)]'
  }`

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      title={title}
      type="button"
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      aria-expanded={ariaExpanded}
    >
      {children}
    </button>
  )
}

