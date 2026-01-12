'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getImageUrl } from '@/lib/image';
import { isValidSlug } from '@/lib/utils';
import type { Post } from '@/types/post';
import ViewCount from '@/components/posts/ViewCount';

interface InfiniteScrollPostsProps {
  initialPosts: Post[];
  fetchUrl: string;
  slug: string;
}

export default function InfiniteScrollPosts({
  initialPosts,
  fetchUrl,
  slug,
}: InfiniteScrollPostsProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  const fetchMorePosts = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const nextPage = page + 1;
      // Build query string - only include slug if it's provided
      const queryParams = new URLSearchParams();
      if (slug) {
        queryParams.set('slug', slug);
      }
      queryParams.set('page', String(nextPage));
      const response = await fetch(`${fetchUrl}?${queryParams.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }

      const data = await response.json();
      const newPosts = data.posts || [];

      if (newPosts.length > 0) {
        setPosts((prev) => [...prev, ...newPosts]);
        setPage(nextPage);
        setHasMore(data.pagination?.hasMore ?? false);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching more posts:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [page, loading, hasMore, fetchUrl, slug]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchMorePosts();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [fetchMorePosts, hasMore, loading]);

  // Filter posts to only show those with valid slugs
  const validPosts = posts.filter((post) => isValidSlug(post.slug?.current));

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {validPosts.map((post) => {
          const postSlug = post.slug?.current;
          if (!postSlug || !isValidSlug(postSlug)) return null;

          const imageUrl = getImageUrl(post.mainImage, 600, 400);
          const formattedDate = post.publishedAt
            ? new Date(post.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : '';

          return (
            <Link
              key={post._id}
              href={`/posts/${postSlug}`}
              className="group block relative transition-all duration-300 h-full border border-[var(--border-color)] hover:border-[var(--electric-blue)] hover:shadow-[0_0_20px_rgba(0,191,255,0.3)] bg-[var(--card-bg)]"
            >
              {/* Post Image */}
              {imageUrl ? (
                <div className="relative w-full aspect-[16/9] overflow-hidden bg-[var(--background-dark-navy)]">
                  <Image
                    src={imageUrl}
                    alt={post.mainImage?.alt || post.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
              ) : (
                <div className="relative w-full aspect-[16/9] bg-[var(--background-dark-navy)] flex items-center justify-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-[var(--electric-blue)]/20 to-[var(--electric-blue)]/20 opacity-30 blur-xl" />
                </div>
              )}

              {/* Post Content */}
              <div className="p-4 md:p-5">
                <h2 className="text-base md:text-lg font-bold text-[var(--foreground)] group-hover:text-[var(--electric-blue)] transition-colors duration-300 mb-2 line-clamp-2">
                  {post.title}
                </h2>

                {post.excerpt && (
                  <p className="text-xs sm:text-sm text-[var(--foreground-low)] mb-3 line-clamp-2">
                    {post.excerpt}
                  </p>
                )}

                <div className="flex items-center justify-between gap-2 text-xs text-[var(--text-gray-500)]">
                {formattedDate && (
                    <time>{formattedDate}</time>
                )}
                  <ViewCount viewCount={post.viewCount} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Loading indicator and observer target */}
      {hasMore && (
        <div ref={observerTarget} className="py-8 text-center">
          {loading && (
            <div className="text-[var(--foreground-muted)]">
              Loading more posts...
            </div>
          )}
        </div>
      )}

      {!hasMore && validPosts.length > 0 && (
        <div className="py-8 text-center text-[var(--foreground-muted)]">
          No more posts to load
        </div>
      )}
    </>
  );
}

