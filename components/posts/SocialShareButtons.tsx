'use client';

interface SocialShareButtonsProps {
  title: string;
  url: string;
  excerpt?: string;
}

export default function SocialShareButtons({ title, url, excerpt }: SocialShareButtonsProps) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedText = encodeURIComponent(excerpt || title);

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    reddit: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      // TODO: Replace with a toast notification component
      alert('Link copied to clipboard!');
    } catch (err) {
      // Silently fail - clipboard API may not be available in some contexts
      console.error('Failed to copy link:', err);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 mt-8 pt-8 border-t border-[rgba(0,255,255,0.2)]">
      <span className="text-sm font-medium text-[var(--foreground-low)]">Share:</span>
      <div className="flex flex-wrap gap-2">
        <a
          href={shareLinks.twitter}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--electric-blue)] hover:border-[var(--electric-blue)] hover:bg-[var(--electric-blue)]/10 transition-all duration-300 text-sm font-medium"
          aria-label="Share on Twitter"
        >
          Twitter
        </a>
        <a
          href={shareLinks.facebook}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--electric-blue)] hover:border-[var(--electric-blue)] hover:bg-[var(--electric-blue)]/10 transition-all duration-300 text-sm font-medium"
          aria-label="Share on Facebook"
        >
          Facebook
        </a>
        <a
          href={shareLinks.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--electric-blue)] hover:border-[var(--electric-blue)] hover:bg-[var(--electric-blue)]/10 transition-all duration-300 text-sm font-medium"
          aria-label="Share on LinkedIn"
        >
          LinkedIn
        </a>
        <a
          href={shareLinks.reddit}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--electric-blue)] hover:border-[var(--electric-blue)] hover:bg-[var(--electric-blue)]/10 transition-all duration-300 text-sm font-medium"
          aria-label="Share on Reddit"
        >
          Reddit
        </a>
        <button
          onClick={handleCopyLink}
          className="px-4 py-2 bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--electric-blue)] hover:border-[var(--electric-blue)] hover:bg-[var(--electric-blue)]/10 transition-all duration-300 text-sm font-medium"
          aria-label="Copy link"
        >
          Copy Link
        </button>
      </div>
    </div>
  );
}

