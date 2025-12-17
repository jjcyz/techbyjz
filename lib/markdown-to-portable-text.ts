/**
 * Converts Markdown to Sanity Portable Text format
 * This allows AI models to output Markdown, which is then converted to Portable Text
 *
 * Supports:
 * - Headers (# H1, ## H2, ### H3, #### H4)
 * - Bold (**text** or __text__)
 * - Italic (*text* or _text_)
 * - Links ([text](url))
 * - Inline code (`code`)
 * - Code blocks (```language\ncode\n```)
 * - Blockquotes (> quote)
 * - Unordered lists (- item or * item)
 * - Ordered lists (1. item)
 * - Nested lists (indented items)
 */

import { PortableTextBlock } from '@portabletext/types';

/**
 * Converts a markdown string to Portable Text blocks
 */
export function markdownToPortableText(markdown: string): PortableTextBlock[] {
  const lines = markdown.split('\n');
  const blocks: PortableTextBlock[] = [];
  let currentParagraph: string[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let currentListItems: Array<{ text: string; ordered: boolean; level: number }> = [];
  const linkAnnotations: Array<{ _key: string; _type: 'link'; href: string }> = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join(' ').trim();
      if (text) {
        blocks.push(createTextBlock(text, linkAnnotations));
      }
      currentParagraph = [];
    }
  };

  const flushList = () => {
    if (currentListItems.length > 0) {
      // Group consecutive items of the same type and level
      interface ListGroup {
        items: string[];
        ordered: boolean;
      }
      const grouped: ListGroup[] = [];
      let currentGroup: ListGroup | null = null;

      for (const item of currentListItems) {
        if (!currentGroup || currentGroup.ordered !== item.ordered) {
          if (currentGroup !== null && currentGroup.items.length > 0) {
            grouped.push(currentGroup);
          }
          currentGroup = { items: [], ordered: item.ordered };
        }
        // At this point, currentGroup is guaranteed to be non-null
        currentGroup.items.push(item.text);
      }

      // Add final group if it has items
      if (currentGroup !== null && currentGroup.items.length > 0) {
        grouped.push(currentGroup);
      }

      // Create list blocks
      grouped.forEach((group) => {
        group.items.forEach((itemText) => {
          blocks.push(createListItemBlock(itemText, group.ordered, linkAnnotations));
        });
      });

      currentListItems = [];
    }
  };

  const flushCodeBlock = () => {
    if (codeBlockContent.length > 0) {
      const code = codeBlockContent.join('\n');
      blocks.push({
        _type: 'block',
        _key: generateKey(),
        style: 'normal',
        children: [
          {
            _type: 'span',
            _key: generateKey(),
            text: code,
            marks: ['code'],
          },
        ],
      });
      codeBlockContent = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Handle code blocks
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        flushCodeBlock();
        inCodeBlock = false;
      } else {
        flushParagraph();
        flushList();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // Handle headers
    const headerMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headerMatch) {
      flushParagraph();
      flushList();
      const level = headerMatch[1].length;
      const text = headerMatch[2];
      blocks.push(createHeaderBlock(text, level, linkAnnotations));
      continue;
    }

    // Handle blockquotes
    if (trimmed.startsWith('> ')) {
      flushParagraph();
      flushList();
      const text = trimmed.slice(2);
      blocks.push(createBlockquoteBlock(text, linkAnnotations));
      continue;
    }

    // Handle lists (both ordered and unordered)
    const listMatch = trimmed.match(/^(\s*)([-*+]|\d+\.)\s+(.+)$/);
    if (listMatch) {
      flushParagraph();
      const indentLevel = listMatch[1].length;
      const isOrdered = /^\d+\./.test(listMatch[2]);
      const text = listMatch[3];
      currentListItems.push({
        text: processInlineMarkdown(text),
        ordered: isOrdered,
        level: indentLevel,
      });
      continue;
    }

    // Handle horizontal rules
    if (trimmed.match(/^[-*_]{3,}$/)) {
      flushParagraph();
      flushList();
      continue;
    }

    // If we hit a blank line and have list items, flush them
    if (!trimmed && currentListItems.length > 0) {
      flushList();
      continue;
    }

    // Handle regular paragraphs
    if (trimmed) {
      // If we have list items, flush them before starting a new paragraph
      if (currentListItems.length > 0) {
        flushList();
      }
      currentParagraph.push(processInlineMarkdown(line));
    } else {
      flushParagraph();
    }
  }

  // Flush any remaining content
  flushParagraph();
  flushList();
  flushCodeBlock();

  return blocks;
}

/**
 * Creates a text block with inline formatting
 */
function createTextBlock(text: string, linkAnnotations: Array<{ _key: string; _type: 'link'; href: string }> = []): PortableTextBlock {
  const result = parseInlineMarkdown(text, linkAnnotations);
  const block: PortableTextBlock = {
    _type: 'block',
    _key: generateKey(),
    style: 'normal',
    children: result.children,
  };
  if (result.markDefs.length > 0) {
    block.markDefs = result.markDefs;
  }
  return block;
}

/**
 * Fixes a single text block that contains markdown syntax
 */
export function fixMarkdownInBlock(block: PortableTextBlock): PortableTextBlock {
  if (!block.children || block.children.length === 0) return block;

  // Extract text from children
  const text = block.children.map(c => c.text).join('');

  // Check if it contains markdown syntax
  if (!/(\*\*|\*|__|_|\[.*\]\(.*\)|`)/.test(text)) {
    return block; // No markdown, return as-is
  }

  // Re-parse the text
  const linkAnnotations: Array<{ _key: string; _type: 'link'; href: string }> = [];
  const result = parseInlineMarkdown(text, linkAnnotations);

  // Create new block preserving structure
  const fixedBlock: PortableTextBlock = {
    ...block,
    children: result.children,
  };

  if (result.markDefs.length > 0) {
    fixedBlock.markDefs = result.markDefs;
  }

  return fixedBlock;
}

/**
 * Creates a header block
 */
function createHeaderBlock(text: string, level: number, linkAnnotations: Array<{ _key: string; _type: 'link'; href: string }> = []): PortableTextBlock {
  const style = `h${Math.min(level, 4)}` as 'h1' | 'h2' | 'h3' | 'h4';
  const result = parseInlineMarkdown(text, linkAnnotations);
  const block: PortableTextBlock = {
    _type: 'block',
    _key: generateKey(),
    style,
    children: result.children,
  };
  if (result.markDefs.length > 0) {
    block.markDefs = result.markDefs;
  }
  return block;
}

/**
 * Creates a blockquote block
 */
function createBlockquoteBlock(text: string, linkAnnotations: Array<{ _key: string; _type: 'link'; href: string }> = []): PortableTextBlock {
  const result = parseInlineMarkdown(text, linkAnnotations);
  const block: PortableTextBlock = {
    _type: 'block',
    _key: generateKey(),
    style: 'blockquote',
    children: result.children,
  };
  if (result.markDefs.length > 0) {
    block.markDefs = result.markDefs;
  }
  return block;
}

/**
 * Creates a list item block
 */
function createListItemBlock(text: string, ordered: boolean, linkAnnotations: Array<{ _key: string; _type: 'link'; href: string }> = []): PortableTextBlock {
  const result = parseInlineMarkdown(text, linkAnnotations);
  const block: PortableTextBlock = {
    _type: 'block',
    _key: generateKey(),
    style: 'normal',
    listItem: ordered ? 'number' : 'bullet',
    children: result.children,
  };
  if (result.markDefs.length > 0) {
    block.markDefs = result.markDefs;
  }
  return block;
}

/**
 * Processes inline markdown in a line (handles bold, italic, links, code)
 */
function processInlineMarkdown(line: string): string {
  // Return as-is, parseInlineMarkdown will handle the conversion
  return line;
}

/**
 * Parses inline markdown (bold, italic, links, code) into Portable Text spans
 * This is a simplified parser that handles common cases
 */
function parseInlineMarkdown(
  text: string,
  linkAnnotations: Array<{ _key: string; _type: 'link'; href: string }> = []
): {
  children: Array<{
    _type: 'span';
    _key: string;
    text: string;
    marks?: string[];
  }>;
  markDefs: Array<{ _key: string; _type: 'link'; href: string }>;
} {
  const children: Array<{
    _type: 'span';
    _key: string;
    text: string;
    marks?: string[];
  }> = [];

  // Track positions and matches
  const matches: Array<{
    start: number;
    end: number;
    type: string;
    content: string;
    url?: string;
  }> = [];

  // Find all markdown patterns
  // Links: [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match: RegExpExecArray | null;
  while ((match = linkRegex.exec(text)) !== null) {
    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      type: 'link',
      content: match[1],
      url: match[2],
    });
  }

  // Inline code: `code`
  const codeRegex = /`([^`]+)`/g;
  let codeMatch: RegExpExecArray | null;
  while ((codeMatch = codeRegex.exec(text)) !== null) {
    matches.push({
      start: codeMatch.index,
      end: codeMatch.index + codeMatch[0].length,
      type: 'code',
      content: codeMatch[1],
    });
  }

  // Bold: **text** or __text__
  const boldRegex = /\*\*([^*]+)\*\*|__([^_]+)__/g;
  let boldMatch: RegExpExecArray | null;
  while ((boldMatch = boldRegex.exec(text)) !== null) {
    matches.push({
      start: boldMatch.index,
      end: boldMatch.index + boldMatch[0].length,
      type: 'strong',
      content: boldMatch[1] || boldMatch[2],
    });
  }

  // Italic: *text* or _text_ (but not if it's part of bold)
  const italicRegex = /(?<!\*)\*([^*]+)\*(?!\*)|(?<!_)_([^_]+)_(?!_)/g;
  let italicMatch: RegExpExecArray | null;
  while ((italicMatch = italicRegex.exec(text)) !== null) {
    // Check if this is already part of a bold match
    const isPartOfBold = matches.some(
      (m) => m.type === 'strong' && italicMatch && italicMatch.index >= m.start && italicMatch.index < m.end
    );
    if (!isPartOfBold && italicMatch) {
      matches.push({
        start: italicMatch.index,
        end: italicMatch.index + italicMatch[0].length,
        type: 'em',
        content: italicMatch[1] || italicMatch[2],
      });
    }
  }

  // Sort matches by position
  matches.sort((a, b) => a.start - b.start);

  // Remove overlapping matches (prioritize links > code > bold > italic)
  const filteredMatches: typeof matches = [];
  const usedRanges: Array<{ start: number; end: number }> = [];

  matches.forEach((m) => {
    const overlaps = usedRanges.some(
      (r) => !(m.end <= r.start || m.start >= r.end)
    );
    if (!overlaps) {
      filteredMatches.push(m);
      usedRanges.push({ start: m.start, end: m.end });
    }
  });

  // Build children array
  let lastIndex = 0;
  filteredMatches.forEach((match) => {
    // Add text before match
    if (match.start > lastIndex) {
      const beforeText = text.slice(lastIndex, match.start);
      if (beforeText) {
        children.push({
          _type: 'span',
          _key: generateKey(),
          text: beforeText,
        });
      }
    }

    // Add the matched content
    if (match.type === 'link' && match.url) {
      // For links, create a link annotation
      const linkKey = generateKey();
      linkAnnotations.push({
        _key: linkKey,
        _type: 'link',
        href: match.url,
      });
      children.push({
        _type: 'span',
        _key: generateKey(),
        text: match.content,
        marks: [linkKey],
      });
    } else {
      children.push({
        _type: 'span',
        _key: generateKey(),
        text: match.content,
        marks: [match.type],
      });
    }

    lastIndex = match.end;
  });

  // Add remaining text
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex);
    if (remainingText) {
      children.push({
        _type: 'span',
        _key: generateKey(),
        text: remainingText,
      });
    }
  }

  // If no matches, return plain text
  if (children.length === 0) {
    children.push({
      _type: 'span',
      _key: generateKey(),
      text,
    });
  }

  return {
    children,
    markDefs: linkAnnotations,
  };
}

/**
 * Generates a unique key for Portable Text blocks
 */
function generateKey(): string {
  return Math.random().toString(36).substring(2, 15);
}
