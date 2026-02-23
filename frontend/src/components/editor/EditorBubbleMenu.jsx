import { BubbleMenu } from "@tiptap/react";
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    Link,
    Code,
    Highlighter,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    Subscript as SubscriptIcon,
    Superscript as SuperscriptIcon,
    Palette,
} from "lucide-react";
import { useState, useCallback, useRef, useEffect } from "react";

function MenuButton({ onClick, isActive, children, label }) {
    return (
        <button
            onClick={onClick}
            className={`
        p-1.5 rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors relative
        ${isActive ? "text-[var(--color-accent)] bg-[var(--color-accent)]/10 dark:bg-[var(--color-accent)]/20" : ""}
      `}
            title={label}
            type="button"
        >
            {children}
        </button>
    );
}

function EditorBubbleMenu({ editor }) {
    if (!editor) return null;

    const setLink = useCallback(() => {
        const previousUrl = editor.getAttributes("link").href;
        const url = window.prompt("URL", previousUrl);

        // cancelled
        if (url === null) {
            return;
        }

        // empty
        if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
        }

        // update
        editor
            .chain()
            .focus()
            .extendMarkRange("link")
            .setLink({ href: url })
            .run();
    }, [editor]);

    return (
        <BubbleMenu
            editor={editor}
            tippyOptions={{ duration: 150, placement: "top" }}
            shouldShow={({ editor, state, from, to }) => {
                // Show menu if text is selected, but not on empty selections, and not on images/tables
                if (from === to) return false;
                if (editor.isActive("image") || editor.isActive("table"))
                    return false;
                return true;
            }}
            className="flex items-center gap-0.5 p-1 bg-[var(--color-bg-elevated)] rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[var(--color-border-primary)] overflow-visible dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] animate-in fade-in zoom-in-95 duration-200"
        >
            <MenuButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                isActive={editor.isActive("bold")}
                label="Bold (Ctrl+B)"
            >
                <Bold size={15} />
            </MenuButton>

            <MenuButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                isActive={editor.isActive("italic")}
                label="Italic (Ctrl+I)"
            >
                <Italic size={15} />
            </MenuButton>

            <MenuButton
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                isActive={editor.isActive("underline")}
                label="Underline (Ctrl+U)"
            >
                <UnderlineIcon size={15} />
            </MenuButton>

            <MenuButton
                onClick={() => editor.chain().focus().toggleStrike().run()}
                isActive={editor.isActive("strike")}
                label="Strikethrough (Ctrl+Shift+X)"
            >
                <Strikethrough size={15} />
            </MenuButton>

            <div className="w-px h-5 bg-[var(--color-border-secondary)] mx-1" />

            <MenuButton
                onClick={() => editor.chain().focus().toggleSubscript().run()}
                isActive={editor.isActive("subscript")}
                label="Subscript"
            >
                <SubscriptIcon size={15} />
            </MenuButton>

            <MenuButton
                onClick={() => editor.chain().focus().toggleSuperscript().run()}
                isActive={editor.isActive("superscript")}
                label="Superscript"
            >
                <SuperscriptIcon size={15} />
            </MenuButton>

            <div className="w-px h-5 bg-[var(--color-border-secondary)] mx-1" />

            <MenuButton
                onClick={() => editor.chain().focus().toggleHighlight().run()}
                isActive={editor.isActive("highlight")}
                label="Highlight"
            >
                <Highlighter size={15} />
            </MenuButton>

            <div className="w-px h-5 bg-[var(--color-border-secondary)] mx-1" />

            <MenuButton
                onClick={() =>
                    editor.chain().focus().setTextAlign("left").run()
                }
                isActive={editor.isActive({ textAlign: "left" })}
                label="Align Left"
            >
                <AlignLeft size={15} />
            </MenuButton>

            <MenuButton
                onClick={() =>
                    editor.chain().focus().setTextAlign("center").run()
                }
                isActive={editor.isActive({ textAlign: "center" })}
                label="Align Center"
            >
                <AlignCenter size={15} />
            </MenuButton>

            <MenuButton
                onClick={() =>
                    editor.chain().focus().setTextAlign("right").run()
                }
                isActive={editor.isActive({ textAlign: "right" })}
                label="Align Right"
            >
                <AlignRight size={15} />
            </MenuButton>

            <MenuButton
                onClick={() =>
                    editor.chain().focus().setTextAlign("justify").run()
                }
                isActive={editor.isActive({ textAlign: "justify" })}
                label="Justify"
            >
                <AlignJustify size={15} />
            </MenuButton>

            <div className="w-px h-5 bg-[var(--color-border-secondary)] mx-1" />

            <MenuButton
                onClick={setLink}
                isActive={editor.isActive("link")}
                label="Link"
            >
                <Link size={15} />
            </MenuButton>

            <MenuButton
                onClick={() => editor.chain().focus().toggleCode().run()}
                isActive={editor.isActive("code")}
                label="Inline Code"
            >
                <Code size={15} />
            </MenuButton>
        </BubbleMenu>
    );
}

export default EditorBubbleMenu;
