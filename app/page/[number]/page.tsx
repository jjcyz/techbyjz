import { redirect } from 'next/navigation';

/**
 * Handle pagination URLs like /page/2/
 * Since the home page doesn't currently support pagination,
 * redirect to the home page
 */
export default function PageNumberPage({ params }: { params: Promise<{ number: string }> }) {
  // Redirect pagination URLs to home page
  // In the future, this could be updated to support actual pagination
  redirect('/');
}

