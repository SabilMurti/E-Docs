import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    GitBranch,
    Plus,
    Trash2,
    Search,
    ArrowLeft,
    Clock,
    User,
    CheckCircle2,
    MoreHorizontal,
    ExternalLink,
} from "lucide-react";
import { getBranches, createBranch, deleteBranch } from "../../api/branches";
import LoadingSpinner from "../common/LoadingSpinner";
import ConfirmModal from "../common/ConfirmModal";
import InputModal from "../common/InputModal";
import { toast } from "sonner";

function BranchesPage() {
    const { siteId } = useParams();
    const navigate = useNavigate();
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [branchToDelete, setBranchToDelete] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchBranches = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getBranches(siteId);
            setBranches(data.data || []);
        } catch (err) {
            toast.error("Failed to load branches");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [siteId]);

    useEffect(() => {
        fetchBranches();
    }, [fetchBranches]);

    const handleCreateBranch = async (name) => {
        if (!name) return;
        setIsSubmitting(true);
        try {
            // Find default branch to use as source
            const defaultBranch = branches.find((b) => b.is_default);
            await createBranch(siteId, {
                name: name.toLowerCase().replace(/\s+/g, "-"),
                source_branch: defaultBranch?.name || "main",
            });
            toast.success(`Branch "${name}" created successfully`);
            setShowCreateModal(false);
            fetchBranches();
        } catch (err) {
            toast.error(
                err.response?.data?.message || "Failed to create branch",
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteBranch = async () => {
        if (!branchToDelete) return;
        setIsSubmitting(true);
        try {
            await deleteBranch(siteId, branchToDelete.id);
            toast.success(`Branch "${branchToDelete.name}" deleted`);
            setShowDeleteModal(false);
            setBranchToDelete(null);
            fetchBranches();
        } catch (err) {
            toast.error(
                err.response?.data?.message || "Failed to delete branch",
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredBranches = branches.filter((b) =>
        b.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const timeAgo = (date) => {
        if (!date) return "";
        const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
        if (s < 60) return "just now";
        if (s < 3600) return `${Math.floor(s / 60)}m ago`;
        if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
        return `${Math.floor(s / 86400)}d ago`;
    };

    if (loading && branches.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">
            <div className="max-w-6xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <button
                            onClick={() => navigate(`/sites/${siteId}`)}
                            className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors mb-4"
                        >
                            <ArrowLeft size={16} />
                            Back to Site
                        </button>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <GitBranch
                                className="text-[var(--color-accent)]"
                                size={32}
                            />
                            Branches
                        </h1>
                        <p className="text-[var(--color-text-muted)] mt-1">
                            Manage version control branches for this
                            documentation site.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[var(--color-accent)] text-white rounded-lg font-semibold hover:bg-[var(--color-accent-hover)] transition-all shadow-lg shadow-[var(--color-accent)]/20"
                    >
                        <Plus size={18} />
                        New Branch
                    </button>
                </div>

                {/* Search and Filters */}
                <div className="bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border-primary)] p-4 mb-6 shadow-sm">
                    <div className="relative max-w-md">
                        <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
                            size={18}
                        />
                        <input
                            type="text"
                            placeholder="Find a branch..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-all font-medium"
                        />
                    </div>
                </div>

                {/* Branches List */}
                <div className="bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border-primary)] overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[var(--color-bg-tertiary)] border-b border-[var(--color-border-primary)]">
                                    <th className="px-6 py-4 text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest w-1/3">
                                        Branch Name
                                    </th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">
                                        Modified
                                    </th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">
                                        Creator
                                    </th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-border-primary)]">
                                {filteredBranches.map((branch) => (
                                    <tr
                                        key={branch.id}
                                        className="hover:bg-[var(--color-bg-tertiary)]/50 transition-colors group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`p-2 rounded-md ${branch.is_default ? "bg-amber-400/10 text-amber-500" : "bg-blue-400/10 text-blue-500"}`}
                                                >
                                                    <GitBranch size={16} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-sm tracking-tight">
                                                            {branch.name}
                                                        </span>
                                                        {branch.is_default && (
                                                            <span className="px-2 py-0.5 bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-[10px] font-bold uppercase rounded border border-[var(--color-accent)]/20">
                                                                Default
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() =>
                                                                navigate(
                                                                    `/sites/${siteId}?branch=${branch.name}`,
                                                                )
                                                            }
                                                            className="text-[10px] text-[var(--color-accent)] hover:underline flex items-center gap-0.5"
                                                        >
                                                            View in Editor{" "}
                                                            <ExternalLink
                                                                size={10}
                                                            />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-[var(--color-text-muted)] text-sm whitespace-nowrap">
                                                <Clock size={14} />
                                                <span>
                                                    {timeAgo(branch.updated_at)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-[var(--color-text-muted)] text-sm whitespace-nowrap">
                                                <User size={14} />
                                                <span>
                                                    {branch.creator?.name ||
                                                        "System"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {!branch.is_default && (
                                                    <button
                                                        onClick={() => {
                                                            setBranchToDelete(
                                                                branch,
                                                            );
                                                            setShowDeleteModal(
                                                                true,
                                                            );
                                                        }}
                                                        className="p-2 text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                                        title="Delete branch"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                                <button className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] rounded-lg transition-all">
                                                    <MoreHorizontal size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredBranches.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan="4"
                                            className="px-6 py-12 text-center text-[var(--color-text-muted)]"
                                        >
                                            <GitBranch
                                                size={40}
                                                className="mx-auto mb-3 opacity-20"
                                            />
                                            <p className="font-medium tracking-tight">
                                                No branches found matching your
                                                search
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Create Branch Modal */}
            <InputModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSubmit={handleCreateBranch}
                title="Create New Branch"
                message="Branches allow you to work on features without affecting the main site."
                placeholder="e.g. fix-navigation-v2"
                submitText="Create Branch"
                isLoading={isSubmitting}
            />

            {/* Delete Branch Modal */}
            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteBranch}
                title="Delete Branch"
                message={`Are you sure you want to delete the branch "${branchToDelete?.name}"? All unique pages in this branch will be permanently lost.`}
                confirmText="Delete Branch"
                variant="danger"
                isLoading={isSubmitting}
            />
        </div>
    );
}

export default BranchesPage;
