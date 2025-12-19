import Image from 'next/image';
import { ReadArticlesButton, RandomPostButton } from '@/components/shared/Buttons';
import Search from '@/components/shared/Search';
import type { Post } from '@/types/post';

interface HeroBannerSectionProps {
  posts: Post[];
  randomPost: Post | null;
}

export default function HeroBannerSection({ posts, randomPost }: HeroBannerSectionProps) {
  return (
    <section className="relative min-h-[50vh] flex flex-col -mx-4 sm:-mx-6 md:-mx-8 lg:-mx-10 xl:-mx-12">
        {/* Background Image */}
        <div className="absolute inset-0 z-0 bg-[var(--background-dark-navy)]">
          <Image
            src="/images/backgrounds/hero-background.jpg"
            alt="Hero background"
            fill
            className="object-cover"
            priority
          />
          {/* Dark overlay gradient - darker towards bottom */}
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--background-dark-navy)]/30 via-[var(--background-dark-navy)]/70 to-[var(--background-dark-navy)]" />
        </div>

      {/* Search Component - Top Right */}
      <div className="absolute top-4 right-16 sm:top-6 sm:right-20 md:right-24 lg:right-32 xl:right-40 z-20">
        <Search posts={posts} />
      </div>

      {/* Hero Content Container */}
      <div className="relative z-10 w-full mx-auto flex-1 flex flex-col justify-center py-6 sm:py-8 md:py-10 lg:py-12 xl:py-14 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
        {/* Hero Text Section */}
        <div className="w-full mb-4 sm:mb-6 pl-4 sm:pl-8 md:pl-12 lg:pl-16 xl:pl-24">
          <div className="space-y-4 sm:space-y-6">
            <div className="space-y-3 sm:space-y-4">
              <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-none text-left pb-4 sm:pb-6 text-[var(--electric-blue)]">
                TechByJZ
              </div>

              <p className="text-base sm:text-lg md:text-xl text-[var(--electric-blue)] leading-relaxed text-left max-w-2xl">
              Tech insights you won&apos;t find anywhere else. Deep dives into tech news and trends today and what it means for the you. Ideas you never thought about and questions you never asked.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-row gap-4 sm:gap-6 justify-start pt-2 sm:pt-3">
              <ReadArticlesButton />
              <RandomPostButton randomPost={randomPost} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

