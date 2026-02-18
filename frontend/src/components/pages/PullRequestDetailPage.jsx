import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    GitPullRequest,
    GitMerge,
    ArrowLeft,
    Check,
    X,
    Clock,
    MessageSquare,
    Eye,
    Edit3,
    Trash2,
    CheckCircle,
    XCircle,
    FileText,
    FileCode,
    Plus,
    Minus,
    ChevronDown,
    ChevronRight,
    AlertTriangle,
} from "lucide-react";
import {
    getPullRequest,
    mergePullRequest,
    closePullRequest,
    deletePullRequest,
    submitReview,
    resolvePullRequestConflicts,
} from "../../api/pulls";
import ConflictResolver from "./ConflictResolver";
import LoadingSpinner from "../common/LoadingSpinner";
import ConfirmModal from "../common/ConfirmModal";
import { toast } from "sonner";

// Helper to extract text from Tiptap JSON
function extractTextFromTiptap(node) {
    if (!node) return "";
    if (typeof node === "string") return node;
    let text = "";
    if (node.text) text += node.text;
    if (node.content && Array.isArray(node.content)) {
        node.content.forEach((child, i) => {
            if (child.type === "paragraph" && i > 0) text += "\n";
            if (child.type === "heading" && i > 0) text += "\n";
            text += extractTextFromTiptap(child);
        });
    }
    return text;
}

function PullRequestDetailPage() {
    const { siteId, prId } = useParams();
    const navigate = useNavigate();
    const [pr, setPr] = useState(null);
    const [changes, setChanges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [merging, setMerging] = useState(false);
    const [closing, setClosing] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [activeTab, setActiveTab] = useState("conversation");
    const [expandedFiles, setExpandedFiles] = useState({});
    const [reviewBody, setReviewBody] = useState("");
    const [reviewAction, setReviewAction] = useState(null);
    const [submittingReview, setSubmittingReview] = useState(false);

    useEffect(() => {
        fetchPR();
    }, [siteId, prId]);

    // Auto-expand all files when changes load
    useEffect(() => {
        if (changes.length > 0) {
            const expanded = {};
            changes.forEach((_, i) => {
                expanded[i] = true;
            });
            setExpandedFiles(expanded);
        }
    }, [changes]);

    const fetchPR = async () => {
        setLoading(true);
        try {
            const res = await getPullRequest(siteId, prId);
            setPr(res.pull_request);
            setChanges(res.changes || []);
            return res; // Return fresh data so callers can use it immediately
        } catch (err) {
            toast.error("Failed to load pull request");
            console.error(err);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const handleMerge = async () => {
        setMerging(true);
        try {
            await mergePullRequest(siteId, prId);
            toast.success("Pull request merged successfully!");
            fetchPR();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to merge");
        } finally {
            setMerging(false);
        }
    };

    const handleClose = async () => {
        setClosing(true);
        try {
            await closePullRequest(siteId, prId);
            toast.success("Pull request closed");
            fetchPR();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to close");
        } finally {
            setClosing(false);
        }
    };

    const handleDelete = async () => {
        try {
            await deletePullRequest(siteId, prId);
            toast.success("Pull request deleted");
            navigate(`/sites/${siteId}/pulls`);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to delete");
        }
    };

    const handleReview = async (status) => {
        setSubmittingReview(true);
        try {
            await submitReview(siteId, prId, {
                status,
                body: reviewBody || null,
            });
            toast.success(
                status === "approved"
                    ? "PR approved!"
                    : status === "changes_requested"
                      ? "Changes requested"
                      : "Comment submitted",
            );
            setReviewBody("");
            setReviewAction(null);
            fetchPR();
        } catch (err) {
            toast.error(
                err.response?.data?.message || "Failed to submit review",
            );
        } finally {
            setSubmittingReview(false);
        }
    };

    const toggleFile = (index) => {
        setExpandedFiles((prev) => ({ ...prev, [index]: !prev[index] }));
    };

    const timeAgo = (date) => {
        if (!date) return "";
        const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
        if (s < 60) return "just now";
        if (s < 3600) return `${Math.floor(s / 60)}m ago`;
        if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
        return `${Math.floor(s / 86400)}d ago`;
    };

    const getStatusBadge = () => {
        if (!pr) return null;
        if (pr.status === "merged")
            return (
                <span className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-purple-900/40 text-purple-300">
                    <GitMerge className="w-4 h-4" /> Merged
                </span>
            );
        if (pr.status === "closed")
            return (
                <span className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-900/40 text-red-400">
                    <X className="w-4 h-4" /> Closed
                </span>
            );
        if (pr.status === "draft")
            return (
                <span className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-gray-700 text-gray-300">
                    <Edit3 className="w-4 h-4" /> Draft
                </span>
            );
        return (
            <span className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-900/40 text-green-400">
                <GitPullRequest className="w-4 h-4" /> Open
            </span>
        );
    };

    if (loading) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{ backgroundColor: "var(--color-bg-primary)" }}
            >
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!pr) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{
                    backgroundColor: "var(--color-bg-primary)",
                    color: "var(--color-text-muted)",
                }}
            >
                Pull request not found.
            </div>
        );
    }

    return (
        <div
            className="min-h-screen"
            style={{
                backgroundColor: "var(--color-bg-primary)",
                color: "var(--color-text-primary)",
            }}
        >
            <div className="max-w-5xl mx-auto px-6 py-8">
                {/* Back */}
                <button
                    onClick={() => navigate(`/sites/${siteId}/pulls`)}
                    className="flex items-center gap-2 mb-6 text-sm transition-colors hover:opacity-80"
                    style={{ color: "var(--color-text-muted)" }}
                >
                    <ArrowLeft className="w-4 h-4" /> Pull Requests
                </button>

                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold mb-2">
                                {pr.title}{" "}
                                <span
                                    style={{ color: "var(--color-text-muted)" }}
                                >
                                    #{pr.number}
                                </span>
                            </h1>
                            <div className="flex items-center gap-3 flex-wrap">
                                {getStatusBadge()}
                                <span
                                    className="text-sm"
                                    style={{ color: "var(--color-text-muted)" }}
                                >
                                    {pr.author?.name || "Unknown"} wants to
                                    merge
                                    <code
                                        className="mx-1 px-2 py-0.5 rounded text-xs font-mono"
                                        style={{
                                            backgroundColor:
                                                "var(--color-bg-tertiary)",
                                        }}
                                    >
                                        {pr.source_branch?.name}
                                    </code>
                                    into
                                    <code
                                        className="mx-1 px-2 py-0.5 rounded text-xs font-mono"
                                        style={{
                                            backgroundColor:
                                                "var(--color-bg-tertiary)",
                                        }}
                                    >
                                        {pr.target_branch?.name}
                                    </code>
                                </span>
                            </div>
                        </div>
                        {pr.status !== "merged" && (
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="p-2 rounded-lg transition-colors hover:bg-red-900/20 text-red-400"
                                title="Delete PR"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div
                    className="flex items-center gap-1 mb-6 border-b"
                    style={{ borderColor: "var(--color-border-primary)" }}
                >
                    {[
                        {
                            id: "conversation",
                            label: "Conversation",
                            icon: MessageSquare,
                        },
                        changes.some((c) => c.has_conflict) && {
                            id: "resolve",
                            label: "Resolve Conflicts",
                            icon: AlertTriangle,
                            color: "var(--color-warning)",
                        },
                        {
                            id: "files",
                            label: `Files Changed (${changes.length})`,
                            icon: FileCode,
                        },
                    ]
                        .filter(Boolean)
                        .map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium transition-colors ${
                                    activeTab === tab.id
                                        ? "border-current"
                                        : "border-transparent"
                                }`}
                                style={{
                                    color:
                                        activeTab === tab.id
                                            ? tab.color || "var(--color-accent)"
                                            : "var(--color-text-muted)",
                                }}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                </div>

                {/* Conversation Tab */}
                {activeTab === "conversation" && (
                    <div className="space-y-6">
                        {/* Description */}
                        {pr.description && (
                            <div
                                className="rounded-xl border p-5"
                                style={{
                                    borderColor: "var(--color-border-primary)",
                                    backgroundColor:
                                        "var(--color-bg-secondary)",
                                }}
                            >
                                <p className="text-sm whitespace-pre-wrap">
                                    {pr.description}
                                </p>
                            </div>
                        )}

                        {/* Reviews Timeline */}
                        {pr.reviews && pr.reviews.length > 0 && (
                            <div className="space-y-3">
                                {pr.reviews.map((review) => (
                                    <div
                                        key={review.id}
                                        className="flex items-start gap-3 rounded-xl border p-4"
                                        style={{
                                            borderColor:
                                                "var(--color-border-primary)",
                                            backgroundColor:
                                                "var(--color-bg-secondary)",
                                        }}
                                    >
                                        <div
                                            className={`mt-0.5 ${
                                                review.status === "approved"
                                                    ? "text-green-400"
                                                    : review.status ===
                                                        "changes_requested"
                                                      ? "text-orange-400"
                                                      : "text-blue-400"
                                            }`}
                                        >
                                            {review.status === "approved" ? (
                                                <CheckCircle className="w-5 h-5" />
                                            ) : review.status ===
                                              "changes_requested" ? (
                                                <XCircle className="w-5 h-5" />
                                            ) : (
                                                <MessageSquare className="w-5 h-5" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="font-semibold">
                                                    {review.user?.name ||
                                                        "Unknown"}
                                                </span>
                                                <span
                                                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                                        review.status ===
                                                        "approved"
                                                            ? "bg-green-900/40 text-green-400"
                                                            : review.status ===
                                                                "changes_requested"
                                                              ? "bg-orange-900/40 text-orange-400"
                                                              : "bg-blue-900/40 text-blue-400"
                                                    }`}
                                                >
                                                    {review.status ===
                                                    "approved"
                                                        ? "Approved"
                                                        : review.status ===
                                                            "changes_requested"
                                                          ? "Changes requested"
                                                          : "Commented"}
                                                </span>
                                                <span
                                                    style={{
                                                        color: "var(--color-text-muted)",
                                                    }}
                                                >
                                                    {timeAgo(review.created_at)}
                                                </span>
                                            </div>
                                            {review.body && (
                                                <p className="mt-2 text-sm whitespace-pre-wrap">
                                                    {review.body}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Review Form (only for open PRs) */}
                        {pr.status === "open" && (
                            <div
                                className="rounded-xl border p-5"
                                style={{
                                    borderColor: "var(--color-border-primary)",
                                    backgroundColor:
                                        "var(--color-bg-secondary)",
                                }}
                            >
                                <h3 className="text-sm font-semibold mb-3">
                                    Submit Review
                                </h3>
                                <textarea
                                    value={reviewBody}
                                    onChange={(e) =>
                                        setReviewBody(e.target.value)
                                    }
                                    placeholder="Leave a comment..."
                                    rows={3}
                                    className="w-full px-4 py-2.5 rounded-lg border text-sm resize-none mb-3"
                                    style={{
                                        backgroundColor:
                                            "var(--color-bg-primary)",
                                        borderColor:
                                            "var(--color-border-primary)",
                                        color: "var(--color-text-primary)",
                                    }}
                                />
                                <div className="flex items-center gap-2 flex-wrap">
                                    <button
                                        onClick={() => handleReview("approved")}
                                        disabled={submittingReview}
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                                    >
                                        <Check className="w-4 h-4" /> Approve
                                    </button>
                                    <button
                                        onClick={() =>
                                            handleReview("changes_requested")
                                        }
                                        disabled={submittingReview}
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-orange-600 text-white hover:bg-orange-700 transition-colors disabled:opacity-50"
                                    >
                                        <XCircle className="w-4 h-4" /> Request
                                        Changes
                                    </button>
                                    <button
                                        onClick={() =>
                                            handleReview("commented")
                                        }
                                        disabled={
                                            submittingReview ||
                                            !reviewBody.trim()
                                        }
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50"
                                        style={{
                                            borderColor:
                                                "var(--color-border-primary)",
                                            color: "var(--color-text-muted)",
                                        }}
                                    >
                                        <MessageSquare className="w-4 h-4" />{" "}
                                        Comment
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Merge Actions */}
                        {pr.status === "open" && (
                            <div
                                className="rounded-xl border p-5"
                                style={{
                                    borderColor: "var(--color-border-primary)",
                                    backgroundColor:
                                        "var(--color-bg-secondary)",
                                }}
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        {changes.some((c) => c.has_conflict) ? (
                                            <div className="flex items-center gap-2 text-orange-400 text-sm font-medium">
                                                <AlertTriangle className="w-5 h-5" />{" "}
                                                This branch has conflicts that
                                                must be resolved
                                            </div>
                                        ) : pr.is_approved ? (
                                            <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                                                <CheckCircle className="w-5 h-5" />{" "}
                                                All reviewers have approved
                                            </div>
                                        ) : pr.has_changes_requested ? (
                                            <div className="flex items-center gap-2 text-orange-400 text-sm font-medium">
                                                <XCircle className="w-5 h-5" />{" "}
                                                Changes have been requested
                                            </div>
                                        ) : (
                                            <div
                                                className="flex items-center gap-2 text-sm"
                                                style={{
                                                    color: "var(--color-text-muted)",
                                                }}
                                            >
                                                <Clock className="w-5 h-5" />{" "}
                                                Waiting for review
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={
                                                changes.some(
                                                    (c) => c.has_conflict,
                                                )
                                                    ? () =>
                                                          setActiveTab(
                                                              "resolve",
                                                          )
                                                    : handleMerge
                                            }
                                            disabled={merging}
                                            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
                                            style={{
                                                backgroundColor: changes.some(
                                                    (c) => c.has_conflict,
                                                )
                                                    ? "#f97316"
                                                    : pr.is_approved
                                                      ? "#22c55e"
                                                      : "var(--color-accent)",
                                            }}
                                        >
                                            {changes.some(
                                                (c) => c.has_conflict,
                                            ) ? (
                                                <>
                                                    <AlertTriangle className="w-4 h-4" />{" "}
                                                    Resolve Conflicts
                                                </>
                                            ) : (
                                                <>
                                                    <GitMerge className="w-4 h-4" />{" "}
                                                    {merging
                                                        ? "Merging..."
                                                        : "Merge Pull Request"}
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={handleClose}
                                            disabled={closing}
                                            className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all hover:bg-red-900/20 text-red-400 border"
                                            style={{
                                                borderColor:
                                                    "var(--color-border-primary)",
                                            }}
                                        >
                                            <X className="w-4 h-4" />
                                            {closing ? "Closing..." : "Close"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Merged Info */}
                        {pr.status === "merged" && (
                            <div
                                className="rounded-xl border p-5 bg-purple-900/10"
                                style={{
                                    borderColor: "var(--color-border-primary)",
                                }}
                            >
                                <div className="flex items-center gap-2 text-purple-300 text-sm">
                                    <GitMerge className="w-5 h-5" />
                                    <span className="font-medium">
                                        {pr.merged_by_user?.name || "Someone"}
                                    </span>
                                    merged this {timeAgo(pr.merged_at)}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Resolve Tab */}
                {activeTab === "resolve" && (
                    <ConflictResolver
                        siteId={siteId}
                        prId={prId}
                        conflicts={changes.filter((c) => c.has_conflict)}
                        onResolved={async () => {
                            const fresh = await fetchPR();
                            // Use fresh data (not stale state) to decide tab
                            const stillHasConflicts = (
                                fresh?.changes || []
                            ).some((c) => c.has_conflict);
                            if (!stillHasConflicts) {
                                setActiveTab("conversation");
                            }
                        }}
                    />
                )}

                {/* Files Changed Tab */}
                {activeTab === "files" && (
                    <div className="space-y-4">
                        {changes.length === 0 ? (
                            <div
                                className="text-center py-12"
                                style={{ color: "var(--color-text-muted)" }}
                            >
                                <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
                                <p>No files changed</p>
                            </div>
                        ) : (
                            changes.map((change, index) => (
                                <div
                                    key={index}
                                    className="rounded-xl border overflow-hidden"
                                    style={{
                                        borderColor:
                                            "var(--color-border-primary)",
                                    }}
                                >
                                    {/* File Header */}
                                    <button
                                        onClick={() => toggleFile(index)}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors"
                                        style={{
                                            backgroundColor:
                                                "var(--color-bg-tertiary)",
                                        }}
                                    >
                                        {expandedFiles[index] ? (
                                            <ChevronDown className="w-4 h-4" />
                                        ) : (
                                            <ChevronRight className="w-4 h-4" />
                                        )}
                                        <span
                                            className={`text-xs px-2 py-0.5 rounded font-mono ${
                                                change.type === "added"
                                                    ? "bg-green-900/40 text-green-400"
                                                    : change.type === "deleted"
                                                      ? "bg-red-900/40 text-red-400"
                                                      : "bg-yellow-900/40 text-yellow-400"
                                            }`}
                                        >
                                            {change.type === "added"
                                                ? "A"
                                                : change.type === "deleted"
                                                  ? "D"
                                                  : "M"}
                                        </span>
                                        <span>
                                            {change.source_title ||
                                                change.target_title ||
                                                "Untitled"}
                                        </span>
                                    </button>

                                    {/* File Diff */}
                                    {expandedFiles[index] && (
                                        <div className="bg-[var(--color-bg-secondary)] border-t border-[var(--color-border-primary)] overflow-x-auto">
                                            {/* Diff Content */}
                                            {(() => {
                                                const oldText =
                                                    change.type === "added"
                                                        ? ""
                                                        : extractTextFromTiptap(
                                                              change.target_content,
                                                          );
                                                const newText =
                                                    change.type === "deleted"
                                                        ? ""
                                                        : extractTextFromTiptap(
                                                              change.source_content,
                                                          );

                                                const oldLines =
                                                    oldText.split("\n");
                                                const newLines =
                                                    newText.split("\n");

                                                // Very simple line-based diff logic
                                                // In a production app, use a library like 'diff' or 'jsdiff'
                                                const diff = [];
                                                let o = 0,
                                                    n = 0;

                                                while (
                                                    o < oldLines.length ||
                                                    n < newLines.length
                                                ) {
                                                    if (
                                                        o < oldLines.length &&
                                                        n < newLines.length &&
                                                        oldLines[o] ===
                                                            newLines[n]
                                                    ) {
                                                        diff.push({
                                                            type: "unchanged",
                                                            text: oldLines[o],
                                                            oldL: o + 1,
                                                            newL: n + 1,
                                                        });
                                                        o++;
                                                        n++;
                                                    } else if (
                                                        n < newLines.length &&
                                                        (o >= oldLines.length ||
                                                            !oldLines
                                                                .slice(o)
                                                                .includes(
                                                                    newLines[n],
                                                                ))
                                                    ) {
                                                        diff.push({
                                                            type: "added",
                                                            text: newLines[n],
                                                            oldL: null,
                                                            newL: n + 1,
                                                        });
                                                        n++;
                                                    } else {
                                                        diff.push({
                                                            type: "deleted",
                                                            text: oldLines[o],
                                                            oldL: o + 1,
                                                            newL: null,
                                                        });
                                                        o++;
                                                    }
                                                }

                                                return (
                                                    <div className="font-mono text-[12px] leading-relaxed">
                                                        <table className="w-full border-collapse">
                                                            <tbody>
                                                                {diff.map(
                                                                    (
                                                                        line,
                                                                        lid,
                                                                    ) => (
                                                                        <tr
                                                                            key={
                                                                                lid
                                                                            }
                                                                            className={`
                                                                            ${line.type === "added" ? "bg-green-500/10 hover:bg-green-500/20" : ""}
                                                                            ${line.type === "deleted" ? "bg-red-500/10 hover:bg-red-500/20" : ""}
                                                                            ${line.type === "unchanged" ? "hover:bg-[var(--color-bg-hover)]" : ""}
                                                                        `}
                                                                        >
                                                                            <td className="w-10 text-right px-2 py-0 border-r border-[var(--color-border-primary)] select-none text-[var(--color-text-muted)] opacity-50">
                                                                                {
                                                                                    line.oldL
                                                                                }
                                                                            </td>
                                                                            <td className="w-10 text-right px-2 py-0 border-r border-[var(--color-border-primary)] select-none text-[var(--color-text-muted)] opacity-50">
                                                                                {
                                                                                    line.newL
                                                                                }
                                                                            </td>
                                                                            <td className="w-6 text-center select-none py-0">
                                                                                {line.type ===
                                                                                "added"
                                                                                    ? "+"
                                                                                    : line.type ===
                                                                                        "deleted"
                                                                                      ? "-"
                                                                                      : ""}
                                                                            </td>
                                                                            <td className="px-4 py-0 whitespace-pre">
                                                                                {
                                                                                    line.text
                                                                                }
                                                                            </td>
                                                                        </tr>
                                                                    ),
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Delete Confirm Modal */}
            <ConfirmModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="Delete Pull Request?"
                message={`Are you sure you want to delete PR #${pr.number} "${pr.title}"? This action cannot be undone.`}
                confirmText="Delete"
                confirmStyle="danger"
            />
        </div>
    );
}

export default PullRequestDetailPage;
