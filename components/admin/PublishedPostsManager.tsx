'use client';

import React, { useEffect, useState } from 'react';
import RichTextEditor from '@/components/posts/RichTextEditor';
import InlineEditableField from './InlineEditableField';
import type { Category, Tag } from '@/types/post';
import type { PortableTextContent } from '@/components/posts/RichTextEditor/types';

interface PublishedPost {
  _id: string;
  title: string;
  excerpt?: string;
  _createdAt: string;
  publishedAt: string;
  viewCount?: number | null;
  slug?: {
    current: string;
  } | null;
  categories?: Array<{ _id: string; title: string; slug?: { current: string } } | null>;
  tags?: Array<{ _id: string; title: string; slug?: { current: string } } | null>;
}

interface PostDetail extends PublishedPost {
  content?: PortableTextContent[];
}

export default function PublishedPostsManager() {
  const [posts, setPosts] = useState<PublishedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [expandedPost, setExpandedPost] = useState<PostDetail | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [savingField, setSavingField] = useState<string | null>(null);

  useEffect(() => {
    fetchPublishedPosts();
    fetchCategoriesAndTags();
  }, []);

  async function fetchCategoriesAndTags() {
    try {
      const [catsRes, tagsRes] = await Promise.all([
        fetch('/api/admin/categories'),
        fetch('/api/admin/tags'),
      ]);

      const catsData = await catsRes.json();
      const tagsData = await tagsRes.json();

      if (catsData.success) setCategories(catsData.data || []);
      if (tagsData.success) setTags(tagsData.data || []);
    } catch {
      // Silently fail - categories/tags will just be empty arrays
    }
  }

  async function handleExpand(postId: string) {
    if (expandedPostId === postId) {
      // Collapse if already expanded
      setExpandedPostId(null);
      setExpandedPost(null);
      return;
    }

    try {
      setError(null);
      const response = await fetch(`/api/admin/posts/${postId}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch post');
      }

      setExpandedPost(data.data);
      setExpandedPostId(postId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load post for editing');
    }
  }

  async function handleSaveField(postId: string, field: string, value: string | string[]) {
    setSavingField(`${postId}-${field}`);
    try {
      const updateData: Record<string, unknown> = { [field]: value };
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to save');
      }

      // Update local state
      await fetchPublishedPosts();
      if (expandedPostId === postId && expandedPost) {
        const updatedPost = { ...expandedPost, [field]: value };
        setExpandedPost(updatedPost);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSavingField(null);
    }
  }

  async function handleSaveCategoriesTags(postId: string, categoryIds: string[], tagIds: string[]) {
    setSavingField(`${postId}-categories-tags`);
    try {
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categoryIds,
          tagIds,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to save');
      }

      // Update local state
      await fetchPublishedPosts();
      if (expandedPostId === postId && expandedPost) {
        const updatedCategories = categories.filter((cat) => categoryIds.includes(cat._id));
        const updatedTags = tags.filter((tag) => tagIds.includes(tag._id));
        setExpandedPost({
          ...expandedPost,
          categories: updatedCategories,
          tags: updatedTags,
        });
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSavingField(null);
    }
  }

  async function handleCreateCategory(title: string): Promise<Category> {
    const response = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to create category');
    }

    // Refresh categories list
    await fetchCategoriesAndTags();

    return data.data;
  }

  async function handleCreateTag(title: string): Promise<Tag> {
    const response = await fetch('/api/admin/tags', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to create tag');
    }

    // Refresh tags list
    await fetchCategoriesAndTags();

    return data.data;
  }

  async function handleCategoriesChange(
    postId: string,
    newCategories: Category[],
    currentTags: Tag[]
  ) {
    setSavingField(`${postId}-categories`);
    try {
      const categoryIds = newCategories.map((cat) => cat._id);
      const tagIds = currentTags.map((tag) => tag._id);
      await handleSaveCategoriesTags(postId, categoryIds, tagIds);

      // Update local state
      await fetchPublishedPosts();
      if (expandedPostId === postId && expandedPost) {
        setExpandedPost({
          ...expandedPost,
          categories: newCategories,
        });
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save categories');
    } finally {
      setSavingField(null);
    }
  }

  async function handleTagsChange(
    postId: string,
    newTags: Tag[],
    currentCategories: Category[]
  ) {
    setSavingField(`${postId}-tags`);
    try {
      const tagIds = newTags.map((tag) => tag._id);
      const categoryIds = currentCategories.map((cat) => cat._id);
      await handleSaveCategoriesTags(postId, categoryIds, tagIds);

      // Update local state
      await fetchPublishedPosts();
      if (expandedPostId === postId && expandedPost) {
        setExpandedPost({
          ...expandedPost,
          tags: newTags,
        });
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save tags');
    } finally {
      setSavingField(null);
    }
  }

  async function handleSaveContent(postId: string, content: PortableTextContent[]) {
    setSavingField(`${postId}-content`);
    try {
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to save content');
      }

      // Update local state
      if (expandedPostId === postId && expandedPost) {
        setExpandedPost({ ...expandedPost, content });
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save content');
    } finally {
      setSavingField(null);
    }
  }

  async function fetchPublishedPosts() {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/admin/published');
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch published posts');
      }

      // Filter out null categories and tags from the response
      const posts = (data.data || []).map((post: PublishedPost) => ({
        ...post,
        categories: (post.categories || []).filter((cat): cat is NonNullable<typeof cat> => cat != null),
        tags: (post.tags || []).filter((tag): tag is NonNullable<typeof tag> => tag != null),
      }));

      setPosts(posts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load published posts');
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(postId: string, action: 'unpublish' | 'delete') {
    const actionLabel = action === 'unpublish' ? 'unpublish' : 'delete';
    if (!confirm(`Are you sure you want to ${actionLabel} this published post?`)) {
      return;
    }

    try {
      setActionLoading(postId);
      const response = await fetch('/api/admin/published', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId, action }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || `Failed to ${actionLabel} post`);
      }

      // Refresh the list
      await fetchPublishedPosts();
      // Collapse if the post was expanded
      if (expandedPostId === postId) {
        setExpandedPostId(null);
        setExpandedPost(null);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : `Failed to ${actionLabel} post`);
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading published posts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error: {error}</p>
        <button
          onClick={fetchPublishedPosts}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Published Posts</h2>
        <button
          onClick={fetchPublishedPosts}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Refresh
        </button>
      </div>

      {posts.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-500">No published posts found.</p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title & Content
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Published
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Views
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {posts.map((post) => {
                  const isExpanded = expandedPostId === post._id;
                  const postData = isExpanded && expandedPost ? expandedPost : post;
                  const isSaving = savingField?.startsWith(post._id);
                  const postUrl = post.slug?.current ? `/posts/${post.slug.current}` : null;

                  return (
                    <React.Fragment key={post._id}>
                      <tr className={isExpanded ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                        <td className="px-6 py-4">
                          <div className="space-y-3">
                            <div className="text-sm font-medium">
                              <InlineEditableField
                                value={postData.title || ''}
                                onSave={(value) => handleSaveField(post._id, 'title', value)}
                                placeholder="Untitled"
                                className="font-medium text-gray-900"
                              />
                            </div>
                            <div className="text-sm">
                              <InlineEditableField
                                value={postData.excerpt || ''}
                                onSave={(value) => handleSaveField(post._id, 'excerpt', value)}
                                placeholder="Add excerpt..."
                                multiline
                                className="text-gray-500"
                              />
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <label className="text-xs text-gray-600 whitespace-nowrap">
                                  Categories
                                </label>
                                <InlineEditableField
                                  value=""
                                  onSave={async () => {}}
                                  tags={(postData.categories || []).filter((cat): cat is NonNullable<typeof cat> => cat != null)}
                                  availableTags={categories}
                                  onTagsChange={(newCategories) =>
                                    handleCategoriesChange(
                                      post._id,
                                      newCategories,
                                      (postData.tags || []).filter((tag): tag is NonNullable<typeof tag> => tag != null)
                                    )
                                  }
                                  onCreateTag={handleCreateCategory}
                                  placeholder="Add categories..."
                                  className="flex-1"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <label className="text-xs text-gray-600 whitespace-nowrap">
                                  Tags
                                </label>
                                <InlineEditableField
                                  value=""
                                  onSave={async () => {}}
                                  tags={(postData.tags || []).filter((tag): tag is NonNullable<typeof tag> => tag != null)}
                                  availableTags={tags}
                                  onTagsChange={(newTags) =>
                                    handleTagsChange(
                                      post._id,
                                      newTags,
                                      (postData.categories || []).filter((cat): cat is NonNullable<typeof cat> => cat != null)
                                    )
                                  }
                                  onCreateTag={handleCreateTag}
                                  placeholder="Add tags..."
                                  className="flex-1"
                                />
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {post.publishedAt
                            ? new Date(post.publishedAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })
                            : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {post.viewCount != null && typeof post.viewCount === 'number'
                            ? post.viewCount.toLocaleString()
                            : '0'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2 flex-wrap">
                            {postUrl && (
                              <a
                                href={postUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-900"
                              >
                                View
                              </a>
                            )}
                            <button
                              onClick={() => handleExpand(post._id)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              {isExpanded ? 'Collapse' : 'Edit'}
                            </button>
                            <button
                              onClick={() => handleAction(post._id, 'unpublish')}
                              disabled={actionLoading === post._id || isSaving}
                              className="text-orange-600 hover:text-orange-900 disabled:opacity-50"
                            >
                              {actionLoading === post._id ? 'Unpublishing...' : 'Unpublish'}
                            </button>
                            <button
                              onClick={() => handleAction(post._id, 'delete')}
                              disabled={actionLoading === post._id || isSaving}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            >
                              {actionLoading === post._id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && expandedPost && (
                        <tr>
                          <td colSpan={4} className="px-6 py-4 bg-gray-50">
                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  Edit Content
                                </h3>
                                {isSaving && (
                                  <span className="text-sm text-gray-500">Saving...</span>
                                )}
                              </div>
                              <RichTextEditor
                                initialContent={expandedPost.content || []}
                                onSave={(content) => handleSaveContent(post._id, content)}
                                onCancel={() => handleExpand(post._id)}
                                isSaving={savingField === `${post._id}-content`}
                              />
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
