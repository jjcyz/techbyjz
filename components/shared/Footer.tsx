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
    <footer className="relative bg-[var(--card-bg)] border-t border-[var(--border-color)] py-8 w-full">
      <div className="w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 mb-8">
          <div>
            <h3 className="text-lg sm:text-xl font-bold mb-3 text-[var(--foreground)]">
              TechByJZ
            </h3>
          </div>

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

          <div>
            <h4 className="text-sm sm:text-base font-semibold text-[var(--electric-blue)] mb-3">
              Legal & Info
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-[var(--foreground-low)] hover:text-[var(--electric-blue)] transition-colors text-sm">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-[var(--foreground-low)] hover:text-[var(--electric-blue)] transition-colors text-sm">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-[var(--foreground-low)] hover:text-[var(--electric-blue)] transition-colors text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-[var(--foreground-low)] hover:text-[var(--electric-blue)] transition-colors text-sm">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[var(--border-color)] pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[var(--foreground-muted)] text-sm text-center sm:text-left break-words">
            © {currentYear} TechByJZ. All rights reserved.
          </p>
          <BackToTopButton />
        </div>
      </div>
    </footer>
  );
}
