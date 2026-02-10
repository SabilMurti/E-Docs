# Rich Pages Editor v2

## Goal

Membangun rich pages editor dengan kualitas dokumentasi seperti GitBook + kemampuan web builder (drag-drop, visual styling). Implementasi bertahap dengan fokus kualitas dan stabilitas per block type.

---

## Architecture Overview

```
src/components/editor/
├── RichEditor.jsx              # Main editor wrapper (mengganti PageEditor)
├── EditorCore.jsx              # Tiptap instance + global handlers
├── toolbar/
│   ├── BubbleToolbar.jsx       # Text selection toolbar (improved)
│   ├── FloatingToolbar.jsx     # Block-level actions
│   └── FixedToolbar.jsx        # Optional sticky toolbar
├── menus/
│   ├── SlashMenu.jsx           # Slash command (self-contained)
│   ├── BlockMenu.jsx           # Block operations menu
│   └── LinkMenu.jsx            # Link editing popup
├── blocks/                     # Block-type components
│   ├── index.js                # Re-export semua blocks
│   ├── CalloutBlock.jsx        # Info/Warning/Success/Danger
│   ├── CodeBlock.jsx           # Syntax highlighting + copy
│   ├── ImageBlock.jsx          # Resize + caption
│   ├── TableBlock.jsx          # Interactive table
│   ├── TabsBlock.jsx           # Tabbed content
│   ├── ToggleBlock.jsx         # Accordion/expandable
│   ├── ColumnsBlock.jsx        # Multi-column layout
│   ├── CardBlock.jsx           # Card with styling
│   ├── EmbedBlock.jsx          # YouTube, generic embeds
│   └── DividerBlock.jsx        # Styled divider
├── extensions/                 # Tiptap custom extensions
│   ├── Callout/
│   │   ├── index.js            # Extension definition
│   │   └── CalloutView.jsx     # Node view component
│   ├── CodeBlockPlus/
│   ├── ImagePlus/
│   ├── Tabs/
│   ├── Toggle/
│   ├── Columns/
│   ├── Card/
│   └── DragHandle/             # Drag-drop support
├── utils/
│   ├── blockOperations.js      # Move, duplicate, delete, transform
│   └── keyboardShortcuts.js    # Global shortcuts
└── styles/
    └── editor.css              # Editor-specific styles
```

---

## Implementation Phases

### ✅ Phase 1: Core Foundation (COMPLETED)

Perbaikan infrastruktur dasar agar stable.

- [x] **1.1** Refactor PageEditor → RichEditor dengan clean separation
- [x] **1.2** Fix SlashMenu: self-contained keyboard handling (capture phase)
- [x] **1.3** Implement proper block operations (move up/down, duplicate, delete, transform)
- [x] **1.4** Add DragHandle extension untuk drag-drop blocks

**Verify:** ✅ Build success, slash menu self-contained

---

### ✅ Phase 2: Essential Text Blocks (COMPLETED)

Block-block text dasar dengan styling premium.

- [x] **2.1** Callout Extension - Info, Warning, Success, Danger dengan proper node view
- [x] **2.2** CodeBlock Plus - Language selector, copy button, macOS-style header
- [ ] **2.3** Blockquote styling enhancement
- [ ] **2.4** List improvements (nested drag support)

**Verify:** ✅ Callout dan CodeBlock sebagai proper Tiptap extensions

---

### ⏳ Phase 3: Media & Embeds

Handling gambar dan media lainnya.

- [ ] **3.1** ImagePlus Extension - Upload, resize handles, caption, alignment
- [ ] **3.2** Video Embed - YouTube, Vimeo dengan proper preview
- [ ] **3.3** File attachment block
- [ ] **3.4** Generic iframe embed

**Verify:** Image bisa resize dengan drag, embed YouTube tampil dengan preview

---

### ⏳ Phase 4: Layout Blocks

Block untuk layout yang kompleks.

- [ ] **4.1** Columns Extension - 2, 3, 4 column layouts, resizable
- [ ] **4.2** Tabs Extension - Multiple tabs, renameable
- [ ] **4.3** Toggle/Accordion Extension - Collapsible content
- [ ] **4.4** Card Extension - Styled cards dengan icon support

**Verify:** Columns bisa di-resize, tabs bisa di-switch, toggle bisa expand/collapse

---

### ⏳ Phase 5: Table & Data

Tabel dan data display.

- [ ] **5.1** Table enhancement - Better styling, row/column operations
- [ ] **5.2** Table of Contents - Auto-generated dari headings
- [ ] **5.3** Page link block - Link ke page lain dengan preview

**Verify:** Table punya toolbar untuk manipulasi, ToC auto-update

---

### ✅ Phase 6: Polish & DX (COMPLETED)

Final touches dan UX improvements.

- [x] **6.1** Block transformation (Turn Into menu — convert paragraph ↔ heading, list ↔ checklist)
- [x] **6.2** Keyboard shortcuts (Undo/Redo buttons + Ctrl+Z/Y built-in + toolbar hints)
- [x] **6.3** Undo/redo reliability (buttons + StarterKit built-in)
- [ ] **6.4** Performance optimization
- [ ] **6.5** Accessibility audit

**Verify:** ✅ Undo/Redo buttons, Turn Into dropdown, cleaned SlashMenu

---

## Done When

- [ ] Semua block types functional dan stable
- [ ] Drag-drop blocks berfungsi smooth
- [ ] Slash command `/` untuk semua block types
- [ ] Visual styling konsisten dengan design system
- [ ] No console errors, no React warnings

---

## Notes

- Setiap phase di-commit terpisah
- Testing manual setelah setiap block
- Backward compatible dengan existing content (TipTap JSON)
