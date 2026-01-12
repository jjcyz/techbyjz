import { redirect } from 'next/navigation';

/**
 * Handle pagination URLs like /posts/page/10/
 * Redirect to /posts since pagination is handled via infinite scroll
 */
export default function PostsPageNumberPage({ params }: { params: Promise<{ number: string }> }) {
  // Redirect pagination URLs to posts listing page
  // Pagination is handled via infinite scroll, so we redirect to the base /posts page
  redirect('/posts');
}

