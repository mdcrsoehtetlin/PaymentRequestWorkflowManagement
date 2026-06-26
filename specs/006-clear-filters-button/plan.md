# Implementation Plan: Clear Filters Button for Admin Search Panels

**Branch**: `feature/clear-filters-button` | **Date**: 2026-06-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-clear-filters-button/spec.md`

## Summary

Migrate the User Management and Audit Logs admin screens from inline hand-built search panels to the shared `SearchFilterBar` component, which provides built-in Clear Filters button support. This adds a Clear Filters button to both screens, enables consistent behavior and styling, and reduces code duplication.

## Technical Context

**Language/Version**: TypeScript 5.7.3, React 19

**Primary Dependencies**: Vite 8.x, Tailwind CSS 3.x, lucide-react

**Storage**: N/A (frontend-only change)

**Testing**: Manual browser verification (no new API endpoints)

**Target Platform**: Web (Chrome, Firefox, Edge)

**Project Type**: Web application (React SPA frontend)

**Performance Goals**: No measurable performance change (UI-only refactoring)

**Constraints**: Must use existing SearchFilterBar shared component; no backend changes

**Scale/Scope**: 2 screens migrated (UserManagementWorkspace, AuditLogWorkspace)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **I. Naming Conventions & Type Safety**: All new variables will use camelCase, components PascalCase. TypeScript strict mode enforced. No `any` types.
- [x] **II. Module-Based Directory Isolation**: Changes confined to `frontend/src/pages/admin/` (role module) and shared `SearchFilterBar` already in shared layer. No cross-module imports.
- [x] **IV. Security, Auth & Error Handling**: No backend changes. Frontend only — no security implications. SearchFilterBar handles filter state locally.
- [x] **V. UI/UX Design System Compliance**: SearchFilterBar uses `bg-blue-900` for Search button, `border-slate-300 bg-white` for Clear Filters, `focus:ring-indigo-500` for focus states, `focus:ring-slate-500` for Clear Filters. Typography follows Inter scale. WCAG AA contrast ratios maintained.
- [x] **VI. Detailed Design Contract**: React 19 SPA, Vite 8.x, Tailwind CSS 3.x. Path aliases `@/*` → `src/*`. 4-layer model not applicable (no backend changes).
- [x] **VII. Performance Targets**: No performance degradation expected. SearchFilterBar maintains same debounce behavior. No new network requests.
- [x] **VIII. Git Branching & Commit**: Feature branch `feature/clear-filters-button`. Conventional commit prefix: `feat:`.

**Gate Status**: PASS — all constitution checks satisfied.

## Project Structure

### Documentation (this feature)

```text
specs/006-clear-filters-button/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
frontend/src/
├── components/shared/
│   └── SearchFilterBar.tsx    # Existing shared component (no changes needed)
└── pages/admin/
    ├── UserManagementWorkspace.tsx  # MODIFY: replace inline panel → SearchFilterBar
    └── AuditLogWorkspace.tsx        # MODIFY: replace inline panel → SearchFilterBar
```

**Structure Decision**: Frontend-only changes within the existing project structure. Two admin screen files are modified; the shared SearchFilterBar component already supports Clear Filters and requires no changes.

## Complexity Tracking

No constitution violations. This is a straightforward UI refactoring that leverages an existing shared component.
