'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import BlogCard from './BlogCard';
import type { Post, Tag } from '@/types/post';

interface SearchProps {
  posts: Post[];
}

export default function Search({ posts }: SearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
      const categoriesMatch = post.categories?.some((category) =>
        category.title?.toLowerCase().includes(query)
      );

      return titleMatch || excerptMatch || tagsMatch || categoriesMatch;
    });
  }, [searchQuery, posts]);

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  const handleIconMouseEnter = () => {
    setIsExpanded(true);
  };

  const handleContainerMouseLeave = () => {
    setIsExpanded(false);
    setSearchQuery('');
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleClear = () => {
    setSearchQuery('');
  };

  const hasResults = filteredPosts.length > 0;
  const showResults = isExpanded && searchQuery.trim().length > 0;

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseLeave={handleContainerMouseLeave}
    >
      <div className="relative flex items-center">
        {!isExpanded && (
          <button
            onMouseEnter={handleIconMouseEnter}
            className="p-3 text-white hover:text-[var(--neon-cyan)] transition-all duration-300"
            aria-label="Open search"
          >
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
          </button>
        )}

        {isExpanded && (
          <div className="relative flex items-stretch transition-all duration-300">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search for posts..."
              className="w-80 sm:w-96 md:w-[500px] lg:w-[600px] bg-[var(--card-bg)] rounded-lg text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none text-base px-6 py-4 h-auto"
            />

            {searchQuery && (
              <button
                onClick={handleClear}
                className="absolute right-3 p-1 text-[var(--foreground-muted)] hover:text-[var(--neon-cyan)] transition-colors rounded z-10"
                aria-label="Clear search"
              >
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
              </button>
            )}
          </div>
        )}
      </div>

      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--card-bg)] border border-[var(--border-cyan)] rounded-lg shadow-[0_0_30px_var(--glow-cyan)] backdrop-blur-sm z-50 max-h-[600px] overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border-color)]">
              <h3 className="text-lg font-semibold text-[var(--foreground)]">
                {hasResults
                  ? `Found ${filteredPosts.length} ${filteredPosts.length === 1 ? 'post' : 'posts'}`
                  : 'No results found'}
              </h3>
            </div>

            {hasResults ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {filteredPosts.map((post) => (
                  <BlogCard key={post._id || post.slug?.current} post={post} />
                ))}
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
