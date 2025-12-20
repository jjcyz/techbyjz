/**
 * Categories and Tags Logic
 *
 * Handles:
 * - Fetching existing categories and tags from Sanity
 * - Using AI to analyze content and suggest appropriate categories/tags
 * - Matching or creating categories/tags in Sanity
 */

import { createClient } from '@sanity/client';
import { client } from './sanity';
import { sanityConfig } from './sanity.config';
import { CATEGORIES_QUERY } from './queries';
import { normalizeTag } from './tag-formatting';

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
 * OPTIMIZED: Only creates new tags if absolutely necessary (prevents tag bloat)
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

  // Adjust instructions based on whether tags exist
  const tagInstruction = existingTags.length > 0
    ? 'Select 3-5 tags that are relevant. STRONGLY prefer existing tags - only suggest new ones if absolutely necessary.'
    : 'Select 3-5 tags that are relevant. Since no tags exist yet, suggest new tags based on the content.';

  const prompt = `Analyze this blog post and suggest appropriate categories and tags.

Post Title: ${title}
Post Excerpt: ${excerpt}
Post Content (first 2000 chars): ${content.substring(0, 2000)}...

Available Categories: ${categoryList || 'None (you can suggest new ones)'}
Available Tags: ${tagList || 'None - you should suggest new tags based on the content'}

Instructions:
1. Select 1-3 categories that best fit this post. ${existingCategories.length > 0 ? 'STRONGLY prefer existing categories - only suggest new ones if absolutely no match exists.' : 'Suggest new categories based on the content.'}
2. ${tagInstruction}
3. IMPORTANT: ${existingTags.length > 0 ? 'Only suggest new categories/tags if there\'s truly no existing match. This prevents tag bloat.' : 'Since no tags exist, you should suggest new tags. Be creative but relevant.'}

Return your response as a JSON object with this exact format:
{
  "categories": ["Category Name 1", "Category Name 2"],
  "tags": ["Tag 1", "Tag 2", "Tag 3"],
  "newCategories": ${existingCategories.length > 0 ? '[] (only if absolutely no existing category matches)' : '[] (suggest new categories if needed)'},
  "newTags": ${existingTags.length > 0 ? '[] (only if absolutely no existing tag matches)' : '[] (suggest new tags - this is expected since no tags exist)'}
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
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
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
  // Create write client for creating tags/categories (CDN disabled for writes)
  const writeClient = createClient({
    projectId: sanityConfig.projectId,
    dataset: sanityConfig.dataset,
    apiVersion: sanityConfig.apiVersion,
    useCdn: false, // CDN is read-only, must be false for writes
    token: process.env.SANITY_API_TOKEN,
  });

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
      // Create new category with normalized formatting
      try {
        // Normalize category to Title Case and generate slug
        const { title: normalizedTitle, slug } = normalizeTag(categoryName);

        const newCategory = await writeClient.create({
          _type: 'category',
          title: normalizedTitle,
          slug: {
            _type: 'slug',
            current: slug,
          },
        });

        categoryIds.push(newCategory._id);
        console.log(`Created new category: "${normalizedTitle}" (from "${categoryName}")`);
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
      // Create new tag with normalized formatting
      try {
        // Normalize tag to Title Case and generate slug
        const { title: normalizedTitle, slug } = normalizeTag(tagName);

        const newTag = await writeClient.create({
          _type: 'tag',
          title: normalizedTitle,
          slug: {
            _type: 'slug',
            current: slug,
          },
        });

        tagIds.push(newTag._id);
        console.log(`Created new tag: "${normalizedTitle}" (from "${tagName}")`);
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

/**
 * Suggest tags only (no categories) - matches existing tags or creates new ones
 * Used for backfilling tags on existing posts that already have categories
 */
export async function suggestTagsOnly(
  title: string,
  excerpt: string,
  content: string,
  existingTags: Tag[]
): Promise<string[]> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn('No OpenAI API key found. Skipping tag suggestions.');
    return [];
  }

  // Create a write client with CDN disabled for write operations
  // This ensures we have the correct configuration for creating tags
  const writeClient = createClient({
    projectId: sanityConfig.projectId,
    dataset: sanityConfig.dataset,
    apiVersion: sanityConfig.apiVersion,
    useCdn: false, // CDN is read-only, must be false for writes
    token: process.env.SANITY_API_TOKEN,
  });

  // Format existing tags for the AI
  const tagList = existingTags.map((t) => t.title).join(', ');

  const prompt = `Analyze this blog post and suggest 5-7 relevant tags.

Post Title: ${title}
Post Excerpt: ${excerpt}
Post Content (first 2000 chars): ${content.substring(0, 2000)}...

${existingTags.length > 0 ? `Existing Tags (you can use these if relevant): ${tagList}` : 'No existing tags - create new tags based on the content.'}

Instructions:
1. Suggest 5-7 tags that are highly relevant to this post
2. If existing tags match well, use them. Otherwise, create new tags freely
3. Don't be conservative - create new tags whenever they better describe the content
4. Tags should be specific keywords (e.g., "machine-learning", "react", "ollama", "datacenter", "ai-models", "edge-computing", "heuristics")
5. Be creative and comprehensive - cover all major topics in the post

Return your response as a JSON object with this exact format:
{
  "tags": ["Tag 1", "Tag 2", "Tag 3", "Tag 4", "Tag 5"],
  "newTags": ["New Tag 1", "New Tag 2"] (include ALL tags here, whether existing or new)
}

IMPORTANT: Include ALL suggested tags in the "newTags" array. The system will automatically match existing tags and create new ones as needed.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
          role: 'system',
          content: 'You are an expert content curator who tags blog posts comprehensively. Create new tags freely when they better describe the content. Always return valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.5, // Increased for more creative tag suggestions
        max_tokens: 400, // Increased to allow more tags
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = JSON.parse(data.choices[0].message.content);

    // Combine all suggested tags (from both arrays)
    // The AI now returns all tags in newTags, but we also check tags array for backwards compatibility
    const suggestedTagNames = [
      ...(aiResponse.newTags || []), // Primary source - all tags
      ...(aiResponse.tags || []),    // Fallback for backwards compatibility
    ].filter((tag: string) => tag && tag.trim() !== ''); // Remove empty tags

    // Remove duplicates
    const uniqueTagNames = Array.from(new Set(suggestedTagNames.map((t: string) => t.trim())));

    console.log(`   💭 AI suggested ${uniqueTagNames.length} tags: ${uniqueTagNames.join(', ')}`);

    // Match existing tags or create new ones
    const tagIds: string[] = [];

    for (const tagName of uniqueTagNames) {
      const normalized = tagName.toLowerCase().trim();

      // First, try to match existing tags (exact match)
      const exact = existingTags.find((item) => item.title.toLowerCase() === normalized);
      if (exact) {
        tagIds.push(exact._id);
        console.log(`   ✅ Matched existing tag: "${tagName}" → "${exact.title}"`);
        continue;
      }

      // Try partial match (more flexible)
      const partial = existingTags.find((item) => {
        const itemNormalized = item.title.toLowerCase();
        // Check if one contains the other (more flexible matching)
        return itemNormalized.includes(normalized) ||
               normalized.includes(itemNormalized) ||
               // Also check word-by-word matching
               normalized.split(/[\s-]+/).some((word: string) => itemNormalized.includes(word)) ||
               itemNormalized.split(/[\s-]+/).some((word: string) => normalized.includes(word));
      });
      if (partial) {
        tagIds.push(partial._id);
        console.log(`   ✅ Matched existing tag (partial): "${tagName}" → "${partial.title}"`);
        continue;
      }

      // No match found - create new tag (if permissions allow)
      try {
        // Normalize tag to Title Case and generate slug
        const { title: normalizedTitle, slug } = normalizeTag(tagName);

        const newTag = await writeClient.create({
          _type: 'tag',
          title: normalizedTitle,
          slug: {
            _type: 'slug',
            current: slug,
          },
        });

        tagIds.push(newTag._id);
        console.log(`   ✨ Created new tag: "${normalizedTitle}" (from "${tagName}")`);
        // Add to existingTags array so future iterations can use it
        existingTags.push({
          _id: newTag._id,
          title: newTag.title as string,
          slug: newTag.slug as { current: string },
        });
      } catch (error) {
        // If permission error, just skip this tag
        if (error instanceof Error && error.message.includes('permission')) {
          console.log(`   ⚠️  Skipped creating tag "${tagName}" (insufficient permissions)`);
        } else {
          console.error(`   ❌ Error creating tag "${tagName}":`, error);
        }
      }
    }

    return Array.from(new Set(tagIds));
  } catch (error) {
    console.error('Error suggesting tags:', error);
    return [];
  }
}

