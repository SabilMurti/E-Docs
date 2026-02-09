import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, FileText, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { debounce } from 'lodash';
import api from '../../api/axios';

function SearchBar({ siteId, onResultClick }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  // Create debounced search function with useMemo
  const performSearch = useMemo(
    () =>
      debounce(async (searchQuery, currentSiteId) => {
        if (!searchQuery.trim() || !currentSiteId) {
          setResults([]);
          return;
        }

        setIsLoading(true);
        try {
          const response = await api.get(`/sites/${currentSiteId}/search`, {
            params: { q: searchQuery }
          });
          setResults(response.data.data || []);
        } catch (error) {
          console.error('Search error:', error);
          setResults([]);
        } finally {
          setIsLoading(false);
        }
      }, 300),
    []
  );

  useEffect(() => {
    performSearch(query, siteId);
    return () => performSearch.cancel();
  }, [query, siteId, performSearch]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResultClick = (result) => {
    setQuery('');
    setResults([]);
    setIsFocused(false);
    if (onResultClick) {
      onResultClick(result);
    } else {
      navigate(`/sites/${siteId}/pages/${result.id}`);
    }
  };

  const showResults = isFocused && (query.trim() || results.length > 0);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input */}
      <div className="relative">
        <Search 
          size={14} 
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" 
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="Search pages..."
          className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg py-1.5 pl-9 pr-8 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)]/50 transition-colors"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)]"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)] rounded-lg shadow-lg overflow-hidden z-50">
          {isLoading ? (
            <div className="px-3 py-4 text-center text-sm text-[var(--color-text-muted)]">
              Searching...
            </div>
          ) : results.length > 0 ? (
            <div className="max-h-64 overflow-y-auto py-1">
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[var(--color-bg-hover)] transition-colors"
                >
                  <FileText size={14} className="text-[var(--color-text-muted)] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--color-text-primary)] truncate">
                      {result.title}
                    </p>
                    {result.snippet && (
                      <p className="text-xs text-[var(--color-text-muted)] truncate">
                        {result.snippet}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : query.trim() ? (
            <div className="px-3 py-4 text-center text-sm text-[var(--color-text-muted)]">
              No results found
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
