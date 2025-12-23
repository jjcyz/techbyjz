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
      .ProseMirror p[data-indent-level="1"],
      .ProseMirror h1[data-indent-level="1"],
      .ProseMirror h2[data-indent-level="1"],
      .ProseMirror h3[data-indent-level="1"],
      .ProseMirror h4[data-indent-level="1"] { padding-left: 2rem !important; }
      .ProseMirror p[data-indent-level="2"],
      .ProseMirror h1[data-indent-level="2"],
      .ProseMirror h2[data-indent-level="2"],
      .ProseMirror h3[data-indent-level="2"],
      .ProseMirror h4[data-indent-level="2"] { padding-left: 4rem !important; }
      .ProseMirror p[data-indent-level="3"],
      .ProseMirror h1[data-indent-level="3"],
      .ProseMirror h2[data-indent-level="3"],
      .ProseMirror h3[data-indent-level="3"],
      .ProseMirror h4[data-indent-level="3"] { padding-left: 6rem !important; }
      .ProseMirror p[data-indent-level="4"],
      .ProseMirror h1[data-indent-level="4"],
      .ProseMirror h2[data-indent-level="4"],
      .ProseMirror h3[data-indent-level="4"],
      .ProseMirror h4[data-indent-level="4"] { padding-left: 8rem !important; }
      .ProseMirror p[data-indent-level="5"],
      .ProseMirror h1[data-indent-level="5"],
      .ProseMirror h2[data-indent-level="5"],
      .ProseMirror h3[data-indent-level="5"],
      .ProseMirror h4[data-indent-level="5"] { padding-left: 10rem !important; }
      .ProseMirror p[data-indent-level="6"],
      .ProseMirror h1[data-indent-level="6"],
      .ProseMirror h2[data-indent-level="6"],
      .ProseMirror h3[data-indent-level="6"],
      .ProseMirror h4[data-indent-level="6"] { padding-left: 12rem !important; }
      .ProseMirror p[data-indent-level="7"],
      .ProseMirror h1[data-indent-level="7"],
      .ProseMirror h2[data-indent-level="7"],
      .ProseMirror h3[data-indent-level="7"],
      .ProseMirror h4[data-indent-level="7"] { padding-left: 14rem !important; }
      .ProseMirror p[data-indent-level="8"],
      .ProseMirror h1[data-indent-level="8"],
      .ProseMirror h2[data-indent-level="8"],
      .ProseMirror h3[data-indent-level="8"],
      .ProseMirror h4[data-indent-level="8"] { padding-left: 16rem !important; }
    `}} />
  )
}

