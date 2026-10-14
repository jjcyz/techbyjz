import { revalidatePath } from 'next/cache';

/**
 * On-demand revalidation webhook for Sanity.
 *
 * Point a Sanity webhook (POST) at:
 *   https://<site>/api/revalidate?secret=<SANITY_REVALIDATE_SECRET>
 * with a JSON body containing the changed document's type and slug, e.g.
 *   { "_type": "post", "slug": { "current": "my-post" } }
 *
 * This replaces short time-based revalidation windows: pages now refresh at
 * most once a day on their own, and instantly when content actually changes.
 */
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  // This secret should only be known to this route handler and Sanity
  if (secret !== process.env.SANITY_REVALIDATE_SECRET) {
    return new Response('Invalid token', { status: 401 });
  }

  let body: { _type?: string; slug?: { current?: string } | string } | null = null;
  try {
    body = await request.json();
  } catch {
    return new Response('Invalid JSON body', { status: 400 });
  }

  const slug = typeof body?.slug === 'string' ? body.slug : body?.slug?.current;

  // Listings and the homepage always refresh when content changes
  const paths = new Set<string>(['/', '/posts']);

  if (body?._type === 'post' && slug) {
    paths.add(`/posts/${slug}`);
    paths.add(`/${slug}`); // root-level redirect shim for this post
  } else if (body?._type === 'tag' && slug) {
    paths.add(`/tag/${slug}`);
  } else if (body?._type === 'category' && slug) {
    paths.add(`/category/${slug}`);
  }

  const revalidated = [...paths];
  for (const path of revalidated) {
    revalidatePath(path);
  }

  return Response.json({ revalidated: true, paths: revalidated });
}
