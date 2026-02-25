import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    FileText,
    ChevronRight,
    Menu,
    X,
    ExternalLink,
    Sun,
    Moon,
    Search,
    BookOpen,
    ThumbsUp,
    ThumbsDown,
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

    const children = allPages
        .filter((p) => p.parent_id === page.id)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

    const hasChildren = children.length > 0;
    const isActive = page.id === currentPageId || page.slug === currentPageId;

    return (
        <div>
            <div
                className="group relative flex items-center gap-1.5 py-[7px] rounded-md cursor-pointer select-none text-sm"
                style={{
                    paddingLeft: `${10 + depth * 14}px`,
                    paddingRight: '8px',
                    // Smooth color + scale transition
                    transition: 'background 180ms ease, color 180ms ease',
                    color: isActive ? 'var(--sidebar-active-text)' : 'var(--public-text-muted)',
                    fontWeight: isActive ? '500' : '400',
                    background: isActive
                        ? 'linear-gradient(90deg, rgba(16,185,129,0.12) 0%, rgba(16,185,129,0.04) 100%)'
                        : 'transparent',
                }}
                onClick={() => onSelect(page)}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = 'var(--public-text-primary)'; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = 'var(--public-text-muted)'; }}
            >
                {/* Animated left accent bar */}
                <span
                    className="absolute left-0 top-1 bottom-1 rounded-full"
                    style={{
                        width: isActive ? '3px' : '0px',
                        backgroundColor: '#10b981',
                        boxShadow: isActive ? '0 0 6px rgba(16,185,129,0.6)' : 'none',
                        transition: 'width 200ms ease, box-shadow 200ms ease',
                    }}
                />

                {/* Expand/collapse chevron */}
                {hasChildren ? (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsExpanded(!isExpanded);
                        }}
                        className="p-0.5 rounded shrink-0"
                        style={{ color: isActive ? '#10b981' : 'var(--public-text-muted)' }}
                    >
                        <ChevronRight
                            size={13}
                            style={{
                                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                transition: 'transform 200ms ease',
                                display: 'block',
                            }}
                        />
                    </button>
                ) : (
                    <span className="w-[21px] shrink-0" />
                )}

                {/* Icon - scales up when active */}
                {page.icon ? (
                    <span
                        className="text-sm shrink-0 leading-none"
                        style={{
                            transform: isActive ? 'scale(1.2)' : 'scale(1)',
                            transition: 'transform 200ms ease',
                            display: 'inline-block',
                        }}
                    >
                        {page.icon}
                    </span>
                ) : (
                    <FileText
                        size={13}
                        className="shrink-0"
                        style={{
                            color: isActive ? '#10b981' : 'var(--public-text-muted)',
                            transform: isActive ? 'scale(1.1)' : 'scale(1)',
                            transition: 'transform 200ms ease, color 180ms ease',
                        }}
                    />
                )}

                <span className="truncate flex-1">{page.title || 'Untitled'}</span>

                {/* Pulsing dot for active item */}
                {isActive && (
                    <span className="relative shrink-0 w-1.5 h-1.5 mr-0.5">
                        <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-60" />
                        <span className="relative block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    </span>
                )}
            </div>

            {/* Children */}
            {hasChildren && isExpanded && (
                <div style={{ marginTop: '1px' }}>
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

// Page Feedback Component - "Was this page helpful?"
function PageFeedback() {
    const [voted, setVoted] = useState(null);

    if (voted) {
        return (
            <div className="mt-14 pt-8 border-t text-center" style={{ borderColor: 'var(--public-border)' }}>
                <p className="text-sm font-medium" style={{ color: 'var(--public-text-secondary)' }}>
                    {voted === 'up' ? '🎉 Thanks for the feedback!' : '🙏 Thanks, we\'ll improve this page.'}
                </p>
            </div>
        );
    }

    return (
        <div className="mt-14 pt-8 border-t" style={{ borderColor: 'var(--public-border)' }}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm font-medium" style={{ color: 'var(--public-text-secondary)' }}>
                    Was this page helpful?
                </p>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setVoted('up')}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150"
                        style={{
                            border: '1px solid var(--public-border)',
                            backgroundColor: 'var(--public-card-bg)',
                            color: 'var(--public-text-secondary)',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#10b981';
                            e.currentTarget.style.color = '#10b981';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--public-border)';
                            e.currentTarget.style.color = 'var(--public-text-secondary)';
                        }}
                    >
                        <ThumbsUp size={14} />
                        Yes
                    </button>
                    <button
                        onClick={() => setVoted('down')}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150"
                        style={{
                            border: '1px solid var(--public-border)',
                            backgroundColor: 'var(--public-card-bg)',
                            color: 'var(--public-text-secondary)',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#ef4444';
                            e.currentTarget.style.color = '#ef4444';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--public-border)';
                            e.currentTarget.style.color = 'var(--public-text-secondary)';
                        }}
                    >
                        <ThumbsDown size={14} />
                        No
                    </button>
                </div>
            </div>
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

    // Build breadcrumb path for current page
    const buildBreadcrumb = (page) => {
        if (!page) return [];
        const crumbs = [];
        let current = page;
        while (current) {
            crumbs.unshift(current);
            current = current.parent_id
                ? pages.find((p) => p.id === current.parent_id)
                : null;
        }
        return crumbs;
    };
    const breadcrumbs = buildBreadcrumb(currentPage);

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--public-bg)' }}>
            {/* Header - GitBook style */}
            <header
                className="sticky top-0 z-40 h-14"
                style={{
                    backgroundColor: 'var(--public-header-bg)',
                    borderBottom: '1px solid var(--public-border)',
                    backdropFilter: 'blur(12px)',
                }}
            >
                <div className="h-full px-4 max-w-[1400px] mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            className="lg:hidden p-2 -ml-2 rounded-md transition-colors"
                            style={{ color: 'var(--public-text-muted)' }}
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu size={19} />
                        </button>

                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
                                {site?.logo_url ? (
                                    <img src={site.logo_url} alt="" className="w-full h-full object-cover rounded-lg" />
                                ) : (
                                    <BookOpen size={14} className="text-white" />
                                )}
                            </div>
                            <div>
                                <h1 className="text-sm font-semibold leading-tight" style={{ color: 'var(--public-text-primary)' }}>
                                    {site?.name}
                                </h1>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        {/* Search Button */}
                        <button
                            onClick={() => setSearchOpen(true)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                            style={{
                                color: 'var(--public-text-muted)',
                                backgroundColor: 'var(--public-input-bg)',
                                border: '1px solid var(--public-border)',
                            }}
                            title="Search documentation (Ctrl+K)"
                        >
                            <Search size={13} />
                            <span className="hidden sm:inline">Search...</span>
                            <kbd className="hidden sm:inline-flex h-4 items-center gap-0.5 rounded px-1.5 font-mono text-[10px]"
                                 style={{ border: '1px solid var(--public-border)', backgroundColor: 'var(--public-sidebar-bg)' }}>
                                ⌘K
                            </kbd>
                        </button>

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg transition-all"
                            style={{ color: 'var(--public-text-muted)' }}
                            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                        >
                            {isDark ? <Sun size={17} /> : <Moon size={17} />}
                        </button>

                        <div className="hidden sm:block w-px h-5 mx-1" style={{ backgroundColor: 'var(--public-border)' }} />

                        <a
                            href="/"
                            className="hidden sm:flex items-center gap-1 text-xs font-medium transition-colors hover:text-emerald-600"
                            style={{ color: 'var(--public-text-muted)' }}
                        >
                            E-Docs <ExternalLink size={10} />
                        </a>
                    </div>
                </div>
            </header>

            <div className="flex flex-1 max-w-[1400px] mx-auto w-full">
                {/* Sidebar - GitBook style */}
                <aside
                    className={`
          fixed lg:sticky top-14 left-0 z-30
          h-[calc(100vh-3.5rem)]
          overflow-y-auto transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
                    style={{
                        width: '256px',
                        backgroundColor: 'var(--public-sidebar-bg)',
                        borderRight: '1px solid var(--public-border)',
                    }}
                >
                    {/* Sidebar Header */}
                    <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--public-border)' }}>
                        <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--public-text-muted)' }}>
                            {site?.name || 'Documentation'}
                        </p>
                    </div>

                    <div className="p-3 space-y-0.5">
                        {rootPages.length === 0 ? (
                            <p className="text-xs text-center py-6" style={{ color: 'var(--public-text-muted)' }}>
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

                    <button
                        className="absolute top-3 right-3 lg:hidden p-1.5 rounded-md"
                        style={{ color: 'var(--public-text-muted)' }}
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X size={18} />
                    </button>
                </aside>

                {/* Mobile Backdrop */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-20 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Content Area */}
                <main className="flex-1 min-w-0" style={{ backgroundColor: 'var(--public-bg)' }}>
                    <div className="flex">
                        {/* Main Content */}
                        <div className="flex-1 min-w-0">
                            <div className="max-w-[750px] mx-auto px-8 py-10">
                                {currentPage ? (
                                    <article className="animate-in fade-in slide-in-from-bottom-2 duration-400">
                                        {/* Breadcrumb */}
                                        {breadcrumbs.length > 1 && (
                                            <nav className="flex items-center gap-1 mb-5 flex-wrap">
                                                {breadcrumbs.map((crumb, idx) => (
                                                    <span key={crumb.id} className="flex items-center gap-1">
                                                        {idx > 0 && <ChevronRight size={12} style={{ color: 'var(--public-text-muted)' }} />}
                                                        <span
                                                            className={`text-xs transition-colors ${
                                                                idx === breadcrumbs.length - 1
                                                                    ? 'font-medium'
                                                                    : 'cursor-pointer hover:text-emerald-600'
                                                            }`}
                                                            style={{
                                                                color: idx === breadcrumbs.length - 1
                                                                    ? 'var(--public-text-secondary)'
                                                                    : 'var(--public-text-muted)'
                                                            }}
                                                            onClick={() => idx < breadcrumbs.length - 1 && handlePageSelect(crumb)}
                                                        >
                                                            {crumb.title || 'Untitled'}
                                                        </span>
                                                    </span>
                                                ))}
                                            </nav>
                                        )}

                                        {/* Page Title */}
                                        <header className="mb-8">
                                            <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight mb-3"
                                                style={{ color: 'var(--public-text-primary)' }}>
                                                {currentPage.title || "Untitled Page"}
                                            </h1>
                                            {currentPage.updated_at && (
                                                <p className="text-xs" style={{ color: 'var(--public-text-muted)' }}>
                                                    Last updated{" "}
                                                    {new Date(currentPage.updated_at).toLocaleDateString('en-US', {
                                                        year: 'numeric', month: 'long', day: 'numeric'
                                                    })}
                                                </p>
                                            )}
                                        </header>

                                        {/* Divider */}
                                        <div className="mb-8 h-px" style={{ backgroundColor: 'var(--public-border)' }} />

                                        {/* Page Content */}
                                        <div className="public-page-content">
                                            <PageViewer content={currentPage.content} />
                                        </div>

                                        {/* Next/Prev Navigation */}
                                        <div className="mt-14 pt-8 border-t flex flex-col sm:flex-row gap-4" style={{ borderColor: 'var(--public-border)' }}>
                                            {prevPage && (
                                                <button
                                                    onClick={() => handlePageSelect(prevPage)}
                                                    className="flex-1 flex flex-col p-5 rounded-xl transition-all group text-left"
                                                    style={{
                                                        border: '1px solid var(--public-border)',
                                                        backgroundColor: 'var(--public-card-bg)',
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.borderColor = '#10b981';
                                                        e.currentTarget.style.backgroundColor = 'rgba(16,185,129,0.04)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.borderColor = 'var(--public-border)';
                                                        e.currentTarget.style.backgroundColor = 'var(--public-card-bg)';
                                                    }}
                                                >
                                                    <span className="text-[10px] uppercase tracking-wider font-semibold mb-1.5" style={{ color: 'var(--public-text-muted)' }}>
                                                        ← Previous
                                                    </span>
                                                    <span className="text-sm font-semibold group-hover:text-emerald-600 transition-colors" style={{ color: 'var(--public-text-primary)' }}>
                                                        {prevPage.title}
                                                    </span>
                                                </button>
                                            )}
                                            {nextPage && (
                                                <button
                                                    onClick={() => handlePageSelect(nextPage)}
                                                    className="flex-1 flex flex-col p-5 rounded-xl transition-all group text-right ml-auto"
                                                    style={{
                                                        border: '1px solid var(--public-border)',
                                                        backgroundColor: 'var(--public-card-bg)',
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.borderColor = '#10b981';
                                                        e.currentTarget.style.backgroundColor = 'rgba(16,185,129,0.04)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.borderColor = 'var(--public-border)';
                                                        e.currentTarget.style.backgroundColor = 'var(--public-card-bg)';
                                                    }}
                                                >
                                                    <span className="text-[10px] uppercase tracking-wider font-semibold mb-1.5" style={{ color: 'var(--public-text-muted)' }}>
                                                        Next →
                                                    </span>
                                                    <span className="text-sm font-semibold group-hover:text-emerald-600 transition-colors" style={{ color: 'var(--public-text-primary)' }}>
                                                        {nextPage.title}
                                                    </span>
                                                </button>
                                            )}
                                        </div>

                                        {/* Page Feedback */}
                                        <PageFeedback />
                                    </article>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-24 text-center">
                                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                                             style={{ backgroundColor: 'var(--public-card-bg)', border: '1px solid var(--public-border)' }}>
                                            <FileText size={28} style={{ color: 'var(--public-text-muted)' }} />
                                        </div>
                                        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--public-text-primary)' }}>
                                            Select a page
                                        </h3>
                                        <p className="text-sm" style={{ color: 'var(--public-text-secondary)' }}>
                                            Choose a page from the sidebar to start reading.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Sidebar - ToC */}
                        <aside className="hidden xl:block w-56 shrink-0">
                            <div className="sticky top-24 pt-10 pr-6">
                                <TableOfContents content={currentPage?.content} />
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
