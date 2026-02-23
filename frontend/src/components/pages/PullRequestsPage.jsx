import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
    GitPullRequest,
    Plus,
    Check,
    X,
    GitMerge,
    Clock,
    MessageSquare,
    Filter,
} from "lucide-react";
import { getPullRequests } from "../../api/pulls";
import LoadingSpinner from "../common/LoadingSpinner";

function PullRequestsPage() {
    const { siteSlug } = useParams();
    const navigate = useNavigate();
    const [pullRequests, setPullRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("open");

    useEffect(() => {
        fetchPRs();
    }, [siteSlug, statusFilter]);

    const fetchPRs = async () => {
        setLoading(true);
        try {
            const res = await getPullRequests(siteSlug, statusFilter);
            setPullRequests(res.data || []);
        } catch (err) {
            console.error("Failed to fetch pull requests:", err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (pr) => {
        if (pr.status === "merged")
            return <GitMerge className="w-4 h-4 text-purple-400" />;
        if (pr.status === "closed")
            return <X className="w-4 h-4 text-red-400" />;
        if (pr.is_approved) return <Check className="w-4 h-4 text-green-400" />;
        return <GitPullRequest className="w-4 h-4 text-green-400" />;
    };

    const getStatusColor = (pr) => {
        if (pr.status === "merged") return "text-purple-400";
        if (pr.status === "closed") return "text-red-400";
        return "text-green-400";
    };

    const timeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        if (seconds < 60) return "just now";
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    const openCount = pullRequests.filter((pr) => pr.status === "open").length;
    const closedCount = pullRequests.filter(
        (pr) => pr.status !== "open",
    ).length;

    return (
        <div
            className="min-h-screen"
            style={{
                backgroundColor: "var(--color-bg-primary)",
                color: "var(--color-text-primary)",
            }}
        >
            <div className="max-w-5xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <GitPullRequest
                            className="w-6 h-6"
                            style={{ color: "var(--color-accent)" }}
                        />
                        <h1 className="text-2xl font-bold">Pull Requests</h1>
                    </div>
                    <button
                        onClick={() => navigate(`/sites/${siteSlug}/pulls/new`)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white transition-all hover:opacity-90"
                        style={{ backgroundColor: "var(--color-accent)" }}
                    >
                        <Plus className="w-4 h-4" />
                        New Pull Request
                    </button>
                </div>

                {/* Status Tabs */}
                <div
                    className="flex items-center gap-4 mb-6 border-b"
                    style={{ borderColor: "var(--color-border-primary)" }}
                >
                    <button
                        onClick={() => setStatusFilter("open")}
                        className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors font-medium ${
                            statusFilter === "open"
                                ? "border-green-400 text-green-400"
                                : "border-transparent"
                        }`}
                        style={
                            statusFilter !== "open"
                                ? { color: "var(--color-text-muted)" }
                                : {}
                        }
                    >
                        <GitPullRequest className="w-4 h-4" />
                        Open
                    </button>
                    <button
                        onClick={() => setStatusFilter("closed")}
                        className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors font-medium ${
                            statusFilter === "closed"
                                ? "border-red-400 text-red-400"
                                : "border-transparent"
                        }`}
                        style={
                            statusFilter !== "closed"
                                ? { color: "var(--color-text-muted)" }
                                : {}
                        }
                    >
                        <Check className="w-4 h-4" />
                        Closed
                    </button>
                    <button
                        onClick={() => setStatusFilter("merged")}
                        className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors font-medium ${
                            statusFilter === "merged"
                                ? "border-purple-400 text-purple-400"
                                : "border-transparent"
                        }`}
                        style={
                            statusFilter !== "merged"
                                ? { color: "var(--color-text-muted)" }
                                : {}
                        }
                    >
                        <GitMerge className="w-4 h-4" />
                        Merged
                    </button>
                </div>

                {/* PR List */}
                {loading ? (
                    <div className="flex justify-center py-16">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : pullRequests.length === 0 ? (
                    <div
                        className="text-center py-16"
                        style={{ color: "var(--color-text-muted)" }}
                    >
                        <GitPullRequest className="w-12 h-12 mx-auto mb-4 opacity-40" />
                        <p className="text-lg font-medium mb-2">
                            No {statusFilter} pull requests
                        </p>
                        <p className="text-sm">
                            {statusFilter === "open"
                                ? "Create a pull request to propose changes from one branch to another."
                                : `No ${statusFilter} pull requests found.`}
                        </p>
                    </div>
                ) : (
                    <div
                        className="rounded-xl border overflow-hidden"
                        style={{
                            borderColor: "var(--color-border-primary)",
                            backgroundColor: "var(--color-bg-secondary)",
                        }}
                    >
                        {pullRequests.map((pr, index) => (
                            <Link
                                key={pr.id}
                                to={`/sites/${siteSlug}/pulls/${pr.id}`}
                                className="flex items-start gap-4 px-5 py-4 transition-colors hover:opacity-90 group"
                                style={{
                                    backgroundColor:
                                        "var(--color-bg-secondary)",
                                    borderBottom:
                                        index < pullRequests.length - 1
                                            ? "1px solid var(--color-border-primary)"
                                            : "none",
                                }}
                                onMouseEnter={(e) =>
                                    (e.currentTarget.style.backgroundColor =
                                        "var(--color-bg-hover)")
                                }
                                onMouseLeave={(e) =>
                                    (e.currentTarget.style.backgroundColor =
                                        "var(--color-bg-secondary)")
                                }
                            >
                                {/* Status Icon */}
                                <div className="mt-1">{getStatusIcon(pr)}</div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-base font-semibold group-hover:text-blue-400 transition-colors truncate">
                                            {pr.title}
                                        </h3>
                                        {pr.status === "draft" && (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
                                                Draft
                                            </span>
                                        )}
                                        {pr.is_approved &&
                                            pr.status === "open" && (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-green-900/40 text-green-400 flex items-center gap-1">
                                                    <Check className="w-3 h-3" />{" "}
                                                    Approved
                                                </span>
                                            )}
                                        {pr.has_changes_requested && (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-orange-900/40 text-orange-400">
                                                Changes requested
                                            </span>
                                        )}
                                    </div>
                                    <p
                                        className="text-sm mt-1"
                                        style={{
                                            color: "var(--color-text-muted)",
                                        }}
                                    >
                                        #{pr.number} opened{" "}
                                        {timeAgo(pr.created_at)} by{" "}
                                        {pr.author?.name || "Unknown"}
                                    </p>
                                    <div
                                        className="flex items-center gap-3 mt-1 text-xs"
                                        style={{
                                            color: "var(--color-text-muted)",
                                        }}
                                    >
                                        <span className="font-mono">
                                            {pr.source_branch?.name}
                                        </span>
                                        <span>→</span>
                                        <span className="font-mono">
                                            {pr.target_branch?.name}
                                        </span>
                                        {pr.review_count > 0 && (
                                            <span className="flex items-center gap-1">
                                                <MessageSquare className="w-3 h-3" />{" "}
                                                {pr.review_count}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Author Avatar */}
                                <div className="flex-shrink-0">
                                    {pr.author?.avatar_url ? (
                                        <img
                                            src={pr.author.avatar_url}
                                            alt=""
                                            className="w-6 h-6 rounded-full"
                                        />
                                    ) : (
                                        <div
                                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                                            style={{
                                                backgroundColor:
                                                    "var(--color-accent)",
                                                color: "white",
                                            }}
                                        >
                                            {(pr.author?.name ||
                                                "?")[0].toUpperCase()}
                                        </div>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default PullRequestsPage;
