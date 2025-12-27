import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/shared/Footer';
import Header from '@/components/shared/Header';
import { client } from '@/lib/sanity';
import { POSTS_QUERY, CATEGORIES_QUERY } from '@/lib/queries';
import { isValidSlug } from '@/lib/utils';
import type { Post, Category } from '@/types/post';

export const metadata: Metadata = {
  title: 'Privacy Policy | TechByJZ',
  description: 'Privacy Policy for TechByJZ - Learn how we collect, use, and protect your personal information.',
  robots: {
    index: true,
    follow: true,
  },
};

export default async function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p className="text-sm text-[var(--foreground-muted)]">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="prose prose-invert max-w-none space-y-6 text-sm md:text-base text-[var(--foreground)]">
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-4 mt-8">
              Introduction
            </h2>
            <p className="text-[var(--foreground-low)] leading-relaxed">
              Welcome to TechByJZ. We respect your privacy and are committed to protecting your personal data.
              This privacy policy explains how we collect, use, and safeguard your information when you visit our website.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-4 mt-8">
              Information We Collect
            </h2>
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-3 mt-6">
              Automatically Collected Information
            </h3>
            <p className="text-[var(--foreground-low)] leading-relaxed mb-4">
              When you visit our website, we automatically collect certain information, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[var(--foreground-low)]">
              <li>Your IP address</li>
              <li>Browser type and version</li>
              <li>Device information</li>
              <li>Pages you visit and time spent on pages</li>
              <li>Referring website addresses</li>
              <li>Date and time of your visit</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-4 mt-8">
              How We Use Your Information
            </h2>
            <p className="text-[var(--foreground-low)] leading-relaxed mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[var(--foreground-low)]">
              <li>Provide, maintain, and improve our website</li>
              <li>Analyze website usage and trends</li>
              <li>Personalize your experience</li>
              <li>Track page views and engagement</li>
              <li>Ensure website security and prevent fraud</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-4 mt-8">
              Cookies and Tracking Technologies
            </h2>
            <p className="text-[var(--foreground-low)] leading-relaxed mb-4">
              We use cookies and similar tracking technologies to track activity on our website and store certain information.
              Cookies are files with a small amount of data that are sent to your browser and stored on your device.
            </p>
            <p className="text-[var(--foreground-low)] leading-relaxed mb-4">
              You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
              However, if you do not accept cookies, you may not be able to use some portions of our website.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-4 mt-8">
              Third-Party Services
            </h2>
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-3 mt-6">
              Google AdSense
            </h3>
            <p className="text-[var(--foreground-low)] leading-relaxed mb-4">
              We use Google AdSense to display advertisements on our website. Google AdSense uses cookies to serve
              ads based on your prior visits to our website or other websites. Google&apos;s use of advertising cookies
              enables it and its partners to serve ads to you based on your visit to our site and/or other sites on the Internet.
            </p>
            <p className="text-[var(--foreground-low)] leading-relaxed mb-4">
              You may opt out of personalized advertising by visiting{' '}
              <a
                href="https://www.google.com/settings/ads"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--electric-blue)] hover:underline"
              >
                Google&apos;s Ad Settings
              </a>
              {' '}or{' '}
              <a
                href="https://www.aboutads.info/choices/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--electric-blue)] hover:underline"
              >
                www.aboutads.info
              </a>.
            </p>
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-3 mt-6">
              Analytics
            </h3>
            <p className="text-[var(--foreground-low)] leading-relaxed mb-4">
              We may use analytics services to help analyze how users use our website. These services use cookies and
              similar technologies to collect information about website usage.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-4 mt-8">
              Data Security
            </h2>
            <p className="text-[var(--foreground-low)] leading-relaxed">
              We implement appropriate technical and organizational security measures to protect your personal information.
              However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot
              guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-4 mt-8">
              Your Rights
            </h2>
            <p className="text-[var(--foreground-low)] leading-relaxed mb-4">
              Depending on your location, you may have certain rights regarding your personal information, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[var(--foreground-low)]">
              <li>The right to access your personal data</li>
              <li>The right to rectify inaccurate data</li>
              <li>The right to request deletion of your data</li>
              <li>The right to object to processing of your data</li>
              <li>The right to data portability</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-4 mt-8">
              Children&apos;s Privacy
            </h2>
            <p className="text-[var(--foreground-low)] leading-relaxed">
              Our website is not intended for children under the age of 13. We do not knowingly collect personal
              information from children under 13. If you are a parent or guardian and believe your child has provided
              us with personal information, please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-4 mt-8">
              Changes to This Privacy Policy
            </h2>
            <p className="text-[var(--foreground-low)] leading-relaxed">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the
              new Privacy Policy on this page and updating the &quot;Last updated&quot; date. You are advised to review
              this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-4 mt-8">
              Contact Us
            </h2>
            <p className="text-[var(--foreground-low)] leading-relaxed mb-4">
              If you have any questions about this Privacy Policy, please contact us:
            </p>
            <p className="text-[var(--foreground-low)] leading-relaxed">
              Email: <a href="mailto:techbyjz@gmail.com" className="text-[var(--electric-blue)] hover:underline">techbyjz@gmail.com</a>
            </p>
          </section>
        </div>
      </div>

      <Footer categories={categories} />
    </main>
    </>
  );
}

