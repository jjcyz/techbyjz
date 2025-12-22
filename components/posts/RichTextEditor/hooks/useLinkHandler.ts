import { useCallback, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { isValidUrl, normalizeUrl } from '../utils'

export function useLinkHandler(editor: Editor | null, setError: (error: string | null) => void) {
  const [linkUrl, setLinkUrl] = useState('')
  const [showLinkInput, setShowLinkInput] = useState(false)

  const handleSetLink = useCallback(() => {
    if (!editor) return

    // If link is already active, remove it
    if (editor.isActive('link')) {
      editor.chain().focus().unsetLink().run()
      return
    }

    // Show link input
    const previousUrl = editor.getAttributes('link').href || ''
    setLinkUrl(previousUrl)
    setShowLinkInput(true)
    setError(null)
  }, [editor, setError])

  const handleLinkSubmit = useCallback(() => {
    if (!editor || !linkUrl.trim()) {
      setShowLinkInput(false)
      setLinkUrl('')
      return
    }

    const normalizedUrl = normalizeUrl(linkUrl)

    if (!isValidUrl(normalizedUrl)) {
      setError('Please enter a valid URL')
      return
    }

    // If text is selected, apply link to selection
    // Otherwise, insert the URL as link text
    if (editor.state.selection.empty) {
      editor.chain().focus().insertContent(`<a href="${normalizedUrl}">${normalizedUrl}</a>`).run()
    } else {
      editor.chain().focus().setLink({ href: normalizedUrl }).run()
    }

    setShowLinkInput(false)
    setLinkUrl('')
    setError(null)
    editor.commands.focus()
  }, [editor, linkUrl, setError])

  const handleLinkCancel = useCallback(() => {
    setShowLinkInput(false)
    setLinkUrl('')
    setError(null)
    editor?.commands.focus()
  }, [editor, setError])

  return {
    linkUrl,
    showLinkInput,
    setLinkUrl,
    handleSetLink,
    handleLinkSubmit,
    handleLinkCancel,
  }
}

