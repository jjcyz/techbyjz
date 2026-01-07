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
  const [isEditing, setIsEditing] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<Tag[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const justEnteredEditModeRef = useRef(false);

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
    if (!isEditing && !isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      // Don't close if we just entered edit mode
      if (justEnteredEditModeRef.current) {
        justEnteredEditModeRef.current = false;
        return;
      }

      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setIsEditing(false);
        setInputValue('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditing, isOpen]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      await handleAddTag(inputValue.trim());
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setIsEditing(false);
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
    // Keep editing mode open so user can add more tags
    inputRef.current?.focus();
  };

  const handleRemoveTag = async (tagId: string) => {
    const newTags = tags.filter((t) => t._id !== tagId);
    await onTagsChange(newTags);
  };

  const handleSelectOption = async (tag: Tag) => {
    await handleAddTag(tag.title);
  };

  const handleClick = () => {
    justEnteredEditModeRef.current = true;
    setIsEditing(true);
  };

  return (
    <div ref={containerRef} className="relative">
      {!isEditing ? (
        // Display mode: show only pins
        <div
          onClick={handleClick}
          className="flex flex-wrap gap-1 items-center cursor-pointer py-0.5 min-h-[20px] hover:bg-gray-50 rounded transition-colors"
        >
          {tags.length > 0 ? (
            tags.map((tag) => (
              <span
                key={tag._id}
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-xs"
              >
                {tag.title}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveTag(tag._id);
                  }}
                  className="hover:text-blue-900 focus:outline-none ml-0.5"
                  aria-label={`Remove ${tag.title}`}
                >
                  ×
                </button>
              </span>
            ))
          ) : (
            <span className="text-xs text-gray-400 italic">{placeholder}</span>
          )}
        </div>
      ) : (
        // Editing mode: show pins + input field
        <div className="flex flex-wrap gap-1 items-center px-1.5 py-0.5 border border-gray-300 rounded bg-white focus-within:border-blue-500">
          {tags.map((tag) => (
            <span
              key={tag._id}
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-xs"
            >
              {tag.title}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag._id)}
                className="hover:text-blue-900 focus:outline-none ml-0.5"
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
            placeholder={placeholder}
            className="flex-1 min-w-[80px] outline-none text-xs py-0.5"
            disabled={isCreating}
          />
          {isCreating && (
            <span className="text-xs text-gray-500">Creating...</span>
          )}
        </div>
      )}

      {isOpen && (filteredOptions.length > 0 || inputValue.trim()) && (
        <div className="absolute z-10 w-full mt-0.5 bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-auto">
          {filteredOptions.length > 0 ? (
            <ul className="py-0.5">
              {filteredOptions.map((tag) => (
                <li
                  key={tag._id}
                  onClick={() => handleSelectOption(tag)}
                  className="px-2 py-1 hover:bg-gray-100 cursor-pointer text-xs"
                >
                  {tag.title}
                </li>
              ))}
            </ul>
          ) : (
            inputValue.trim() && (
              <div
                onClick={() => handleAddTag(inputValue.trim())}
                className="px-2 py-1 hover:bg-gray-100 cursor-pointer text-xs text-blue-600"
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

