import React, { useState } from 'react';
import { X, Tag } from 'lucide-react';
import './TagInput.css';

const TagInput = ({ tags, setTags, availableTags = ['security', 'python', 'react', 'django', 'linux', 'network', 'osint', 'tools'] }) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue.trim());
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const addTag = (tag) => {
    const normalizedTag = tag.toLowerCase().replace(/[^a-z0-9-_]/g, '');
    if (normalizedTag && !tags.includes(normalizedTag) && tags.length < 5) {
      setTags([...tags, normalizedTag]);
    }
    setInputValue('');
    setShowSuggestions(false);
  };

  const removeTag = (index) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const filteredSuggestions = availableTags.filter(
    tag => !tags.includes(tag) && tag.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div className="tag-input-container">
      <div className="tag-input-label">
        <Tag size={14} />
        <span>Tags</span>
      </div>
      <div className="tags-display">
        {tags.map((tag, index) => (
          <span key={index} className="tag">
            {tag}
            <button onClick={() => removeTag(index)} className="tag-remove">
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <div className="tag-input-wrapper">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={tags.length === 0 ? "Add tags..." : ""}
          className="tag-input-field"
        />
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="tag-suggestions">
            {filteredSuggestions.slice(0, 5).map((suggestion, index) => (
              <button
                key={index}
                className="tag-suggestion"
                onClick={() => addTag(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TagInput;

