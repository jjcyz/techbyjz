import { PortableTextBlock } from '@portabletext/types'

export type PortableTextContent = PortableTextBlock | {
  _type: 'image';
  _key: string;
  asset: { _type: 'reference'; _ref: string };
  alt?: string
}

export interface RichTextEditorProps {
  initialContent: PortableTextBlock[] | null | undefined
  onSave: (content: PortableTextContent[]) => void
  onCancel: () => void
  isSaving: boolean
}

