'use client';

import Link from 'next/link';
import type { Category } from '@/types/post';
import { BackToTopButton } from './Buttons';

interface FooterProps {
  categories: Category[];
}

export default function Footer({ categories }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-[var(--background-dark-navy)] border-t border-[rgba(0,255,255,0.1)] py-8 overflow-hidden w-full">
      {/* Subtle background glow */}
      <div className="absolute inset-0 bg-gradient-to-t from-[rgba(157,78,221,0.05)] to-transparent" />

      <div className="relative w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 mb-8">
          {/* Brand */}
          <div>
            <h3 className="text-lg sm:text-xl font-bold mb-3 bg-gradient-to-r from-[var(--electric-blue)] to-[var(--purple)] bg-clip-text text-transparent">
              TechByJZ
            </h3>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm sm:text-base font-semibold text-[var(--electric-blue)] mb-3">
              Quick Links
            </h4>
            <ul className="space-y-2">
              {categories
                .filter((category) => !category.title.toLowerCase().includes('all'))
                .slice(0, 7)
                .map((category) => {
                const slug = category.slug?.current;
                const href = slug ? `/category/${slug}` : '#';
                return (
                  <li key={category._id}>
                    <Link
                      href={href}
                      className="text-[var(--foreground-low)] hover:text-[var(--electric-blue)] transition-colors text-sm"
                    >
                      {category.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Legal & Info */}
          <div>
            <h4 className="text-sm sm:text-base font-semibold text-[var(--electric-blue)] mb-3">
              Legal & Info
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-[var(--foreground-low)] hover:text-[var(--electric-blue)] transition-colors text-sm"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-[var(--foreground-low)] hover:text-[var(--electric-blue)] transition-colors text-sm"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-[var(--foreground-low)] hover:text-[var(--electric-blue)] transition-colors text-sm"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-[var(--foreground-low)] hover:text-[var(--electric-blue)] transition-colors text-sm"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[rgba(0,255,255,0.1)] pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[var(--foreground-muted)] text-sm text-center sm:text-left break-words">
            © {currentYear} TechByJZ. All rights reserved.
          </p>
          <BackToTopButton />
        </div>
      </div>
    </footer>
  );
}
