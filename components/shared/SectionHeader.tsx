import Link from 'next/link';
import type { Category } from '@/types/post';

interface SectionHeaderProps {
  title: string;
  category?: Category | null;
  sectionId: string;
  theme?: 'electric-blue' | 'purple' | 'red';
  viewMoreHref?: string;
}

const themeConfig = {
  'electric-blue': {
    textColor: 'text-[var(--electric-blue)]',
    borderColor: 'border-[var(--electric-blue)]',
    hoverBg: 'hover:bg-[var(--electric-blue)]',
  },
  purple: {
    textColor: 'text-[var(--purple)]',
    borderColor: 'border-[var(--purple)]',
    hoverBg: 'hover:bg-[var(--purple)]',
  },
  red: {
    textColor: 'text-[#ff4444]',
    borderColor: 'border-[#ff4444]',
    hoverBg: 'hover:bg-[#ff4444]',
  },
};

export default function SectionHeader({
  title,
  category,
  sectionId,
  theme = 'electric-blue',
  viewMoreHref,
}: SectionHeaderProps) {
  const themeStyles = themeConfig[theme];

  // Determine view more link - prioritize explicit href, then category slug, then fallback to hash
  const viewMoreUrl = viewMoreHref
    || (category?.slug?.current ? `/category/${category.slug.current}` : `/#${sectionId}`);

  // Determine if title should be a link (same logic as view more)
  const titleUrl = category?.slug?.current ? `/category/${category.slug.current}` : null;
  const titleClassName = `text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold leading-tight sm:leading-none text-left ${themeStyles.textColor} ${titleUrl ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`;

  return (
    <div className="w-full md:w-1/5 lg:w-1/6 xl:w-1/6 md:min-w-[180px] lg:min-w-[200px] md:flex-shrink">
      <div className="flex flex-col gap-3">
        {titleUrl ? (
          <Link href={titleUrl} className={titleClassName}>
            {title}
          </Link>
        ) : (
          <h2 className={titleClassName}>
            {title}
          </h2>
        )}
        <Link
          href={viewMoreUrl}
          className={`inline-flex items-center gap-2 text-xs sm:text-sm ${themeStyles.textColor} border ${themeStyles.borderColor} px-3 py-1.5 ${themeStyles.hoverBg} hover:text-[var(--background-dark-navy)] transition-all duration-300 font-semibold w-fit group`}
        >
          View More
          <svg
            className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
}

