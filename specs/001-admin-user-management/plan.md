# Implementation Plan: User Management Page of Admin Panel

**Branch**: `001-admin-user-management` | **Date**: 2026-06-22 | **Spec**: [spec.md](file:///d:/AI/開発/PaymentRequestWorkflowManagement/specs/001-admin-user-management/spec.md)

**Input**: Feature specification from [spec.md](file:///d:/AI/開発/PaymentRequestWorkflowManagement/specs/001-admin-user-management/spec.md)

## Summary
The User Management Page of Admin Panel allows administrators (`ADMIN` role) to register users, edit user profiles, toggle account activation status, verify lookup master configuration tables, and query global transaction audit logs. 
The technical approach includes:
- **Backend (NestJS)**: Implement REST endpoints under `/api/v1/admin/` namespace protected by `JwtAuthGuard` and `RolesGuard`. Implement password generation using Node's `crypto` library, hashing with `bcrypt` (12 rounds), Redis-based session token eviction, and version-based optimistic locking check validation.
- **Frontend (React)**: Integrate a persistent split-dashboard layout under `frontend/src/pages/admin/` using Tailwind CSS, swapping work areas based on navigation tab selection.

## Technical Context

**Language/Version**: TypeScript 5.7+ / Node.js 20+

**Primary Dependencies**: NestJS 11.x, React 19, Vite 8.x, Tailwind CSS 3.x, TypeORM 0.3.20, Redis (ioredis), class-validator, bcrypt

**Storage**: PostgreSQL 16 (Primary) + Redis (Session and view caching)

**Testing**: Jest (Unit/Integration) + Supertest (E2E)

**Target Platform**: Modern web browsers (Desktop-first with tablet collapsible navigation support)

**Project Type**: Web Application (NestJS backend REST API + React SPA frontend)

**Performance Goals**: Dashboard page load ≤ 2s, search/filter queries ≤ 1.5s, Redis session eviction ≤ 200ms

**Constraints**: Strict role segregation (only role `ADMIN` allowed), admin self-modification lockout prevention, immutable audit logs database triggers

**Scale/Scope**: Corporate workflow system (several administrators, hundreds of system users, up to 10,000+ audit log items)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Validated against Strict Naming Conventions, Type Safety & Documentation Standards (I)
- [x] Confirmed Module-Based Directory Isolation — internal structure & shared layer access control (II)
- [x] Checked against Security, Auth, Error Handling & Audit Trail Standards (IV)
- [x] Ensured UI/UX Design System Compliance — colors, typography, accessibility (V)
- [x] Aligned with Detailed Design "Contract" & Architecture (VI) — tech stack, 4-layer model, path aliases
- [x] Verified Performance Targets, API Design & Environment Standards (VII)
- [x] Confirmed Git Branching, Commit & PR Standards compliance (VIII)

## Project Structure

### Documentation (this feature)

```text
specs/001-admin-user-management/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── user-management-api.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
└── modules/
    ├── admin/                    # Admin panel backend endpoints and service layer logic
    │   ├── admin.module.ts
    │   ├── admin.controller.ts
    │   ├── admin.service.ts
    │   ├── dto/
    │   └── tests/
    └── shared/                   # Shared TypeORM entities, WebSocket hubs, and auth guards
        ├── entities/
        │   ├── user.entity.ts
        │   └── approval-log.entity.ts
        └── guards/

frontend/
└── src/
    └── pages/
        └── admin/                # Admin dashboard client components
            ├── AdminDashboardShell.tsx
            ├── UserManagementWorkspace.tsx
            ├── MasterDataWorkspace.tsx
            └── AuditLogWorkspace.tsx
```

**Structure Decision**: Web application layout structure separating NestJS REST API backend modules and React SPA frontend dashboard pages, aligned with module isolation boundaries.

## Frontend Tab Switching Mechanism

The admin dashboard uses **React Router sub-routes** for tab navigation within the persistent split-dashboard shell.

- **Route Structure**: `/admin/users`, `/admin/master-data`, `/admin/audit-logs`
- **Mechanism**: `AdminSidebarNavigation` renders `<NavLink>` components from `react-router-dom`. The `AdminDashboardShell` layout wraps an `<Outlet />` that renders the matched child route workspace component. No client-side state management or conditional rendering is used for tab switching.
- **Behavior**: Selecting a sidebar tab navigates to the sub-route, which swaps the right-side workspace panel. The sidebar and header remain mounted (no full page refresh).
- **Component Mapping**:
  - `/admin/users` → `UserManagementWorkspace`
  - `/admin/master-data` → `MasterDataWorkspace`
  - `/admin/audit-logs` → `AuditLogWorkspace`

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

*(No constitution violations identified. Implementation details strictly adhere to repository guidelines.)*
