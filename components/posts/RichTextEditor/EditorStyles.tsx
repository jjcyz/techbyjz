export function EditorStyles() {
  return (
    <style dangerouslySetInnerHTML={{ __html: `
      .ProseMirror blockquote {
        border-left: 4px solid var(--electric-blue) !important;
        padding-left: 0.75rem !important;
        margin: 1rem 0 !important;
        font-style: italic !important;
        color: var(--foreground-low) !important;
        background-color: rgba(13, 20, 33, 0.3) !important;
        padding-top: 0.5rem !important;
        padding-bottom: 0.5rem !important;
      }
      .ProseMirror img {
        max-width: 100% !important;
        height: auto !important;
        border-radius: 0 !important;
        margin: 1rem 0 !important;
        display: block !important;
        cursor: pointer !important;
      }
      .ProseMirror img.ProseMirror-selectednode {
        outline: 2px solid var(--electric-blue) !important;
        outline-offset: 2px !important;
      }
      .ProseMirror ul,
      .ProseMirror ol {
        padding-left: 1.5rem !important;
        margin-left: 0 !important;
        margin-top: 0.5rem !important;
        margin-bottom: 0.5rem !important;
      }
      .ProseMirror ul {
        list-style-type: disc !important;
      }
      .ProseMirror ol {
        list-style-type: decimal !important;
      }
      .ProseMirror li {
        margin-left: 0 !important;
        padding-left: 0.25rem !important;
      }
      .ProseMirror li p {
        margin-top: 0 !important;
        margin-bottom: 0 !important;
      }
    `}} />
  )
}

