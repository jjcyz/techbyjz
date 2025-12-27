'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Search from './Search';
import type { Post, Category } from '@/types/post';
import { isValidSlug } from '@/lib/utils';

interface HeaderProps {
  posts: Post[];
  categories?: Category[];
}

const MenuIcon = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 6h16M4 12h16M4 18h16"
    />
  </svg>
);

const CloseIcon = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);


export default function Header({ posts, categories = [] }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  // Close menu when route changes
  useEffect(() => {
    if (isMenuOpen) {
      setIsMenuOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Keyboard shortcut for menu (Cmd/Ctrl+M)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'm') {
        event.preventDefault();
        setIsMenuOpen(!isMenuOpen);
      }
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen]);

  // Filter categories to only show those with valid slugs
  const validCategories = categories.filter(
    (category) => category.slug?.current && isValidSlug(category.slug.current)
  );

  // Check if we're on a post page
  const isPostPage = pathname?.startsWith('/posts/');

  return (
    <>
      {/* Floating Navigation Icons - Right Side */}
      <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-3">
        {/* Search Component - on top (hidden on post pages) */}
        {!isPostPage && (
          <div className="flex justify-end">
            <Search posts={posts} />
          </div>
        )}

        {/* Menu Icon Button - below search (or standalone on post pages) */}
        <button
          ref={menuRef}
          onClick={() => {
            setIsMenuOpen(!isMenuOpen);
          }}
          className="p-3 text-[var(--foreground-low)] hover:text-[var(--electric-blue)] transition-all duration-300 focus:outline-none flex-shrink-0"
          aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu (Press Cmd+M or Ctrl+M)'}
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {/* Navigation Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-[var(--background-dark-navy)]/95 backdrop-blur-md z-40 overflow-y-auto">
          <div className="min-h-screen px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-8 md:py-12">
            <nav className="max-w-4xl mx-auto space-y-2">
              {/* Logo/Brand */}
              <div className="mb-8 pb-6 border-b border-[var(--border-color)]">
                <Link
                  href="/"
                  className="inline-block group"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-[var(--electric-blue)] to-[var(--purple)] bg-clip-text text-transparent group-hover:opacity-80 transition-opacity">
                    TechByJZ
                  </h1>
                </Link>
              </div>

              {/* Navigation Links */}
              <Link
                href="/"
                className={`block py-4 px-6 text-lg font-medium transition-all duration-300 ${
                  pathname === '/'
                    ? 'text-[var(--electric-blue)] bg-[var(--card-bg)] border-2 border-[var(--electric-blue)] shadow-[0_0_20px_rgba(0,191,255,0.3)]'
                    : 'text-[var(--foreground-low)] hover:text-[var(--electric-blue)] hover:bg-[var(--card-bg)] border-2 border-transparent hover:border-[var(--border-color)]'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>

              {validCategories.map((category) => (
                <Link
                  key={category._id}
                  href={`/category/${category.slug!.current}`}
                  className={`block py-4 px-6 text-lg font-medium transition-all duration-300 ${
                    pathname?.startsWith(`/category/${category.slug!.current}`)
                      ? 'text-[var(--electric-blue)] bg-[var(--card-bg)] border-2 border-[var(--electric-blue)] shadow-[0_0_20px_rgba(0,191,255,0.3)]'
                      : 'text-[var(--foreground-low)] hover:text-[var(--electric-blue)] hover:bg-[var(--card-bg)] border-2 border-transparent hover:border-[var(--border-color)]'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {category.title}
                </Link>
              ))}

              <Link
                href="/about"
                className={`block py-4 px-6 text-lg font-medium transition-all duration-300 ${
                  pathname === '/about'
                    ? 'text-[var(--electric-blue)] bg-[var(--card-bg)] border-2 border-[var(--electric-blue)] shadow-[0_0_20px_rgba(0,191,255,0.3)]'
                    : 'text-[var(--foreground-low)] hover:text-[var(--electric-blue)] hover:bg-[var(--card-bg)] border-2 border-transparent hover:border-[var(--border-color)]'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>

              <Link
                href="/privacy"
                className="block py-4 px-6 text-lg font-medium text-[var(--foreground-low)] hover:text-[var(--electric-blue)] hover:bg-[var(--card-bg)] border-2 border-transparent hover:border-[var(--border-color)] transition-all duration-300"
                onClick={() => setIsMenuOpen(false)}
              >
                Privacy Policy
              </Link>

              <Link
                href="/terms"
                className="block py-4 px-6 text-lg font-medium text-[var(--foreground-low)] hover:text-[var(--electric-blue)] hover:bg-[var(--card-bg)] border-2 border-transparent hover:border-[var(--border-color)] transition-all duration-300"
                onClick={() => setIsMenuOpen(false)}
              >
                Terms of Service
              </Link>
            </nav>
          </div>
        </div>
      )}

    </>
  );
}

