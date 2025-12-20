import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/lib/sanity';
import { TAG_BY_SLUG_QUERY } from '@/lib/queries';
import { isValidSlug } from '@/lib/utils';
import type { Post, Tag } from '@/types/post';

const POSTS_PER_PAGE = 12;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get('slug');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || String(POSTS_PER_PAGE), 10);

    if (!slug || !isValidSlug(slug)) {
      return NextResponse.json(
        { error: 'Invalid tag slug' },
        { status: 400 }
      );
    }

    // Fetch tag to get its ID
    const tag = await client.fetch<Tag | null>(
      TAG_BY_SLUG_QUERY,
      { slug },
      { next: { revalidate: 60 } }
    );

    if (!tag) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      );
    }

    // Fetch posts with pagination
    const start = (page - 1) * limit;
    const end = start + limit;

    const posts = await client.fetch<Post[]>(
      `*[_type == "post" && $tagId in tags[]._ref] | order(publishedAt desc) [${start}...${end}] {
        _id,
        title,
        slug,
        excerpt,
        publishedAt,
        mainImage {
          _type,
          asset {
            _ref,
            _type
          },
          alt
        },
        "authorName": author->name,
        categories,
        tags[]->{
          _id,
          title,
          slug
        }
      }`,
      { tagId: tag._id },
      { next: { revalidate: 60 } }
    );

    // Get total count for pagination
    const totalCount = await client.fetch<number>(
      `count(*[_type == "post" && $tagId in tags[]._ref])`,
      { tagId: tag._id },
      { next: { revalidate: 60 } }
    );

    const hasMore = end < totalCount;

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total: totalCount,
        hasMore,
      },
    });
  } catch (error) {
    console.error('Error fetching tag posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

