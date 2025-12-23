import { Extension } from '@tiptap/core'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

export interface IndentOptions {
  types: string[]
  minLevel: number
  maxLevel: number
  defaultLevel: number
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    indent: {
      /**
       * Increase the indent level
       */
      indent: () => ReturnType
      /**
       * Decrease the indent level
       */
      outdent: () => ReturnType
    }
  }
}

export const Indent = Extension.create<IndentOptions>({
  name: 'indent',

  addOptions() {
    return {
      types: ['paragraph', 'heading'],
      minLevel: 0,
      maxLevel: 8,
      defaultLevel: 0,
    }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indentLevel: {
            default: this.options.defaultLevel,
            parseHTML: (element) => {
              const level = parseInt(element.getAttribute('data-indent-level') || '0', 10)
              return Math.max(this.options.minLevel, Math.min(this.options.maxLevel, level))
            },
            renderHTML: (attributes) => {
              if (!attributes.indentLevel || attributes.indentLevel === this.options.defaultLevel) {
                return {}
              }
              return {
                'data-indent-level': attributes.indentLevel,
              }
            },
          },
        },
      },
    ]
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => {
        // If we're in a list item, use Tiptap's built-in sinkListItem command
        if (this.editor.can().sinkListItem('listItem')) {
          return this.editor.commands.sinkListItem('listItem')
        }
        // Otherwise, use custom indent for paragraphs/headings
        return this.editor.commands.indent()
      },
      'Shift-Tab': () => {
        // If we're in a list item, use Tiptap's built-in liftListItem command
        if (this.editor.can().liftListItem('listItem')) {
          return this.editor.commands.liftListItem('listItem')
        }
        // Otherwise, use custom outdent for paragraphs/headings
        return this.editor.commands.outdent()
      },
    }
  },

  addCommands() {
    return {
      indent:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state
          const { from, to } = selection

          const nodes: Array<{ pos: number; node: ProseMirrorNode; currentLevel: number }> = []

          // If there's a selection, indent all blocks in the selection
          if (from !== to) {
            state.doc.nodesBetween(from, to, (node, pos) => {
              if (this.options.types.includes(node.type.name)) {
                const currentLevel = node.attrs.indentLevel || this.options.defaultLevel
                nodes.push({ pos, node, currentLevel })
              }
            })
          } else {
            // If no selection, find the block containing the cursor
            const $from = selection.$from
            for (let i = $from.depth; i > 0; i--) {
              const node = $from.node(i)
              if (this.options.types.includes(node.type.name)) {
                const pos = $from.before(i)
                const currentLevel = node.attrs.indentLevel || this.options.defaultLevel
                nodes.push({ pos, node, currentLevel })
                break
              }
            }
          }

          if (nodes.length === 0) {
            return false
          }

          if (!dispatch) return true

          const tr2 = tr

          nodes.forEach(({ pos, node, currentLevel }) => {
            const newLevel = Math.min(this.options.maxLevel, currentLevel + 1)
            tr2.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              indentLevel: newLevel,
            })
          })

          dispatch(tr2)
          return true
        },
      outdent:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state
          const { from, to } = selection

          const nodes: Array<{ pos: number; node: ProseMirrorNode; currentLevel: number }> = []

          // If there's a selection, outdent all blocks in the selection
          if (from !== to) {
            state.doc.nodesBetween(from, to, (node, pos) => {
              if (this.options.types.includes(node.type.name)) {
                const currentLevel = node.attrs.indentLevel || this.options.defaultLevel
                nodes.push({ pos, node, currentLevel })
              }
            })
          } else {
            // If no selection, find the block containing the cursor
            const $from = selection.$from
            for (let i = $from.depth; i > 0; i--) {
              const node = $from.node(i)
              if (this.options.types.includes(node.type.name)) {
                const pos = $from.before(i)
                const currentLevel = node.attrs.indentLevel || this.options.defaultLevel
                nodes.push({ pos, node, currentLevel })
                break
              }
            }
          }

          if (nodes.length === 0) {
            return false
          }

          if (!dispatch) return true

          const tr2 = tr

          nodes.forEach(({ pos, node, currentLevel }) => {
            const newLevel = Math.max(this.options.minLevel, currentLevel - 1)
            tr2.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              indentLevel: newLevel,
            })
          })

          dispatch(tr2)
          return true
        },
    }
  },
})

