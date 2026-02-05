# E-Docs Frontend Implementation Plan

> **Project**: GitBook-like Documentation Platform (Frontend)  
> **Tech Stack**: Vite + React (JavaScript) + TailwindCSS + Tiptap  
> **Backend**: Laravel 12 API (sudah tersedia)

---

## Overview

Membuat frontend React untuk platform dokumentasi seperti GitBook yang terintegrasi dengan backend Laravel 12 API. Frontend akan berada di folder `/frontend` dan berkomunikasi dengan backend melalui REST API.

### Success Criteria

| Criteria              | Measurement                            |
| --------------------- | -------------------------------------- |
| OAuth Login berfungsi | User bisa login via Google/GitHub      |
| Spaces Management     | CRUD spaces berfungsi                  |
| Page Editor           | Bisa create/edit page dengan Tiptap    |
| Tree Navigation       | Sidebar menampilkan hierarchical pages |
| Collaboration         | Bisa invite member dengan role         |
| Version History       | Bisa lihat dan restore revisi          |
| Public View           | Visitor bisa akses public space        |

---

## Tech Stack

| Category        | Technology      | Rationale                                    |
| --------------- | --------------- | -------------------------------------------- |
| **Build Tool**  | Vite            | Fast HMR, simple config                      |
| **Framework**   | React 18 (JS)   | Familiar, ecosystem luas                     |
| **Styling**     | TailwindCSS v4  | Rapid development, utility-first             |
| **Routing**     | React Router v7 | Standard untuk SPA                           |
| **State**       | Zustand         | Lightweight, simple API                      |
| **HTTP Client** | Axios           | Interceptors, error handling                 |
| **Rich Editor** | Tiptap v2       | Compatible dengan backend (ProseMirror JSON) |
| **Icons**       | Lucide React    | Clean, consistent                            |
| **Tree View**   | @dnd-kit        | Drag & drop untuk reorder pages              |

---

## File Structure

```
/frontend
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .env.example
├── public/
│   └── favicon.ico
└── src/
    ├── main.jsx                 # Entry point
    ├── App.jsx                  # Root component + routes
    ├── index.css                # Tailwind imports
    │
    ├── api/                     # API layer
    │   ├── client.js            # Axios instance
    │   ├── auth.js              # Auth endpoints
    │   ├── spaces.js            # Spaces endpoints
    │   ├── pages.js             # Pages endpoints
    │   ├── members.js           # Members endpoints
    │   └── revisions.js         # Revisions endpoints
    │
    ├── components/              # Reusable components
    │   ├── common/
    │   │   ├── Button.jsx
    │   │   ├── Modal.jsx
    │   │   ├── Input.jsx
    │   │   ├── Dropdown.jsx
    │   │   └── LoadingSpinner.jsx
    │   │
    │   ├── layout/
    │   │   ├── Navbar.jsx
    │   │   ├── Sidebar.jsx
    │   │   └── MainLayout.jsx
    │   │
    │   ├── auth/
    │   │   └── OAuthButton.jsx
    │   │
    │   ├── spaces/
    │   │   ├── SpaceCard.jsx
    │   │   ├── SpaceList.jsx
    │   │   └── SpaceForm.jsx
    │   │
    │   ├── pages/
    │   │   ├── PageTree.jsx       # Recursive tree component
    │   │   ├── PageTreeItem.jsx
    │   │   └── PageContent.jsx
    │   │
    │   ├── editor/
    │   │   ├── TiptapEditor.jsx
    │   │   ├── EditorToolbar.jsx
    │   │   └── extensions/        # Custom Tiptap extensions
    │   │
    │   ├── members/
    │   │   ├── MemberList.jsx
    │   │   └── InviteModal.jsx
    │   │
    │   └── revisions/
    │       ├── RevisionList.jsx
    │       └── RevisionItem.jsx
    │
    ├── pages/                   # Route pages
    │   ├── HomePage.jsx         # Landing / Space list
    │   ├── LoginPage.jsx        # OAuth buttons
    │   ├── SpacePage.jsx        # Single space view
    │   ├── PageEditorPage.jsx   # Edit page content
    │   ├── SettingsPage.jsx     # Space settings + members
    │   └── PublicSpacePage.jsx  # Public view (no auth)
    │
    ├── stores/                  # Zustand stores
    │   ├── authStore.js
    │   ├── spaceStore.js
    │   └── pageStore.js
    │
    ├── hooks/                   # Custom hooks
    │   ├── useAuth.js
    │   ├── useSpaces.js
    │   └── usePages.js
    │
    └── utils/                   # Helpers
        ├── constants.js
        └── helpers.js
```

---

## Phased Implementation

### 🔴 Phase 1: Foundation (MVP Core)

**Goal**: Project setup + authentication working

#### [NEW] Project Initialization

| File                          | Description                                                              |
| ----------------------------- | ------------------------------------------------------------------------ |
| `frontend/package.json`       | Dependencies: react, vite, tailwindcss, axios, zustand, react-router-dom |
| `frontend/vite.config.js`     | Proxy to Laravel API                                                     |
| `frontend/tailwind.config.js` | TailwindCSS v4 config                                                    |
| `frontend/.env.example`       | `VITE_API_URL=http://localhost:8000/api`                                 |

**Commands**:

```bash
cd /home/fahcreza/E-Docs
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm install -D tailwindcss @tailwindcss/postcss postcss
npm install axios zustand react-router-dom lucide-react
```

---

#### [NEW] API Client Setup

**File**: `src/api/client.js`

```javascript
import axios from "axios";

const client = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: { "Content-Type": "application/json" },
});

// Add token interceptor
client.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export default client;
```

---

#### [NEW] OAuth Authentication

**File**: `src/components/auth/OAuthButton.jsx`

Implementasi popup OAuth sesuai README backend:

1. Open popup ke `/api/auth/google` atau `/api/auth/github`
2. Listen `message` event untuk terima token
3. Save token ke localStorage
4. Close popup

**Flow**:

```
User clicks "Login with Google"
    ↓
Popup opens → Laravel redirects to Google
    ↓
User authenticates at Google
    ↓
Callback to Laravel → Generate token
    ↓
Laravel sends postMessage with token
    ↓
Frontend receives token → Store in localStorage
    ↓
Popup closes → User logged in
```

---

### 🟡 Phase 2: Core Features

**Goal**: Spaces + Pages CRUD working

#### Components to Build

| Component          | INPUT             | OUTPUT              | VERIFY            |
| ------------------ | ----------------- | ------------------- | ----------------- |
| `SpaceList.jsx`    | API call          | Grid of space cards | Spaces tampil     |
| `SpaceForm.jsx`    | User input        | Create/update space | Space tersimpan   |
| `PageTree.jsx`     | Pages array       | Recursive sidebar   | Hierarchy benar   |
| `TiptapEditor.jsx` | Page content JSON | Editable document   | Content tersimpan |

#### API Endpoints Used

```javascript
// Spaces
GET    /api/spaces           → List spaces
POST   /api/spaces           → Create space
PUT    /api/spaces/{id}      → Update space
DELETE /api/spaces/{id}      → Delete space

// Pages
GET    /api/spaces/{id}/pages           → Get page tree
POST   /api/spaces/{id}/pages           → Create page
PUT    /api/spaces/{id}/pages/{pageId}  → Update page
DELETE /api/spaces/{id}/pages/{pageId}  → Delete page
POST   /api/spaces/{id}/pages/reorder   → Reorder pages
```

---

### 🟢 Phase 3: Collaboration

**Goal**: Member management working

#### Components to Build

| Component         | Description                |
| ----------------- | -------------------------- |
| `MemberList.jsx`  | Display members with roles |
| `InviteModal.jsx` | Form to invite by email    |

#### API Endpoints Used

```javascript
GET    /api/spaces/{id}/members           → List members
POST   /api/spaces/{id}/members           → Invite member
PUT    /api/spaces/{id}/members/{memberId} → Change role
DELETE /api/spaces/{id}/members/{memberId} → Remove member
```

---

### 🔵 Phase 4: Advanced Features

**Goal**: Version history + search

#### Components to Build

| Component           | Description                         |
| ------------------- | ----------------------------------- |
| `RevisionList.jsx`  | Timeline of page revisions          |
| `RevisionItem.jsx`  | Single revision with restore button |
| `SearchBar.jsx`     | Search input in navbar              |
| `SearchResults.jsx` | Display search results              |

#### API Endpoints Used

```javascript
GET  /api/spaces/{id}/pages/{pageId}/revisions              → List revisions
GET  /api/spaces/{id}/pages/{pageId}/revisions/{revId}      → View revision
POST /api/spaces/{id}/pages/{pageId}/revisions/{revId}/restore → Restore
GET  /api/spaces/{id}/search?q=keyword                      → Search
```

---

### ⚪ Phase 5: Public Access

**Goal**: Public view tanpa login

#### Routes

| Route                     | Component             | Auth Required |
| ------------------------- | --------------------- | ------------- |
| `/public/:slug`           | `PublicSpacePage.jsx` | ❌ No         |
| `/public/:slug/:pageSlug` | `PublicPageView.jsx`  | ❌ No         |

#### API Endpoints Used

```javascript
GET /api/public/spaces/{slug}           → Get public space
GET /api/public/spaces/{slug}/pages     → Get pages tree
GET /api/public/spaces/{slug}/pages/{pageSlug} → Get page content
```

---

### 🟣 Phase 6: Polish & Deploy

**Goal**: Production-ready

| Task              | Description                           |
| ----------------- | ------------------------------------- |
| Responsive Design | Mobile-friendly layout                |
| Loading States    | Skeleton loaders, spinners            |
| Error Handling    | Toast notifications, error boundaries |
| Empty States      | "No spaces yet" illustrations         |
| Dark Mode         | Toggle light/dark theme               |

---

## UI Design Reference (GitBook Style)

### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  🔲 Logo    [Search...]           [User Avatar ▼]       │  ← Navbar
├─────────────┬───────────────────────────────────────────┤
│             │                                           │
│  📁 Space   │   Page Title                              │
│  └─ 📄 Intro│   ══════════════                          │
│  └─ 📄 Setup│                                           │
│     └─ 📄 X │   Content here...                         │
│  └─ 📄 API  │                                           │
│             │                                           │
│  [+ Add Page]                                           │
│             │                                           │
├─────────────┴───────────────────────────────────────────┤
│  Sidebar (250px)  │  Main Content (flex-1)              │
└─────────────────────────────────────────────────────────┘
```

### Color Palette (GitBook-inspired)

```css
/* Light Mode */
--bg-primary: #ffffff;
--bg-secondary: #f7f7f7;
--text-primary: #1a1a1a;
--text-secondary: #6b7280;
--accent: #3b82f6; /* Blue */
--border: #e5e7eb;

/* Dark Mode */
--bg-primary: #0d1117;
--bg-secondary: #161b22;
--text-primary: #e6edf3;
--accent: #58a6ff;
```

---

## Verification Plan

### Automated Tests

Karena ini project baru, akan dibuat test files:

```bash
# Install testing dependencies
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom

# Run tests
npm run test
```

**Test Files to Create**:

- `src/api/__tests__/client.test.js` - API client tests
- `src/stores/__tests__/authStore.test.js` - Auth store tests
- `src/components/__tests__/OAuthButton.test.jsx` - OAuth flow test

### Manual Verification

| Phase | Test          | Steps                                                                                                                          |
| ----- | ------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 1     | OAuth Login   | 1. Buka http://localhost:5173 <br> 2. Klik "Login with Google" <br> 3. Popup muncul, login <br> 4. Popup tutup, user logged in |
| 2     | Space CRUD    | 1. Klik "New Space" <br> 2. Isi nama, submit <br> 3. Space muncul di list                                                      |
| 2     | Page Editor   | 1. Buka space <br> 2. Klik "+ Add Page" <br> 3. Ketik konten di editor <br> 4. Save, refresh, konten masih ada                 |
| 3     | Invite Member | 1. Buka Settings <br> 2. Invite email <br> 3. Check member muncul di list                                                      |
| 4     | Search        | 1. Ketik keyword di search bar <br> 2. Hasil muncul                                                                            |
| 5     | Public View   | 1. Publish space <br> 2. Buka /public/{slug} tanpa login <br> 3. Konten tampil                                                 |

### Browser Testing

```bash
# Start dev server
npm run dev

# Test in browser
# 1. Open http://localhost:5173
# 2. Test each feature manually
# 3. Check console for errors
```

---

## Dependencies

```json
{
    "dependencies": {
        "react": "^18.3.0",
        "react-dom": "^18.3.0",
        "react-router-dom": "^7.0.0",
        "axios": "^1.7.0",
        "zustand": "^5.0.0",
        "@tiptap/react": "^2.10.0",
        "@tiptap/starter-kit": "^2.10.0",
        "@tiptap/extension-placeholder": "^2.10.0",
        "@dnd-kit/core": "^6.3.0",
        "@dnd-kit/sortable": "^9.0.0",
        "lucide-react": "^0.460.0"
    },
    "devDependencies": {
        "@vitejs/plugin-react": "^4.3.0",
        "vite": "^6.0.0",
        "tailwindcss": "^4.0.0",
        "@tailwindcss/postcss": "^4.0.0",
        "postcss": "^8.5.0"
    }
}
```

---

## Risk & Mitigation

| Risk                 | Mitigation                             |
| -------------------- | -------------------------------------- |
| CORS issues          | Configure Laravel CORS, use Vite proxy |
| OAuth popup blocked  | Fallback redirect flow                 |
| Tiptap JSON mismatch | Test with backend sample data          |
| Large page tree      | Virtual scrolling if needed            |

---

## Timeline Estimate

| Phase     | Duration        | Notes              |
| --------- | --------------- | ------------------ |
| Phase 1   | 2-3 hari        | Setup + Auth       |
| Phase 2   | 4-5 hari        | Core CRUD + Editor |
| Phase 3   | 2 hari          | Member management  |
| Phase 4   | 2-3 hari        | Revisions + Search |
| Phase 5   | 1-2 hari        | Public view        |
| Phase 6   | 2-3 hari        | Polish             |
| **Total** | **~2-3 minggu** |                    |

---

## Next Steps

Setelah plan disetujui:

1. Run `/create` atau mulai Phase 1
2. Setup Vite + React + TailwindCSS
3. Implement OAuth flow
4. Test dengan backend

---

> 📝 **Note**: Plan ini akan diupdate seiring development berlanjut.
