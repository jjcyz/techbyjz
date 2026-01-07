'use client';

import { useState, useRef, useEffect } from 'react';

interface Tag {
  _id: string;
  title: string;
}

interface TagInputProps {
  tags: Tag[];
  availableTags: Tag[];
  onTagsChange: (tags: Tag[]) => Promise<void>;
  onCreateTag: (title: string) => Promise<Tag>;
  placeholder?: string;
}

export default function TagInput({
  tags,
  availableTags,
  onTagsChange,
  onCreateTag,
  placeholder = 'Add tags...',
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<Tag[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (inputValue.trim()) {
      const filtered = availableTags.filter(
        (tag) =>
          !tags.some((t) => t._id === tag._id) &&
          tag.title.toLowerCase().includes(inputValue.toLowerCase())
      );
      setFilteredOptions(filtered);
      setIsOpen(true);
    } else {
      setFilteredOptions([]);
      setIsOpen(false);
    }
  }, [inputValue, availableTags, tags]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      await handleAddTag(inputValue.trim());
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setInputValue('');
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      // Remove last tag on backspace when input is empty
      const newTags = tags.slice(0, -1);
      await onTagsChange(newTags);
    }
  };

  const handleAddTag = async (tagTitle: string) => {
    if (!tagTitle.trim()) return;

    // Check if tag already exists in available tags
    const existingTag = availableTags.find(
      (tag) => tag.title.toLowerCase() === tagTitle.toLowerCase()
    );

    let tagToAdd: Tag;

    if (existingTag) {
      tagToAdd = existingTag;
    } else {
      // Create new tag
      setIsCreating(true);
      try {
        tagToAdd = await onCreateTag(tagTitle);
      } catch (error) {
        console.error('Failed to create tag:', error);
        setIsCreating(false);
        return;
      } finally {
        setIsCreating(false);
      }
    }

    // Add tag if not already in list
    if (!tags.some((t) => t._id === tagToAdd._id)) {
      await onTagsChange([...tags, tagToAdd]);
    }

    setInputValue('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleRemoveTag = async (tagId: string) => {
    const newTags = tags.filter((t) => t._id !== tagId);
    await onTagsChange(newTags);
  };

  const handleSelectOption = async (tag: Tag) => {
    await handleAddTag(tag.title);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex flex-wrap gap-2 items-center min-h-10 px-2 py-1 border border-gray-300 rounded-md bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500">
        {tags.map((tag) => (
          <span
            key={tag._id}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-sm"
          >
            {tag.title}
            <button
              type="button"
              onClick={() => handleRemoveTag(tag._id)}
              className="hover:text-blue-900 focus:outline-none"
              aria-label={`Remove ${tag.title}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onFocus={() => {
            if (inputValue.trim()) {
              setIsOpen(true);
            }
          }}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] outline-none text-sm"
          disabled={isCreating}
        />
        {isCreating && (
          <span className="text-sm text-gray-500">Creating...</span>
        )}
      </div>

      {isOpen && (filteredOptions.length > 0 || inputValue.trim()) && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredOptions.length > 0 ? (
            <ul className="py-1">
              {filteredOptions.map((tag) => (
                <li
                  key={tag._id}
                  onClick={() => handleSelectOption(tag)}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                >
                  {tag.title}
                </li>
              ))}
            </ul>
          ) : (
            inputValue.trim() && (
              <div
                onClick={() => handleAddTag(inputValue.trim())}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm text-blue-600"
              >
                + Create &quot;{inputValue.trim()}&quot;
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

