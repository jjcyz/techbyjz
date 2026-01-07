/**
 * Centralized GROQ queries for Sanity CMS
 * This keeps all queries in one place for easier maintenance
 */

export const POSTS_QUERY = `*[_type == "post"] | order(publishedAt desc) {
  _id,
  title,
  slug,
  excerpt,
  publishedAt,
  viewCount,
  mainImage,
  "authorName": author->name,
  categories,
  tags[]->{
    _id,
    title,
    slug
  }
}`;

export const POST_BY_SLUG_QUERY = `*[_type == "post" && slug.current == $slug][0] {
  _id,
  title,
  slug,
  excerpt,
  content,
  publishedAt,
  viewCount,
  mainImage,
  "authorName": author->name,
  "categories": categories[]->{
    _id,
    title,
    slug
  },
  "tags": tags[]->{
    _id,
    title,
    slug
  }
}`;

export const CATEGORIES_QUERY = `*[_type == "category"] | order(title asc) {
  _id,
  title,
  slug
}`;

export const CATEGORY_BY_SLUG_QUERY = `*[_type == "category" && slug.current == $slug][0] {
  _id,
  title,
  slug
}`;

export const POSTS_BY_CATEGORY_ID_QUERY = `*[_type == "post" && $categoryId in categories[]._ref] | order(publishedAt desc) {
  _id,
  title,
  slug,
  excerpt,
  publishedAt,
  viewCount,
  mainImage,
  "authorName": author->name,
  categories,
  tags[]->{
    _id,
    title,
    slug
  }
}`;

export const RELATED_POSTS_QUERY = `*[_type == "post" && _id != $postId && count(categories[@._ref in $categoryIds]) > 0] | order(publishedAt desc) [0...3] {
  _id,
  title,
  slug,
  excerpt,
  publishedAt,
  viewCount,
  mainImage,
  "authorName": author->name,
  categories
}`;

export const RECENT_POSTS_QUERY = `*[_type == "post" && _id != $postId] | order(publishedAt desc) [0...3] {
  _id,
  title,
  slug,
  excerpt,
  publishedAt,
  viewCount,
  mainImage,
  "authorName": author->name,
  categories
}`;

export const TAGS_QUERY = `*[_type == "tag"] | order(title asc) {
  _id,
  title,
  slug
}`;

export const TAG_BY_SLUG_QUERY = `*[_type == "tag" && slug.current == $slug][0] {
  _id,
  title,
  slug
}`;

// Lightweight query for sitemap - only fetches essential fields
export const POSTS_SITEMAP_QUERY = `*[_type == "post"] {
  slug,
  publishedAt
}`;
