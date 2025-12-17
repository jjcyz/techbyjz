import { client } from "@/lib/sanity";
import { POSTS_QUERY, CATEGORIES_QUERY } from "@/lib/queries";
import FeaturedSection from "@/components/FeaturedSection";
import NewsSection from "@/components/NewsSection";
import AutomationSection from "@/components/AutomationSection";
import AISection from "@/components/AISection";
import HeroBannerSection from "@/components/HeroBannerSection";
import Footer from "@/components/Footer";
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

  // Filter posts by category title (case-insensitive, trimmed)
  const filterPostsByCategoryTitle = (categoryTitle: string): Post[] => {
    const normalizedTitle = categoryTitle.trim().toLowerCase();
    return validPosts.filter((post) =>
      post.categories?.some((category) =>
        category.title?.trim().toLowerCase() === normalizedTitle
      )
    );
  };

  // Filter posts by category title with partial matching (for flexible matching)
  const filterPostsByCategoryPartial = (searchTerms: string[]): Post[] => {
    return validPosts.filter((post) =>
      post.categories?.some((category) =>
        category && category.title && searchTerms.some((term) =>
          category.title.toLowerCase().includes(term.toLowerCase())
        )
      )
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
