'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import type { Post } from '@/types/post';
import { isValidSlug } from '@/lib/utils';

interface SearchProps {
  posts: Post[];
}

const SearchIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const CloseIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

export default function Search({ posts }: SearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) {
      return [];
    }

    const query = searchQuery.toLowerCase().trim();

    return posts.filter((post) => {
      const titleMatch = post.title?.toLowerCase().includes(query);
      const excerptMatch = post.excerpt?.toLowerCase().includes(query);
      const tagsMatch = post.tags?.some((tag) => {
        const tagValue = typeof tag === 'string' ? tag : tag.title || String(tag);
        return tagValue.toLowerCase().includes(query);
      });
      // Categories are now strings (IDs), so we can't search by title here
      // Category search would require passing category objects, which we'll skip for now
      // Users can still search by post title, excerpt, and tags

      return titleMatch || excerptMatch || tagsMatch;
    });
  }, [searchQuery, posts]);

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  const handleToggleSearch = () => {
    if (isExpanded) {
      setSearchQuery('');
    }
    setIsExpanded(!isExpanded);
  };

  const handleClear = () => {
    setSearchQuery('');
    inputRef.current?.focus();
  };

  const hasResults = filteredPosts.length > 0;
  const showResults = isExpanded && searchQuery.trim().length > 0;

  return (
    <div className="relative">
      <div className="relative flex items-center">
        {!isExpanded && (
          <button
            onClick={handleToggleSearch}
            className="p-3 text-white transition-all duration-300"
            aria-label="Open search"
          >
            <SearchIcon />
          </button>
        )}

        {isExpanded && (
          <div className="relative flex items-stretch transition-all duration-300">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for posts..."
              className="w-96 sm:w-[500px] md:w-[600px] lg:w-[700px] xl:w-[800px] bg-[var(--card-bg)] text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none text-base px-6 py-4 h-auto pr-12"
            />

            <button
              onClick={() => {
                if (searchQuery) {
                  handleClear();
                } else {
                  handleToggleSearch();
                }
              }}
              className="absolute right-3 p-1 text-[var(--foreground-muted)] hover:text-[var(--electric-blue)] transition-colors z-10"
              aria-label={searchQuery ? "Clear search" : "Close search"}
            >
              <CloseIcon />
            </button>
          </div>
        )}
      </div>

      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--card-bg)] border border-[var(--border-cyan)] shadow-[0_0_30px_var(--glow-cyan)] backdrop-blur-sm z-50 max-h-[600px] overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border-color)]">
              <h3 className="text-lg font-semibold text-[var(--foreground)]">
                {hasResults
                  ? `Found ${filteredPosts.length} ${filteredPosts.length === 1 ? 'post' : 'posts'}`
                  : 'No results found'}
              </h3>
            </div>

            {hasResults ? (
              <div className="space-y-2">
                {filteredPosts.map((post) => {
                  const slug = post.slug?.current;
                  if (!slug || !isValidSlug(slug)) return null;

                  return (
                    <Link
                      key={post._id || slug}
                      href={`/posts/${slug}`}
                      className="block p-3 hover:bg-[var(--card-bg)] hover:text-[var(--electric-blue)] transition-colors"
                    >
                      <h4 className="text-base font-semibold text-[var(--foreground)] hover:text-[var(--electric-blue)] transition-colors">
                        {post.title}
                      </h4>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-[var(--foreground-muted)] mb-2">
                  No posts match your search query
                </p>
                <p className="text-sm text-[var(--foreground-muted)]">
                  Try different keywords or check your spelling
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

