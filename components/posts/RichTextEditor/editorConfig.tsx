import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import { Indent } from './extensions/Indent'

export const editorExtensions = [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3, 4],
    },
    bulletList: {
      HTMLAttributes: {
        class: 'list-disc',
      },
    },
    orderedList: {
      HTMLAttributes: {
        class: 'list-decimal',
      },
    },
    blockquote: {
      HTMLAttributes: {
        class: 'border-l-4 border-[var(--electric-blue)] pl-3 my-4 italic text-[var(--foreground-low)] bg-[var(--card-bg)]/30 py-2',
      },
    },
  }),
  Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      class: 'text-[var(--electric-blue)] underline',
    },
    autolink: true,
    defaultProtocol: 'https',
  }),
  Placeholder.configure({
    placeholder: 'Start typing...',
  }),
  Image.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        'data-sanity-ref': {
          default: null,
          parseHTML: (element) => element.getAttribute('data-sanity-ref'),
          renderHTML: (attributes) => {
            if (!attributes['data-sanity-ref']) {
              return {}
            }
            return {
              'data-sanity-ref': attributes['data-sanity-ref'],
            }
          },
        },
        'data-sanity-image': {
          default: null,
          parseHTML: (element) => element.getAttribute('data-sanity-image'),
          renderHTML: (attributes) => {
            if (!attributes['data-sanity-image']) {
              return {}
            }
            return {
              'data-sanity-image': attributes['data-sanity-image'],
            }
          },
        },
      }
    },
  }).configure({
    inline: false,
    allowBase64: false,
    HTMLAttributes: {
      class: 'max-w-full h-auto my-4',
    },
  }),
  Indent.configure({
    types: ['paragraph', 'heading'],
    minLevel: 0,
    maxLevel: 8,
    defaultLevel: 0,
  }),
]

export const editorProps = {
  attributes: {
    class: 'prose prose-invert max-w-none focus:outline-none min-h-[400px] px-4 py-3',
    'aria-label': 'Rich text editor',
  },
}

