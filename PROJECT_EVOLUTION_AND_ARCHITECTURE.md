# Project Evolution & Architecture Documentation

This document provides a comprehensive overview of the project's evolution, detailing all added, changed, and removed features, as well as a deep dive into the frontend architecture and how the system works.

---

## 📅 Project Evolution (Changelog)

A detailed log of all modifications made to the codebase in recent development cycles.

### 🚀 Added (New Features)

#### 1. Collaborative Git-like Workflow

We transformed the document management system into a Git-style collaboration platform.

- **Merge Requests (MRs):**
    - Dedicated "Compare & Merge" interface similar to GitHub Pull Requests.
    - Ability to select **Source Branch** and **Target Branch**.
    - **Conflict Detection:** Backend logic to check if branches can be merged automatically.
    - **Diff View:** Visual comparison showing files changed (`added`, `modified`, `deleted`) with line-by-line diffs.
- **Git Actions:**
    - **"Git Pull" (Sync):** Mechanism to update a local draft with the latest version from the server.
    - **Branch Management:** Create, switch, and push branches.
- **Status Workflow:** Handling states like `Draft`, `Open`, `Merged`, `Conflict`, and `Identical`.

#### 2. Advanced Rich Text Editor

Significant upgrades to the core editing experience (`Tiptap`-based).

- **Interactive Flowchart (Excalidraw):**
    - Integrated **Excalidraw** directly into the editor as a custom block.
    - Users can draw diagrams, flowcharts, and wireframes without leaving the app.
    - Double-click to edit, click outside to save.
- **Mermaid Diagrams:** Support for code-based diagrams using Mermaid syntax.
- **Enhanced Content Blocks:**
    - **Tables:** Full support for adding/deleting rows/cols.
    - **Images:** Upload, resize, and caption support.
    - **Callouts/Alerts:** Colored blocks for warnings, tips, and notes.
    - **Code Blocks:** Syntax highlighting for various languages.
- **Floating Menus:** Context-aware menus (Bubble Menu for text formatting, Floating Menu for inserting blocks).

#### 3. Authentication & Security

- **Casdoor Integration:** Implemented Centralized Authentication Service (SSO).
- **Google OAuth:** Enabled "Login with Google" via Casdoor.
- **Protected Routes:** Frontend middleware to secure pages requiring authentication.

#### 4. Admin Functionality

- **Category Management (CRUD):** Full admin interface to Create, Read, Update, and Delete document categories.

---

### 🛠️ Changed (Modifications)

#### 1. Revision History Overhaul

- **From:** A simple vertical timeline or modal popup.
- **To:** A **Full-Page Commit History** (similar to GitHub's commit log).
    - Displays detailed metadata (Committer, Date, Message).
    - Drill-down view to see exactly what changed in each revision.

#### 2. "Push" & Review Workflow

- **Before:** Users could "Push" directly from the editor header.
- **Now:** The "Push" button was moved to the **Change Request Detail** view.
    - **Logic:** Users must first "Request Review" -> Go to the Request page -> Review their own changes -> Then "Push" if approved. This prevents accidental pushes and encourages self-review.

#### 3. Diff Visualization

- Improved the visual discrepancy highlighter.
- **Green:** Added lines.
- **Red:** Removed/Old lines.
- **Line Numbers:** Added for better reference.

---

### 🗑️ Removed (Cleaned Up)

#### 1. Old History Components

- **Legacy Modal History:** Removed in favor of the full-page experience.
- **Vertical Timeline Styles:** Deprecated CSS for the old timeline view.

#### 2. Redundant UI Elements

- **Direct Push Button:** Removed from the main editor header to enforce the Review -> Push workflow.
- **Excalidraw Export Options:** Hidden unnecessary "Save to Disk" or "Export Image" buttons from the embedded Excalidraw UI to keep the interface clean and focused on in-app usage.

---

## 🏗️ Frontend System Architecture

### 1. Technology Stack

The frontend is a modern Single Page Application (SPA) built with:

- **Framework:** [React 19](https://react.dev/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Language:** JavaScript (ES Modules)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) (Utility-first)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand) (Global Store)
- **Routing:** [React Router v7](https://reactrouter.com/)
- **Editor:** [Tiptap](https://tiptap.dev/) (Headless WYSIWYG)
- **UI Components:** Lucide React (Icons), Sonner (Toasts), DnD Kit (Drag & Drop)

### 2. Folder Structure

The codebase follows a feature-based and functional grouping:

```bash
frontend/src/
├── api/             # API client (Axios) and endpoint definitions (sites, auth, etc.)
├── components/      # UI Components
│   ├── common/      # Reusable UI atoms (Buttons, Modals, Spinners)
│   ├── editor/      # Tiptap Editor engine and extensions
│   ├── layout/      # Main Application Layouts (Sidebar, Header)
│   └── pages/       # Specific page components (MergeRequests, ChangeRequests)
├── hooks/           # Custom React Hooks
├── pages/           # Route wrapper components (lazy loading points)
├── stores/          # Zustand State Stores
└── utils/           # Helper functions (date formatting, string manipulation)
```

### 3. State Management (Zustand)

We avoid "Prop Drilling" by using **Zustand** stores for global state:

- **`authStore.js`**:
    - Manages User Profile (`user`), Authentication Status (`isAuthenticated`), and Token.
    - Handles Login/Logout logic.
- **`siteStore.js`**:
    - **Critical Store.** Manages the currently active Site (`currentSite`), the repository of Pages, and Git Branches (`branches`, `currentBranch`).
    - Fetches and caches site structure.
- **`pageStore.js`**:
    - Manages the specific Page content being viewed/edited.
    - Tracks `isEditing`, `unsavedChanges`, and `currentContent`.

### 4. The Editor Engine (`src/components/editor`)

The heart of the application is the **Rich Text Editor**. usage `Tiptap` in a modular way:

- **`RichEditor.jsx`**: The main component initializing the editor instance.
- **`extensions/`**: Defines custom capabilities.
    - **`Excalidraw/`**: Custom Node View that renders the Excalidraw React component inside a Tiptap block. Stored as a generic JSON object in the document.
    - **`SlashCommandMenu.jsx`**: Listens for `/` to open the block insertion menu.
- **Block System**: Content is stored as structured JSON (not just HTML), allowing complex interactive components like Change Request embeddings or diagrams to exist within the text.

### 5. Routing System (`App.jsx`)

- **Public Routes:** e.g., `/login`, `/auth/callback`, `/public/*` (Public documentation view).
- **Protected Routes:** Wrapped in `<ProtectedRoute>`.
    - Checks `authStore.isAuthenticated`.
    - Redirects to `/login` if false.
- **Dynamic Routes:**
    - `/sites/:siteId` -> Loads site context.
    - `/sites/:siteId/pages/:pageId` -> Loads specific page editor.
    - `/sites/:siteId/merge-requests/*` -> Git workflow pages.

### 6. Authentication Flow

1. **User Clicks Login:** Redirects to Casdoor (External IdP).
2. **Casdoor Redirects Back:** Hits `/auth/callback` with a `code`.
3. **Frontend Processing:**
    - Sends `code` to Backend `POST /api/auth/callback`.
    - Backend exchanges code for Token & User Info.
    - Frontend receives JWT Token -> Saves to LocalStorage -> Updates `authStore`.
4. **Session Hydration:** On app reload, `App.jsx` checks LocalStorage token and calls `fetchUser()` to restore session.

---

This document should provide a clear "Bird's Eye View" of where the project stands and how its internal machinery functions.
