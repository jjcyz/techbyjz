/**
 * Categories and Tags Logic
 *
 * Handles:
 * - Fetching existing categories and tags from Sanity
 * - Using AI to analyze content and suggest appropriate categories/tags
 * - Matching or creating categories/tags in Sanity
 */

import { client } from './sanity';
import { CATEGORIES_QUERY } from './queries';

export interface Category {
  _id: string;
  title: string;
  slug?: {
    current: string;
  };
}

export interface Tag {
  _id: string;
  title: string;
  slug?: {
    current: string;
  };
}

const TAGS_QUERY = `*[_type == "tag"] | order(title asc) {
  _id,
  title,
  slug
}`;

/**
 * Fetch all categories from Sanity
 */
export async function fetchCategories(): Promise<Category[]> {
  try {
    const categories = await client.fetch<Category[]>(CATEGORIES_QUERY);
    return categories || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

/**
 * Fetch all tags from Sanity
 */
export async function fetchTags(): Promise<Tag[]> {
  try {
    const tags = await client.fetch<Tag[]>(TAGS_QUERY);
    return tags || [];
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
}

/**
 * Use AI to analyze content and suggest categories and tags
 */
export async function suggestCategoriesAndTags(
  title: string,
  excerpt: string,
  content: string,
  existingCategories: Category[],
  existingTags: Tag[]
): Promise<{ categoryIds: string[]; tagIds: string[] }> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn('No OpenAI API key found. Skipping category/tag suggestions.');
    return { categoryIds: [], tagIds: [] };
  }

  // Format existing categories and tags for the AI
  const categoryList = existingCategories.map((c) => c.title).join(', ');
  const tagList = existingTags.map((t) => t.title).join(', ');

  const prompt = `Analyze this blog post and suggest appropriate categories and tags.

Post Title: ${title}
Post Excerpt: ${excerpt}
Post Content (first 2000 chars): ${content.substring(0, 2000)}...

Available Categories: ${categoryList || 'None (you can suggest new ones)'}
Available Tags: ${tagList || 'None (you can suggest new ones)'}

Instructions:
1. Select 1-3 categories that best fit this post. Prefer existing categories if they match.
2. Select 3-7 tags that are relevant to this post. Prefer existing tags if they match.
3. If no existing category/tag fits well, suggest new ones (but prioritize matching existing ones).

Return your response as a JSON object with this exact format:
{
  "categories": ["Category Name 1", "Category Name 2"],
  "tags": ["Tag 1", "Tag 2", "Tag 3"],
  "newCategories": ["New Category Name"] (only if needed),
  "newTags": ["New Tag Name"] (only if needed)
}

Be specific and relevant. Categories should be broad topics (e.g., "AI", "Web Development", "Startups").
Tags should be more specific keywords (e.g., "machine-learning", "react", "venture-capital").`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert content curator who accurately categorizes and tags blog posts. Always return valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3, // Lower temperature for more consistent categorization
        max_tokens: 500,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = JSON.parse(data.choices[0].message.content);

    return await matchOrCreateCategoriesAndTags(
      aiResponse.categories || [],
      aiResponse.tags || [],
      aiResponse.newCategories || [],
      aiResponse.newTags || [],
      existingCategories,
      existingTags
    );
  } catch (error) {
    console.error('Error suggesting categories and tags:', error);
    return { categoryIds: [], tagIds: [] };
  }
}

/**
 * Match existing categories/tags or create new ones
 */
async function matchOrCreateCategoriesAndTags(
  suggestedCategories: string[],
  suggestedTags: string[],
  newCategories: string[],
  newTags: string[],
  existingCategories: Category[],
  existingTags: Tag[]
): Promise<{ categoryIds: string[]; tagIds: string[] }> {
  const categoryIds: string[] = [];
  const tagIds: string[] = [];

  // Helper function to find best match (case-insensitive, handles partial matches)
  const findBestMatch = (
    name: string,
    existing: Array<{ title: string; _id: string }>
  ): string | null => {
    const normalized = name.toLowerCase().trim();

    // Exact match
    const exact = existing.find((item) => item.title.toLowerCase() === normalized);
    if (exact) return exact._id;

    // Partial match (contains)
    const partial = existing.find((item) =>
      item.title.toLowerCase().includes(normalized) ||
      normalized.includes(item.title.toLowerCase())
    );
    if (partial) return partial._id;

    return null;
  };

  // Match or create categories
  for (const categoryName of [...suggestedCategories, ...newCategories]) {
    if (!categoryName || categoryName.trim() === '') continue;

    const existingId = findBestMatch(categoryName, existingCategories);

    if (existingId) {
      categoryIds.push(existingId);
    } else {
      // Create new category
      try {
        const slug = categoryName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

        const newCategory = await client.create({
          _type: 'category',
          title: categoryName.trim(),
          slug: {
            _type: 'slug',
            current: slug,
          },
        });

        categoryIds.push(newCategory._id);
        console.log(`Created new category: ${categoryName}`);
      } catch (error) {
        console.error(`Error creating category "${categoryName}":`, error);
      }
    }
  }

  // Match or create tags
  for (const tagName of [...suggestedTags, ...newTags]) {
    if (!tagName || tagName.trim() === '') continue;

    const existingId = findBestMatch(tagName, existingTags);

    if (existingId) {
      tagIds.push(existingId);
    } else {
      // Create new tag
      try {
        const slug = tagName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

        const newTag = await client.create({
          _type: 'tag',
          title: tagName.trim(),
          slug: {
            _type: 'slug',
            current: slug,
          },
        });

        tagIds.push(newTag._id);
        console.log(`Created new tag: ${tagName}`);
      } catch (error) {
        console.error(`Error creating tag "${tagName}":`, error);
      }
    }
  }

  // Remove duplicates
  return {
    categoryIds: Array.from(new Set(categoryIds)),
    tagIds: Array.from(new Set(tagIds)),
  };
}

