import { NodeViewWrapper } from "@tiptap/react";
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Link2, X, ChevronRight, Check } from "lucide-react";

const VARIANTS = [
  { id: "primary", label: "Primary" },
  { id: "secondary", label: "Secondary" },
  { id: "outline", label: "Outline" },
];

const variantStyles = {
  primary:
    "bg-[var(--color-accent)] !text-white hover:bg-[var(--color-accent-hover)] shadow-sm",
  secondary:
    "bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border-primary)] hover:border-[var(--color-accent)] shadow-sm hover:shadow-md w-full justify-between",
  outline:
    "bg-transparent text-[var(--color-accent)] border-2 border-[var(--color-accent)] hover:bg-[var(--color-accent)]/10",
};

export default function ButtonBlock({ node, updateAttributes, selected }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(node.attrs.text || "Click here");
  const [editUrl, setEditUrl] = useState(node.attrs.url || "#");
  const [editVariant, setEditVariant] = useState(node.attrs.variant || "primary");
  const panelRef = useRef(null);

  // Sync local state when node attrs change externally
  useEffect(() => {
    setEditText(node.attrs.text);
    setEditUrl(node.attrs.url);
    setEditVariant(node.attrs.variant);
  }, [node.attrs.text, node.attrs.url, node.attrs.variant]);

  // Close panel when clicking outside (without a fixed overlay)
  useEffect(() => {
    if (!isEditing) return;
    const handleOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        handleCancel();
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [isEditing]);

  // Use mousedown + preventDefault on all panel interactions so editor focus is not lost
  const handleSave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    updateAttributes({ text: editText, url: editUrl, variant: editVariant });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(node.attrs.text);
    setEditUrl(node.attrs.url);
    setEditVariant(node.attrs.variant);
    setIsEditing(false);
  };

  const openEdit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditing(true);
  };

  return (
    <NodeViewWrapper className="button-block my-4 relative">
      <div className="relative group" ref={isEditing ? panelRef : null}>

        {/* ── View mode ─────────────────────────────── */}
        {node.attrs.url?.startsWith("http") ? (
          <a
            href={node.attrs.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all no-underline ${variantStyles[node.attrs.variant] || variantStyles.primary}`}
            onClick={(e) => e.preventDefault()} // prevent actual navigation inside editor
          >
            <span className="flex-1 text-left">{node.attrs.text}</span>
            <ExternalLink size={16} />
          </a>
        ) : (
          <Link
            to={node.attrs.url || "#"}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all no-underline ${variantStyles[node.attrs.variant] || variantStyles.primary}`}
            onClick={(e) => e.preventDefault()} // prevent navigation inside editor
          >
            <span className="flex-1 text-left">{node.attrs.text}</span>
            <ChevronRight size={16} className="opacity-50" />
          </Link>
        )}

        {/* Edit pencil button */}
        <button
          onMouseDown={openEdit}
          className="absolute -top-2 -right-2 p-1.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
          title="Edit button"
        >
          <Link2 size={14} className="text-[var(--color-text-muted)]" />
        </button>

        {/* ── Edit panel (floating) ──────────────────── */}
        {isEditing && (
          <div
            ref={panelRef}
            className="absolute z-30 top-full left-0 mt-2 w-80 p-4 bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)] rounded-xl shadow-2xl space-y-3"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Edit Button
              </h4>
              <button
                onMouseDown={(e) => { e.preventDefault(); handleCancel(); }}
                className="p-1 rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)]"
              >
                <X size={16} />
              </button>
            </div>

            {/* Button Text */}
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                Button Text
              </label>
              <input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSave(e); } }}
                className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)]/50"
                placeholder="e.g., View Documentation"
              />
            </div>

            {/* Target URL */}
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                Target URL
              </label>
              <input
                type="text"
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSave(e); } }}
                className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)]/50"
                placeholder="https://... atau /sites/xxx/pages/yyy"
              />
            </div>

            {/* Style selector */}
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                Style
              </label>
              <div className="flex gap-2">
                {VARIANTS.map((v) => (
                  <button
                    key={v.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setEditVariant(v.id);
                    }}
                    className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors border ${
                      editVariant === v.id
                        ? "bg-[var(--color-accent)] text-white border-[var(--color-accent)]"
                        : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] border-[var(--color-border-primary)] hover:border-[var(--color-accent)]/50"
                    }`}
                  >
                    {editVariant === v.id && <Check size={10} />}
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                onMouseDown={handleSave}
                className="flex-1 px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors"
              >
                Save
              </button>
              <button
                onMouseDown={(e) => { e.preventDefault(); handleCancel(); }}
                className="flex-1 px-4 py-2 bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] rounded-lg text-sm font-medium border border-[var(--color-border-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}
