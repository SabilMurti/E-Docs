import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    GitPullRequest,
    Clock,
    User,
    ArrowLeft,
    Check,
    X,
    GitMerge,
    Plus,
    ArrowRight,
    Activity,
    Circle,
} from "lucide-react";
import { getChangeRequests } from "../../api/pages";
import LoadingSpinner from "../common/LoadingSpinner";

const STATUS_CONFIG = {
    open: {
        label: "Open",
        icon: GitPullRequest,
        color: "var(--color-success)",
        bg: "var(--color-success-light)",
        filterColor: "#22c55e",
    },
    draft: {
        label: "Draft",
        icon: Circle,
        color: "var(--color-info)",
        bg: "var(--color-info-light)",
        filterColor: "#3b82f6",
    },
    merged: {
        label: "Merged",
        icon: GitMerge,
        color: "#a855f7",
        bg: "#f3e8ff",
        filterColor: "#a855f7",
    },
    rejected: {
        label: "Rejected",
        icon: X,
        color: "var(--color-error)",
        bg: "var(--color-error-light)",
        filterColor: "#ef4444",
    },
};

function timeAgo(dateStr) {
    const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
    });
}

function StatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.open;
    const Icon = cfg.icon;
    return (
        <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ color: cfg.color, backgroundColor: cfg.bg }}
        >
            <Icon size={10} />
            {cfg.label}
        </span>
    );
}

function RequestCard({ request, onClick }) {
    const cfg = STATUS_CONFIG[request.status] || STATUS_CONFIG.open;

    return (
        <div
            onClick={onClick}
            className="group relative flex items-start gap-4 px-5 py-4 cursor-pointer transition-all duration-150"
            style={{
                borderBottom: "1px solid var(--color-border-primary)",
                backgroundColor: "var(--color-bg-elevated)",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                    "var(--color-bg-hover)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                    "var(--color-bg-elevated)";
            }}
        >
            {/* Status Indicator Line */}
            <div
                className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: cfg.color }}
            />

            {/* Icon */}
            <div
                className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                    backgroundColor: cfg.bg,
                    color: cfg.color,
                }}
            >
                <GitPullRequest size={15} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-1.5">
                    <h3
                        className="text-sm font-semibold leading-snug group-hover:underline transition-colors truncate"
                        style={{ color: "var(--color-text-primary)" }}
                    >
                        {request.title || "Untitled Update"}
                    </h3>
                    <StatusBadge status={request.status} />
                </div>

                {request.description && (
                    <p
                        className="text-xs line-clamp-2 mb-2 leading-relaxed"
                        style={{ color: "var(--color-text-secondary)" }}
                    >
                        {request.description}
                    </p>
                )}

                <div
                    className="flex items-center gap-3 text-xs flex-wrap"
                    style={{ color: "var(--color-text-muted)" }}
                >
                    <span className="flex items-center gap-1">
                        <User size={11} />
                        {request.author?.name || request.user?.name || "Unknown"}
                    </span>
                    <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {timeAgo(request.created_at)}
                    </span>
                    {request.source_branch?.name && (
                        <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[10px]"
                            style={{
                                backgroundColor: "var(--color-bg-tertiary)",
                                color: "var(--color-text-secondary)",
                                border: "1px solid var(--color-border-primary)",
                            }}
                        >
                            {request.source_branch.name}
                            <ArrowRight size={9} />
                            {request.target_branch?.name || "main"}
                        </span>
                    )}
                </div>
            </div>

            {/* Arrow hint */}
            <div
                className="flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: "var(--color-text-muted)" }}
            >
                <ArrowRight size={15} />
            </div>
        </div>
    );
}

export default function ChangeRequestsList() {
    const { siteSlug, pageSlug } = useParams();
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState("all");

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const data = await getChangeRequests(pageSlug);
                setRequests(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Failed to fetch requests:", error);
                setRequests([]);
            } finally {
                setIsLoading(false);
            }
        };

        if (pageSlug) fetchRequests();
    }, [pageSlug]);

    const counts = {
        all: requests.length,
        open: requests.filter((r) => r.status === "open").length,
        draft: requests.filter((r) => r.status === "draft").length,
        merged: requests.filter((r) => r.status === "merged").length,
        rejected: requests.filter((r) => r.status === "rejected").length,
    };

    const filtered =
        activeFilter === "all"
            ? requests
            : requests.filter((r) => r.status === activeFilter);

    const tabs = [
        { key: "all", label: "All", count: counts.all },
        {
            key: "open",
            label: "Open",
            count: counts.open,
            color: STATUS_CONFIG.open.filterColor,
        },
        {
            key: "draft",
            label: "Draft",
            count: counts.draft,
            color: STATUS_CONFIG.draft.filterColor,
        },
        {
            key: "merged",
            label: "Merged",
            count: counts.merged,
            color: STATUS_CONFIG.merged.filterColor,
        },
        {
            key: "rejected",
            label: "Rejected",
            count: counts.rejected,
            color: STATUS_CONFIG.rejected.filterColor,
        },
    ];

    return (
        <div
            className="min-h-screen"
            style={{ backgroundColor: "var(--color-bg-primary)" }}
        >
            <div className="max-w-4xl mx-auto px-6 py-8">
                {/* Back Navigation */}
                <button
                    onClick={() =>
                        navigate(`/sites/${siteSlug}/pages/${pageSlug}`)
                    }
                    className="inline-flex items-center gap-1.5 text-sm mb-6 transition-colors"
                    style={{ color: "var(--color-text-muted)" }}
                    onMouseEnter={(e) =>
                        (e.currentTarget.style.color =
                            "var(--color-text-primary)")
                    }
                    onMouseLeave={(e) =>
                        (e.currentTarget.style.color =
                            "var(--color-text-muted)")
                    }
                >
                    <ArrowLeft size={15} />
                    Back to Page
                </button>

                {/* Page Header */}
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <div className="flex items-center gap-2.5 mb-1">
                            <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center"
                                style={{
                                    backgroundColor: "var(--color-accent-light)",
                                    color: "var(--color-accent)",
                                }}
                            >
                                <GitPullRequest size={16} />
                            </div>
                            <h1
                                className="text-xl font-bold"
                                style={{ color: "var(--color-text-primary)" }}
                            >
                                Change Requests
                            </h1>
                        </div>
                        <p
                            className="text-sm"
                            style={{ color: "var(--color-text-muted)" }}
                        >
                            Proposed edits awaiting review for this page
                        </p>
                    </div>

                    {/* Stats + New Button */}
                    <div className="flex items-center gap-3">
                        {counts.open > 0 && (
                            <div
                                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg"
                                style={{
                                    backgroundColor: "#dcfce7",
                                    color: "#15803d",
                                    border: "1px solid #bbf7d0",
                                }}
                            >
                                <Activity size={12} />
                                {counts.open} open
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Panel */}
                <div
                    className="rounded-xl overflow-hidden"
                    style={{
                        border: "1px solid var(--color-border-primary)",
                        backgroundColor: "var(--color-bg-elevated)",
                        boxShadow: "var(--shadow-sm)",
                    }}
                >
                    {/* Filter Tabs */}
                    <div
                        className="flex items-center px-4 gap-1 border-b"
                        style={{
                            borderColor: "var(--color-border-primary)",
                            backgroundColor: "var(--color-bg-secondary)",
                        }}
                    >
                        {tabs.map((tab) => {
                            const isActive = activeFilter === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveFilter(tab.key)}
                                    className="relative flex items-center gap-1.5 px-3 py-3 text-xs font-medium transition-colors border-b-2"
                                    style={{
                                        borderBottomColor: isActive
                                            ? tab.color || "var(--color-accent)"
                                            : "transparent",
                                        color: isActive
                                            ? tab.color || "var(--color-accent)"
                                            : "var(--color-text-muted)",
                                        marginBottom: "-1px",
                                    }}
                                >
                                    {tab.label}
                                    {tab.count > 0 && (
                                        <span
                                            className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                                            style={{
                                                backgroundColor: isActive
                                                    ? tab.color
                                                        ? `${tab.color}20`
                                                        : "var(--color-accent-muted)"
                                                    : "var(--color-bg-tertiary)",
                                                color: isActive
                                                    ? tab.color ||
                                                      "var(--color-accent)"
                                                    : "var(--color-text-muted)",
                                            }}
                                        >
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Content */}
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <LoadingSpinner />
                            <p
                                className="text-sm"
                                style={{ color: "var(--color-text-muted)" }}
                            >
                                Loading change requests...
                            </p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <EmptyState
                            filter={activeFilter}
                            siteSlug={siteSlug}
                            pageSlug={pageSlug}
                            navigate={navigate}
                        />
                    ) : (
                        <div>
                            {filtered.map((request) => (
                                <RequestCard
                                    key={request.id}
                                    request={request}
                                    onClick={() =>
                                        navigate(
                                            `/sites/${siteSlug}/pages/${pageSlug}/requests/${request.id}`
                                        )
                                    }
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer summary */}
                {!isLoading && requests.length > 0 && (
                    <p
                        className="text-xs text-center mt-4"
                        style={{ color: "var(--color-text-muted)" }}
                    >
                        {filtered.length} of {requests.length} request
                        {requests.length !== 1 ? "s" : ""} shown
                    </p>
                )}
            </div>
        </div>
    );
}

function EmptyState({ filter, siteSlug, pageSlug, navigate }) {
    const isFiltered = filter !== "all";

    return (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                style={{
                    backgroundColor: "var(--color-bg-tertiary)",
                    color: "var(--color-text-muted)",
                }}
            >
                <GitPullRequest size={28} />
            </div>
            <h3
                className="text-base font-semibold mb-2"
                style={{ color: "var(--color-text-primary)" }}
            >
                {isFiltered
                    ? `No ${filter} change requests`
                    : "No change requests yet"}
            </h3>
            <p
                className="text-sm max-w-xs leading-relaxed mb-6"
                style={{ color: "var(--color-text-muted)" }}
            >
                {isFiltered
                    ? `There are no change requests with "${filter}" status for this page.`
                    : "Change requests let contributors propose edits that require review before going live."}
            </p>
            {!isFiltered && (
                <button
                    onClick={() =>
                        navigate(`/sites/${siteSlug}/pages/${pageSlug}`)
                    }
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all text-white"
                    style={{ backgroundColor: "var(--color-accent)" }}
                    onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor =
                            "var(--color-accent-hover)")
                    }
                    onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor =
                            "var(--color-accent)")
                    }
                >
                    <ArrowLeft size={14} />
                    Go back to page
                </button>
            )}
        </div>
    );
}
