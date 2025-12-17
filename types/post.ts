export interface SanityImage {
  _type: 'image';
  asset: {
    _ref: string;
    _type: 'reference';
  };
  alt?: string;
}

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

export interface Post {
  _id: string;
  title: string;
  slug: {
    current: string;
  } | null;
  excerpt?: string;
  content?: unknown; // Sanity portable text content
  body?: unknown; // Legacy field name, kept for backwards compatibility
  publishedAt: string;
  mainImage?: SanityImage;
  authorName?: string;
  categories?: string[]; // Array of category IDs (strings)
  tags?: (string | Tag)[];
}

// Helper type for posts with enriched category details
export interface PostWithCategoryDetails extends Omit<Post, 'categories'> {
  categories?: Category[]; // Enriched with full category objects
}
