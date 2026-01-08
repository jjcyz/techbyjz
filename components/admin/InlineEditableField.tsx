'use client';

import { useState, useRef, useEffect, useMemo } from 'react';

interface Tag {
  _id: string;
  title: string;
}

interface InlineEditableFieldProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
  // Tags mode props
  tags?: Tag[];
  availableTags?: Tag[];
  onTagsChange?: (tags: Tag[]) => Promise<void>;
  onCreateTag?: (title: string) => Promise<Tag>;
}

export default function InlineEditableField({
  value,
  onSave,
  placeholder = 'Click to edit',
  multiline = false,
  className = '',
  tags,
  availableTags = [],
  onTagsChange,
  onCreateTag,
}: InlineEditableFieldProps) {
  const isTagsMode = tags !== undefined && onTagsChange !== undefined;
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<Tag[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement && !isTagsMode) {
        inputRef.current.select();
      }
    }
  }, [isEditing, isTagsMode]);

  // Calculate dropdown position for tags mode
  useEffect(() => {
    if (isTagsMode && isEditing && inputRef.current && containerRef.current) {
      const updatePosition = () => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          setDropdownPosition({
            top: rect.bottom + window.scrollY + 2,
            left: rect.left + window.scrollX,
            width: rect.width,
          });
        }
      };
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isTagsMode, isEditing, isOpen]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  // Memoize tag IDs to prevent unnecessary recalculations
  const tagIds = useMemo(() => new Set(tags?.map(t => t._id) || []), [tags]);

  // Create stable key for availableTags to detect actual content changes
  const availableTagsKey = useMemo(
    () => availableTags.map(t => `${t._id}:${t.title}`).join('|'),
    [availableTags]
  );

  // Memoize filtered options - only recalculate when input or tag data actually changes
  const memoizedFilteredOptions = useMemo(() => {
    if (!isTagsMode || !inputValue.trim()) {
      return [];
    }
    const inputLower = inputValue.toLowerCase();
    return availableTags.filter(
      (tag) =>
        !tagIds.has(tag._id) &&
        tag.title.toLowerCase().includes(inputLower)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue, availableTagsKey, tagIds, isTagsMode]);

  // Tags mode: update filtered options and dropdown state
  // Only update when the filtered results actually change
  useEffect(() => {
    if (isTagsMode && inputValue.trim()) {
      setFilteredOptions(memoizedFilteredOptions);
      setIsOpen(memoizedFilteredOptions.length > 0 || inputValue.trim() !== '');
    } else {
      setFilteredOptions([]);
      setIsOpen(false);
    }
  }, [inputValue, memoizedFilteredOptions, isTagsMode]);

  // Tags mode: handle click outside
  useEffect(() => {
    if (!isTagsMode || !isEditing) return;

    const handleClickOutside = (event: MouseEvent) => {
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
  }, [isTagsMode, isEditing]);

  const handleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = async () => {
    if (isTagsMode) {
      setIsEditing(false);
      setInputValue('');
      return;
    }

    if (editValue !== value) {
      setIsSaving(true);
      try {
        await onSave(editValue);
      } catch (error) {
        console.error('Failed to save:', error);
        setEditValue(value); // Revert on error
      } finally {
        setIsSaving(false);
      }
    }
    setIsEditing(false);
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (isTagsMode) {
      if (e.key === 'Enter' && inputValue.trim()) {
        e.preventDefault();
        await handleAddTag(inputValue.trim());
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        setIsEditing(false);
        setInputValue('');
      } else if (e.key === 'Backspace' && !inputValue && tags && tags.length > 0) {
        const newTags = tags.slice(0, -1);
        await onTagsChange?.(newTags);
      }
      return;
    }

    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      await handleBlur();
    } else if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  const handleAddTag = async (tagTitle: string) => {
    if (!tagTitle.trim() || !onTagsChange || !tags) return;

    const existingTag = availableTags.find(
      (tag) => tag.title.toLowerCase() === tagTitle.toLowerCase()
    );

    let tagToAdd: Tag;

    if (existingTag) {
      tagToAdd = existingTag;
    } else {
      if (!onCreateTag) return;
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

    if (!tags.some((t) => t._id === tagToAdd._id)) {
      await onTagsChange([...tags, tagToAdd]);
    }

    setInputValue('');
    setIsOpen(false);
    if (inputRef.current instanceof HTMLInputElement) {
      inputRef.current.focus();
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    if (!onTagsChange || !tags) return;
    const newTags = tags.filter((t) => t._id !== tagId);
    await onTagsChange(newTags);
  };

  const handleSelectOption = async (tag: Tag) => {
    await handleAddTag(tag.title);
  };

  // Tags mode rendering
  if (isTagsMode) {
    if (isEditing) {
      return (
        <div ref={containerRef} className="relative">
          <div className="flex flex-wrap gap-1 items-center px-1.5 py-0.5 border border-blue-500 rounded bg-white focus-within:ring-2 focus-within:ring-blue-500">
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
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
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

          {isOpen && (filteredOptions.length > 0 || inputValue.trim()) && (
            <div
              className="fixed z-50 bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-auto"
              style={{
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
                width: `${dropdownPosition.width}px`,
              }}
            >
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
                inputValue.trim() && onCreateTag && (
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

    return (
      <div
        onClick={handleClick}
        className={`flex flex-wrap gap-1 items-center cursor-pointer py-0.5 min-h-[20px] hover:bg-gray-50 rounded transition-colors ${className}`}
        title="Click to edit"
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
    );
  }

  // Regular text mode rendering
  if (isEditing) {
    if (multiline) {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
          rows={3}
          placeholder={placeholder}
        />
      );
    }
    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
        placeholder={placeholder}
        disabled={isSaving}
      />
    );
  }

  return (
    <div
      onClick={handleClick}
      className={`cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors ${isSaving ? 'opacity-50' : ''} ${className}`}
      title="Click to edit"
    >
      {value || <span className="text-gray-400 italic">{placeholder}</span>}
    </div>
  );
}
