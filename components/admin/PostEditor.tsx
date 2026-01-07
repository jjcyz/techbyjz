'use client';

import { useState } from 'react';
import RichTextEditor from '@/components/posts/RichTextEditor';
import type { PortableTextContent } from '@/components/posts/RichTextEditor/types';
import type { Category, Tag } from '@/types/post';

interface PostEditorProps {
  postId: string;
  initialTitle?: string;
  initialExcerpt?: string;
  initialContent?: PortableTextContent[];
  initialCategories?: Array<{ _id: string; title: string }>;
  initialTags?: Array<{ _id: string; title: string }>;
  availableCategories: Category[];
  availableTags: Tag[];
  onSave?: () => void;
  onCancel?: () => void;
}

export default function PostEditor({
  postId,
  initialTitle = '',
  initialExcerpt = '',
  initialContent = [],
  initialCategories = [],
  initialTags = [],
  availableCategories,
  availableTags,
  onSave,
  onCancel,
}: PostEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [excerpt, setExcerpt] = useState(initialExcerpt);
  const [content, setContent] = useState<PortableTextContent[]>(initialContent);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    initialCategories.map(cat => cat._id)
  );
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    initialTags.map(tag => tag._id)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (savedContent: PortableTextContent[]) => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          excerpt,
          content: savedContent,
          categoryIds: selectedCategoryIds,
          tagIds: selectedTagIds,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to save post');
      }

      setContent(savedContent);
      if (onSave) {
        onSave();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save post');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Post title"
        />
      </div>

      {/* Excerpt */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Excerpt
        </label>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Short description of the post"
        />
      </div>

      {/* Categories */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Categories
        </label>
        <div className="flex flex-wrap gap-2">
          {availableCategories.map((category) => (
            <label
              key={category._id}
              className="flex items-center px-3 py-1 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={selectedCategoryIds.includes(category._id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedCategoryIds([...selectedCategoryIds, category._id]);
                  } else {
                    setSelectedCategoryIds(selectedCategoryIds.filter(id => id !== category._id));
                  }
                }}
                className="mr-2"
              />
              <span className="text-sm">{category.title}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tags
        </label>
        <div className="flex flex-wrap gap-2">
          {availableTags.map((tag) => (
            <label
              key={tag._id}
              className="flex items-center px-3 py-1 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={selectedTagIds.includes(tag._id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedTagIds([...selectedTagIds, tag._id]);
                  } else {
                    setSelectedTagIds(selectedTagIds.filter(id => id !== tag._id));
                  }
                }}
                className="mr-2"
              />
              <span className="text-sm">{tag.title}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Content Editor */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Content
        </label>
        <RichTextEditor
          initialContent={content}
          onSave={handleSave}
          onCancel={handleCancel}
          isSaving={isSaving}
        />
      </div>
    </div>
  );
}

