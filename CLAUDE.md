# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Industrial auditing application built with React 19 and Firebase. The app enables industrial equipment auditing with role-based access control (Admin, Supervisor, Auditor). Spanish language UI.

## Development Commands

```bash
npm start          # Start development server (localhost:3000)
npm run build      # Production build
npm test           # Run tests in watch mode
npm test -- --watchAll=false  # Run tests once
```

## Architecture

### Main Entry Point
- `src/AuditoriaApp.jsx` - Main application component that orchestrates authentication, roles, and renders role-specific layouts

### Role-Based System (3 Roles)
The app implements a permission system defined in `src/services/migration/roleService.js`:
- **Admin**: Full system access, user management, database cleanup
- **Supervisor**: Field data capture, create/edit plants and equipment
- **Auditor**: Review equipment, edit only `actionsDescription` and `observations` fields

Editable fields per role are defined in `EDITABLE_FIELDS_BY_ROLE` constant in roleService.js.

### Directory Structure
```
src/
├── hooks/                  # Custom React hooks
│   ├── useAuth.js         # Authentication state
│   ├── useRole.js         # Role management
│   ├── useAuthWithRole.js # Combined auth + role
│   ├── usePlants.js       # Plant data operations
│   ├── useEquipment.js    # Equipment data operations
│   ├── useSync.js         # Offline sync logic
│   └── useOfflineStatus.js
├── components/
│   ├── auth/              # Login, password recovery, role gates
│   ├── admin/             # Admin dashboard, user management
│   ├── supervisor/        # Plant/equipment forms and lists
│   ├── auditor/           # Auditor-specific views
│   ├── layout/            # AuditorLayout, SupervisorLayout
│   └── shared/            # Reusable components
├── services/
│   ├── auth/authService.js       # Firebase auth operations
│   ├── firebase/
│   │   ├── firebaseConfig.js     # Firebase initialization
│   │   └── firebaseServices.js   # CRUD for plants, equipment, images, PDFs
│   ├── migration/roleService.js  # Role/permission definitions
│   ├── storage/                  # Local storage and sync services
│   └── deletion/                 # Deletion operations
```

### Firebase Structure
- **Firestore Collections**: `plants`, `equipment`, `users`
- **Storage Paths**:
  - Images: `equipment_images/{plantId}/{equipmentId}/{category}/{filename}`
  - PDFs: `plantas/{plantId}/equipos/{equipmentId}/documentos/{category}/{filename}`

### Security Rules
- `firestore.rules` - Firestore security with role-based read/write permissions
- `storage.rules` - Storage security for images and PDFs (max 10MB images, 20MB PDFs)

Auditors can only update audit fields: `reviewStatus`, `reviewDate`, `reviewedBy`, `reviewerName`, `actionsDescription`, `observations`, `updatedAt`

### Equipment Audit Fields
Equipment documents include audit tracking fields:
- `reviewStatus`: 'pendiente' | 'revisado'
- `reviewDate`, `reviewedBy`, `reviewerName`
- `actionsDescription`, `observations` (editable by auditor)

## Key Patterns

### Authentication Flow
1. `useAuth()` hook provides `user`, `isAuthenticated`, `isLoading`
2. `useRole()` hook provides `isAdmin`, `isSupervisor`, `isAuditor`
3. Role determines which layout is rendered (AuditorLayout vs SupervisorLayout)

### Offline Support
The app supports offline mode with local storage sync. The `useSync` hook manages synchronization state.

### Image Compression
Images are compressed using `browser-image-compression` to max 0.5MB, 1920px, WebP format before upload.

## Tech Stack
- React 19.2, Tailwind CSS 3.4
- Firebase 12.5 (Auth, Firestore, Storage)
- lucide-react for icons
