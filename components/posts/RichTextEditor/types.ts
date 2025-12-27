import { PortableTextBlock } from '@portabletext/types'

export type PortableTextContent = PortableTextBlock | {
  _type: 'image';
  _key: string;
  asset: { _type: 'reference'; _ref: string };
  alt?: string
} | {
  _type: 'table';
  _key: string;
  rows: Array<{
    cells: Array<{
      content: Array<{
        _type: 'block';
        _key: string;
        style: 'normal';
        children: Array<{ _type: 'span'; _key: string; text: string; marks?: string[] }>;
        markDefs?: Array<{ _key: string; _type: 'link'; href: string }>;
      }>;
      isHeader: boolean;
    }>;
  }>;
}

export interface RichTextEditorProps {
  initialContent: PortableTextContent[] | null | undefined
  onSave: (content: PortableTextContent[]) => void
  onCancel: () => void
  isSaving: boolean
}

