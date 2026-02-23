import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    FileText,
    ChevronRight,
    Menu,
    X,
    ExternalLink,
    Sparkles,
    Sun,
    Moon,
    Search,
} from "lucide-react";
import LoadingSpinner from "../components/common/LoadingSpinner";
import PageViewer from "../components/pages/PageViewer";
import TableOfContents from "../components/pages/TableOfContents";
import PublicSearchBar from "../components/pages/PublicSearchBar";
import client from "../api/client";
import { useTheme } from "../stores/ThemeContext";

// Recursive Tree Item
function PageTreeItem({ page, allPages, currentPageId, onSelect, depth = 0 }) {
    const [isExpanded, setIsExpanded] = useState(true);

    // Find children in the flat list
    const children = allPages
        .filter((p) => p.parent_id === page.id)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

    const hasChildren = children.length > 0;
    const isActive = page.id === currentPageId || page.slug === currentPageId;

    return (
        <div>
            <div
                className={`
          group flex items-center gap-2 px-3 py-1.5 rounded-lg
          transition-colors cursor-pointer select-none
          ${
              isActive
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]"
          }
        `}
                style={{ paddingLeft: `${12 + depth * 12}px` }}
                onClick={() => onSelect(page)}
            >
                {hasChildren ? (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsExpanded(!isExpanded);
                        }}
                        className="p-0.5 hover:bg-[var(--color-bg-hover)] rounded transition-colors"
                    >
                        <ChevronRight
                            size={12}
                            className={`transition-transform duration-200 text-[var(--color-text-secondary)] ${isExpanded ? "rotate-90" : ""}`}
                        />
                    </button>
                ) : (
                    <span className="w-4" />
                )}

                {page.icon && (
                    <span className="text-sm shrink-0">{page.icon}</span>
                )}
                {!page.icon && (
                    <FileText size={14} className="shrink-0 opacity-70" />
                )}

                <span className="truncate flex-1 text-sm font-medium">
                    {page.title || "Untitled"}
                </span>
            </div>

            {hasChildren && isExpanded && (
                <div className="mt-0.5">
                    {children.map((child) => (
                        <PageTreeItem
                            key={child.id}
                            page={child}
                            allPages={allPages}
                            currentPageId={currentPageId}
                            onSelect={onSelect}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function PublicSitePage() {
    const { siteSlug, pageSlug } = useParams();
    const navigate = useNavigate();

    const [site, setSite] = useState(null);
    const [pages, setPages] = useState([]); // Flat list of all published pages
    const [currentPage, setCurrentPage] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [error, setError] = useState(null);
    const [searchOpen, setSearchOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === "dark";

    useEffect(() => {
        fetchSiteAndPages();
    }, [siteSlug]);

    // Keyboard shortcut for search (Ctrl/Cmd + K)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault();
                setSearchOpen(true);
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Handle URL change for pageSlug
    useEffect(() => {
        if (pages.length > 0) {
            if (pageSlug) {
                // Find page by slug or ID
                const target = pages.find(
                    (p) => p.slug === pageSlug || p.id === pageSlug,
                );
                if (target) {
                    loadPageContent(target);
                } else {
                    // Page not found in valid pages list? Maybe try fetching ID directly if needed
                    // For now, redirect or show error
                }
            } else {
                // No slug, load first root page
                const firstRoot = pages
                    .filter((p) => !p.parent_id)
                    .sort((a, b) => (a.order || 0) - (b.order || 0))[0];
                if (firstRoot) {
                    loadPageContent(firstRoot);
                }
            }
        }
    }, [pageSlug, pages]);

    const fetchSiteAndPages = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // 1. Get Site & Flat Pages List
            const res = await client.get(`/public/sites/${siteSlug}`);
            const siteData = res.data.data;

            setSite(siteData);
            setPages(siteData.pages || []);
        } catch (err) {
            console.error(err);
            setError("This documentation is not available or private.");
        } finally {
            setIsLoading(false);
        }
    };

    const loadPageContent = async (page) => {
        if (currentPage?.id === page.id && currentPage.content) return; // Already loaded

        try {
            // 2. Get Full Page Content
            // Use slug or ID for URL. Route supports /pages/:pageId
            // Let's use ID to be safe
            const res = await client.get(
                `/public/sites/${siteSlug}/pages/${page.id}`,
            );
            const fullPage = res.data.data;
            setCurrentPage(fullPage);
        } catch (err) {
            console.error("Failed to load content", err);
        }
    };

    const handlePageSelect = (page) => {
        setSidebarOpen(false);
        // Update URL
        // Use slug if available, else ID
        navigate(`/public/${siteSlug}/${page.slug || page.id}`);
    };

    if (isLoading && !site) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-(--color-bg-primary) text-(--color-text-primary)">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-(--color-bg-primary) text-(--color-text-primary) p-4">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 mx-auto bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                        <span className="text-2xl">🔒</span>
                    </div>
                    <h2 className="text-xl font-bold mb-2">Access Denied</h2>
                    <p className="text-(--color-text-secondary) mb-6">
                        {error}
                    </p>
                    <a
                        href="/"
                        className="px-4 py-2 bg-emerald-600 border border-emerald-500/30 text-white rounded-lg hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-500/20"
                    >
                        Go Home
                    </a>
                </div>
            </div>
        );
    }

    // Navigation Logic
    const currentIndex = pages.findIndex((p) => p.id === currentPage?.id);
    const prevPage = currentIndex > 0 ? pages[currentIndex - 1] : null;
    const nextPage =
        currentIndex < pages.length - 1 ? pages[currentIndex + 1] : null;

    // Root pages for sidebar
    const rootPages = pages
        .filter((p) => !p.parent_id)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

    return (
        <div className="min-h-screen bg-(--color-bg-primary) flex flex-col text-(--color-text-primary)">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-(--color-bg-primary)/80 backdrop-blur-md border-b border-(--color-border-primary) h-14">
                <div className="h-full px-4 max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            className="lg:hidden p-2 -ml-2 text-(--color-text-secondary) hover:text-(--color-text-primary)"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu size={20} />
                        </button>

                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                {site?.logo_url ? (
                                    <img
                                        src={site.logo_url}
                                        alt=""
                                        className="w-full h-full object-cover rounded-lg"
                                    />
                                ) : (
                                    <Sparkles
                                        size={16}
                                        className="text-white"
                                    />
                                )}
                            </div>
                            <div>
                                <h1 className="text-sm font-bold text-(--color-text-primary) leading-tight">
                                    {site?.name}
                                </h1>
                                <p className="text-[10px] text-emerald-500 font-semibold uppercase tracking-wider">
                                    Docs
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Search Button */}
                        <button
                            onClick={() => setSearchOpen(true)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-(--color-bg-secondary) border border-(--color-border-primary) text-(--color-text-muted) hover:text-(--color-text-primary) hover:border-emerald-500/50 transition-all text-xs font-medium"
                            title="Search documentation (Ctrl+K)"
                        >
                            <Search size={14} />
                            <span className="hidden sm:inline">Search...</span>
                            <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-(--color-border-primary) bg-(--color-bg-primary) px-1.5 font-mono text-[10px] font-medium text-(--color-text-muted)">
                                <span className="text-xs">⌘</span>K
                            </kbd>
                        </button>

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg text-(--color-text-secondary) hover:bg-(--color-bg-hover) hover:text-(--color-text-primary) transition-all"
                            title={
                                isDark
                                    ? "Switch to light mode"
                                    : "Switch to dark mode"
                            }
                        >
                            {isDark ? <Sun size={18} /> : <Moon size={18} />}
                        </button>

                        <a
                            href="/"
                            className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-(--color-text-muted) hover:text-(--color-accent) transition-colors"
                        >
                            Created with E-Docs <ExternalLink size={10} />
                        </a>
                    </div>
                </div>
            </header>

            <div className="flex flex-1 max-w-7xl mx-auto w-full">
                {/* Sidebar */}
                <aside
                    className={`
          fixed lg:sticky top-14 left-0 z-30
          h-[calc(100vh-3.5rem)] w-72 
          bg-(--color-bg-primary) lg:bg-transparent border-r border-(--color-border-primary) lg:border-0
          overflow-y-auto transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
                >
                    <div className="p-4 space-y-1">
                        {rootPages.length === 0 ? (
                            <p className="text-xs text-(--color-text-muted) text-center py-4">
                                No content yet.
                            </p>
                        ) : (
                            rootPages.map((page) => (
                                <PageTreeItem
                                    key={page.id}
                                    page={page}
                                    allPages={pages}
                                    currentPageId={currentPage?.id}
                                    onSelect={handlePageSelect}
                                />
                            ))
                        )}
                    </div>

                    {/* Mobile Overlay Closure Button */}
                    <button
                        className="absolute top-4 right-4 lg:hidden text-(--color-text-muted) hover:text-(--color-text-primary) transition-colors"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X size={20} />
                    </button>
                </aside>

                {/* Mobile Backdrop */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/60 z-20 lg:hidden backdrop-blur-sm"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Content */}
                <main className="flex-1 min-w-0">
                    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-10">
                        <div className="flex-1 max-w-3xl mx-auto px-6 py-10">
                            {currentPage ? (
                                <article className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                    <header className="mb-10 pb-10 border-b border-(--color-border-primary)">
                                        <h1 className="text-3xl md:text-5xl font-extrabold text-(--color-text-primary) mb-4 tracking-tight">
                                            {currentPage.title ||
                                                "Untitled Page"}
                                        </h1>
                                        {currentPage.updated_at && (
                                            <time className="text-xs text-(--color-text-muted) uppercase tracking-widest font-bold">
                                                Last updated{" "}
                                                {new Date(
                                                    currentPage.updated_at,
                                                ).toLocaleDateString()}
                                            </time>
                                        )}
                                    </header>

                                    <div>
                                        <PageViewer
                                            content={currentPage.content}
                                        />
                                    </div>

                                    {/* Next/Prev Navigation */}
                                    <div className="mt-16 pt-10 border-t border-(--color-border-primary) flex flex-col sm:flex-row gap-6">
                                        {prevPage && (
                                            <button
                                                onClick={() =>
                                                    handlePageSelect(prevPage)
                                                }
                                                className="flex-1 flex flex-col p-6 rounded-2xl border border-(--color-border-primary) hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group"
                                            >
                                                <span className="text-[10px] uppercase tracking-widest text-(--color-text-muted) mb-2 font-bold">
                                                    Previous
                                                </span>
                                                <span className="text-sm font-bold text-(--color-text-secondary) group-hover:text-emerald-500 flex items-center gap-2">
                                                    <ChevronRight
                                                        size={16}
                                                        className="rotate-180"
                                                    />
                                                    {prevPage.title}
                                                </span>
                                            </button>
                                        )}
                                        {nextPage && (
                                            <button
                                                onClick={() =>
                                                    handlePageSelect(nextPage)
                                                }
                                                className="flex-1 flex flex-col p-6 rounded-2xl border border-(--color-border-primary) hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-right group ml-auto"
                                            >
                                                <span className="text-[10px] uppercase tracking-widest text-(--color-text-muted) mb-2 font-bold">
                                                    Next
                                                </span>
                                                <span className="text-sm font-bold text-(--color-text-secondary) group-hover:text-emerald-500 flex items-center justify-end gap-2">
                                                    {nextPage.title}
                                                    <ChevronRight size={16} />
                                                </span>
                                            </button>
                                        )}
                                    </div>
                                </article>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-24 text-center">
                                    <div className="w-20 h-20 bg-(--color-bg-secondary) border border-(--color-border-primary) rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                                        <FileText
                                            size={32}
                                            className="text-(--color-text-muted)"
                                        />
                                    </div>
                                    <h3 className="text-xl font-bold text-(--color-text-primary)">
                                        Select a page
                                    </h3>
                                    <p className="text-(--color-text-secondary) text-sm mt-2">
                                        Navigate using the sidebar to view
                                        content.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Right Sidebar - Info/ToC */}
                        <aside className="hidden xl:block w-64 pt-10 pr-6">
                            <div className="sticky top-24">
                                <TableOfContents
                                    content={currentPage?.content}
                                />
                            </div>
                        </aside>
                    </div>
                </main>
            </div>

            {/* Search Bar */}
            <PublicSearchBar
                siteSlug={siteSlug}
                isOpen={searchOpen}
                onClose={() => setSearchOpen(false)}
            />
        </div>
    );
}
