/**
 * PageEditor - Optimized Rich Text Editor for Page Content
 *
 * Features:
 * - Proper scroll container handling for bubble menus
 * - Optimized extensions for page editing
 * - Better performance with lazy loading
 * - Fixed table toolbar positioning
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { getExtensions } from "./extensions";
import EditorBubbleMenu from "./EditorBubbleMenu";
import EditorToolbar from "./EditorToolbar";
import SlashMenu from "./menus/SlashMenu";
import InsertToolbar from "./InsertToolbar";
import MathSymbolsDropdown from "./menus/MathSymbolsDropdown";
import MediaInsertModal from "./MediaInsertModal";
import { TableToolbar } from "./TablePlus";

export default function PageEditor({
    content,
    onChange,
    editable = true,
    placeholder = null,
}) {
    const wrapperRef = useRef(null);
    const editorContainerRef = useRef(null);
    const editorRef = useRef(null);

    const [slashMenu, setSlashMenu] = useState({
        visible: false,
        query: "",
        position: { top: 0, left: 0 },
    });

    const [mediaModal, setMediaModal] = useState({
        isOpen: false,
        type: "image",
    });

    const extensions = useMemo(
        () => [...getExtensions(placeholder)],
        [placeholder],
    );

    const editor = useEditor({
        extensions,
        content:
            Array.isArray(content) && content.length === 0 ? "" : content || "",
        editable,
        onUpdate: ({ editor }) => {
            onChange?.(editor.getJSON());
        },
        editorProps: {
            attributes: {
                class: "page-editor-content focus:outline-none min-h-[400px] px-4 py-4",
            },
        },
        immediatelyRender: false,
    });

    // Sync editor to ref
    useEffect(() => {
        if (editor) {
            editorRef.current = editor;
        }
    }, [editor]);

    // Handle media insertion
    const handleMediaInsert = useCallback((media) => {
        setTimeout(() => {
            const currentEditor = editorRef.current;
            if (!currentEditor) return;

            if (media.type === "image") {
                currentEditor
                    .chain()
                    .focus()
                    .setImage({ src: media.src, alt: media.alt })
                    .run();
            }

            setMediaModal({ isOpen: false, type: "image" });
        }, 0);
    }, []);

    // Listen for image upload triggers
    useEffect(() => {
        const handleOpenModal = (e) => {
            setMediaModal({ isOpen: true, type: e.detail?.type || "image" });
        };

        window.addEventListener("openMediaModal", handleOpenModal);
        return () =>
            window.removeEventListener("openMediaModal", handleOpenModal);
    }, []);

    // Slash command detection
    useEffect(() => {
        if (!editor) return;

        const handleTransaction = () => {
            const { selection } = editor.state;
            const { $from } = selection;

            if (!selection.empty) {
                if (slashMenu.visible) {
                    setSlashMenu((prev) => ({ ...prev, visible: false }));
                }
                return;
            }

            const textBefore = $from.parent.textContent.slice(
                0,
                $from.parentOffset,
            );
            const match = textBefore.match(/(?:^|\s)\/([a-zA-Z0-9]*)$/);

            if (match) {
                const query = match[1];
                const matchIndex = textBefore.lastIndexOf(match[0]);
                const slashOffset = match[0].indexOf("/");
                const startPos =
                    $from.pos - (textBefore.length - matchIndex - slashOffset);

                const coords = editor.view.coordsAtPos(startPos);

                setSlashMenu({
                    visible: true,
                    query,
                    position: {
                        top: coords.bottom + 4,
                        left: coords.left,
                    },
                });
            } else {
                if (slashMenu.visible) {
                    setSlashMenu((prev) => ({ ...prev, visible: false }));
                }
            }
        };

        editor.on("transaction", handleTransaction);
        return () => {
            editor.off("transaction", handleTransaction);
        };
    }, [editor, slashMenu.visible]);

    // Close slash menu on click outside
    useEffect(() => {
        if (!slashMenu.visible) return;

        const handleClick = (e) => {
            if (!e.target.closest(".slash-menu")) {
                setSlashMenu((prev) => ({ ...prev, visible: false }));
            }
        };

        document.addEventListener("click", handleClick);
        return () => document.removeEventListener("click", handleClick);
    }, [slashMenu.visible]);

    // Sync content changes
    useEffect(() => {
        const currentEditor = editorRef.current;
        if (currentEditor && content && !currentEditor.isFocused) {
            const currentContent = currentEditor.getJSON();
            if (JSON.stringify(currentContent) !== JSON.stringify(content)) {
                currentEditor.commands.setContent(content);
            }
        }
    }, [content]);

    if (!editor) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-6 h-6 border-2 border-[var(--color-accent)] border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div ref={wrapperRef} className="page-editor relative group">
            {/* Toolbar - Fixed at top */}
            {editable && (
                <div className="editor-toolbar sticky top-0 z-20 bg-[var(--color-bg-primary)] border-b border-[var(--color-border-secondary)] px-4 py-2 flex items-center gap-2">
                    <InsertToolbar editor={editor} />
                    <MathSymbolsDropdown editor={editor} />
                    <div className="ml-auto flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
                        <span>
                            Type{" "}
                            <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-bg-tertiary)] text-[10px] font-mono">
                                /
                            </kbd>{" "}
                            for commands
                        </span>
                    </div>
                </div>
            )}

            {/* Editor Container - Proper positioning context for bubble menus */}
            <div
                ref={editorContainerRef}
                className="page-editor-container relative"
            >
                {/* Main Content Area */}
                <div className="max-w-3xl mx-auto w-full">
                    <EditorContent editor={editor} />
                </div>

                {/* Bubble Menus - Rendered inside editor container for proper positioning */}
                {editable && (
                    <>
                        <EditorBubbleMenu editor={editor} />
                        <TableToolbar editor={editor} />
                    </>
                )}
            </div>

            {/* Slash Menu */}
            {editable && slashMenu.visible && (
                <SlashMenu
                    editor={editor}
                    query={slashMenu.query}
                    position={slashMenu.position}
                    onClose={() =>
                        setSlashMenu((prev) => ({ ...prev, visible: false }))
                    }
                />
            )}

            {/* Media Insert Modal */}
            <MediaInsertModal
                isOpen={mediaModal.isOpen}
                onClose={() => setMediaModal({ isOpen: false, type: "image" })}
                onInsert={handleMediaInsert}
                type={mediaModal.type}
            />
        </div>
    );
}
