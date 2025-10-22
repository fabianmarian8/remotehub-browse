/**
 * Instant Search Component
 * Provides search-as-you-type functionality with autocomplete suggestions
 */

import { useState, useRef, useEffect } from 'react';
import { Search, Loader2, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useSearchSuggestions } from '@/hooks/useAlgoliaSearch';
import { cn } from '@/lib/utils';

interface InstantSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
  showSuggestions?: boolean;
}

export function InstantSearch({
  value,
  onChange,
  onSearch,
  placeholder = 'Search jobs, companies, skills...',
  className,
  showSuggestions = true,
}: InstantSearchProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Get search suggestions
  const { suggestions, isLoading } = useSearchSuggestions(value);

  const showSuggestionsDropdown =
    showSuggestions &&
    isFocused &&
    value.length >= 2 &&
    suggestions.length > 0;

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestionsDropdown) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        } else if (onSearch) {
          onSearch(value);
        }
        break;
      case 'Escape':
        setIsFocused(false);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: string) => {
    onChange(suggestion);
    setIsFocused(false);
    setSelectedIndex(-1);
    if (onSearch) {
      onSearch(suggestion);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setSelectedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          className={cn(
            'pl-11 pr-11 h-12 text-base shadow-sm transition-all',
            isFocused && 'ring-2 ring-primary/20'
          )}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground animate-spin" />
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestionsDropdown && (
        <Card
          ref={suggestionsRef}
          className="absolute top-full mt-2 w-full z-50 shadow-lg border bg-background/95 backdrop-blur-sm"
        >
          <div className="py-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSelectSuggestion(suggestion)}
                className={cn(
                  'w-full px-4 py-2.5 text-left hover:bg-muted/50 transition-colors flex items-center gap-3',
                  selectedIndex === index && 'bg-muted/50'
                )}
              >
                <TrendingUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{suggestion}</span>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
