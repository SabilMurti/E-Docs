import { useState, useRef, useEffect } from "react";
import { Search, X, FileText } from "lucide-react";
import client from "../../api/client";

export default function PublicSearchBar({ siteIdentifier, isOpen, onClose }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const inputRef = useRef(null);
    const debounceRef = useRef(null);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Close on Escape
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === "Escape") {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
            return () => document.removeEventListener("keydown", handleEscape);
        }
    }, [isOpen, onClose]);

    // Debounced search
    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        if (query.trim().length === 0) {
            setResults([]);
            setHasSearched(false);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            setIsLoading(true);
            setHasSearched(true);

            try {
                const response = await client.get(
                    `/public/sites/${siteIdentifier}/search?q=${encodeURIComponent(query)}`
                );
                setResults(response.data.data || []);
            } catch (error) {
                console.error("Search error:", error);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [query, siteIdentifier]);

    const handleResultClick = (result) => {
        onClose();
        setQuery("");
        setResults([]);
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
                onClick={onClose}
            />

            {/* Search Panel */}
            <div
                className={`
          fixed top-0 left-0 right-0 z-50
          bg-(--color-bg-primary) border-b border-(--color-border-primary)
          shadow-2xl transform transition-transform duration-200 ease-in-out
          ${isOpen ? "translate-y-0" : "-translate-y-full"}
        `}
            >
                <div className="max-w-4xl mx-auto px-4 py-4">
                    {/* Search Input */}
                    <div className="relative">
                        <Search
                            size={20}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-(--color-text-muted)"
                        />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search documentation..."
                            className="w-full pl-12 pr-12 py-3 rounded-xl bg-(--color-bg-secondary) border border-(--color-border-primary) text-(--color-text-primary) placeholder-(--color-text-muted) focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                        />
                        {query && (
                            <button
                                onClick={() => setQuery("")}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-(--color-bg-hover) rounded-full transition-colors text-(--color-text-muted)"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Results */}
                    <div className="mt-4 max-h-[60vh] overflow-y-auto">
                        {isLoading && (
                            <div className="text-center py-8 text-(--color-text-muted)">
                                <div className="inline-block w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                <p className="mt-2 text-sm">Searching...</p>
                            </div>
                        )}

                        {!isLoading && hasSearched && results.length === 0 && (
                            <div className="text-center py-8 text-(--color-text-muted)">
                                <FileText
                                    size={48}
                                    className="mx-auto mb-3 opacity-30"
                                />
                                <p className="text-sm">
                                    No results found for "{query}"
                                </p>
                            </div>
                        )}

                        {!isLoading && results.length > 0 && (
                            <div className="space-y-2">
                                <div className="text-xs text-(--color-text-muted) uppercase tracking-widest font-bold mb-3">
                                    {results.length} Result
                                    {results.length !== 1 ? "s" : ""} Found
                                </div>
                                {results.map((result) => (
                                    <a
                                        key={result.id}
                                        href={result.url}
                                        onClick={() =>
                                            handleResultClick(result)
                                        }
                                        className="block p-4 rounded-xl bg-(--color-bg-secondary) border border-(--color-border-primary) hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group"
                                    >
                                        <div className="flex items-start gap-3">
                                            <FileText
                                                size={18}
                                                className="mt-0.5 text-(--color-text-muted) group-hover:text-emerald-500 transition-colors"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-bold text-(--color-text-primary) group-hover:text-emerald-500 transition-colors">
                                                    {result.title}
                                                </h3>
                                                {result.excerpt && (
                                                    <p className="text-xs text-(--color-text-secondary) mt-1 line-clamp-2">
                                                        {result.excerpt}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        )}

                        {!isLoading && !hasSearched && (
                            <div className="text-center py-8 text-(--color-text-muted)">
                                <Search
                                    size={48}
                                    className="mx-auto mb-3 opacity-30"
                                />
                                <p className="text-sm">
                                    Type to search documentation
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
