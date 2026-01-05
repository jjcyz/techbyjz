import type { Metadata } from 'next';

// Prevent indexing of all studio pages
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

