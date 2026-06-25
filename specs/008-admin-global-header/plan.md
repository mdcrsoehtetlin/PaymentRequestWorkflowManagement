# Implementation Plan: Admin Global Header with Language Switch

**Branch**: `008-admin-global-header` | **Date**: 2026-06-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/008-admin-global-header/spec.md`

## Summary

Add a minimal header bar to the admin panel (`AdminDashboardShell`) containing only the shared `LanguageSwitcher` component. The admin panel currently has no top header — only a standalone sidebar. This is a frontend-only change affecting a single file.

## Technical Context

**Language/Version**: TypeScript 5.7+, React 19

**Primary Dependencies**: React, react-i18next (existing i18n setup), shared `LanguageSwitcher` component

**Storage**: N/A (no data model changes)

**Testing**: Jest + React Testing Library (existing test infrastructure)

**Target Platform**: Web (Chrome, Firefox, Safari — enterprise dashboard)

**Project Type**: Web application (React SPA frontend)

**Performance Goals**: Language switch under 2 seconds (SC-001) — inherent from i18next synchronous translation

**Constraints**: Minimal header — no title, no notification bell, no hamburger menu. Must use existing shared `LanguageSwitcher` component. Must be responsive.

**Scale/Scope**: 1 file modified (`AdminDashboardShell.tsx`), ~10-15 lines added

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Validated against Strict Naming Conventions, Type Safety & Documentation Standards (I) — camelCase for handlers, PascalCase for components
- [x] Confirmed Module-Based Directory Isolation — changes confined to `frontend/src/pages/admin/` (Admin module), no cross-module imports
- [x] Checked against Security, Auth, Error Handling & Audit Trail Standards (IV) — no new endpoints, no auth changes
- [x] Ensured UI/UX Design System Compliance — reuses existing shared `LanguageSwitcher` component, follows design system styling
- [x] Aligned with Detailed Design "Contract" & Architecture — React 19 + Vite 8.x frontend, no backend changes
- [x] Verified Performance Targets — no new API calls, i18next is synchronous
- [x] Confirmed Git Branching, Commit & PR Standards compliance — feature branch, conventional commit

## Project Structure

### Documentation (this feature)

```text
specs/008-admin-global-header/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (minimal — no entity changes)
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   └── pages/
│       └── admin/
│           └── AdminDashboardShell.tsx   # MODIFY: add minimal header with LanguageSwitcher
```

**Structure Decision**: Single-file modification. No new files, components, or modules created. Changes are confined to the Admin role module frontend directory.

## Complexity Tracking

No constitution violations. This is a minimal UI addition reusing existing shared components.
