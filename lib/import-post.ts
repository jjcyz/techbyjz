/**
 * Shared logic for importing posts
 * Extracted from API route to allow direct function calls
 */

import { client } from '@/lib/sanity';
import { markdownToPortableText } from '@/lib/markdown-to-portable-text';
import { sanitizeMarkdown } from '@/lib/security';

export interface ImportPostParams {
  markdown: string;
  postId?: string;
  title?: string;
  excerpt?: string;
  categoryIds?: string[];
  tagIds?: string[];
}

export interface ImportPostResult {
  post: unknown;
  message: string;
}

/**
 * Imports a post from markdown content
 * Can be used to create a new post or update an existing one
 */
export async function importPost(params: ImportPostParams): Promise<ImportPostResult> {
  const { markdown, postId, title, excerpt, categoryIds, tagIds } = params;

  // Validate markdown
  if (!markdown || typeof markdown !== 'string') {
    throw new Error('Markdown content is required');
  }

  // Validate markdown size (max 5MB)
  if (markdown.length > 5 * 1024 * 1024) {
    throw new Error('Content too large (max 5MB)');
  }

  // Sanitize markdown content to prevent XSS
  const sanitizedMarkdown = sanitizeMarkdown(markdown);

  // Convert sanitized markdown to Portable Text
  const portableTextContent = markdownToPortableText(sanitizedMarkdown);

  // If postId is provided, update existing post
  if (postId) {
    const updatedPost = await client
      .patch(postId)
      .set({
        content: portableTextContent,
        ...(title && { title }),
        ...(excerpt && { excerpt }),
      })
      .commit();

    return {
      post: updatedPost,
      message: 'Post updated successfully',
    };
  }

  // Otherwise, create a new draft post
  if (!title) {
    throw new Error('Title is required for new posts');
  }

  // Validate title length
  if (title.length > 200) {
    throw new Error('Title too long (max 200 characters)');
  }

  // Validate excerpt length
  if (excerpt && excerpt.length > 500) {
    throw new Error('Excerpt too long (max 500 characters)');
  }

  // Generate slug from title
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const newPost = await client.create({
    _type: 'post',
    title,
    excerpt: excerpt || '',
    content: portableTextContent,
    publishedAt: new Date().toISOString(),
    viewCount: 0,
    slug: {
      _type: 'slug',
      current: slug,
    },
    ...(categoryIds && categoryIds.length > 0 && {
      categories: categoryIds.map((id: string) => ({
        _type: 'reference',
        _ref: id,
      })),
    }),
    ...(tagIds && tagIds.length > 0 && {
      tags: tagIds.map((id: string) => ({
        _type: 'reference',
        _ref: id,
      })),
    }),
  });

  return {
    post: newPost,
    message: 'Post created successfully',
  };
}

