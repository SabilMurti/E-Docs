import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
    Check,
    History,
    Eye,
    Save,
    CloudUpload,
    Image as ImageIcon,
    ChevronRight,
    GitPullRequest,
    GitBranch,
    ArrowDownCircle,
    ToggleLeft,
    ToggleRight,
    Cloud,
    CloudOff,
    Plus,
} from "lucide-react";
import { toast } from "sonner";
import usePageStore from "../../stores/pageStore";
import useSiteStore from "../../stores/siteStore";
import RichEditor from "../editor/RichEditor";
import PageEditor from "../editor/PageEditor";
import LoadingSpinner from "../common/LoadingSpinner";
import InputModal from "../common/InputModal";
import ConfirmModal from "../common/ConfirmModal";
import Modal from "../common/Modal";
import PageViewer from "./PageViewer";
import PageMenu from "./PageMenu";
import PageSettingsModal from "./PageSettingsModal";
import client from "../../api/client";
import { createChangeRequest, syncChangeRequest } from "../../api/pages";

const AUTO_SAVE_KEY = "edocs-autosave-enabled";
const AUTO_SAVE_DELAY = 3000; // 3 seconds debounce

export default function PageContent() {
    const { pageSlug, siteSlug } = useParams();
    const rawNavigate = useNavigate();

    const { currentPage, fetchPage, saveDraft, isLoading, isSaving } =
        usePageStore();
    const { currentSite, currentBranch } = useSiteStore();

    const [mode, setMode] = useState("edit");
    const [localContent, setLocalContent] = useState(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [draftSaving, setDraftSaving] = useState(false);
    const [autoSaveEnabled, setAutoSaveEnabled] = useState(() => {
        const stored = localStorage.getItem(AUTO_SAVE_KEY);
        return stored !== null ? JSON.parse(stored) : true; // default: enabled
    });

    // Commit state
    const [commitMessage, setCommitMessage] = useState("");
    const [showCommitInput, setShowCommitInput] = useState(false);
    const [showBranchModal, setShowBranchModal] = useState(false);
    const [isCreatingBranch, setIsCreatingBranch] = useState(false);

    // PR state
    const [showPRModal, setShowPRModal] = useState(false);
    const [siteBranches, setSiteBranches] = useState([]);
    const [targetBranchId, setTargetBranchId] = useState("");
    const [prTitle, setPrTitle] = useState("");
    const [prDescription, setPrDescription] = useState("");

    // Page settings state
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Navigation guard state (replaces useBlocker)
    const [pendingNavigation, setPendingNavigation] = useState(null);
    const hasUnsavedRef = useRef(false);

    // Refs for auto-save timer
    const autoSaveTimerRef = useRef(null);
    const localContentRef = useRef(localContent);

    // Keep ref in sync
    useEffect(() => {
        localContentRef.current = localContent;
    }, [localContent]);

    // Keep ref in sync with hasUnsavedChanges
    useEffect(() => {
        hasUnsavedRef.current = hasUnsavedChanges;
    }, [hasUnsavedChanges]);

    // Guarded navigate - intercepts navigation when unsaved changes exist
    const navigate = useCallback(
        (to, options) => {
            if (hasUnsavedRef.current) {
                setPendingNavigation({ to, options });
                return;
            }
            rawNavigate(to, options);
        },
        [rawNavigate],
    );

    // Persist auto-save preference
    useEffect(() => {
        localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(autoSaveEnabled));
    }, [autoSaveEnabled]);

    // Fetch page on mount
    useEffect(() => {
        if (siteSlug && pageSlug) {
            fetchPage(siteSlug, pageSlug);
        }
    }, [siteSlug, pageSlug, fetchPage]);

    // Set local content when page loads
    useEffect(() => {
        if (currentPage?.content) {
            setLocalContent(currentPage.content);
            setHasUnsavedChanges(false);
        }
    }, [currentPage]);

    // --- SAVE DRAFT ---
    const handleSave = useCallback(async () => {
        if (!currentPage || !localContent || !hasUnsavedChanges) return;

        setDraftSaving(true);
        try {
            const result = await saveDraft(siteSlug, currentPage.slug, {
                content: localContent,
            });

            if (result.success) {
                setHasUnsavedChanges(false);
                setLastSaved(new Date());
                toast.success("Draft saved", { duration: 1500 });
            } else {
                toast.error(result.error || "Failed to save draft");
            }
        } catch (error) {
            console.error("Save error:", error);
            toast.error("Failed to save draft");
        } finally {
            setDraftSaving(false);
        }
    }, [currentPage, localContent, siteSlug, hasUnsavedChanges, saveDraft]);

    useEffect(() => {
        if (!autoSaveEnabled || !currentPage) return;

        // Auto-save timer
        if (hasUnsavedChanges) {
            // Clear existing timer
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }

            autoSaveTimerRef.current = setTimeout(async () => {
                const content = localContentRef.current;
                if (!content) return;

                setDraftSaving(true);
                try {
                    const result = await saveDraft(siteSlug, currentPage.slug, {
                        content,
                    });

                    if (result.success) {
                        setHasUnsavedChanges(false);
                        setLastSaved(new Date());
                    }
                } catch (error) {
                    console.error("Auto-save error:", error);
                } finally {
                    setDraftSaving(false);
                }
            }, AUTO_SAVE_DELAY);
        }

        // Cleanup: Save on unmount if dirty and auto-save is on
        return () => {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }

            if (hasUnsavedRef.current && autoSaveEnabled) {
                const content = localContentRef.current;
                if (content) {
                    saveDraft(siteSlug, currentPage.slug, { content }).catch((e) =>
                        console.error("Unmount save failed", e),
                    );
                }
            }
        };
    }, [autoSaveEnabled, hasUnsavedChanges, currentPage, siteSlug, saveDraft]);

    // --- CONTENT CHANGE ---
    const handleContentChange = useCallback((newContent) => {
        setLocalContent(newContent);
        setHasUnsavedChanges(true);
    }, []);

    // --- PAGE SETTINGS ---
    const handlePageSettings = useCallback(() => {
        setShowSettingsModal(true);
    }, []);

    const handleSaveSettings = useCallback(async (settings) => {
        if (!currentPage?.id) {
            toast.error('Page not found');
            return;
        }

        try {
            const result = await usePageStore.getState().updatePage(
                siteSlug,
                currentPage.slug,
                settings
            );

            if (result.success) {
                toast.success('Page settings updated');
                setShowSettingsModal(false);
                // Refetch to get updated page
                await fetchPage(siteSlug, pageSlug);
            } else {
                toast.error(result.error || 'Failed to update page settings');
            }
        } catch (error) {
            console.error('Settings error:', error);
            toast.error('Failed to update page settings');
        }
    }, [siteSlug, pageSlug, currentPage, fetchPage]);

    const handleDeletePage = useCallback(() => {
        setShowDeleteConfirm(true);
    }, []);

    const handleConfirmDelete = useCallback(async () => {
        try {
            const result = await usePageStore.getState().deletePage(
                siteSlug,
                currentPage.slug
            );

            if (result.success) {
                toast.success('Page deleted');
                rawNavigate(`/sites/${siteSlug}`);
            } else {
                toast.error(result.error || 'Failed to delete page');
            }
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to delete page');
        } finally {
            setShowDeleteConfirm(false);
        }
    }, [siteSlug, pageSlug, rawNavigate]);

    const handleDuplicatePage = useCallback(async () => {
        if (!currentPage) return;
        try {
            const branchName = currentPage.branch_name || 'main';
            const result = await usePageStore.getState().duplicatePage(
                siteSlug,
                currentPage.slug,
                branchName
            );

            if (result.success && result.page?.slug) {
                toast.success(`"${result.page.title}" created`);
                rawNavigate(`/sites/${siteSlug}/pages/${result.page.slug}`);
            } else {
                toast.error(result.error || 'Failed to duplicate page');
            }
        } catch (error) {
            console.error('Duplicate error:', error);
            toast.error('Failed to duplicate page');
        }
    }, [currentPage, siteSlug, rawNavigate]);

    // --- COMMIT ---
    const handleCommit = useCallback(async () => {
        if (!currentPage || !localContent) {
            toast.error("No changes to commit");
            return;
        }

        setDraftSaving(true);
        try {
            const result = await usePageStore
                .getState()
                .commitChange(siteSlug, currentPage.slug, {
                    content: localContent,
                    title: currentPage.title,
                    message: commitMessage || "Update content",
                });

            if (result.success) {
                setHasUnsavedChanges(false);
                setLastSaved(new Date());
                setShowCommitInput(false);
                setCommitMessage("");
                toast.success("Changes committed!");
            } else {
                toast.error(result.error || "Failed to commit changes");
            }
        } catch (error) {
            console.error("Commit error:", error);
            toast.error("Failed to commit changes");
        } finally {
            setDraftSaving(false);
        }
    }, [currentPage, localContent, siteSlug, commitMessage]);

    // --- SYNC/PULL ---
    const { currentRequest, fetchRequestDetails } = usePageStore();

    useEffect(() => {
        if (currentPage?.slug) fetchRequestDetails(currentPage.slug);
    }, [currentPage?.slug, fetchRequestDetails]);

    const isOutOfSync = useMemo(() => {
        if (!currentRequest || !currentPage) return false;
        return (
            JSON.stringify(currentRequest.base_content) !==
            JSON.stringify(currentPage.content)
        );
    }, [currentRequest, currentPage]);

    const handlePull = async () => {
        if (!currentRequest) return;
        setDraftSaving(true);
        try {
            await syncChangeRequest(currentRequest.id);
            await fetchRequestDetails(currentPage.slug);
            toast.success("Synced with latest live version");
        } catch (error) {
            toast.error("Failed to sync changes");
        } finally {
            setDraftSaving(false);
        }
    };

    // --- REQUEST REVIEW ---
    const handleFetchBranches = useCallback(async () => {
        try {
            const res = await client.get(`/sites/${siteSlug}/branches`);
            setSiteBranches(res.data.data);

            // Auto-select first main/master branch if we are on a feature branch
            if (
                currentPage &&
                currentPage.branch_name !== "main" &&
                currentPage.branch_name !== "master"
            ) {
                const mainBranch = res.data.data.find(
                    (b) => b.name === "main" || b.name === "master",
                );
                if (mainBranch) setTargetBranchId(mainBranch.id);
            }
        } catch (error) {
            console.error("Failed to fetch branches:", error);
        }
    }, [siteSlug, currentPage, client]);

    const handleRequestReview = useCallback(async () => {
        if (!currentPage) return;

        // Load branches first
        await handleFetchBranches();

        // Prepare defaults
        setPrTitle(currentPage.title);
        setPrDescription("Ready for review");
        setShowPRModal(true);
    }, [currentPage, handleFetchBranches]);

    const handleCreatePR = async () => {
        if (!targetBranchId) {
            toast.error("Please select a target branch");
            return;
        }

        setDraftSaving(true);
        try {
            const result = await createChangeRequest(currentPage.slug, {
                status: "open",
                title: prTitle,
                description: prDescription,
                content: localContent,
                target_branch_id: targetBranchId,
            });

            if (result) {
                setHasUnsavedChanges(false);
                toast.success("Pull Request created successfully!");
                setShowPRModal(false);
                navigate(`/sites/${siteSlug}/pulls/${result.data.id}`);
            }
        } catch (error) {
            console.error("Failed to create PR:", error);
            toast.error(
                error.response?.data?.message ||
                    "Failed to create Pull Request",
            );
        } finally {
            setDraftSaving(false);
        }
    };

    // --- BRANCH MANAGEMENT ---
    const handleCreateBranch = async (name) => {
        if (!name || !currentPage) return;
        setIsCreatingBranch(true);
        try {
            const sourceBranch =
                currentPage.branch_name || currentBranch || "main";
            const res = await client.post(`/sites/${siteSlug}/branches`, {
                name: name.toLowerCase().replace(/\s+/g, "-"),
                source_branch: sourceBranch,
            });

            toast.success(`Branch '${res.data.data.name}' created!`);
            setShowBranchModal(false);

            // Find the page in the new branch and navigate to it
            const pagesRes = await client.get(`/sites/${siteSlug}/pages`, {
                params: { branch: res.data.data.name },
            });
            const allPages = pagesRes.data.data || [];
            const matchingPage = allPages.find(
                (p) => p.logical_id === currentPage.logical_id,
            );

            if (matchingPage) {
                navigate(`/sites/${siteSlug}/pages/${matchingPage.slug}`);
            } else {
                navigate(`/sites/${siteSlug}`);
            }
        } catch (error) {
            toast.error(
                error.response?.data?.message || "Failed to create branch",
            );
        } finally {
            setIsCreatingBranch(false);
        }
    };

    // --- KEYBOARD SHORTCUT (Ctrl+S → Save Draft) ---
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                e.preventDefault();
                handleSave();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleSave]);

    // --- UNSAVED CHANGES GUARD (browser close/refresh) ---
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = "";
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () =>
            window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [hasUnsavedChanges]);

    // Navigation guard handled by pendingNavigation state + guarded navigate above

    // Breadcrumbs
    const breadcrumbs = useMemo(() => {
        const items = [];
        if (currentSite) {
            items.push({
                label: currentSite.name,
                href: `/sites/${currentSite.slug}`,
            });
        }
        if (currentPage) {
            items.push({
                label: currentPage.title,
                href: null,
            });
        }
        return items;
    }, [currentSite, currentPage]);

    // Format "last saved" time
    const lastSavedText = useMemo(() => {
        if (!lastSaved) return null;
        const now = new Date();
        const diff = Math.floor((now - lastSaved) / 1000);
        if (diff < 5) return "just now";
        if (diff < 60) return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        return lastSaved.toLocaleTimeString();
    }, [lastSaved]);

    // Re-render the "time ago" periodically
    const [, setTick] = useState(0);
    useEffect(() => {
        if (!lastSaved) return;
        const interval = setInterval(() => setTick((t) => t + 1), 10000);
        return () => clearInterval(interval);
    }, [lastSaved]);

    if (isLoading || !currentPage) {
        return (
            <div className="h-full flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Navigation guard modal */}
            {pendingNavigation && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    style={{ animation: "fadeIn 0.2s ease" }}
                >
                    <div
                        className="bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4"
                        style={{ animation: "scaleIn 0.2s ease" }}
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                <CloudOff
                                    size={20}
                                    className="text-amber-500"
                                />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                                    Unsaved Changes
                                </h3>
                                <p className="text-xs text-[var(--color-text-muted)]">
                                    Your edits haven't been saved yet
                                </p>
                            </div>
                        </div>
                        <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                            You have unsaved changes on this page. Would you
                            like to save before leaving, or discard them?
                        </p>
                        <div className="flex items-center gap-2 justify-end">
                            <button
                                onClick={() => setPendingNavigation(null)}
                                className="px-4 py-2 text-xs font-medium rounded-lg border border-[var(--color-border-primary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                            >
                                Stay
                            </button>
                            <button
                                onClick={() => {
                                    const nav = pendingNavigation;
                                    setHasUnsavedChanges(false);
                                    setPendingNavigation(null);
                                    rawNavigate(nav.to, nav.options);
                                }}
                                className="px-4 py-2 text-xs font-medium rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors"
                            >
                                Discard & Leave
                            </button>
                            <button
                                onClick={async () => {
                                    await handleSave();
                                    const nav = pendingNavigation;
                                    setPendingNavigation(null);
                                    rawNavigate(nav.to, nav.options);
                                }}
                                className="px-4 py-2 text-xs font-medium rounded-lg bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors flex items-center gap-1.5"
                            >
                                <Save size={12} />
                                Save & Leave
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Page Header */}
            <header className="sticky top-0 z-20 bg-[color:var(--color-bg-primary)] border-b border-[color:var(--color-border-primary)]">
                <div className="flex items-center justify-between px-4 h-12">
                    {/* Left: Breadcrumbs & Branch */}
                    <div className="flex items-center gap-3 overflow-hidden">
                        <nav className="flex items-center gap-1 text-sm overflow-hidden">
                            {breadcrumbs.map((crumb, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-1 shrink-0"
                                >
                                    {index > 0 && (
                                        <ChevronRight
                                            size={14}
                                            className="text-[color:var(--color-text-muted)]"
                                        />
                                    )}
                                    {crumb.href ? (
                                        <Link
                                            to={crumb.href}
                                            className="text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-text-primary)] transition-colors truncate max-w-[120px]"
                                        >
                                            {crumb.label}
                                        </Link>
                                    ) : (
                                        <span className="text-[color:var(--color-text-primary)] font-medium truncate max-w-[150px]">
                                            {crumb.label}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </nav>

                        {currentPage?.branch_name && (
                            <div
                                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-all duration-200 cursor-default select-none whitespace-nowrap ${
                                    currentPage.branch_name === "main" ||
                                    currentPage.branch_name === "master"
                                        ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                }`}
                                title={`Currently on branch: ${currentPage.branch_name}`}
                            >
                                <GitBranch size={10} className="shrink-0" />
                                {currentPage.branch_name}
                            </div>
                        )}

                        {currentPage?.branch_name === "main" && (
                            <button
                                onClick={() => setShowBranchModal(true)}
                                className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-medium bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-accent)]/50 transition-all shadow-sm"
                                title="Branch out to start a Pull Request"
                            >
                                <Plus size={10} />
                                New Branch
                            </button>
                        )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2">
                        {/* Save Status Indicator */}
                        <div className="flex items-center gap-1.5 mr-1">
                            {draftSaving ? (
                                <span className="text-xs text-[color:var(--color-text-muted)] flex items-center gap-1.5 animate-pulse">
                                    <LoadingSpinner size="sm" />
                                    Saving...
                                </span>
                            ) : hasUnsavedChanges ? (
                                <span className="text-xs text-amber-400 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                    Unsaved
                                </span>
                            ) : lastSaved ? (
                                <span className="text-xs text-emerald-400 flex items-center gap-1.5">
                                    <Cloud size={12} />
                                    Saved {lastSavedText}
                                </span>
                            ) : null}
                        </div>

                        {/* Auto-Save Toggle */}
                        <button
                            onClick={() => setAutoSaveEnabled((prev) => !prev)}
                            className={`autosave-toggle flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-medium rounded-lg border transition-all duration-200 ${
                                autoSaveEnabled
                                    ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10"
                                    : "border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                            }`}
                            title={
                                autoSaveEnabled
                                    ? "Auto-save is ON (click to disable)"
                                    : "Auto-save is OFF (click to enable)"
                            }
                        >
                            {autoSaveEnabled ? (
                                <>
                                    <ToggleRight
                                        size={14}
                                        className="text-emerald-400"
                                    />
                                    Auto
                                </>
                            ) : (
                                <>
                                    <ToggleLeft size={14} />
                                    Auto
                                </>
                            )}
                        </button>

                        {/* Divider */}
                        <div className="w-px h-5 bg-[var(--color-border-primary)]" />

                        {/* Save Draft Button (Secondary) */}
                        <button
                            onClick={handleSave}
                            disabled={!hasUnsavedChanges || draftSaving}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 flex items-center gap-1.5 ${
                                hasUnsavedChanges
                                    ? "bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border-[var(--color-border-primary)] hover:border-[var(--color-accent)]/50"
                                    : "bg-transparent text-[var(--color-text-muted)] border-transparent cursor-not-allowed"
                            }`}
                            title="Save as draft (Ctrl+S)"
                        >
                            <Save size={12} />
                            Save Draft
                        </button>

                        {/* Commit Button (Primary) */}
                        <div className="flex items-center gap-2">
                            {showCommitInput ? (
                                <div className="flex items-center gap-2 animate-in slide-in-from-right-4 duration-300">
                                    <input
                                        type="text"
                                        value={commitMessage}
                                        onChange={(e) =>
                                            setCommitMessage(e.target.value)
                                        }
                                        placeholder="What changed?..."
                                        className="w-48 px-2 py-1.5 text-xs bg-[color:var(--color-bg-secondary)] border border-[color:var(--color-border-primary)] rounded-lg focus:outline-none focus:ring-1 focus:ring-[color:var(--color-accent)]"
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter")
                                                handleCommit();
                                            if (e.key === "Escape")
                                                setShowCommitInput(false);
                                        }}
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleCommit}
                                        disabled={draftSaving}
                                        className="px-4 py-1.5 text-xs font-medium rounded-lg bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-all flex items-center gap-1.5 shadow-sm shadow-[var(--color-accent)]/20"
                                    >
                                        {draftSaving ? (
                                            <LoadingSpinner size="xs" />
                                        ) : (
                                            <CloudUpload size={12} />
                                        )}
                                        Push & Commit
                                    </button>
                                    <button
                                        onClick={() =>
                                            setShowCommitInput(false)
                                        }
                                        className="p-1.5 text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-primary)]"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowCommitInput(true)}
                                    className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                                        hasUnsavedChanges
                                            ? "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] shadow-sm shadow-[var(--color-accent)]/20"
                                            : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] border border-[var(--color-border-primary)] opacity-80"
                                    }`}
                                    title="Commit and Push changes to branch"
                                >
                                    <CloudUpload size={12} />
                                    Commit
                                </button>
                            )}
                        </div>

                        {/* Git Pull (Sync) */}
                        {isOutOfSync && (
                            <button
                                onClick={handlePull}
                                disabled={draftSaving}
                                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors flex items-center gap-1.5 shadow-sm"
                                title="Your draft is out of sync with the live version. Pull changes."
                            >
                                <ArrowDownCircle size={14} />
                                Pull
                            </button>
                        )}

                        {/* Request Review Button */}
                        <button
                            onClick={handleRequestReview}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[color:var(--color-border-primary)] text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-bg-hover)] hover:text-[color:var(--color-text-primary)] transition-colors flex items-center gap-1.5"
                            title="Create a pull request for review"
                        >
                            <GitPullRequest size={14} />
                            Create Pull Request
                        </button>

                        {/* View Requests */}
                        <button
                            onClick={() =>
                                navigate(
                                    `/sites/${siteSlug}/pages/${pageSlug}/requests`,
                                )
                            }
                            className="p-1.5 rounded-lg text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-primary)] hover:bg-[color:var(--color-bg-hover)] transition-colors"
                            title="View Requests & Drafts"
                        >
                            <GitPullRequest size={16} />
                        </button>

                        {/* History */}
                        <button
                            onClick={() =>
                                navigate(
                                    `/sites/${siteSlug}/pages/${pageSlug}/history`,
                                )
                            }
                            className="p-1.5 rounded-lg text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-primary)] hover:bg-[color:var(--color-bg-hover)] transition-colors"
                            title="Version History"
                        >
                            <History size={16} />
                        </button>

                        {/* Branches */}
                        <button
                            onClick={() =>
                                navigate(`/sites/${siteSlug}/branches`)
                            }
                            className="p-1.5 rounded-lg text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-primary)] hover:bg-[color:var(--color-bg-hover)] transition-colors"
                            title="Manage Branches"
                        >
                            <GitBranch size={16} />
                        </button>

                        {/* Page Menu (Settings, Delete, Duplicate) */}
                        <PageMenu
                            onSettings={handlePageSettings}
                            onDelete={handleDeletePage}
                            onDuplicate={handleDuplicatePage}
                        />
                    </div>
                </div>
            </header>

            {/* Page Title & Icon */}
            <div className="px-4 py-6 md:px-16 lg:px-24 xl:px-32 border-b border-[color:var(--color-border-secondary)]">
                <div className="max-w-3xl mx-auto">
                    {/* Page Icon - Clickable to open settings */}
                    <div className="mb-4">
                        <button
                            onClick={handlePageSettings}
                            className="w-12 h-12 rounded-xl bg-[color:var(--color-bg-secondary)] border border-[color:var(--color-border-primary)] hover:border-[color:var(--color-accent)] transition-colors flex items-center justify-center group"
                            title="Click to change icon"
                        >
                            {currentPage.icon ? (
                                <span className="text-2xl">
                                    {currentPage.icon}
                                </span>
                            ) : (
                                <ImageIcon
                                    size={20}
                                    className="text-[color:var(--color-text-muted)] group-hover:text-[color:var(--color-accent)]"
                                />
                            )}
                        </button>
                    </div>

                    {/* Page Title - Clickable to edit */}
                    <button
                        onClick={handlePageSettings}
                        className="text-3xl font-bold text-[color:var(--color-text-primary)] hover:text-[color:var(--color-accent)] transition-colors flex items-center gap-2 group"
                        title="Click to edit title"
                    >
                        {currentPage.title}
                        <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Editor / Content Area */}
            <div className="flex-1 overflow-y-auto">
                <div className="px-4 py-6 md:px-16 lg:px-24 xl:px-32">
                    <div className="max-w-3xl mx-auto">
                        {mode === "edit" ? (
                            <PageEditor
                                content={localContent}
                                onChange={handleContentChange}
                                editable={true}
                            />
                        ) : (
                            <div className="bg-[var(--color-bg-primary)] p-8 rounded-lg shadow-sm border border-[var(--color-border-secondary)] min-h-[500px]">
                                <PageViewer content={localContent} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <InputModal
                isOpen={showBranchModal}
                onClose={() => setShowBranchModal(false)}
                onSubmit={handleCreateBranch}
                title="Create New Branch"
                message="To start a Pull Request, you need to create a feature branch first. Changes on your current branch will be cloned."
                placeholder="branch-name"
                submitText="Create Branch"
                isLoading={isCreatingBranch}
            />

            <Modal
                isOpen={showPRModal}
                onClose={() => setShowPRModal(false)}
                title="Create Pull Request"
                size="lg"
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-4 bg-[var(--color-bg-secondary)] p-3 rounded-lg border border-[var(--color-border-primary)]">
                        <div className="flex-1">
                            <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1 block">
                                Source Branch
                            </label>
                            <div className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-text-primary)]">
                                <GitBranch
                                    size={14}
                                    className="text-amber-400"
                                />
                                {currentPage?.branch_name}
                            </div>
                        </div>
                        <div className="flex items-center justify-center text-[var(--color-text-muted)]">
                            <ChevronRight size={16} />
                        </div>
                        <div className="flex-1">
                            <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1 block">
                                Target Branch
                            </label>
                            <select
                                value={targetBranchId}
                                onChange={(e) =>
                                    setTargetBranchId(e.target.value)
                                }
                                className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-md px-2 py-1 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                            >
                                <option value="" disabled>
                                    Select target...
                                </option>
                                {siteBranches.map((branch) => (
                                    <option
                                        key={branch.id}
                                        value={branch.id}
                                        disabled={
                                            branch.id === currentPage?.branch_id
                                        }
                                    >
                                        {branch.name}{" "}
                                        {branch.is_default ? "(default)" : ""}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[var(--color-text-secondary)]">
                            PR Title
                        </label>
                        <input
                            type="text"
                            value={prTitle}
                            onChange={(e) => setPrTitle(e.target.value)}
                            placeholder="e.g. Update user documentation"
                            className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-all"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[var(--color-text-secondary)]">
                            Description (optional)
                        </label>
                        <textarea
                            value={prDescription}
                            onChange={(e) => setPrDescription(e.target.value)}
                            rows={3}
                            placeholder="What changes did you make?..."
                            className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-all resize-none"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            onClick={() => setShowPRModal(false)}
                            className="px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreatePR}
                            disabled={draftSaving || !targetBranchId}
                            className="px-6 py-2 text-sm font-medium bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm shadow-[var(--color-accent)]/20 transition-all flex items-center gap-2"
                        >
                            {draftSaving && <LoadingSpinner size="xs" />}
                            Create Pull Request
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Page Settings Modal */}
            <PageSettingsModal
                isOpen={showSettingsModal}
                onClose={() => setShowSettingsModal(false)}
                onSave={handleSaveSettings}
                page={currentPage}
            />

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Page"
                message={`Are you sure you want to delete "${currentPage?.title}"? This action cannot be undone.`}
                confirmText="Delete"
                variant="danger"
                isLoading={false}
            />
        </div>
    );
}
