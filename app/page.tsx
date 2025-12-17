import { client } from "@/lib/sanity";
import { POSTS_QUERY, CATEGORIES_QUERY } from "@/lib/queries";
import FeaturedSection from "@/components/sections/FeaturedSection/FeaturedSection";
import NewsSection from "@/components/sections/NewsSection/NewsSection";
import AutomationSection from "@/components/sections/AutomationSection/AutomationSection";
import AISection from "@/components/sections/AISection/AISection";
import HeroBannerSection from "@/components/sections/HeroBannerSection/HeroBannerSection";
import Footer from "@/components/shared/Footer";
import { isValidSlug, groupPostsByCategory, getRandomPost } from "@/lib/utils";
import type { Post, Category } from "@/types/post";

export default async function Home() {
  // Fetch posts and categories in parallel for better performance
  const [posts, categories] = await Promise.all([
    client.fetch<Post[]>(POSTS_QUERY, {}, {
      next: { revalidate: 60 } // Revalidate every 60 seconds for ISR
    }),
    client.fetch<Category[]>(CATEGORIES_QUERY, {}, {
      next: { revalidate: 60 }
    })
  ]);

  // Filter out posts without valid slugs (including template strings)
  const validPosts = posts.filter((post) => isValidSlug(post.slug?.current));

  // Group posts by category for category sections
  const postsByCategory = groupPostsByCategory(validPosts);

  // Get a random post for the "Play Random Post" button
  const randomPost = getRandomPost(validPosts);

  // Filter categories to only show those that have posts
  const categoriesWithPosts = categories.filter(
    (category) => postsByCategory[category._id] && postsByCategory[category._id].length > 0
  );

  // Get featured posts (most recent 6)
  const displayFeaturedPosts = validPosts.slice(0, 6);

  // Helper: Find category ID by title
  const findCategoryIdByTitle = (title: string): string | undefined => {
    const normalizedTitle = title.trim().toLowerCase();
    return categories.find(
      (cat) => cat.title?.trim().toLowerCase() === normalizedTitle
    )?._id;
  };

  // Filter posts by category title (case-insensitive, trimmed)
  // Now works with category IDs (strings) instead of category objects
  const filterPostsByCategoryTitle = (categoryTitle: string): Post[] => {
    const categoryId = findCategoryIdByTitle(categoryTitle);
    if (!categoryId) return [];

    return validPosts.filter((post) =>
      post.categories?.includes(categoryId)
    );
  };

  // Get posts for each category section
  // Using exact category titles from Sanity
  const newsPosts = filterPostsByCategoryTitle("Tech World in 60 Sec");
  const automationPosts = filterPostsByCategoryTitle("Automation");
  const aiPosts = filterPostsByCategoryTitle("AI Models");


  return (
    <main className="min-h-screen relative">
      {/* Hero Banner Section */}
      <HeroBannerSection
        posts={validPosts}
        randomPost={randomPost}
      />

      {/* Featured Posts Section */}
      <FeaturedSection posts={displayFeaturedPosts} />

      {/* News Section */}
      <NewsSection posts={newsPosts} />

      {/* Automation Section */}
      <AutomationSection posts={automationPosts} />

      {/* AI Section */}
      <AISection posts={aiPosts} />

      {/* Footer */}
      <Footer categories={categoriesWithPosts} />
    </main>
  );
}
