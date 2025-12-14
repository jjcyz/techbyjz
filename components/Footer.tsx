'use client';

import type { Category } from '@/types/post';
import { ScrollToSectionButton, BackToTopButton } from './Buttons';

interface FooterProps {
  categories: Category[];
}

export default function Footer({ categories }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-[var(--background-dark-navy)] border-t border-[rgba(0,255,255,0.1)] py-12 overflow-hidden w-full">
      {/* Subtle background glow */}
      <div className="absolute inset-0 bg-gradient-to-t from-[rgba(157,78,221,0.05)] to-transparent" />

      <div className="relative w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 mb-8">
          {/* Brand */}
          <div>
            <h3 className="text-xl sm:text-2xl font-bold mb-4 bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--purple)] bg-clip-text text-transparent">
              TechByJZ
            </h3>
            <p className="text-[var(--foreground-low)] text-sm sm:text-base leading-relaxed">
              Futuristic tech insights and deep dives into cutting-edge technology
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-base sm:text-lg font-semibold text-[var(--electric-blue)] mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2">
              <li>
                <ScrollToSectionButton sectionId="featured-posts">
                  Featured Posts
                </ScrollToSectionButton>
              </li>
              {categories.slice(0, 5).map((category) => {
                const slug =
                  category.slug?.current ||
                  category.title.toLowerCase().replace(/\s+/g, '-');
                return (
                  <li key={category._id}>
                    <ScrollToSectionButton sectionId={`category-${slug}`}>
                      {category.title}
                    </ScrollToSectionButton>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-base sm:text-lg font-semibold text-[var(--electric-blue)] mb-4">
              Connect
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="mailto:techbyjz@gmail.com"
                  className="text-[var(--foreground-low)] hover:text-[var(--neon-cyan)] transition-colors text-sm"
                >
                  Contact
                </a>
              </li>
              {/* Add social media links here */}
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

