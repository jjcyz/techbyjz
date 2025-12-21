import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/shared/Footer';
import { client } from '@/lib/sanity';
import { CATEGORIES_QUERY } from '@/lib/queries';
import type { Category } from '@/types/post';

export const metadata: Metadata = {
  title: 'Terms of Service | TechByJZ',
  description: 'Terms of Service for TechByJZ - Read our terms and conditions for using our website.',
  robots: {
    index: true,
    follow: true,
  },
};

export default async function TermsPage() {
  const categories = await client.fetch<Category[]>(CATEGORIES_QUERY, {}, {
    next: { revalidate: 3600 }
  });

  return (
    <main className="min-h-screen relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-8 md:py-12 lg:py-16">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--electric-blue)] hover:border-[var(--electric-blue)] hover:bg-[var(--electric-blue)]/10 transition-all duration-300 text-xs font-medium mb-6"
          >
            ← Back to Home
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-4">
            Terms of Service
          </h1>
          <p className="text-sm text-[var(--foreground-muted)]">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="prose prose-invert max-w-none space-y-6 text-sm md:text-base text-[var(--foreground)]">
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-4 mt-8">
              Agreement to Terms
            </h2>
            <p className="text-[var(--foreground-low)] leading-relaxed">
              By accessing and using TechByJZ, you accept and agree to be bound by the terms and provision of this agreement.
              If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-4 mt-8">
              Use License
            </h2>
            <p className="text-[var(--foreground-low)] leading-relaxed mb-4">
              Permission is granted to temporarily access the materials on TechByJZ for personal, non-commercial transitory viewing only.
              This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[var(--foreground-low)]">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose or for any public display</li>
              <li>Attempt to reverse engineer any software contained on the website</li>
              <li>Remove any copyright or other proprietary notations from the materials</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-4 mt-8">
              Content Ownership
            </h2>
            <p className="text-[var(--foreground-low)] leading-relaxed">
              All content on TechByJZ, including articles, images, graphics, and other materials, is the property of TechByJZ
              or its content suppliers and is protected by copyright and other intellectual property laws. You may not reproduce,
              distribute, or create derivative works from our content without express written permission.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-4 mt-8">
              User Conduct
            </h2>
            <p className="text-[var(--foreground-low)] leading-relaxed mb-4">
              You agree not to use the website in any way that:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[var(--foreground-low)]">
              <li>Is unlawful, harmful, or violates any applicable laws</li>
              <li>Infringes upon the rights of others</li>
              <li>Contains viruses or other harmful code</li>
              <li>Attempts to gain unauthorized access to the website</li>
              <li>Interferes with or disrupts the website or servers</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-4 mt-8">
              Disclaimer
            </h2>
            <p className="text-[var(--foreground-low)] leading-relaxed mb-4">
              The materials on TechByJZ are provided on an &apos;as is&apos; basis. TechByJZ makes no warranties, expressed or implied,
              and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of
              merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
            <p className="text-[var(--foreground-low)] leading-relaxed">
              Further, TechByJZ does not warrant or make any representations concerning the accuracy, likely results, or reliability
              of the use of the materials on its website or otherwise relating to such materials or on any sites linked to this site.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-4 mt-8">
              Limitations
            </h2>
            <p className="text-[var(--foreground-low)] leading-relaxed">
              In no event shall TechByJZ or its suppliers be liable for any damages (including, without limitation, damages for loss
              of data or profit, or due to business interruption) arising out of the use or inability to use the materials on TechByJZ,
              even if TechByJZ or a TechByJZ authorized representative has been notified orally or in writing of the possibility of such damage.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-4 mt-8">
              Revisions and Errata
            </h2>
            <p className="text-[var(--foreground-low)] leading-relaxed">
              The materials appearing on TechByJZ could include technical, typographical, or photographic errors. TechByJZ does not
              warrant that any of the materials on its website are accurate, complete, or current. TechByJZ may make changes to the
              materials contained on its website at any time without notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-4 mt-8">
              Links
            </h2>
            <p className="text-[var(--foreground-low)] leading-relaxed">
              TechByJZ has not reviewed all of the sites linked to our website and is not responsible for the contents of any such linked site.
              The inclusion of any link does not imply endorsement by TechByJZ of the site. Use of any such linked website is at the user&apos;s own risk.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-4 mt-8">
              Modifications
            </h2>
            <p className="text-[var(--foreground-low)] leading-relaxed">
              TechByJZ may revise these terms of service at any time without notice. By using this website you are agreeing to be bound
              by the then current version of these terms of service.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-4 mt-8">
              Contact Information
            </h2>
            <p className="text-[var(--foreground-low)] leading-relaxed mb-4">
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <p className="text-[var(--foreground-low)] leading-relaxed">
              Email: <a href="mailto:techbyjz@gmail.com" className="text-[var(--electric-blue)] hover:underline">techbyjz@gmail.com</a>
            </p>
          </section>
        </div>
      </div>

      <Footer categories={categories} />
    </main>
  );
}

