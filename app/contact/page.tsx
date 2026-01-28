import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/shared/Footer';
import Header from '@/components/shared/Header';
import { client } from '@/lib/sanity';
import { POSTS_QUERY, CATEGORIES_QUERY } from '@/lib/queries';
import { isValidSlug } from '@/lib/utils';
import { fetchOptions } from '@/lib/revalidation-config';
import type { Post, Category } from '@/types/post';

export const metadata: Metadata = {
  title: 'Contact | TechByJZ',
  description: 'Get in touch with TechByJZ - Contact us for questions, suggestions, or collaborations.',
  robots: {
    index: true,
    follow: true,
  },
};

export default async function ContactPage() {
  const [posts, categories] = await Promise.all([
    client.fetch<Post[]>(POSTS_QUERY, {}, fetchOptions.static),
    client.fetch<Category[]>(CATEGORIES_QUERY, {}, fetchOptions.static)
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
            Contact Us
          </h1>
          <p className="text-lg text-[var(--foreground-low)] leading-relaxed">
            We&apos;d love to hear from you! Whether you have questions, suggestions, feedback, or just want to connect,
            feel free to reach out to us.
          </p>
        </div>

        <div className="prose prose-invert max-w-none space-y-8 text-sm md:text-base text-[var(--foreground)]">
          <section className="bg-[var(--card-bg)] border border-[var(--border-color)] p-6 md:p-8 rounded-lg">
            <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-4">
              Get in Touch
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-[var(--electric-blue)] mb-2">
                  Email
                </h3>
                <p className="text-[var(--foreground-low)] leading-relaxed">
                  For general inquiries, feedback, or questions, please email us at:{' '}
                  <a
                    href="mailto:techbyjz@gmail.com"
                    className="text-[var(--electric-blue)] hover:underline font-medium"
                  >
                    techbyjz@gmail.com
                  </a>
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-4 mt-8">
              What We&apos;re Interested In
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-[var(--foreground-low)]">
              <li>Feedback on our articles and content</li>
              <li>Suggestions for topics you&apos;d like us to cover</li>
              <li>Collaboration opportunities</li>
              <li>Technical questions or discussions</li>
              <li>Partnership inquiries</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-4 mt-8">
              Response Time
            </h2>
            <p className="text-[var(--foreground-low)] leading-relaxed">
              We aim to respond to all inquiries within 2-3 business days. For urgent matters, please mention
              &quot;URGENT&quot; in your email subject line.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-4 mt-8">
              Other Ways to Connect
            </h2>
            <p className="text-[var(--foreground-low)] leading-relaxed mb-4">
              You can also find us through:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[var(--foreground-low)]">
              <li>Reading our latest articles on the{' '}
                <Link href="/" className="text-[var(--electric-blue)] hover:underline">
                  homepage
                </Link>
              </li>
              <li>Learning more about us on our{' '}
                <Link href="/about" className="text-[var(--electric-blue)] hover:underline">
                  About page
                </Link>
              </li>
              <li>Reviewing our{' '}
                <Link href="/privacy" className="text-[var(--electric-blue)] hover:underline">
                  Privacy Policy
                </Link>
                {' '}and{' '}
                <Link href="/terms" className="text-[var(--electric-blue)] hover:underline">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </section>
        </div>
      </div>

      <Footer categories={categories} />
    </main>
    </>
  );
}

