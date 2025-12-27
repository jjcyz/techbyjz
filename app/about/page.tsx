import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/shared/Footer';
import Header from '@/components/shared/Header';
import { client } from '@/lib/sanity';
import { POSTS_QUERY, CATEGORIES_QUERY } from '@/lib/queries';
import { isValidSlug } from '@/lib/utils';
import type { Post, Category } from '@/types/post';

export const metadata: Metadata = {
  title: 'About | TechByJZ',
  description: 'Learn about TechByJZ - A futuristic tech blog featuring cutting-edge insights on technology, AI, automation, and cybersecurity.',
  robots: {
    index: true,
    follow: true,
  },
};

export default async function AboutPage() {
  const [posts, categories] = await Promise.all([
    client.fetch<Post[]>(POSTS_QUERY, {}, {
      next: { revalidate: 3600 }
    }),
    client.fetch<Category[]>(CATEGORIES_QUERY, {}, {
      next: { revalidate: 3600 }
    })
  ]);

  const validPosts = posts.filter((post) => isValidSlug(post.slug?.current));

  return (
    <>
      <Header posts={validPosts} categories={categories} />
      <main id="main-content" className="min-h-screen relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-8 md:py-12 lg:py-16">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--electric-blue)] hover:border-[var(--electric-blue)] hover:bg-[var(--electric-blue)]/10 transition-all duration-300 text-xs font-medium mb-6"
          >
            ← Back to Home
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-4">
            About TechByJZ
          </h1>
        </div>

        <div className="prose prose-invert max-w-none space-y-6 text-sm md:text-base text-[var(--foreground)]">
          <section>
            <p className="text-lg text-[var(--foreground-low)] leading-relaxed mb-6">
              Welcome to TechByJZ, your destination for cutting-edge technology insights, trends, and analysis.
              We explore the rapidly evolving world of technology, from artificial intelligence and automation
              to cybersecurity and emerging innovations.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-4 mt-8">
              Our Mission
            </h2>
            <p className="text-[var(--foreground-low)] leading-relaxed">
              At TechByJZ, our mission is to make complex technology accessible and understandable. We break down
              the latest tech trends, innovations, and developments into digestible content that keeps you informed
              and ahead of the curve. Whether you&apos;re a tech enthusiast, professional, or curious learner,
              we provide insights that matter.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-4 mt-8">
              What We Cover
            </h2>
            <p className="text-[var(--foreground-low)] leading-relaxed mb-4">
              Our content spans a wide range of technology topics:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[var(--foreground-low)]">
              <li><strong>AI Models</strong> - Latest developments in artificial intelligence and machine learning</li>
              <li><strong>Automation</strong> - Tools, trends, and insights on process automation</li>
              <li><strong>Cybersecurity</strong> - Security threats, best practices, and protection strategies</li>
              <li><strong>Tech World in 60 Seconds</strong> - Quick updates on the latest tech news</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-4 mt-8">
              Our Approach
            </h2>
            <p className="text-[var(--foreground-low)] leading-relaxed">
              We believe in delivering high-quality, well-researched content that provides real value to our readers.
              Our articles combine in-depth analysis with practical insights, helping you understand not just what&apos;s
              happening in tech, but why it matters and how it might affect you.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-4 mt-8">
              Get in Touch
            </h2>
            <p className="text-[var(--foreground-low)] leading-relaxed mb-4">
              We&apos;d love to hear from you! Whether you have questions, suggestions, or just want to connect,
              feel free to reach out:
            </p>
            <p className="text-[var(--foreground-low)] leading-relaxed">
              Email: <a href="mailto:techbyjz@gmail.com" className="text-[var(--electric-blue)] hover:underline">techbyjz@gmail.com</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-4 mt-8">
              Stay Updated
            </h2>
            <p className="text-[var(--foreground-low)] leading-relaxed">
              Bookmark our site and check back regularly for the latest tech insights. We publish fresh content
              regularly to keep you informed about the ever-changing world of technology.
            </p>
          </section>
        </div>
      </div>

      <Footer categories={categories} />
    </main>
    </>
  );
}

