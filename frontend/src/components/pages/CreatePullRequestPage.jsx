import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    GitPullRequest,
    ArrowLeft,
    ArrowRight,
    FileText,
    Plus,
    Minus,
    FileCode,
    Check,
    AlertTriangle,
} from "lucide-react";
import { compareBranches, createPullRequest } from "../../api/pulls";
import { getBranches } from "../../api/sites";
import LoadingSpinner from "../common/LoadingSpinner";
import { toast } from "sonner";

function CreatePullRequestPage() {
    const { siteSlug } = useParams();
    const navigate = useNavigate();
    const [branches, setBranches] = useState([]);
    const [sourceBranch, setSourceBranch] = useState("");
    const [targetBranch, setTargetBranch] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [changes, setChanges] = useState(null);
    const [comparing, setComparing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBranches();
    }, [siteSlug]);

    const loadBranches = async () => {
        try {
            const res = await getBranches(siteSlug);
            const branchList = res.data || res || [];
            setBranches(branchList);
            const defaultBranch = branchList.find((b) => b.is_default);
            if (defaultBranch) setTargetBranch(defaultBranch.id);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (sourceBranch && targetBranch && sourceBranch !== targetBranch) {
            doCompare();
        } else {
            setChanges(null);
        }
    }, [sourceBranch, targetBranch]);

    const doCompare = async () => {
        setComparing(true);
        try {
            const res = await compareBranches(
                siteSlug,
                sourceBranch,
                targetBranch,
            );
            setChanges(res);
            if (!title && res.changes?.length > 0) {
                const srcName =
                    branches.find((b) => b.id === sourceBranch)?.name ||
                    "branch";
                setTitle(`Merge ${srcName}`);
            }
        } catch (err) {
            console.error(err);
            setChanges(null);
        } finally {
            setComparing(false);
        }
    };

    const handleSubmit = async (asDraft = false) => {
        if (!title.trim()) {
            toast.error("Please enter a title");
            return;
        }
        setSubmitting(true);
        try {
            const res = await createPullRequest(siteSlug, {
                source_branch_id: sourceBranch,
                target_branch_id: targetBranch,
                title: title.trim(),
                description: description.trim() || null,
                status: asDraft ? "draft" : "open",
            });
            toast.success("Pull request created!");
            navigate(`/sites/${siteSlug}/pulls/${res.data.id}`);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to create PR");
        } finally {
            setSubmitting(false);
        }
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

    return (
        <div
            className="min-h-screen"
            style={{
                backgroundColor: "var(--color-bg-primary)",
                color: "var(--color-text-primary)",
            }}
        >
            <div className="max-w-4xl mx-auto px-6 py-8">
                {/* Back */}
                <button
                    onClick={() => navigate(`/sites/${siteSlug}/pulls`)}
                    className="flex items-center gap-2 mb-6 text-sm transition-colors hover:opacity-80"
                    style={{ color: "var(--color-text-muted)" }}
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Pull Requests
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <GitPullRequest
                        className="w-6 h-6"
                        style={{ color: "var(--color-accent)" }}
                    />
                    <h1 className="text-2xl font-bold">New Pull Request</h1>
                </div>

                {/* Branch Selector */}
                <div
                    className="rounded-xl border p-6 mb-6"
                    style={{
                        borderColor: "var(--color-border-primary)",
                        backgroundColor: "var(--color-bg-secondary)",
                    }}
                >
                    <h2
                        className="text-sm font-semibold mb-4"
                        style={{ color: "var(--color-text-muted)" }}
                    >
                        Compare branches
                    </h2>
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex-1 min-w-[200px]">
                            <label
                                className="text-xs font-medium mb-1 block"
                                style={{ color: "var(--color-text-muted)" }}
                            >
                                Source (from)
                            </label>
                            <select
                                value={sourceBranch}
                                onChange={(e) =>
                                    setSourceBranch(e.target.value)
                                }
                                className="w-full px-3 py-2 rounded-lg border text-sm"
                                style={{
                                    backgroundColor: "var(--color-bg-primary)",
                                    borderColor: "var(--color-border-primary)",
                                    color: "var(--color-text-primary)",
                                }}
                            >
                                <option value="">Select branch...</option>
                                {branches
                                    .filter((b) => b.id !== targetBranch)
                                    .map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.name}
                                        </option>
                                    ))}
                            </select>
                        </div>
                        <ArrowRight
                            className="w-5 h-5 mt-5"
                            style={{ color: "var(--color-text-muted)" }}
                        />
                        <div className="flex-1 min-w-[200px]">
                            <label
                                className="text-xs font-medium mb-1 block"
                                style={{ color: "var(--color-text-muted)" }}
                            >
                                Target (into)
                            </label>
                            <select
                                value={targetBranch}
                                onChange={(e) =>
                                    setTargetBranch(e.target.value)
                                }
                                className="w-full px-3 py-2 rounded-lg border text-sm"
                                style={{
                                    backgroundColor: "var(--color-bg-primary)",
                                    borderColor: "var(--color-border-primary)",
                                    color: "var(--color-text-primary)",
                                }}
                            >
                                <option value="">Select branch...</option>
                                {branches
                                    .filter((b) => b.id !== sourceBranch)
                                    .map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.name}
                                            {b.is_default ? " (default)" : ""}
                                        </option>
                                    ))}
                            </select>
                        </div>
                    </div>

                    {/* Comparison Result */}
                    {comparing && (
                        <div
                            className="flex items-center gap-2 mt-4 text-sm"
                            style={{ color: "var(--color-text-muted)" }}
                        >
                            <LoadingSpinner size="sm" /> Comparing branches...
                        </div>
                    )}
                    {changes && !comparing && (
                        <div
                            className="mt-4 text-sm"
                            style={{ color: "var(--color-text-muted)" }}
                        >
                            {changes.changes?.length > 0 ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <FileCode className="w-4 h-4" />
                                        <span>
                                            {changes.changes.length} file(s)
                                            changed
                                        </span>
                                        <span className="text-green-400">
                                            {
                                                changes.changes.filter(
                                                    (c) => c.type === "added",
                                                ).length
                                            }{" "}
                                            added
                                        </span>
                                        <span className="text-yellow-400">
                                            {
                                                changes.changes.filter(
                                                    (c) =>
                                                        c.type === "modified",
                                                ).length
                                            }{" "}
                                            modified
                                        </span>
                                        <span className="text-red-400">
                                            {
                                                changes.changes.filter(
                                                    (c) => c.type === "deleted",
                                                ).length
                                            }{" "}
                                            deleted
                                        </span>
                                    </div>

                                    {changes.changes.some(
                                        (c) => c.has_conflict,
                                    ) ? (
                                        <div className="flex items-center gap-2 text-orange-400 font-medium">
                                            <AlertTriangle className="w-4 h-4" />
                                            <span>
                                                This pull request will have
                                                merge conflicts.
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-green-400 font-medium">
                                            <Check className="w-4 h-4" />
                                            <span>
                                                Able to merge automatically.
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p>
                                    ✅ These branches are identical. Nothing to
                                    merge.
                                </p>
                            )}
                        </div>
                    )}
                    {sourceBranch &&
                        targetBranch &&
                        sourceBranch === targetBranch && (
                            <p className="mt-4 text-sm text-orange-400">
                                Source and target branches must be different.
                            </p>
                        )}
                </div>

                {/* PR Form */}
                {changes && changes.changes?.length > 0 && (
                    <div
                        className="rounded-xl border p-6"
                        style={{
                            borderColor: "var(--color-border-primary)",
                            backgroundColor: "var(--color-bg-secondary)",
                        }}
                    >
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-1 block">
                                    Title
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Enter a descriptive title..."
                                    className="w-full px-4 py-2.5 rounded-lg border text-sm"
                                    style={{
                                        backgroundColor:
                                            "var(--color-bg-primary)",
                                        borderColor:
                                            "var(--color-border-primary)",
                                        color: "var(--color-text-primary)",
                                    }}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">
                                    Description{" "}
                                    <span
                                        className="font-normal"
                                        style={{
                                            color: "var(--color-text-muted)",
                                        }}
                                    >
                                        (optional)
                                    </span>
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) =>
                                        setDescription(e.target.value)
                                    }
                                    placeholder="Describe your changes..."
                                    rows={4}
                                    className="w-full px-4 py-2.5 rounded-lg border text-sm resize-none"
                                    style={{
                                        backgroundColor:
                                            "var(--color-bg-primary)",
                                        borderColor:
                                            "var(--color-border-primary)",
                                        color: "var(--color-text-primary)",
                                    }}
                                />
                            </div>
                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    onClick={() => handleSubmit(false)}
                                    disabled={submitting || !title.trim()}
                                    className="px-5 py-2.5 rounded-lg font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
                                    style={{
                                        backgroundColor: "var(--color-accent)",
                                    }}
                                >
                                    {submitting
                                        ? "Creating..."
                                        : "Create Pull Request"}
                                </button>
                                <button
                                    onClick={() => handleSubmit(true)}
                                    disabled={submitting || !title.trim()}
                                    className="px-5 py-2.5 rounded-lg font-medium transition-all hover:opacity-80 border"
                                    style={{
                                        borderColor:
                                            "var(--color-border-primary)",
                                        color: "var(--color-text-muted)",
                                    }}
                                >
                                    Create Draft
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CreatePullRequestPage;
