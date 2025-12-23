import Image from 'next/image'
import { getImageUrl } from '@/lib/image'
import type { PortableTextComponentProps } from '@portabletext/react'
import type { PortableTextBlock } from '@portabletext/types'

// Shared PortableText components configuration
// This prevents duplication and improves maintainability
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const portableTextComponents: any = {
  block: {
    normal: ({ children, value }: PortableTextComponentProps<PortableTextBlock>) => {
      const blockValue = value as { children?: Array<{ text?: string; _type?: string }>; indentLevel?: number } | undefined;
      const hasEmptyContent = blockValue?.children?.every(child =>
        !child.text || (typeof child.text === 'string' && child.text.trim() === '')
      ) ?? false;

      if (hasEmptyContent || (!children) || (Array.isArray(children) && children.length === 0)) {
        return <div className="h-6 max-w-[65ch] mx-auto" aria-hidden="true" />;
      }

      const indentLevel = blockValue?.indentLevel || 0;
      const indentStyle = indentLevel > 0 ? { paddingLeft: `${indentLevel * 2}rem` } : undefined;

      return (
        <p
          className="text-xs sm:text-sm md:text-base text-[var(--foreground)] mb-4 leading-relaxed max-w-[65ch] mx-auto"
          style={indentStyle}
        >
          {children}
        </p>
      );
    },
    h1: ({ children, value }: PortableTextComponentProps<PortableTextBlock>) => {
      const blockValue = value as { indentLevel?: number } | undefined;
      const indentLevel = blockValue?.indentLevel || 0;
      const indentStyle = indentLevel > 0 ? { paddingLeft: `${indentLevel * 2}rem` } : undefined;
      return (
        <h1
          className="text-lg md:text-xl lg:text-2xl font-bold text-[var(--foreground)] mb-4 mt-8 first:mt-0 max-w-[65ch] mx-auto"
          style={indentStyle}
        >
          {children}
        </h1>
      );
    },
    h2: ({ children, value }: PortableTextComponentProps<PortableTextBlock>) => {
      const blockValue = value as { indentLevel?: number } | undefined;
      const indentLevel = blockValue?.indentLevel || 0;
      const indentStyle = indentLevel > 0 ? { paddingLeft: `${indentLevel * 2}rem` } : undefined;
      return (
        <h2
          className="text-base md:text-lg lg:text-xl font-bold text-[var(--foreground)] mb-3 mt-6 first:mt-0 max-w-[65ch] mx-auto"
          style={indentStyle}
        >
          {children}
        </h2>
      );
    },
    h3: ({ children, value }: PortableTextComponentProps<PortableTextBlock>) => {
      const blockValue = value as { indentLevel?: number } | undefined;
      const indentLevel = blockValue?.indentLevel || 0;
      const indentStyle = indentLevel > 0 ? { paddingLeft: `${indentLevel * 2}rem` } : undefined;
      return (
        <h3
          className="text-sm md:text-base lg:text-lg font-bold text-[var(--foreground)] mb-3 mt-5 first:mt-0 max-w-[65ch] mx-auto"
          style={indentStyle}
        >
          {children}
        </h3>
      );
    },
    h4: ({ children, value }: PortableTextComponentProps<PortableTextBlock>) => {
      const blockValue = value as { indentLevel?: number } | undefined;
      const indentLevel = blockValue?.indentLevel || 0;
      const indentStyle = indentLevel > 0 ? { paddingLeft: `${indentLevel * 2}rem` } : undefined;
      return (
        <h4
          className="text-sm md:text-base font-bold text-[var(--foreground)] mb-2 mt-4 first:mt-0 max-w-[65ch] mx-auto"
          style={indentStyle}
        >
          {children}
        </h4>
      );
    },
    blockquote: ({ children }: PortableTextComponentProps<PortableTextBlock>) => (
      <blockquote className="border-l-4 border-[var(--electric-blue)] pl-3 my-4 italic text-xs sm:text-sm text-[var(--foreground-low)] bg-[var(--card-bg)]/30 py-2 max-w-[65ch] mx-auto leading-relaxed">
        {children}
      </blockquote>
    ),
  },
  list: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    bullet: ({ children }: any) => (
      <ul className="list-disc mb-3 text-xs sm:text-sm md:text-base text-[var(--foreground)] space-y-1.5 max-w-[65ch] mx-auto pl-6 leading-relaxed">{children}</ul>
    ),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    number: ({ children }: any) => (
      <ol className="list-decimal mb-3 text-xs sm:text-sm md:text-base text-[var(--foreground)] space-y-1.5 max-w-[65ch] mx-auto pl-6 leading-relaxed">{children}</ol>
    ),
  },
  listItem: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    bullet: ({ children }: any) => <li className="mb-1 leading-relaxed pl-1">{children}</li>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    number: ({ children }: any) => <li className="mb-1 leading-relaxed pl-1">{children}</li>,
  },
  marks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    strong: ({ children }: any) => <strong className="font-bold text-[var(--foreground)]">{children}</strong>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    em: ({ children }: any) => <em className="italic">{children}</em>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    code: ({ children }: any) => (
      <code className="bg-[var(--card-bg)] px-1.5 py-0.5 text-[var(--electric-blue)] text-xs font-mono">
        {children}
      </code>
    ),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    link: ({ children, value }: any) => {
      const href = value?.href || '#';
      return (
        <a
          href={href}
          target={href.startsWith('http') ? '_blank' : undefined}
          rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
          className="text-[var(--electric-blue)] hover:text-[var(--electric-blue)] underline transition-colors"
        >
          {children}
        </a>
      );
    },
  },
  types: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    image: ({ value }: any) => {
      const imageValue = value as { _type?: string; asset?: { _ref?: string; _type?: string } | { _type: 'reference'; _ref: string }; alt?: string } | undefined;
      if (!imageValue || imageValue._type !== 'image') return null;

      // Convert to SanityImage format
      const asset = typeof imageValue.asset === 'object' && imageValue.asset !== null && '_ref' in imageValue.asset && imageValue.asset._ref
        ? { _type: 'reference' as const, _ref: imageValue.asset._ref }
        : undefined;

      if (!asset) return null;

      const sanityImage = {
        _type: 'image' as const,
        asset,
        alt: imageValue.alt,
      };

      const imageUrl = getImageUrl(sanityImage, 800);
      if (!imageUrl) return null;
      return (
        <div className="my-12 max-w-[65ch] mx-auto w-full">
          <div className="w-full overflow-hidden">
            <Image
              src={imageUrl}
              alt={value.alt || ''}
              width={800}
              height={600}
              className="w-full h-auto max-w-full"
            />
          </div>
        </div>
      );
    },
  },
}

