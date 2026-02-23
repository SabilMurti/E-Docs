import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
    GitCommit,
    Clock,
    User,
    FileText,
    ChevronDown,
    ChevronRight,
    Plus,
    Minus,
    Edit2,
    GitBranch,
} from "lucide-react";
import { getCommits, getCommit } from "../../api/pulls";
import { getBranches } from "../../api/sites";
import LoadingSpinner from "../common/LoadingSpinner";

function extractTextFromTiptap(node) {
    if (!node) return "";
    if (typeof node === "string") return node;
    let text = "";
    if (node.text) text += node.text;
    if (node.content && Array.isArray(node.content)) {
        node.content.forEach((child, i) => {
            if (child.type === "paragraph" && i > 0) text += "\n";
            text += extractTextFromTiptap(child);
        });
    }
    return text;
}

function CommitHistoryPage() {
    const { siteSlug } = useParams();
    const [commits, setCommits] = useState([]);
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState("");
    const [loading, setLoading] = useState(true);
    const [expandedCommit, setExpandedCommit] = useState(null);
    const [commitDetail, setCommitDetail] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    useEffect(() => {
        loadBranches();
    }, [siteSlug]);

    useEffect(() => {
        fetchCommits();
    }, [siteSlug, selectedBranch]);

    const loadBranches = async () => {
        try {
            const res = await getBranches(siteSlug);
            const list = res.data || res || [];
            setBranches(list);
            const defaultBranch = list.find((b) => b.is_default);
            if (defaultBranch) setSelectedBranch(defaultBranch.id);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchCommits = async () => {
        setLoading(true);
        try {
            const res = await getCommits(siteSlug, selectedBranch || null);
            setCommits(res.data || []);
        } catch (err) {
            console.error("Failed to fetch commits:", err);
        } finally {
            setLoading(false);
        }
    };

    const toggleCommit = async (commit) => {
        if (expandedCommit === commit.id) {
            setExpandedCommit(null);
            setCommitDetail(null);
            return;
        }
        setExpandedCommit(commit.id);
        setLoadingDetail(true);
        try {
            const res = await getCommit(siteSlug, commit.id);
            setCommitDetail(res.data || res);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingDetail(false);
        }
    };

    const timeAgo = (date) => {
        if (!date) return "";
        const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
        if (s < 60) return "just now";
        if (s < 3600) return `${Math.floor(s / 60)}m ago`;
        if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
        const d = Math.floor(s / 86400);
        if (d < 30) return `${d}d ago`;
        return new Date(date).toLocaleDateString();
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    // Group commits by date
    const groupedCommits = commits.reduce((groups, commit) => {
        const date = new Date(commit.created_at).toDateString();
        if (!groups[date]) groups[date] = [];
        groups[date].push(commit);
        return groups;
    }, {});

    const getActionIcon = (action) => {
        if (action === "added")
            return <Plus className="w-3 h-3 text-green-400" />;
        if (action === "deleted")
            return <Minus className="w-3 h-3 text-red-400" />;
        return <Edit2 className="w-3 h-3 text-yellow-400" />;
    };

    return (
        <div
            className="min-h-screen"
            style={{
                backgroundColor: "var(--color-bg-primary)",
                color: "var(--color-text-primary)",
            }}
        >
            <div className="max-w-4xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <GitCommit
                            className="w-6 h-6"
                            style={{ color: "var(--color-accent)" }}
                        />
                        <h1 className="text-2xl font-bold">Commit History</h1>
                    </div>

                    {/* Branch Filter */}
                    <div className="flex items-center gap-2">
                        <GitBranch
                            className="w-4 h-4"
                            style={{ color: "var(--color-text-muted)" }}
                        />
                        <select
                            value={selectedBranch}
                            onChange={(e) => setSelectedBranch(e.target.value)}
                            className="px-3 py-1.5 rounded-lg border text-sm"
                            style={{
                                backgroundColor: "var(--color-bg-secondary)",
                                borderColor: "var(--color-border-primary)",
                                color: "var(--color-text-primary)",
                            }}
                        >
                            <option value="">All branches</option>
                            {branches.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.name}
                                    {b.is_default ? " (default)" : ""}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Commits Timeline */}
                {loading ? (
                    <div className="flex justify-center py-16">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : commits.length === 0 ? (
                    <div
                        className="text-center py-16"
                        style={{ color: "var(--color-text-muted)" }}
                    >
                        <GitCommit className="w-12 h-12 mx-auto mb-4 opacity-40" />
                        <p className="text-lg font-medium mb-2">
                            No commits yet
                        </p>
                        <p className="text-sm">
                            Commits will appear here as changes are saved.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {Object.entries(groupedCommits).map(
                            ([dateString, dayCommits]) => (
                                <div key={dateString}>
                                    {/* Date Header */}
                                    <div className="flex items-center gap-3 mb-4">
                                        <div
                                            className="w-2 h-2 rounded-full"
                                            style={{
                                                backgroundColor:
                                                    "var(--color-accent)",
                                            }}
                                        />
                                        <h2
                                            className="text-sm font-semibold"
                                            style={{
                                                color: "var(--color-text-muted)",
                                            }}
                                        >
                                            {formatDate(dateString)}
                                        </h2>
                                        <div
                                            className="flex-1 h-px"
                                            style={{
                                                backgroundColor:
                                                    "var(--color-border-primary)",
                                            }}
                                        />
                                    </div>

                                    {/* Commits for this date */}
                                    <div
                                        className="space-y-2 ml-4 border-l-2 pl-6"
                                        style={{
                                            borderColor:
                                                "var(--color-border-primary)",
                                        }}
                                    >
                                        {dayCommits.map((commit) => (
                                            <div key={commit.id}>
                                                <button
                                                    onClick={() =>
                                                        toggleCommit(commit)
                                                    }
                                                    className="w-full text-left rounded-xl border p-4 transition-colors"
                                                    style={{
                                                        borderColor:
                                                            "var(--color-border-primary)",
                                                        backgroundColor:
                                                            expandedCommit ===
                                                            commit.id
                                                                ? "var(--color-bg-tertiary)"
                                                                : "var(--color-bg-secondary)",
                                                    }}
                                                    onMouseEnter={(e) =>
                                                        (e.currentTarget.style.backgroundColor =
                                                            "var(--color-bg-hover)")
                                                    }
                                                    onMouseLeave={(e) =>
                                                        (e.currentTarget.style.backgroundColor =
                                                            expandedCommit ===
                                                            commit.id
                                                                ? "var(--color-bg-tertiary)"
                                                                : "var(--color-bg-secondary)")
                                                    }
                                                >
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex items-start gap-3">
                                                            {expandedCommit ===
                                                            commit.id ? (
                                                                <ChevronDown
                                                                    className="w-4 h-4 mt-0.5 flex-shrink-0"
                                                                    style={{
                                                                        color: "var(--color-text-muted)",
                                                                    }}
                                                                />
                                                            ) : (
                                                                <ChevronRight
                                                                    className="w-4 h-4 mt-0.5 flex-shrink-0"
                                                                    style={{
                                                                        color: "var(--color-text-muted)",
                                                                    }}
                                                                />
                                                            )}
                                                            <div>
                                                                <p className="font-semibold text-sm">
                                                                    {
                                                                        commit.message
                                                                    }
                                                                </p>
                                                                <div
                                                                    className="flex items-center gap-3 mt-1 text-xs"
                                                                    style={{
                                                                        color: "var(--color-text-muted)",
                                                                    }}
                                                                >
                                                                    <span className="flex items-center gap-1">
                                                                        <User className="w-3 h-3" />
                                                                        {commit
                                                                            .user
                                                                            ?.name ||
                                                                            "Unknown"}
                                                                    </span>
                                                                    <span className="flex items-center gap-1">
                                                                        <Clock className="w-3 h-3" />
                                                                        {timeAgo(
                                                                            commit.created_at,
                                                                        )}
                                                                    </span>
                                                                    {commit.branch && (
                                                                        <span className="flex items-center gap-1">
                                                                            <GitBranch className="w-3 h-3" />
                                                                            {
                                                                                commit
                                                                                    .branch
                                                                                    .name
                                                                            }
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <code
                                                            className="text-xs font-mono px-2 py-0.5 rounded"
                                                            style={{
                                                                backgroundColor:
                                                                    "var(--color-bg-primary)",
                                                                color: "var(--color-accent)",
                                                            }}
                                                        >
                                                            {commit.short_sha ||
                                                                commit.sha?.substring(
                                                                    0,
                                                                    7,
                                                                )}
                                                        </code>
                                                    </div>
                                                </button>

                                                {/* Expanded commit detail */}
                                                {expandedCommit ===
                                                    commit.id && (
                                                    <div
                                                        className="ml-7 mt-2 rounded-xl border overflow-hidden"
                                                        style={{
                                                            borderColor:
                                                                "var(--color-border-primary)",
                                                        }}
                                                    >
                                                        {loadingDetail ? (
                                                            <div className="flex justify-center py-6">
                                                                <LoadingSpinner size="sm" />
                                                            </div>
                                                        ) : commitDetail?.pages &&
                                                          commitDetail.pages
                                                              .length > 0 ? (
                                                            <div
                                                                className="divide-y"
                                                                style={{
                                                                    borderColor:
                                                                        "var(--color-border-primary)",
                                                                }}
                                                            >
                                                                {commitDetail.pages.map(
                                                                    (page) => (
                                                                        <div
                                                                            key={
                                                                                page.id
                                                                            }
                                                                            className="px-4 py-3"
                                                                            style={{
                                                                                backgroundColor:
                                                                                    "var(--color-bg-secondary)",
                                                                            }}
                                                                        >
                                                                            <div className="flex items-center gap-2">
                                                                                {getActionIcon(
                                                                                    page.action,
                                                                                )}
                                                                                <span className="text-sm font-medium">
                                                                                    {page.title ||
                                                                                        "Untitled"}
                                                                                </span>
                                                                                <span
                                                                                    className={`text-xs px-1.5 py-0.5 rounded ${
                                                                                        page.action ===
                                                                                        "added"
                                                                                            ? "bg-green-900/40 text-green-400"
                                                                                            : page.action ===
                                                                                                "deleted"
                                                                                              ? "bg-red-900/40 text-red-400"
                                                                                              : "bg-yellow-900/40 text-yellow-400"
                                                                                    }`}
                                                                                >
                                                                                    {
                                                                                        page.action
                                                                                    }
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    ),
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div
                                                                className="px-4 py-6 text-center text-sm"
                                                                style={{
                                                                    color: "var(--color-text-muted)",
                                                                    backgroundColor:
                                                                        "var(--color-bg-secondary)",
                                                                }}
                                                            >
                                                                No page details
                                                                available
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ),
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default CommitHistoryPage;
