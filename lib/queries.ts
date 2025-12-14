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
  mainImage {
    _type,
    asset {
      _ref,
      _type
    },
    alt
  },
  "authorName": author->name,
  categories[]->{
    _id,
    title,
    slug
  },
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
  mainImage {
    _type,
    asset {
      _ref,
      _type
    },
    alt
  },
  "authorName": author->name,
  categories[]->{
    _id,
    title,
    slug
  },
  tags[]->{
    _id,
    title,
    slug
  }
}`;

export const POST_SLUGS_QUERY = `*[_type == "post"] {
  slug {
    current
  }
}`;

export const CATEGORIES_QUERY = `*[_type == "category"] | order(title asc) {
  _id,
  title,
  slug
}`;

