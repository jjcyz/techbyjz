'use client';

import Link from 'next/link';
import { getSanityStudioUrl } from '@/lib/sanity-studio-url';

interface AdminEditButtonProps {
  postId: string;
  className?: string;
}

/**
 * Admin edit button that links to Sanity Studio to edit the current post.
 * Shows in development mode or when admin mode is enabled via localStorage.
 * To enable: localStorage.setItem('adminMode', 'true') in browser console
 */
export default function AdminEditButton({ postId, className = '' }: AdminEditButtonProps) {
  // Use lazy initialization to avoid setState in effect
  const isAdminMode = (() => {
    if (typeof window === 'undefined') return false;
    const isDev = process.env.NODE_ENV === 'development';
    const adminModeEnabled = localStorage.getItem('adminMode') === 'true';
    return isDev || adminModeEnabled;
  })();

  if (!isAdminMode) {
    return null;
  }

  // Use direct Sanity Studio URL for better performance (faster than embedded)
  const studioUrl = getSanityStudioUrl('post', postId);

  return (
    <a
      href={studioUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--electric-blue)] hover:border-[var(--electric-blue)] hover:bg-[var(--electric-blue)]/10 transition-all duration-300 text-xs font-medium shadow-sm ${className}`}
      title="Edit this post in Sanity Studio"
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
      </svg>
      Edit
    </a>
  );
}

