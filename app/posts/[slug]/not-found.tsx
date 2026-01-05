import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[var(--background)] flex items-center justify-center">
      <div className="text-center px-4">
        <h1 className="text-6xl font-bold text-[var(--electric-blue)] mb-4">404</h1>
        <h2 className="text-2xl text-[var(--foreground)] mb-4">Post Not Found</h2>
        <p className="text-[var(--text-gray-400)] mb-8">
          The post you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-[var(--card-bg)] border-2 border-[var(--border-color)] text-[var(--electric-blue)] hover:border-[var(--electric-blue)] transition-colors"
        >
          Back to Posts
        </Link>
      </div>
    </main>
  );
}

