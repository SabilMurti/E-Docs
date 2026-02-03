# E-Document (Backend API)

A robust backend API for a documentation platform similar to GitBook. Built with **Laravel 12**, it supports workspaces ("Spaces"), hierarchical page structures, real-time collaboration features, version history, and full-text search.

## 🚀 Features

-   **Authentication**: Secure OAuth login (Google & GitHub) via Socialite.
-   **Spaces**: Manage documentation workspaces with public/private visibility.
-   **Structured Content**: Infinite nesting of pages (Tree structure) with drag-and-drop reordering.
-   **Rich Text**: designed to store Tiptap/ProseMirror JSON content.
-   **Collaboration**: Invite team members via email with 'Editor' or 'Viewer' roles.
-   **Versioning**: Automatic revision history for every page update with "Restore" capability.
-   **Search**: Fast full-text search for pages within spaces.

## 🛠️ Setup Guide

### Prerequisites
-   PHP 8.2+
-   Composer
-   MySQL 8.0+

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/SabilMurti/E-Docs.git
    cd E-Docs
    ```

2.  **Install Dependencies**
    ```bash
    composer install
    ```

3.  **Environment Setup**
    Copy `.env.example` to `.env` and configure your database and OAuth credentials.
    ```bash
    cp .env.example .env
    php artisan key:generate
    ```

    **Required .env variables:**
    ```env
    DB_CONNECTION=mysql
    DB_DATABASE=e_document
    DB_PASSWORD=root  # Or your password

    # OAuth Credentials (get these from Google Console / GitHub Settings)
    GOOGLE_CLIENT_ID=...
    GOOGLE_CLIENT_SECRET=...
    GITHUB_CLIENT_ID=...
    GITHUB_CLIENT_SECRET=...

    # Frontend URL (for redirects and emails)
    FRONTEND_URL=http://localhost:5173
    ```

4.  **Database & Migrations**
    ```bash
    php artisan migrate
    ```

5.  **Run Server**
    ```bash
    php artisan serve
    ```

---

## 📖 API Documentation

### Authentication (OAuth)
The app uses a popup/iframe flow for OAuth.
1.  Frontend opens a popup to `GET /api/auth/google` or `GET /api/auth/github`.
2.  User logs in at provider.
3.  Backend handles callback and returns a standard HTML page with a `postMessage`.
4.  Frontend listens for `message` event to receive the API Token.

**Endpoints:**
-   `GET /api/auth/google` - Initiate Google Login
-   `GET /api/auth/github` - Initiate GitHub Login
-   `GET /api/auth/me` - Get current user (Requires Bearer Token)
-   `POST /api/auth/logout` - Revoke Token

### Spaces
-   `GET /api/spaces` - List all spaces you have access to (Owned + Joined).
-   `POST /api/spaces` - Create a new space.
    -   *Body*: `{ "name": "My Docs", "visibility": "public" }`
-   `GET /api/spaces/{id}` - Get space details.
-   `PUT /api/spaces/{id}` - Update space info.
-   `DELETE /api/spaces/{id}` - Delete space (Owner only).
-   `POST /api/spaces/{id}/publish` - Make space publicly accessible.
-   `POST /api/spaces/{id}/unpublish` - Make space private.

### Pages (The core content)
-   `GET /api/spaces/{space_id}/pages` - Get the **full tree** of pages.
    -   *Response*: Recursive JSON structure with `children` arrays.
-   `POST /api/spaces/{space_id}/pages` - Create a page.
    -   *Body*: `{ "title": "Intro", "parent_id": "uuid-optional", "content": {...} }`
-   `GET /api/spaces/{space_id}/pages/{page_id}` - Get single page details.
-   `PUT /api/spaces/{space_id}/pages/{page_id}` - Update content.
    -   *Body*: `{ "title": "New Title", "content": { "type": "doc", ... } }`
    -   *Note*: Updating `content` automatically creates a **Revision**.
-   `POST /api/spaces/{space_id}/pages/reorder` - Update page order.
    -   *Body*: `{ "pages": [ { "id": "uuid", "order": 1, "parent_id": null }, ... ] }`

### Collaboration & Members
-   `GET /api/spaces/{id}/members` - List members.
-   `POST /api/spaces/{id}/members` - Invite user.
    -   *Body*: `{ "email": "friend@example.com", "role": "editor" }`
-   `PUT /api/spaces/{id}/members/{member_id}` - Change role.
-   `DELETE /api/spaces/{id}/members/{member_id}` - Remove member.
-   `POST /api/spaces/{space_id}/invites/{token}/accept` - Accept an invitation.

### Revisions (Version Control)
-   `GET /api/spaces/.../pages/{id}/revisions` - List history.
-   `GET /api/spaces/.../pages/{id}/revisions/{rev_id}` - View specific version.
-   `POST /api/spaces/.../pages/{id}/revisions/{rev_id}/restore` - Revert page to this version.

### Search
-   `GET /api/spaces/{id}/search?q=keyword` - Full-text search on page titles.

---

## 👨‍💻 Frontend Integration Notes (For My Friend)

### 1. Handling OAuth
Don't implement the OAuth flow manually. Just open a window:
```javascript
const popup = window.open('http://localhost:8000/api/auth/google', 'Login', 'width=500,height=600');

window.addEventListener('message', (event) => {
    if (event.origin !== 'http://localhost:8000') return;
    
    const { type, token, user } = event.data;
    if (type === 'oauth-success') {
        // Save token to localStorage
        localStorage.setItem('token', token);
        // Close popup
        popup.close();
    }
});
```

### 2. Tiptap Content
The `content` field in `Pages` expects a JSON object (ProseMirror format).
-   When sending to API: Send the raw JSON from `editor.getJSON()`.
-   When receiving from API: Pass the JSON directly to `editor.commands.setContent(data.content)`.

### 3. Tree Structure
The `GET /pages` endpoint returns a nested tree:
```json
[
  {
    "id": "1",
    "title": "Introduction",
    "children": [
      { "id": "2", "title": "Setup", "children": [] }
    ]
  }
]
```
You can use a recursive component to render the sidebar.

### 4. Public Access
For the public view (read-only for visitors), use the `public` endpoints:
-   `GET /api/public/spaces/{slug}`
-   `GET /api/public/spaces/{slug}/pages`
These do NOT require an Authorization header.
