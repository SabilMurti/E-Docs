import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
    Plus,
    Trash2,
    Rows3,
    Columns3,
    Merge,
    Split,
    Palette,
    X,
    Check,
    Grid3X3,
} from "lucide-react";
import { findParentNode } from "@tiptap/core";

const TABLE_COLORS = [
    { color: "#ffffff", name: "Putih" },
    { color: "#f8fafc", name: "Slate" },
    { color: "#fee2e2", name: "Merah" },
    { color: "#fef3c7", name: "Kuning" },
    { color: "#dcfce7", name: "Hijau" },
    { color: "#dbeafe", name: "Biru" },
    { color: "#f3e8ff", name: "Ungu" },
];

const TABLE_STYLES = {
    default: { name: "Default" },
    bordered: { name: "Bordered" },
    striped: { name: "Striped" },
    minimal: { name: "Minimal" },
};

export function TableCreationModal({ isOpen, onClose, onInsert }) {
    const [rows, setRows] = useState(3);
    const [cols, setCols] = useState(3);
    const [withHeader, setWithHeader] = useState(true);
    const [style, setStyle] = useState("default");

    const handleInsert = () => {
        onInsert({
            rows,
            cols,
            withHeaderRow: withHeader,
            style: style, // Use selected style
        });
        onClose();
        // Reset for next time
        setRows(3);
        setCols(3);
        setStyle("default");
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)] rounded-xl shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-primary)]">
                    <div className="flex items-center gap-2">
                        <Grid3X3
                            size={18}
                            className="text-[var(--color-accent)]"
                        />
                        <h3 className="font-semibold text-[var(--color-text-primary)]">
                            Insert Table
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)]"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-xs text-[var(--color-text-muted)] mb-1">
                                Columns
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={20}
                                value={cols}
                                onChange={(e) =>
                                    setCols(
                                        Math.min(
                                            20,
                                            Math.max(
                                                1,
                                                parseInt(e.target.value) || 1,
                                            ),
                                        ),
                                    )
                                }
                                className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)]"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs text-[var(--color-text-muted)] mb-1">
                                Rows
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={50}
                                value={rows}
                                onChange={(e) =>
                                    setRows(
                                        Math.min(
                                            50,
                                            Math.max(
                                                1,
                                                parseInt(e.target.value) || 1,
                                            ),
                                        ),
                                    )
                                }
                                className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)]"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 mt-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={withHeader}
                                onChange={(e) =>
                                    setWithHeader(e.target.checked)
                                }
                                className="w-4 h-4 rounded border-[var(--color-border-primary)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
                            />
                            <span className="text-sm text-[var(--color-text-secondary)]">
                                Include header row
                            </span>
                        </label>
                        <div>
                            <label className="block text-xs text-[var(--color-text-muted)] mb-2">
                                Table Template
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(TABLE_STYLES).map(
                                    ([key, cfg]) => (
                                        <button
                                            key={key}
                                            onClick={() => setStyle(key)}
                                            className={`
                                    px-3 py-2 rounded-lg text-xs font-medium transition-colors
                                    ${
                                        style === key
                                            ? "bg-[var(--color-accent)] text-white"
                                            : "bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]"
                                    }
                                    `}
                                        >
                                            {cfg.name}
                                        </button>
                                    ),
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 px-4 py-3 border-t border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)]">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 rounded-lg border border-[var(--color-border-primary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors text-sm font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleInsert}
                        className="flex-1 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors text-sm font-medium flex items-center justify-center gap-2"
                    >
                        <Check size={16} /> Insert Table
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
}

export function TableToolbar({ editor }) {
    if (!editor) return null;

    const [showAppearance, setShowAppearance] = useState(false);
    const appearanceRef = useRef(null);
    const [toolbarState, setToolbarState] = useState({
        visible: false,
        top: 0,
        left: 0,
    });

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                appearanceRef.current &&
                !appearanceRef.current.contains(event.target)
            )
                setShowAppearance(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (!editor) return;

        let frameId;
        const updatePosition = () => {
            frameId = requestAnimationFrame(() => {
                if (!editor.isActive("table")) {
                    setToolbarState((prev) =>
                        prev.visible ? { ...prev, visible: false } : prev,
                    );
                    return;
                }

                const tablePredicate = (node) => node.type.name === "table";
                const parentTable = findParentNode(tablePredicate)(
                    editor.state.selection,
                );

                if (parentTable) {
                    const dom = editor.view.nodeDOM(parentTable.pos);
                    if (dom instanceof HTMLElement) {
                        const tableElement =
                            dom.tagName === "TABLE"
                                ? dom
                                : dom.querySelector("table") || dom;
                        const rect = tableElement.getBoundingClientRect();

                        // We need the editor container's bounding rect
                        // Because TableToolbar is rendered inside .page-editor-container, which has position: relative
                        const container =
                            editor.view.dom.closest(".page-editor-container") ||
                            editor.view.dom.parentElement;
                        if (container) {
                            const containerRect =
                                container.getBoundingClientRect();
                            const top = rect.top - containerRect.top - 56; // offset to top of table (increased gap)
                            const left =
                                rect.left - containerRect.left + rect.width / 2;

                            setToolbarState((prev) => {
                                if (
                                    prev.visible &&
                                    Math.abs(prev.top - top) < 1 &&
                                    Math.abs(prev.left - left) < 1
                                ) {
                                    return prev;
                                }
                                return { visible: true, top, left };
                            });
                        }
                    }
                }
            });
        };

        const handleScrollOrResize = () => updatePosition();

        editor.on("selectionUpdate", updatePosition);
        editor.on("update", updatePosition);
        window.addEventListener("resize", handleScrollOrResize, {
            passive: true,
        });
        window.addEventListener("scroll", handleScrollOrResize, true);

        updatePosition();

        return () => {
            cancelAnimationFrame(frameId);
            editor.off("selectionUpdate", updatePosition);
            editor.off("update", updatePosition);
            window.removeEventListener("resize", handleScrollOrResize);
            window.removeEventListener("scroll", handleScrollOrResize, true);
        };
    }, [editor]);

    if (!toolbarState.visible) return null;

    const buttonClass =
        "flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
    const iconButtonClass =
        "p-2 rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative";
    const dividerClass = "w-px h-6 bg-[var(--color-border-secondary)] mx-1";

    return (
        <div
            className="table-toolbar absolute z-50 flex items-center gap-1 p-1.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)] rounded-xl shadow-lg transition-transform duration-100 ease-out"
            style={{
                top: `${toolbarState.top}px`,
                left: `${toolbarState.left}px`,
                transform: "translateX(-50%)",
            }}
        >
            {/* Row / Col Operations */}
            <button
                onClick={() => editor.chain().focus().addRowBefore().run()}
                className={buttonClass}
                title="Add row above"
            >
                <Plus size={14} />
                <span>Row ↑</span>
            </button>
            <button
                onClick={() => editor.chain().focus().addRowAfter().run()}
                className={buttonClass}
                title="Add row below"
            >
                <Plus size={14} />
                <span>Row ↓</span>
            </button>
            <button
                onClick={() => editor.chain().focus().deleteRow().run()}
                className={`${buttonClass} hover:text-red-500`}
                title="Delete row"
            >
                <Trash2 size={14} />
            </button>

            <div className={dividerClass} />

            <button
                onClick={() => editor.chain().focus().addColumnBefore().run()}
                className={buttonClass}
                title="Add column left"
            >
                <Plus size={14} />
                <span>Col ←</span>
            </button>
            <button
                onClick={() => editor.chain().focus().addColumnAfter().run()}
                className={buttonClass}
                title="Add column right"
            >
                <Plus size={14} />
                <span>Col →</span>
            </button>
            <button
                onClick={() => editor.chain().focus().deleteColumn().run()}
                className={`${buttonClass} hover:text-red-500`}
                title="Delete column"
            >
                <Trash2 size={14} />
            </button>

            <div className={dividerClass} />

            {/* Cell Operations */}
            <button
                onClick={() => editor.chain().focus().mergeCells().run()}
                disabled={!editor.can().mergeCells()}
                className={iconButtonClass}
                title="Merge cells"
            >
                <Merge size={16} />
            </button>
            <button
                onClick={() => editor.chain().focus().splitCell().run()}
                disabled={!editor.can().splitCell()}
                className={iconButtonClass}
                title="Split cell"
            >
                <Split size={16} />
            </button>

            <div className={dividerClass} />

            <div className="relative" ref={appearanceRef}>
                <button
                    onClick={() => setShowAppearance(!showAppearance)}
                    className={iconButtonClass}
                    title="Cell Appearance"
                >
                    <Palette size={16} />
                </button>
                {showAppearance && (
                    <div className="absolute top-full right-0 mt-2 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl min-w-[160px] z-50 flex flex-col gap-3">
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                                Background Color
                            </label>
                            <div className="flex gap-1 flex-wrap">
                                {TABLE_COLORS.map((c) => (
                                    <button
                                        key={c.color}
                                        onClick={() =>
                                            editor
                                                .chain()
                                                .focus()
                                                .setCellAttribute(
                                                    "backgroundColor",
                                                    c.color,
                                                )
                                                .run()
                                        }
                                        className="w-5 h-5 rounded-sm border border-slate-200 dark:border-slate-600 hover:scale-110 transition-transform"
                                        style={{ backgroundColor: c.color }}
                                        title={c.name}
                                        type="button"
                                    />
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                                Border Lines
                            </label>
                            <div className="flex gap-1">
                                {[0, 1, 2, 4].map((w) => (
                                    <button
                                        key={w}
                                        onClick={() =>
                                            editor
                                                .chain()
                                                .focus()
                                                .setCellAttribute(
                                                    "borderWidth",
                                                    `${w}px`,
                                                )
                                                .run()
                                        }
                                        className={`px-1.5 py-0.5 text-[9px] border border-slate-200 dark:border-slate-600 rounded font-bold ${
                                            w === 0
                                                ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30"
                                                : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                                        }`}
                                        type="button"
                                    >
                                        {w === 0 ? "OFF" : `${w}px`}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                                Border Color
                            </label>
                            <div className="flex gap-1 flex-wrap">
                                {TABLE_COLORS.map((c) => (
                                    <button
                                        key={`border-${c.color}`}
                                        onClick={() =>
                                            editor
                                                .chain()
                                                .focus()
                                                .setCellAttribute(
                                                    "borderColor",
                                                    c.color,
                                                )
                                                .run()
                                        }
                                        className="w-4 h-4 rounded-sm border-2 border-slate-200 dark:border-slate-600 hover:scale-110 transition-transform bg-transparent"
                                        style={{ borderColor: c.color }}
                                        title={c.name}
                                        type="button"
                                    />
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                                Table Template
                            </label>
                            <div className="grid grid-cols-2 gap-1">
                                {Object.entries(TABLE_STYLES).map(
                                    ([key, cfg]) => {
                                        const currentTheme =
                                            editor.getAttributes("table")
                                                .theme || "default";
                                        return (
                                            <button
                                                key={key}
                                                onClick={() =>
                                                    editor
                                                        .chain()
                                                        .focus()
                                                        .updateAttributes(
                                                            "table",
                                                            { theme: key },
                                                        )
                                                        .run()
                                                }
                                                className={`px-1.5 py-1 text-[10px] rounded font-medium ${
                                                    currentTheme === key
                                                        ? "bg-[var(--color-accent)] text-white"
                                                        : "bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]"
                                                }`}
                                            >
                                                {cfg.name}
                                            </button>
                                        );
                                    },
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className={dividerClass} />
            <button
                onClick={() => editor.chain().focus().deleteTable().run()}
                className={`${iconButtonClass} hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20`}
                title="Delete table"
            >
                <Trash2 size={16} />
            </button>
        </div>
    );
}

export function useTableCreation(editor) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openModal = useCallback(() => setIsModalOpen(true), []);
    const closeModal = useCallback(() => setIsModalOpen(false), []);

    const insertTable = useCallback(
        (options) => {
            if (!editor) return;
            const tableNode = {
                type: "table",
                attrs: { theme: options.style || "default" },
                content: Array.from({ length: options.rows }).map(
                    (_, rIndex) => {
                        const isHeader = options.withHeaderRow && rIndex === 0;
                        return {
                            type: "tableRow",
                            content: Array.from({ length: options.cols }).map(
                                () => ({
                                    type: isHeader
                                        ? "tableHeader"
                                        : "tableCell",
                                    content: [
                                        {
                                            type: "paragraph",
                                            content: [
                                                { type: "text", text: "Text" },
                                            ],
                                        },
                                    ],
                                }),
                            ),
                        };
                    },
                ),
            };

            editor.chain().focus().insertContent(tableNode).run();
        },
        [editor],
    );

    return {
        isModalOpen,
        openModal,
        closeModal,
        insertTable,
        TableModal: () => (
            <TableCreationModal
                isOpen={isModalOpen}
                onClose={closeModal}
                onInsert={insertTable}
            />
        ),
    };
}
