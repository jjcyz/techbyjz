import Link from 'next/link';
import type { Category } from '@/types/post';

interface SectionHeaderProps {
  title: string;
  category?: Category | null;
  sectionId: string;
  viewMoreHref?: string;
}

export default function SectionHeader({
  title,
  category,
  sectionId,
  viewMoreHref,
}: SectionHeaderProps) {
  const viewMoreUrl = viewMoreHref
    || (category?.slug?.current ? `/category/${category.slug.current}` : `/#${sectionId}`);

  const titleUrl = category?.slug?.current ? `/category/${category.slug.current}` : null;
  const titleClassName =
    'text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold leading-tight sm:leading-none text-left text-[var(--electric-blue)] '
    + (titleUrl ? 'cursor-pointer hover:opacity-80 transition-opacity' : '');

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
          className="inline-flex items-center gap-2 text-xs sm:text-sm text-[var(--electric-blue)] border border-[var(--electric-blue)] px-3 py-1.5 hover:bg-[var(--electric-blue)] hover:text-white transition-all duration-300 font-semibold w-fit group"
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
