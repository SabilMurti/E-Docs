import { useState } from "react";
import {
    AlertTriangle,
    Check,
    CheckCircle,
    ArrowDown,
    ArrowUp,
    FileText,
    Save,
    Layers,
    GitMerge,
} from "lucide-react";
import { resolvePullRequestConflicts } from "../../api/pulls";
import { toast } from "sonner";

// ─── Extract readable text from a single Tiptap node ────────────────────────
function nodeToText(node) {
    if (!node) return "(deleted)";
    if (node.type === "image") return `[Image: ${node.attrs?.src?.split("/").pop() || "image"}]`;
    if (node.type === "horizontalRule") return "───────────────";

    const walk = (n) => {
        if (!n) return "";
        if (n.type === "text") return n.text || "";
        if (n.content) return n.content.map(walk).join("");
        return "";
    };

    const text = walk(node);
    const typeLabels = {
        heading: `H${node.attrs?.level || 1}: `,
        codeBlock: "```\n",
        blockquote: "> ",
        bulletList: "• ",
        orderedList: "1. ",
    };
    return (typeLabels[node.type] || "") + text;
}

// ─── Node type label ─────────────────────────────────────────────────────────
function nodeTypeLabel(node) {
    if (!node) return "Deleted";
    const labels = {
        paragraph: "Paragraph",
        heading: `Heading ${node.attrs?.level || ""}`,
        image: "Image",
        codeBlock: "Code Block",
        blockquote: "Blockquote",
        bulletList: "Bullet List",
        orderedList: "Ordered List",
        horizontalRule: "Divider",
        table: "Table",
    };
    return labels[node.type] || node.type;
}

// ─── Single conflict node card ──────────────────────────────────────────────
function ConflictNodeCard({ conflictNode, nodeIndex, choice, onChoose }) {
    const { base, ours, theirs } = conflictNode;
    const isResolved = choice !== undefined && choice !== null;

    const oursText = nodeToText(ours);
    const theirsText = nodeToText(theirs);
    const oursLabel = nodeTypeLabel(ours);
    const theirsLabel = nodeTypeLabel(theirs);

    return (
        <div
            className={`rounded-xl border overflow-hidden transition-all duration-200 ${
                isResolved
                    ? "border-emerald-500/40 shadow-emerald-500/5 shadow-lg"
                    : "border-orange-500/30"
            }`}
        >
            {/* Header */}
            <div
                className="flex items-center justify-between px-4 py-2.5 border-b"
                style={{
                    backgroundColor: isResolved
                        ? "rgba(52, 211, 153, 0.06)"
                        : "rgba(251, 146, 60, 0.06)",
                    borderColor: isResolved
                        ? "rgba(52, 211, 153, 0.2)"
                        : "rgba(251, 146, 60, 0.2)",
                }}
            >
                <div className="flex items-center gap-2">
                    <Layers
                        size={14}
                        className={isResolved ? "text-emerald-400" : "text-orange-400"}
                    />
                    <span className="text-xs font-bold uppercase tracking-wide text-gray-300">
                        Block {nodeIndex + 1}
                    </span>
                    {isResolved && (
                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 uppercase tracking-wider">
                            <CheckCircle size={9} /> Resolved
                        </span>
                    )}
                </div>
                {isResolved && (
                    <button
                        onClick={() => onChoose(null)}
                        className="text-xs text-gray-500 hover:text-white transition-colors"
                    >
                        Change
                    </button>
                )}
            </div>

            <div className="grid grid-cols-2 divide-x divide-gray-700/60">
                {/* Ours (source/current) */}
                <div
                    className={`p-0 rounded-bl-xl transition-all ${
                        choice === "ours" ? "ring-2 ring-inset ring-red-400/40" : ""
                    }`}
                >
                    <div className="flex items-center justify-between px-3 py-2 bg-red-950/30 border-b border-red-500/15">
                        <div className="flex items-center gap-1.5">
                            <ArrowUp size={11} className="text-red-400" />
                            <span className="text-[11px] font-bold text-red-400 font-mono">
                                Current (source) · {oursLabel}
                            </span>
                        </div>
                        <button
                            onClick={() => onChoose("ours")}
                            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                                choice === "ours"
                                    ? "bg-red-500 text-white"
                                    : "bg-red-900/30 text-red-300 hover:bg-red-900/60"
                            }`}
                        >
                            {choice === "ours" ? (
                                <span className="flex items-center gap-1">
                                    <Check size={10} /> Accepted
                                </span>
                            ) : (
                                "Accept"
                            )}
                        </button>
                    </div>
                    <div className="p-3 min-h-[60px]">
                        {ours ? (
                            <pre className="text-red-200 text-[12px] font-mono whitespace-pre-wrap break-all leading-relaxed">
                                {oursText || "(empty block)"}
                            </pre>
                        ) : (
                            <span className="text-red-400/40 italic text-xs">
                                (block removed in source)
                            </span>
                        )}
                    </div>
                </div>

                {/* Theirs (target/incoming) */}
                <div
                    className={`p-0 transition-all ${
                        choice === "theirs" ? "ring-2 ring-inset ring-green-400/40" : ""
                    }`}
                >
                    <div className="flex items-center justify-between px-3 py-2 bg-green-950/30 border-b border-green-500/15">
                        <div className="flex items-center gap-1.5">
                            <ArrowDown size={11} className="text-green-400" />
                            <span className="text-[11px] font-bold text-green-400 font-mono">
                                Incoming (target) · {theirsLabel}
                            </span>
                        </div>
                        <button
                            onClick={() => onChoose("theirs")}
                            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                                choice === "theirs"
                                    ? "bg-green-500 text-white"
                                    : "bg-green-900/30 text-green-300 hover:bg-green-900/60"
                            }`}
                        >
                            {choice === "theirs" ? (
                                <span className="flex items-center gap-1">
                                    <Check size={10} /> Accepted
                                </span>
                            ) : (
                                "Accept"
                            )}
                        </button>
                    </div>
                    <div className="p-3 min-h-[60px]">
                        {theirs ? (
                            <pre className="text-green-200 text-[12px] font-mono whitespace-pre-wrap break-all leading-relaxed">
                                {theirsText || "(empty block)"}
                            </pre>
                        ) : (
                            <span className="text-green-400/40 italic text-xs">
                                (block removed in target)
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Accept Both */}
            <div className="px-3 py-2 border-t border-gray-700/40 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                    Or keep both versions:
                </span>
                <button
                    onClick={() => onChoose("both")}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                        choice === "both"
                            ? "bg-blue-500 text-white"
                            : "bg-blue-900/20 text-blue-300 hover:bg-blue-900/40"
                    }`}
                >
                    {choice === "both" ? (
                        <span className="flex items-center gap-1">
                            <Check size={10} /> Both accepted
                        </span>
                    ) : (
                        "Accept Both"
                    )}
                </button>
            </div>
        </div>
    );
}

// ─── Per-page conflict editor ────────────────────────────────────────────────
function PageConflictEditor({ conflict, onResolve }) {
    // conflict.conflicting_nodes = [{index, base, ours, theirs}, ...]
    const conflictingNodes = conflict.conflicting_nodes || [];
    const [nodeChoices, setNodeChoices] = useState({}); // { nodeIndex: 'ours' | 'theirs' | 'both' | null }

    const allResolved =
        conflictingNodes.length > 0 &&
        conflictingNodes.every((cn) => nodeChoices[cn.index] !== undefined && nodeChoices[cn.index] !== null);

    const handleNodeChoose = (nodeIndex, choice) => {
        const newChoices = { ...nodeChoices, [nodeIndex]: choice };
        setNodeChoices(newChoices);

        // Check if all done
        const done = conflictingNodes.every(
            (cn) => newChoices[cn.index] !== undefined && newChoices[cn.index] !== null
        );

        if (done) {
            // Build final content: start from merged_content and patch conflict positions
            const mergedNodes = [...(conflict.merged_content?.content || conflict.source_content?.content || [])];

            conflictingNodes.forEach((cn) => {
                const c = newChoices[cn.index];
                if (c === "ours") {
                    mergedNodes[cn.index] = cn.ours;
                } else if (c === "theirs") {
                    mergedNodes[cn.index] = cn.theirs;
                } else if (c === "both") {
                    // Insert both: replace current slot with ours, splice theirs after
                    mergedNodes.splice(cn.index, 1, cn.ours, cn.theirs);
                }
            });

            // Remove undefined/null entries (from deleted nodes)
            const finalNodes = mergedNodes.filter(Boolean);

            onResolve(conflict.logical_id, {
                title: conflict.source_title,
                content: { type: "doc", content: finalNodes },
            });
        }
    };

    const resolvedCount = conflictingNodes.filter(
        (cn) => nodeChoices[cn.index] !== undefined && nodeChoices[cn.index] !== null
    ).length;

    return (
        <div
            className={`rounded-xl border overflow-hidden transition-all duration-200 ${
                allResolved
                    ? "border-emerald-500/40 shadow-lg shadow-emerald-500/5"
                    : "border-orange-500/20"
            }`}
        >
            {/* Page header */}
            <div
                className="flex items-center justify-between px-5 py-3.5"
                style={{ backgroundColor: "var(--color-bg-tertiary)" }}
            >
                <div className="flex items-center gap-3">
                    <FileText
                        size={15}
                        className={allResolved ? "text-emerald-400" : "text-orange-400"}
                    />
                    <span className="text-sm font-semibold">
                        {conflict.source_title || conflict.target_title || "Untitled"}
                    </span>
                    {allResolved ? (
                        <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                            <CheckCircle size={10} /> Resolved
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400">
                            <AlertTriangle size={10} />
                            {conflictingNodes.length - resolvedCount} of{" "}
                            {conflictingNodes.length} blocks remaining
                        </span>
                    )}
                </div>
                <span className="text-xs italic" style={{ color: "var(--color-text-muted)" }}>
                    {conflict.conflict_reason}
                </span>
            </div>

            {/* Conflict nodes */}
            <div className="p-4 space-y-3" style={{ backgroundColor: "var(--color-bg-primary)" }}>
                {conflictingNodes.map((cn) => (
                    <ConflictNodeCard
                        key={cn.index}
                        conflictNode={cn}
                        nodeIndex={cn.index}
                        choice={nodeChoices[cn.index]}
                        onChoose={(choice) => handleNodeChoose(cn.index, choice)}
                    />
                ))}
            </div>
        </div>
    );
}

// ─── Main ConflictResolver ───────────────────────────────────────────────────
export default function ConflictResolver({ siteSlug, prId, conflicts, onResolved }) {
    const [resolutions, setResolutions] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleResolve = (logicalId, data) => {
        setResolutions((prev) => ({
            ...prev,
            [logicalId]: {
                logical_id: logicalId,
                title: data.title,
                content: data.content,
            },
        }));
    };

    const handleSubmit = async () => {
        const unresolvedCount = conflicts.length - Object.keys(resolutions).length;
        if (unresolvedCount > 0) {
            toast.error(
                `Please resolve all ${unresolvedCount} conflict${unresolvedCount !== 1 ? "s" : ""} first.`
            );
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = Object.values(resolutions).map((r) => ({
                logical_id: r.logical_id,
                title: r.title,
                content: r.content,
            }));
            await resolvePullRequestConflicts(siteSlug, prId, payload);
            toast.success("All conflicts resolved! You can now merge the pull request.");
            onResolved();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to resolve conflicts");
        } finally {
            setIsSubmitting(false);
        }
    };

    const resolvedCount = Object.keys(resolutions).length;
    const allResolved = resolvedCount === conflicts.length;

    return (
        <div className="space-y-6 p-6 overflow-y-auto">
            {/* Banner */}
            <div
                className="flex items-start gap-4 p-5 rounded-xl border"
                style={{
                    backgroundColor: "rgba(251, 146, 60, 0.05)",
                    borderColor: "rgba(251, 146, 60, 0.2)",
                }}
            >
                <GitMerge className="w-6 h-6 text-orange-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                    <h3 className="text-base font-bold text-orange-400 mb-1">
                        {conflicts.length} page{conflicts.length !== 1 ? "s" : ""} with merge conflicts
                    </h3>
                    <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                        The same block was edited in both branches. Unaffected blocks were{" "}
                        <strong className="text-emerald-400">auto-merged</strong> — only the conflicting
                        blocks need your decision. Choose{" "}
                        <strong className="text-red-300">Accept Current</strong> (keep your changes),{" "}
                        <strong className="text-green-300">Accept Incoming</strong> (keep target changes),
                        or <strong className="text-blue-300">Accept Both</strong>.
                    </p>
                </div>
                <div className="shrink-0 text-right">
                    <div
                        className="text-2xl font-bold"
                        style={{ color: allResolved ? "#34d399" : "var(--color-text-primary)" }}
                    >
                        {resolvedCount}/{conflicts.length}
                    </div>
                    <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                        pages resolved
                    </div>
                    <div
                        className="mt-2 w-24 h-1.5 rounded-full overflow-hidden"
                        style={{ backgroundColor: "var(--color-bg-tertiary)" }}
                    >
                        <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                                width: `${conflicts.length > 0 ? (resolvedCount / conflicts.length) * 100 : 0}%`,
                                backgroundColor: allResolved ? "#34d399" : "#f97316",
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Per-page editors */}
            <div className="space-y-4">
                {conflicts.map((conflict) => (
                    <PageConflictEditor
                        key={conflict.logical_id}
                        conflict={conflict}
                        resolution={resolutions[conflict.logical_id]}
                        onResolve={handleResolve}
                    />
                ))}
            </div>

            {/* Submit bar */}
            <div
                className="sticky bottom-0 flex items-center justify-between gap-4 p-4 rounded-xl border backdrop-blur-sm"
                style={{
                    backgroundColor: "rgba(var(--color-bg-secondary-rgb, 15, 15, 20), 0.95)",
                    borderColor: allResolved
                        ? "rgba(52, 211, 153, 0.3)"
                        : "var(--color-border-primary)",
                }}
            >
                <div className="flex items-center gap-3">
                    {allResolved ? (
                        <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
                            <CheckCircle size={18} />
                            All conflicts resolved — ready to submit
                        </div>
                    ) : (
                        <div
                            className="flex items-center gap-2 text-sm"
                            style={{ color: "var(--color-text-muted)" }}
                        >
                            <AlertTriangle size={16} className="text-orange-400" />
                            {conflicts.length - resolvedCount} page
                            {conflicts.length - resolvedCount !== 1 ? "s" : ""} remaining
                        </div>
                    )}
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={!allResolved || isSubmitting}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                        backgroundColor: allResolved ? "#34d399" : "var(--color-accent)",
                        color: "#000",
                    }}
                >
                    {isSubmitting ? (
                        <>
                            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                            Submitting...
                        </>
                    ) : (
                        <>
                            <Save size={16} />
                            Apply Resolutions
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
