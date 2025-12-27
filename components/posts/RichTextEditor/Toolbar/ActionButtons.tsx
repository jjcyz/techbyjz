'use client'

import { memo } from 'react'

interface ActionButtonsProps {
  onSave: () => void
  onCancel: () => void
  isSaving: boolean
}

function ActionButtonsComponent({ onSave, onCancel, isSaving }: ActionButtonsProps) {
  return (
    <>
      <button
        onClick={onSave}
        disabled={isSaving}
        className="px-3 py-1.5 bg-[var(--electric-blue)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        type="button"
        title="Save & Publish (Ctrl+S)"
        aria-label="Save and publish"
      >
        {isSaving ? 'Saving...' : 'Save'}
      </button>
      <button
        onClick={onCancel}
        disabled={isSaving}
        className="px-3 py-1.5 text-[var(--foreground)] hover:bg-[var(--card-bg)] disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
        type="button"
        title="Cancel (Esc)"
        aria-label="Cancel editing"
      >
        Cancel
      </button>
    </>
  )
}

export const ActionButtons = memo(ActionButtonsComponent)
