import { useState, useCallback } from 'react';
import { Search, X, FileText, Folder } from 'lucide-react';
import { searchSpace } from '../../api/spaces';
import { debounce } from '../../utils/helpers';
import LoadingSpinner from '../common/LoadingSpinner';

function SearchBar({ spaceId, onResultClick }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Debounced search
  const performSearch = useCallback(
    debounce(async (searchQuery) => {
      if (!searchQuery.trim() || !spaceId) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await searchSpace(spaceId, searchQuery);
        setResults(response.data || response || []);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      }
      setIsLoading(false);
    }, 300),
    [spaceId]
  );

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(true);
    performSearch(value);
  };

  const handleResultClick = (result) => {
    setIsOpen(false);
    setQuery('');
    if (onResultClick) onResultClick(result);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Search Input */}
      <div className="relative">
        <Search 
          size={18} 
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" 
        />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query && setIsOpen(true)}
          placeholder="Search pages..."
          className="
            w-full pl-10 pr-10 py-2.5
            bg-[var(--color-bg-secondary)]
            border border-[var(--color-border)]
            rounded-lg
            text-[var(--color-text-primary)]
            placeholder:text-[var(--color-text-muted)]
            focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]
            focus:border-transparent
            transition-all
          "
        />
        {query && (
          <button
            onClick={handleClear}
            className="
              absolute right-3 top-1/2 -translate-y-1/2
              text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]
            "
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && query && (
        <div className="
          absolute top-full left-0 right-0 mt-2
          bg-[var(--color-bg-primary)]
          border border-[var(--color-border)]
          rounded-lg shadow-xl
          max-h-80 overflow-auto
          z-50
        ">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="md" />
            </div>
          ) : results.length === 0 ? (
            <div className="py-8 text-center text-[var(--color-text-secondary)]">
              <Search size={32} className="mx-auto mb-2 opacity-50" />
              <p>No results found for "{query}"</p>
            </div>
          ) : (
            <div className="py-2">
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className="
                    w-full flex items-start gap-3 px-4 py-3
                    hover:bg-[var(--color-bg-secondary)]
                    text-left transition-colors
                  "
                >
                  <div className="
                    w-8 h-8 rounded-lg
                    bg-[var(--color-bg-secondary)]
                    flex items-center justify-center flex-shrink-0
                  ">
                    <FileText size={16} className="text-[var(--color-text-muted)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-[var(--color-text-primary)] truncate">
                      {result.title || 'Untitled'}
                    </h4>
                    {result.excerpt && (
                      <p className="
                        text-sm text-[var(--color-text-secondary)]
                        line-clamp-2 mt-0.5
                      ">
                        {result.excerpt}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)} 
        />
      )}
    </div>
  );
}

export default SearchBar;
