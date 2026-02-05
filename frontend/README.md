# E-Docs Frontend

Web application for E-Docs documentation platform, built with React, Vite, and TailwindCSS.

## Features

- **Authentication**: OAuth login with Google (and GitHub support).
- **Space Management**: Create, edit, delete, and publish documentation spaces.
- **Page Editor**: Rich text editing using Tiptap with block-based content.
- **Hierarchical Pages**: Drag-and-drop page tree organization.
- **Collaboration**: Invite members with 'Editor' or 'Viewer' roles.
- **Version History**: Track content changes and restore previous versions.
- **Public Access**: Publicly sharable links for published spaces.
- **Dark Mode**: Fully supported dark/light theme.

## Tech Stack

- **Framework**: React 18 + Vite
- **Styling**: TailwindCSS v4
- **State Management**: Zustand
- **Routing**: React Router v7
- **Editor**: Tiptap v2
- **Testing**: Vitest + React Testing Library

## Getting Started

1. **Install Dependencies**

    ```bash
    npm install
    ```

2. **Environment Setup**
   Copy `.env.example` to `.env`:

    ```bash
    cp .env.example .env
    ```

    Ensure backend URL is set:

    ```
    VITE_API_URL=http://localhost:8000/api
    VITE_BACKEND_URL=http://localhost:8000
    ```

3. **Run Development Server**

    ```bash
    npm run dev
    ```

4. **Run Tests**
    ```bash
    npm run test
    ```

## Project Structure

- `src/api` - Axios client and API endpoints
- `src/components` - Reusable UI components
- `src/pages` - Route page components
- `src/stores` - Global state (Auth, Spaces, Pages)
- `src/utils` - Helper functions

## Key Components

- **Navbar**: Main navigation, search, and user menu.
- **Sidebar**: Space navigation and page tree.
- **TiptapEditor**: Custom wrapper around Tiptap editor.
- **SettingsPage**: Space configuration and member management.

## Testing

Unit tests are included for critical logic (AuthStore, API Client, Helpers).
Run `npm run test` to execute them.
