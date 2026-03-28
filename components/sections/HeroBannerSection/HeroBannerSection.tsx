import Image from 'next/image';
import { ReadArticlesButton, RandomPostButton } from '@/components/shared/Buttons';
import type { Post } from '@/types/post';

interface HeroBannerSectionProps {
  randomPost: Post | null;
}

export default function HeroBannerSection({ randomPost }: HeroBannerSectionProps) {
  return (
    <section className="relative min-h-[50vh] flex flex-col w-full">
      <div className="absolute inset-0 z-0 bg-[var(--surface-muted)]">
        <Image
          src="/images/backgrounds/hero-background.jpg"
          alt="Hero background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/85 via-white/70 to-white/90" />
      </div>

      <div className="relative z-10 w-full mx-auto flex-1 flex flex-col justify-center py-4 sm:py-6 md:py-8 lg:py-10 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
        <div className="w-full md:w-1/3 lg:w-2/5 xl:w-2/5 md:min-w-[180px] mb-4 sm:mb-6">
          <div className="space-y-4 sm:space-y-6">
            <div className="space-y-1.5 sm:space-y-2">
              <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold leading-none text-left pb-1.5 sm:pb-2 text-[var(--foreground)]">
                TechByJZ
              </div>

              <p className="text-xs sm:text-sm md:text-base text-[var(--foreground-low)] leading-relaxed text-left max-w-sm">
                Tech insights you won&apos;t find anywhere else. Deep dives into tech news and trends today and what it means for you. Ideas you never thought about and questions you never asked.
              </p>
            </div>

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
