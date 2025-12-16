'use client'

import type { Post, Category } from "@/types/post"

interface CategoryDebugProps {
  posts: Post[]
  categories: Category[]
}

/**
 * Debug component to display category and post information
 * Useful for troubleshooting category matching issues
 */
export default function CategoryDebug({ posts, categories }: CategoryDebugProps) {
  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  // Get all unique category titles from posts
  const postCategoryTitles = new Set<string>()
  posts.forEach(post => {
    post.categories?.forEach(cat => {
      if (cat?.title) {
        postCategoryTitles.add(cat.title.trim())
      }
    })
  })

  // Get category titles from categories list
  const categoryTitles = categories.map(cat => cat.title?.trim()).filter(Boolean)

  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-4 m-4 text-sm">
      <h3 className="font-bold mb-2">Category Debug Info</h3>
      <div className="space-y-2">
        <div>
          <strong>Total Posts:</strong> {posts.length}
        </div>
        <div>
          <strong>Posts with Categories:</strong>{' '}
          {posts.filter(p => p.categories && p.categories.length > 0).length}
        </div>
        <div>
          <strong>Total Categories (from query):</strong> {categories.length}
        </div>
        <div>
          <strong>Category Titles (from query):</strong>
          <ul className="list-disc list-inside ml-2">
            {categoryTitles.map((title, idx) => (
              <li key={idx}>{title}</li>
            ))}
          </ul>
        </div>
        <div>
          <strong>Category Titles (from posts):</strong>
          <ul className="list-disc list-inside ml-2">
            {Array.from(postCategoryTitles).map((title, idx) => (
              <li key={idx}>{title}</li>
            ))}
          </ul>
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
          <em>This component only appears in development mode</em>
        </div>
      </div>
    </div>
  )
}
