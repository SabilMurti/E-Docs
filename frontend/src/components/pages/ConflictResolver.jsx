import { useState, useMemo } from "react";
import {
    AlertTriangle,
    Check,
    ChevronRight,
    ChevronDown,
    GitBranch,
    Save,
    CheckCircle,
    ArrowDown,
    ArrowUp,
    ChevronsUpDown,
    FileText,
    Eye,
} from "lucide-react";
import { resolvePullRequestConflicts } from "../../api/pulls";
import { toast } from "sonner";

// ─── Text extraction from Tiptap JSON ────────────────────────────────────────
function extractLines(node) {
    if (!node) return [];
    if (typeof node === "string") return node.split("\n");

    const lines = [];
    const walk = (n, depth = 0) => {
        if (!n) return;
        if (n.type === "text") {
            lines.push(n.text || "");
            return;
        }
        const blockTypes = [
            "paragraph",
            "heading",
            "blockquote",
            "codeBlock",
            "bulletList",
            "orderedList",
            "listItem",
            "horizontalRule",
        ];
        const isBlock = blockTypes.includes(n.type);

        if (n.content) {
            n.content.forEach((child) => walk(child, depth));
        }
        if (isBlock) lines.push(""); // newline after block
    };

    if (node.content) node.content.forEach((child) => walk(child));
    // Remove trailing empty lines
    while (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
    return lines.length > 0 ? lines : ["(empty)"];
}

// ─── Compute line-based diff ──────────────────────────────────────────────────
function computeDiff(currentLines, incomingLines) {
    // Simple LCS-based diff
    const m = currentLines.length;
    const n = incomingLines.length;

    // Build LCS table
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (currentLines[i - 1] === incomingLines[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }

    // Backtrack to get diff
    const diff = [];
    let i = m,
        j = n;
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && currentLines[i - 1] === incomingLines[j - 1]) {
            diff.unshift({
                type: "same",
                text: currentLines[i - 1],
                ci: i - 1,
                ii: j - 1,
            });
            i--;
            j--;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
            diff.unshift({
                type: "incoming",
                text: incomingLines[j - 1],
                ii: j - 1,
            });
            j--;
        } else {
            diff.unshift({
                type: "current",
                text: currentLines[i - 1],
                ci: i - 1,
            });
            i--;
        }
    }
    return diff;
}

// ─── Group diff into conflict blocks ─────────────────────────────────────────
function groupIntoBlocks(diff) {
    const blocks = [];
    let i = 0;
    while (i < diff.length) {
        if (diff[i].type === "same") {
            blocks.push({ type: "context", lines: [diff[i]] });
            i++;
        } else {
            // Collect a conflict block
            const currentLines = [];
            const incomingLines = [];
            while (i < diff.length && diff[i].type !== "same") {
                if (diff[i].type === "current") currentLines.push(diff[i]);
                else incomingLines.push(diff[i]);
                i++;
            }
            blocks.push({
                type: "conflict",
                current: currentLines,
                incoming: incomingLines,
            });
        }
    }
    return blocks;
}

// ─── Single conflict block UI ─────────────────────────────────────────────────
function ConflictBlock({ block, index, choice, onChoose }) {
    const isResolved = choice !== null && choice !== undefined;

    return (
        <div
            className={`border rounded-lg overflow-hidden transition-all duration-200 ${
                isResolved ? "border-emerald-500/40" : "border-orange-500/30"
            }`}
        >
            {/* Current (source) section */}
            <div className="relative">
                <div className="flex items-center justify-between px-3 py-1.5 bg-red-950/40 border-b border-red-500/20">
                    <div className="flex items-center gap-2">
                        <ArrowUp size={12} className="text-red-400" />
                        <span className="text-xs font-mono font-bold text-red-400">
                            &lt;&lt;&lt;&lt;&lt;&lt;&lt; Current change (source
                            branch)
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => onChoose("current")}
                            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                                choice === "current"
                                    ? "bg-red-500 text-white"
                                    : "bg-red-900/30 text-red-300 hover:bg-red-900/60"
                            }`}
                        >
                            {choice === "current" ? (
                                <span className="flex items-center gap-1">
                                    <Check size={10} /> Accepted
                                </span>
                            ) : (
                                "Accept Current"
                            )}
                        </button>
                        <button
                            onClick={() => onChoose("both")}
                            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                                choice === "both"
                                    ? "bg-blue-500 text-white"
                                    : "bg-blue-900/30 text-blue-300 hover:bg-blue-900/60"
                            }`}
                        >
                            {choice === "both" ? (
                                <span className="flex items-center gap-1">
                                    <Check size={10} /> Both
                                </span>
                            ) : (
                                "Accept Both"
                            )}
                        </button>
                    </div>
                </div>
                {block.current.map((line, li) => (
                    <div
                        key={li}
                        className="flex items-stretch group bg-red-500/8 hover:bg-red-500/15 transition-colors"
                    >
                        <span className="w-10 text-right pr-2 py-0.5 text-[11px] font-mono text-red-400/50 select-none border-r border-red-500/10 shrink-0">
                            {(line.ci ?? "") + 1}
                        </span>
                        <span className="w-5 text-center py-0.5 text-red-400 text-[11px] font-mono select-none shrink-0">
                            -
                        </span>
                        <span className="flex-1 px-3 py-0.5 text-[13px] font-mono text-red-200 whitespace-pre-wrap break-all">
                            {line.text || " "}
                        </span>
                    </div>
                ))}
                {block.current.length === 0 && (
                    <div className="px-4 py-1 text-[12px] font-mono text-red-400/40 italic bg-red-500/5">
                        (no lines in current branch)
                    </div>
                )}
            </div>

            {/* Separator */}
            <div className="flex items-center px-3 py-1 bg-[#1a1a2e] border-y border-[var(--color-border-primary)]">
                <ChevronsUpDown
                    size={12}
                    className="text-[var(--color-text-muted)] mr-2"
                />
                <span className="text-[11px] font-mono text-[var(--color-text-muted)]">
                    ======= conflict separator
                </span>
            </div>

            {/* Incoming (target) section */}
            <div>
                <div className="flex items-center justify-between px-3 py-1.5 bg-green-950/40 border-b border-green-500/20">
                    <div className="flex items-center gap-2">
                        <ArrowDown size={12} className="text-green-400" />
                        <span className="text-xs font-mono font-bold text-green-400">
                            &gt;&gt;&gt;&gt;&gt;&gt;&gt; Incoming change (target
                            branch)
                        </span>
                    </div>
                    <button
                        onClick={() => onChoose("incoming")}
                        className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                            choice === "incoming"
                                ? "bg-green-500 text-white"
                                : "bg-green-900/30 text-green-300 hover:bg-green-900/60"
                        }`}
                    >
                        {choice === "incoming" ? (
                            <span className="flex items-center gap-1">
                                <Check size={10} /> Accepted
                            </span>
                        ) : (
                            "Accept Incoming"
                        )}
                    </button>
                </div>
                {block.incoming.map((line, li) => (
                    <div
                        key={li}
                        className="flex items-stretch group bg-green-500/8 hover:bg-green-500/15 transition-colors"
                    >
                        <span className="w-10 text-right pr-2 py-0.5 text-[11px] font-mono text-green-400/50 select-none border-r border-green-500/10 shrink-0">
                            {(line.ii ?? "") + 1}
                        </span>
                        <span className="w-5 text-center py-0.5 text-green-400 text-[11px] font-mono select-none shrink-0">
                            +
                        </span>
                        <span className="flex-1 px-3 py-0.5 text-[13px] font-mono text-green-200 whitespace-pre-wrap break-all">
                            {line.text || " "}
                        </span>
                    </div>
                ))}
                {block.incoming.length === 0 && (
                    <div className="px-4 py-1 text-[12px] font-mono text-green-400/40 italic bg-green-500/5">
                        (no lines in incoming branch)
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Context lines (unchanged) ────────────────────────────────────────────────
function ContextLine({ line }) {
    return (
        <div className="flex items-stretch hover:bg-[var(--color-bg-hover)] transition-colors">
            <span className="w-10 text-right pr-2 py-0.5 text-[11px] font-mono text-[var(--color-text-muted)]/40 select-none border-r border-[var(--color-border-primary)] shrink-0">
                {(line.ci ?? line.ii ?? "") + 1}
            </span>
            <span className="w-5 text-center py-0.5 text-[11px] font-mono select-none shrink-0 text-[var(--color-text-muted)]/30">
                {" "}
            </span>
            <span className="flex-1 px-3 py-0.5 text-[13px] font-mono text-[var(--color-text-secondary)] whitespace-pre-wrap break-all">
                {line.text || " "}
            </span>
        </div>
    );
}

// ─── Resolution preview ───────────────────────────────────────────────────────
function ResolutionPreview({ blocks, blockChoices }) {
    const resolvedLines = useMemo(() => {
        const lines = [];
        blocks.forEach((block, bi) => {
            if (block.type === "context") {
                lines.push(...block.lines.map((l) => l.text));
            } else {
                const choice = blockChoices[bi];
                if (choice === "current") {
                    lines.push(...block.current.map((l) => l.text));
                } else if (choice === "incoming") {
                    lines.push(...block.incoming.map((l) => l.text));
                } else if (choice === "both") {
                    lines.push(...block.current.map((l) => l.text));
                    lines.push(...block.incoming.map((l) => l.text));
                }
            }
        });
        return lines;
    }, [blocks, blockChoices]);

    return (
        <div className="rounded-lg border border-emerald-500/30 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-950/30 border-b border-emerald-500/20">
                <Eye size={14} className="text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-400">
                    Resolution Preview
                </span>
            </div>
            <div className="font-mono text-[13px] max-h-48 overflow-y-auto bg-[var(--color-bg-primary)]">
                {resolvedLines.map((line, i) => (
                    <div
                        key={i}
                        className="flex items-stretch px-4 py-0.5 hover:bg-[var(--color-bg-hover)]"
                    >
                        <span className="w-8 text-right pr-3 text-[11px] text-[var(--color-text-muted)]/40 select-none shrink-0">
                            {i + 1}
                        </span>
                        <span className="text-[var(--color-text-primary)] whitespace-pre-wrap break-all">
                            {line || " "}
                        </span>
                    </div>
                ))}
                {resolvedLines.length === 0 && (
                    <div className="px-4 py-3 text-[var(--color-text-muted)] italic text-xs">
                        (empty — all content removed)
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Per-page conflict editor ─────────────────────────────────────────────────
function PageConflictEditor({ conflict, resolution, onResolve }) {
    const [expanded, setExpanded] = useState(true);
    const [showPreview, setShowPreview] = useState(false);

    const currentLines = useMemo(
        () => extractLines(conflict.source_content),
        [conflict.source_content],
    );
    const incomingLines = useMemo(
        () => extractLines(conflict.target_content),
        [conflict.target_content],
    );
    const diff = useMemo(
        () => computeDiff(currentLines, incomingLines),
        [currentLines, incomingLines],
    );
    const blocks = useMemo(() => groupIntoBlocks(diff), [diff]);

    const conflictBlocks = blocks.filter((b) => b.type === "conflict");
    const [blockChoices, setBlockChoices] = useState({});

    const allResolved =
        conflictBlocks.length > 0 &&
        conflictBlocks.every((_, i) => {
            const bi = blocks.indexOf(conflictBlocks[i]);
            return blockChoices[bi] !== undefined;
        });

    const handleBlockChoose = (blockIndex, choice) => {
        const newChoices = { ...blockChoices, [blockIndex]: choice };
        setBlockChoices(newChoices);

        // Build resolved content from choices
        const resolvedLines = [];
        blocks.forEach((block, bi) => {
            if (block.type === "context") {
                resolvedLines.push(...block.lines.map((l) => l.text));
            } else {
                const c = newChoices[bi];
                if (c === "current")
                    resolvedLines.push(...block.current.map((l) => l.text));
                else if (c === "incoming")
                    resolvedLines.push(...block.incoming.map((l) => l.text));
                else if (c === "both") {
                    resolvedLines.push(...block.current.map((l) => l.text));
                    resolvedLines.push(...block.incoming.map((l) => l.text));
                }
            }
        });

        // Check if all conflict blocks are resolved
        const allDone = conflictBlocks.every((_, i) => {
            const bi = blocks.indexOf(conflictBlocks[i]);
            return newChoices[bi] !== undefined;
        });

        if (allDone) {
            // Determine overall choice label
            const choices = Object.values(newChoices);
            const choiceLabel = choices.every((c) => c === "current")
                ? "current"
                : choices.every((c) => c === "incoming")
                  ? "incoming"
                  : "both";

            // Build a simple Tiptap doc from resolved lines
            const resolvedContent = {
                type: "doc",
                content: resolvedLines
                    .filter((l) => l !== "(empty)")
                    .map((line) => ({
                        type: "paragraph",
                        attrs: { textAlign: null, dataDraggable: "true" },
                        content: line ? [{ type: "text", text: line }] : [],
                    })),
            };

            onResolve(conflict.logical_id, choiceLabel, {
                title:
                    choiceLabel === "incoming"
                        ? conflict.target_title
                        : conflict.source_title,
                content: resolvedContent,
            });
        }
    };

    const resolvedCount = Object.keys(blockChoices).length;
    const isFullyResolved = allResolved;

    return (
        <div
            className={`rounded-xl border overflow-hidden transition-all duration-200 ${
                isFullyResolved
                    ? "border-emerald-500/40 shadow-lg shadow-emerald-500/5"
                    : "border-orange-500/20"
            }`}
        >
            {/* Page header */}
            <button
                onClick={() => setExpanded((e) => !e)}
                className="w-full flex items-center justify-between px-5 py-3.5 transition-colors"
                style={{ backgroundColor: "var(--color-bg-tertiary)" }}
            >
                <div className="flex items-center gap-3">
                    {expanded ? (
                        <ChevronDown size={16} />
                    ) : (
                        <ChevronRight size={16} />
                    )}
                    <FileText
                        size={15}
                        className={
                            isFullyResolved
                                ? "text-emerald-400"
                                : "text-orange-400"
                        }
                    />
                    <span className="text-sm font-semibold">
                        {conflict.source_title ||
                            conflict.target_title ||
                            "Untitled"}
                    </span>
                    {isFullyResolved ? (
                        <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                            <CheckCircle size={10} /> Resolved
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400">
                            <AlertTriangle size={10} />
                            {conflictBlocks.length - resolvedCount} of{" "}
                            {conflictBlocks.length} conflicts remaining
                        </span>
                    )}
                </div>
                <span
                    className="text-xs italic"
                    style={{ color: "var(--color-text-muted)" }}
                >
                    {conflict.conflict_reason}
                </span>
            </button>

            {expanded && (
                <div style={{ backgroundColor: "var(--color-bg-primary)" }}>
                    {/* Title conflict if any */}
                    {conflict.source_title !== conflict.target_title && (
                        <div className="border-b border-[var(--color-border-primary)] p-4">
                            <p
                                className="text-xs font-semibold mb-2"
                                style={{ color: "var(--color-text-muted)" }}
                            >
                                TITLE CONFLICT
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-lg bg-red-500/8 border border-red-500/20">
                                    <p className="text-[10px] text-red-400 font-bold mb-1">
                                        CURRENT
                                    </p>
                                    <p className="text-sm font-mono text-red-200">
                                        {conflict.source_title}
                                    </p>
                                </div>
                                <div className="p-3 rounded-lg bg-green-500/8 border border-green-500/20">
                                    <p className="text-[10px] text-green-400 font-bold mb-1">
                                        INCOMING
                                    </p>
                                    <p className="text-sm font-mono text-green-200">
                                        {conflict.target_title}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Diff editor */}
                    <div className="border border-[var(--color-border-primary)] rounded-lg m-4 overflow-hidden font-mono text-[13px]">
                        {/* Editor header */}
                        <div
                            className="flex items-center justify-between px-4 py-2 border-b border-[var(--color-border-primary)]"
                            style={{
                                backgroundColor: "var(--color-bg-tertiary)",
                            }}
                        >
                            <div
                                className="flex items-center gap-4 text-xs"
                                style={{ color: "var(--color-text-muted)" }}
                            >
                                <span className="flex items-center gap-1.5">
                                    <span className="w-3 h-3 rounded-sm bg-red-500/40 inline-block" />
                                    Current (source)
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="w-3 h-3 rounded-sm bg-green-500/40 inline-block" />
                                    Incoming (target)
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="w-3 h-3 rounded-sm bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] inline-block" />
                                    Unchanged
                                </span>
                            </div>
                            <span
                                className="text-xs font-semibold"
                                style={{ color: "var(--color-text-muted)" }}
                            >
                                {conflictBlocks.length} conflict
                                {conflictBlocks.length !== 1 ? "s" : ""}
                            </span>
                        </div>

                        {/* Diff lines */}
                        <div
                            className="max-h-[500px] overflow-y-auto"
                            style={{
                                backgroundColor: "var(--color-bg-primary)",
                            }}
                        >
                            {blocks.map((block, bi) =>
                                block.type === "context" ? (
                                    block.lines.map((line, li) => (
                                        <ContextLine
                                            key={`ctx-${bi}-${li}`}
                                            line={line}
                                        />
                                    ))
                                ) : (
                                    <ConflictBlock
                                        key={`conflict-${bi}`}
                                        block={block}
                                        index={bi}
                                        choice={blockChoices[bi]}
                                        onChoose={(choice) =>
                                            handleBlockChoose(bi, choice)
                                        }
                                    />
                                ),
                            )}
                        </div>
                    </div>

                    {/* Resolution preview */}
                    {isFullyResolved && (
                        <div className="mx-4 mb-4">
                            <button
                                onClick={() => setShowPreview((p) => !p)}
                                className="flex items-center gap-2 text-xs font-semibold mb-2 text-emerald-400 hover:text-emerald-300 transition-colors"
                            >
                                <Eye size={13} />
                                {showPreview ? "Hide" : "Show"} resolution
                                preview
                            </button>
                            {showPreview && (
                                <ResolutionPreview
                                    blocks={blocks}
                                    blockChoices={blockChoices}
                                />
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Main ConflictResolver ────────────────────────────────────────────────────
export default function ConflictResolver({
    siteSlug,
    prId,
    conflicts,
    onResolved,
}) {
    const [resolutions, setResolutions] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleResolve = (logicalId, type, data) => {
        setResolutions((prev) => ({
            ...prev,
            [logicalId]: {
                logical_id: logicalId,
                title: data.title,
                content: data.content,
                choice: type,
            },
        }));
    };

    const handleSubmit = async () => {
        const unresolvedCount =
            conflicts.length - Object.keys(resolutions).length;
        if (unresolvedCount > 0) {
            toast.error(
                `Please resolve all ${unresolvedCount} conflict${unresolvedCount !== 1 ? "s" : ""} first.`,
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
            toast.success(
                "All conflicts resolved! You can now merge the pull request.",
            );
            onResolved();
        } catch (err) {
            toast.error(
                err.response?.data?.message || "Failed to resolve conflicts",
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const resolvedCount = Object.keys(resolutions).length;
    const allResolved = resolvedCount === conflicts.length;

    return (
        <div className="space-y-6">
            {/* Banner */}
            <div
                className="flex items-start gap-4 p-5 rounded-xl border"
                style={{
                    backgroundColor: "rgba(251, 146, 60, 0.05)",
                    borderColor: "rgba(251, 146, 60, 0.2)",
                }}
            >
                <AlertTriangle className="w-6 h-6 text-orange-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                    <h3 className="text-base font-bold text-orange-400 mb-1">
                        {conflicts.length} merge conflict
                        {conflicts.length !== 1 ? "s" : ""} must be resolved
                    </h3>
                    <p
                        className="text-sm"
                        style={{ color: "var(--color-text-secondary)" }}
                    >
                        Both branches modified the same pages. For each conflict
                        block, choose{" "}
                        <strong className="text-red-300">Accept Current</strong>{" "}
                        (keep source branch changes),{" "}
                        <strong className="text-green-300">
                            Accept Incoming
                        </strong>{" "}
                        (keep target branch changes), or{" "}
                        <strong className="text-blue-300">Accept Both</strong>{" "}
                        (keep both versions).
                    </p>
                </div>
                {/* Progress */}
                <div className="shrink-0 text-right">
                    <div
                        className="text-2xl font-bold"
                        style={{
                            color: allResolved
                                ? "#34d399"
                                : "var(--color-text-primary)",
                        }}
                    >
                        {resolvedCount}/{conflicts.length}
                    </div>
                    <div
                        className="text-xs"
                        style={{ color: "var(--color-text-muted)" }}
                    >
                        resolved
                    </div>
                    <div
                        className="mt-2 w-24 h-1.5 rounded-full overflow-hidden"
                        style={{ backgroundColor: "var(--color-bg-tertiary)" }}
                    >
                        <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                                width: `${(resolvedCount / conflicts.length) * 100}%`,
                                backgroundColor: allResolved
                                    ? "#34d399"
                                    : "#f97316",
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
                    backgroundColor:
                        "rgba(var(--color-bg-secondary-rgb, 15, 15, 20), 0.95)",
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
                            <AlertTriangle
                                size={16}
                                className="text-orange-400"
                            />
                            {conflicts.length - resolvedCount} conflict
                            {conflicts.length - resolvedCount !== 1 ? "s" : ""}{" "}
                            remaining
                        </div>
                    )}
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={!allResolved || isSubmitting}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                        backgroundColor: allResolved
                            ? "#34d399"
                            : "var(--color-accent)",
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
                            Mark as Resolved &amp; Merge
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
