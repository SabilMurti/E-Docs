import { useState } from "react";
import { Plus, Minus, FileText, Eye, FileCode } from "lucide-react";

/**
 * Extract plain text from TipTap JSON for preview
 */
function extractTextFromTiptap(tiptapJson) {
    if (!tiptapJson || !tiptapJson.content) return "";

    let text = "";
    const traverse = (node) => {
        if (node.type === "text") {
            text += node.text;
        }
        if (node.content) {
            node.content.forEach(traverse);
        }
        // Add newline after paragraphs, headings, etc
        if (["paragraph", "heading", "codeBlock"].includes(node.type)) {
            text += "\n";
        }
    };

    traverse(tiptapJson);
    return text.trim();
}

/**
 * GitHub-Style Diff Viewer for Merge Requests
 * Shows added, modified, and deleted pages with detailed changes
 */
export default function DiffViewer({ changes = [] }) {
    // Auto-expand all files like GitHub (no need to click to see diff)
    const [expandedFiles, setExpandedFiles] = useState(() =>
        Object.fromEntries(changes.map((c) => [c.logical_id, true])),
    );
    const [viewMode, setViewMode] = useState("split"); // 'split', 'unified'

    const toggleFile = (logicalId) => {
        setExpandedFiles((prev) => ({
            ...prev,
            [logicalId]: !prev[logicalId],
        }));
    };

    const getChangeStats = () => {
        const added = changes.filter((c) => c.type === "added").length;
        const modified = changes.filter((c) => c.type === "modified").length;
        const deleted = changes.filter((c) => c.type === "deleted").length;
        return { added, modified, deleted, total: changes.length };
    };

    const stats = getChangeStats();

    if (changes.length === 0) {
        return (
            <div className="text-center py-12 text-[var(--color-text-muted)]">
                <FileText size={48} className="mx-auto mb-3 opacity-50" />
                <p>No changes to display</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Stats Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-primary)]">
                <div className="flex items-center gap-4 text-sm">
                    <span className="text-[var(--color-text-primary)] font-medium">
                        Showing {stats.total} changed{" "}
                        {stats.total === 1 ? "file" : "files"}
                    </span>
                    <div className="flex items-center gap-3">
                        {stats.added > 0 && (
                            <span className="text-green-400 flex items-center gap-1">
                                <Plus size={14} />
                                {stats.added} added
                            </span>
                        )}
                        {stats.modified > 0 && (
                            <span className="text-yellow-400 flex items-center gap-1">
                                <FileText size={14} />
                                {stats.modified} modified
                            </span>
                        )}
                        {stats.deleted > 0 && (
                            <span className="text-red-400 flex items-center gap-1">
                                <Minus size={14} />
                                {stats.deleted} deleted
                            </span>
                        )}
                    </div>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-1 bg-[var(--color-bg-tertiary)] rounded-md p-1">
                    <button
                        onClick={() => setViewMode("split")}
                        className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                            viewMode === "split"
                                ? "bg-[var(--color-accent)] text-white"
                                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                        }`}
                    >
                        Split
                    </button>
                    <button
                        onClick={() => setViewMode("unified")}
                        className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                            viewMode === "unified"
                                ? "bg-[var(--color-accent)] text-white"
                                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                        }`}
                    >
                        Unified
                    </button>
                </div>
            </div>

            {/* Changed Files List */}
            <div className="space-y-3">
                {changes.map((change) => (
                    <FileChange
                        key={change.logical_id}
                        change={change}
                        isExpanded={expandedFiles[change.logical_id]}
                        onToggle={() => toggleFile(change.logical_id)}
                        viewMode={viewMode}
                    />
                ))}
            </div>
        </div>
    );
}

/**
 * Individual File Change Component
 */
function FileChange({ change, isExpanded, onToggle, viewMode }) {
    const getStatusIcon = () => {
        switch (change.type) {
            case "added":
                return <Plus size={16} className="text-green-400" />;
            case "deleted":
                return <Minus size={16} className="text-red-400" />;
            case "modified":
                return <FileText size={16} className="text-yellow-400" />;
            default:
                return <FileCode size={16} />;
        }
    };

    const getStatusBadge = () => {
        const classes = {
            added: "bg-green-500/10 text-green-400 border-green-500/20",
            deleted: "bg-red-500/10 text-red-400 border-red-500/20",
            modified: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
        };

        return (
            <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium border ${classes[change.type]}`}
            >
                {change.type.toUpperCase()}
            </span>
        );
    };

    return (
        <div className="border border-[var(--color-border-primary)] rounded-lg overflow-hidden bg-[var(--color-bg-secondary)]">
            {/* File Header */}
            <button
                onClick={onToggle}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--color-bg-hover)] transition-colors"
            >
                <div className="flex items-center gap-3">
                    {getStatusIcon()}
                    <span className="font-mono text-sm text-[var(--color-text-primary)]">
                        {change.title}
                    </span>
                    {getStatusBadge()}
                </div>

                <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
                    {change.diff && (
                        <span>
                            {Object.keys(change.diff).length}{" "}
                            {Object.keys(change.diff).length === 1
                                ? "change"
                                : "changes"}
                        </span>
                    )}
                    <span
                        className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    >
                        ▼
                    </span>
                </div>
            </button>

            {/* File Content Diff */}
            {isExpanded && (
                <div className="border-t border-[var(--color-border-primary)]">
                    {change.type === "added" && (
                        <AddedFileView change={change} />
                    )}
                    {change.type === "deleted" && (
                        <DeletedFileView change={change} />
                    )}
                    {change.type === "modified" && (
                        <ModifiedFileView change={change} viewMode={viewMode} />
                    )}
                </div>
            )}
        </div>
    );
}

/**
 * View for Added Files
 */
function AddedFileView({ change }) {
    return (
        <div className="p-4 bg-green-500/5">
            <div className="flex items-center gap-2 mb-3 text-sm text-green-400">
                <Plus size={14} />
                <span className="font-medium">New page</span>
            </div>
            <div className="text-sm text-[var(--color-text-secondary)] space-y-1">
                {change.icon && (
                    <div className="flex items-center gap-2">
                        <span className="text-[var(--color-text-muted)]">
                            Icon:
                        </span>
                        <span className="text-lg">{change.icon}</span>
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <span className="text-[var(--color-text-muted)]">
                        Created:
                    </span>
                    <span>{new Date(change.created_at).toLocaleString()}</span>
                </div>
            </div>
        </div>
    );
}

/**
 * View for Deleted Files
 */
function DeletedFileView({ change }) {
    return (
        <div className="p-4 bg-red-500/5">
            <div className="flex items-center gap-2 mb-3 text-sm text-red-400">
                <Minus size={14} />
                <span className="font-medium">Deleted page</span>
            </div>
            <div className="text-sm text-[var(--color-text-secondary)]">
                <span className="text-[var(--color-text-muted)]">
                    This page will be removed
                </span>
            </div>
        </div>
    );
}

/**
 * View for Modified Files
 */
function ModifiedFileView({ change, viewMode }) {
    const { diff } = change;

    return (
        <div className="divide-y divide-[var(--color-border-primary)]">
            {/* Title Change */}
            {diff.title && (
                <div className="p-4 bg-[var(--color-bg-tertiary)]">
                    <div className="text-sm font-medium text-[var(--color-text-primary)] mb-2">
                        Title
                    </div>
                    <div className="space-y-1 font-mono text-xs">
                        <div className="flex items-start gap-2 text-red-400 bg-red-500/10 px-2 py-1 rounded">
                            <Minus size={14} className="mt-0.5" />
                            <span>{diff.title.old}</span>
                        </div>
                        <div className="flex items-start gap-2 text-green-400 bg-green-500/10 px-2 py-1 rounded">
                            <Plus size={14} className="mt-0.5" />
                            <span>{diff.title.new}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Icon Change */}
            {diff.icon && (
                <div className="p-4 bg-[var(--color-bg-tertiary)]">
                    <div className="text-sm font-medium text-[var(--color-text-primary)] mb-2">
                        Icon
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Minus size={12} className="text-red-400" />
                            <span className="text-2xl">
                                {diff.icon.old || "(none)"}
                            </span>
                        </div>
                        <span className="text-[var(--color-text-muted)]">
                            →
                        </span>
                        <div className="flex items-center gap-2">
                            <Plus size={12} className="text-green-400" />
                            <span className="text-2xl">
                                {diff.icon.new || "(none)"}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Content Change */}
            {diff.content && (
                <div className="p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)] mb-3">
                        <FileCode size={14} />
                        <span>Content changed</span>
                    </div>

                    {/* Show actual content diff */}
                    <div className="space-y-2 text-sm">
                        {/* Old Content */}
                        <div className="bg-red-500/5 border border-red-500/20 rounded p-3">
                            <div className="flex items-center gap-2 text-red-400 font-medium mb-2">
                                <Minus size={12} />
                                <span>Before</span>
                            </div>
                            <div className="text-[var(--color-text-secondary)] line-clamp-6">
                                {extractTextFromTiptap(diff.content.old) ||
                                    "(empty)"}
                            </div>
                        </div>

                        {/* New Content */}
                        <div className="bg-green-500/5 border border-green-500/20 rounded p-3">
                            <div className="flex items-center gap-2 text-green-400 font-medium mb-2">
                                <Plus size={12} />
                                <span>After</span>
                            </div>
                            <div className="text-[var(--color-text-secondary)] line-clamp-6">
                                {extractTextFromTiptap(diff.content.new) ||
                                    "(empty)"}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Cover Image Change */}
            {diff.cover_image && (
                <div className="p-4 bg-[var(--color-bg-tertiary)]">
                    <div className="text-sm font-medium text-[var(--color-text-primary)] mb-2">
                        Cover Image
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)]">
                        Cover image has been{" "}
                        {diff.cover_image.old && diff.cover_image.new
                            ? "changed"
                            : diff.cover_image.new
                              ? "added"
                              : "removed"}
                    </div>
                </div>
            )}
        </div>
    );
}
