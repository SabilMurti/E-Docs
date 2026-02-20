import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import { useState, useEffect } from "react";
import { ExternalLink, Link2, X } from "lucide-react";

/**
 * ButtonBlock Component
 *
 * A clickable button that links to another page or subpage.
 * Used within the Tiptap editor as a node view.
 */
export default function ButtonBlock({
    node,
    updateAttributes,
    extension,
    selected,
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(node.attrs.text || "Click here");
    const [editUrl, setEditUrl] = useState(node.attrs.url || "#");
    const [editVariant, setEditVariant] = useState(
        node.attrs.variant || "primary",
    );

    useEffect(() => {
        setEditText(node.attrs.text);
        setEditUrl(node.attrs.url);
        setEditVariant(node.attrs.variant);
    }, [node.attrs]);

    const handleSave = () => {
        updateAttributes({
            text: editText,
            url: editUrl,
            variant: editVariant,
        });
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditText(node.attrs.text);
        setEditUrl(node.attrs.url);
        setEditVariant(node.attrs.variant);
        setIsEditing(false);
    };

    const variantStyles = {
        primary: "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] no-underline",
        secondary:
            "bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border border-[var(--color-border-primary)] hover:border-[var(--color-accent)]/50 no-underline",
        outline:
            "bg-transparent text-[var(--color-accent)] border-2 border-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 no-underline",
    };

    if (isEditing) {
        return (
            <NodeViewWrapper className="button-block my-4">
                <div className="p-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
                            Edit Button
                        </h4>
                        <button
                            onClick={() => setIsEditing(false)}
                            className="p-1 rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)]"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                            Button Text
                        </label>
                        <input
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)]/50"
                            placeholder="e.g., View Documentation"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                            Target URL
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={editUrl}
                                onChange={(e) => setEditUrl(e.target.value)}
                                className="flex-1 px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)]/50"
                                placeholder="/sites/123/pages/456"
                            />
                            <a
                                href={editUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-2 rounded-lg border border-[var(--color-border-primary)] text-[var(--color-text-muted)] hover:text-[var(--color-accent)]"
                                title="Test link"
                            >
                                <ExternalLink size={16} />
                            </a>
                        </div>
                        <p className="text-xs text-[var(--color-text-muted)] mt-1">
                            Link to another page:{" "}
                            <code className="bg-[var(--color-bg-tertiary)] px-1 rounded">
                                /sites/{"{siteId}"}/pages/{"{pageId}"}
                            </code>
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                            Style
                        </label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setEditVariant("primary")}
                                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    editVariant === "primary"
                                        ? "bg-[var(--color-accent)] text-white"
                                        : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] border border-[var(--color-border-primary)]"
                                }`}
                            >
                                Primary
                            </button>
                            <button
                                onClick={() => setEditVariant("secondary")}
                                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    editVariant === "secondary"
                                        ? "bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] border border-[var(--color-border-primary)]"
                                        : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] border border-[var(--color-border-primary)]"
                                }`}
                            >
                                Secondary
                            </button>
                            <button
                                onClick={() => setEditVariant("outline")}
                                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    editVariant === "outline"
                                        ? "border-2 border-[var(--color-accent)] text-[var(--color-accent)]"
                                        : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] border border-[var(--color-border-primary)]"
                                }`}
                            >
                                Outline
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                        <button
                            onClick={handleSave}
                            className="flex-1 px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors"
                        >
                            Save
                        </button>
                        <button
                            onClick={handleCancel}
                            className="flex-1 px-4 py-2 bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] rounded-lg text-sm font-medium border border-[var(--color-border-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </NodeViewWrapper>
        );
    }

    return (
        <NodeViewWrapper className="button-block my-4">
            <div className="relative group">
                <a
                    href={node.attrs.url}
                    target={
                        node.attrs.url.startsWith("http") ? "_blank" : undefined
                    }
                    rel={
                        node.attrs.url.startsWith("http")
                            ? "noopener noreferrer"
                            : undefined
                    }
                    data-variant={node.attrs.variant}
                    className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all no-underline ${variantStyles[node.attrs.variant]} ${node.attrs.variant}`}
                >
                    <span>{node.attrs.text}</span>
                    <ExternalLink size={16} />
                </a>

                {/* Edit Button (visible on hover) */}
                <button
                    onClick={() => setIsEditing(true)}
                    className="absolute -top-2 -right-2 p-1.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    title="Edit button"
                >
                    <Link2
                        size={14}
                        className="text-[var(--color-text-muted)]"
                    />
                </button>
            </div>
        </NodeViewWrapper>
    );
}
