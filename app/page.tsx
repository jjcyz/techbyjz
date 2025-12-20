import { client } from "@/lib/sanity";
import { POSTS_QUERY, CATEGORIES_QUERY } from "@/lib/queries";
import FeaturedSection from "@/components/sections/FeaturedSection/FeaturedSection";
import NewsSection from "@/components/sections/NewsSection/NewsSection";
import AutomationSection from "@/components/sections/AutomationSection/AutomationSection";
import AISection from "@/components/sections/AISection/AISection";
import CybersecuritySection from "@/components/sections/CybersecuritySection/CybersecuritySection";
import HeroBannerSection from "@/components/sections/HeroBannerSection/HeroBannerSection";
import Footer from "@/components/shared/Footer";
import { isValidSlug, groupPostsByCategory, getRandomPost } from "@/lib/utils";
import type { Post, Category } from "@/types/post";

export default async function Home() {
  // Fetch posts and categories in parallel for better performance
  let posts: Post[] = [];
  let categories: Category[] = [];

  try {
    [posts, categories] = await Promise.all([
      client.fetch<Post[]>(POSTS_QUERY, {}, {
        next: { revalidate: 60 } // Revalidate every 60 seconds for ISR
      }),
      client.fetch<Category[]>(CATEGORIES_QUERY, {}, {
        next: { revalidate: 60 }
      })
    ]);
  } catch (error) {
    console.error('Error fetching data from Sanity:', error);
    // Return empty arrays if fetch fails - page will still render
    // This prevents the entire page from failing and returning 404
  }

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

  // Helper: Find category by title and get its posts
  const getCategoryPosts = (categoryTitle: string): { category: Category | undefined; posts: Post[] } => {
    const category = categories.find(cat => cat.title === categoryTitle);
    if (!category) return { category: undefined, posts: [] };

    const posts = postsByCategory[category._id] || [];
    return { category, posts };
  };

  // Get posts for each category section
  const { category: newsCategory, posts: newsPosts } = getCategoryPosts("Tech World in 60 Seconds");
  const { category: automationCategory, posts: automationPosts } = getCategoryPosts("Automation");
  const { category: aiCategory, posts: aiPosts } = getCategoryPosts("AI Models");
  const { category: cybersecurityCategory, posts: cybersecurityPosts } = getCategoryPosts("Cybersecurity");

  return (
    <main className="min-h-screen relative overflow-x-hidden w-full">
      {/* Hero Banner Section */}
      <HeroBannerSection
        posts={validPosts}
        randomPost={randomPost}
      />

      {/* Featured Posts Section */}
      <FeaturedSection posts={displayFeaturedPosts} />

      {/* News Section */}
      <NewsSection posts={newsPosts} category={newsCategory} />

      {/* Automation Section */}
      <AutomationSection posts={automationPosts} category={automationCategory} />

      {/* AI Section */}
      <AISection posts={aiPosts} category={aiCategory} />

      {/* Cybersecurity Section */}
      <CybersecuritySection posts={cybersecurityPosts} category={cybersecurityCategory} />

      {/* Footer */}
      <Footer categories={categoriesWithPosts} />
    </main>
  );
}
