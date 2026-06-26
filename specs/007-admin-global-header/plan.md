# Implementation Plan: Global Header with Language Switcher for Admin Panel

**Branch**: `main` | **Date**: 2026-06-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-admin-global-header/spec.md`

## Summary

Add a minimal global header bar to the admin panel's `AdminDashboardShell` containing the shared `LanguageSwitcher` component. The header uses the same visual styling as the non-admin `Header` (h-16, white bg, border-b, sticky) but includes only the LanguageSwitcher (no notification bell, no hamburger). Language state is already shared via react-i18next — no new state management needed.

## Technical Context

**Language/Version**: TypeScript 5.7.3, React 19

**Primary Dependencies**: react-i18next (language state), lucide-react (icons), react-router-dom (routing)

**Storage**: N/A (language state via react-i18next + localStorage)

**Testing**: Vitest + React Testing Library (manual verification per existing test approach)

**Target Platform**: Web (desktop + mobile responsive)

**Project Type**: Web application (frontend only — no backend changes)

**Performance Goals**: No measurable performance impact (single component addition)

**Constraints**: Must use shared LanguageSwitcher component (Constitution §II); no cross-module imports; Tailwind tokens only

**Scale/Scope**: 1 file modified (AdminDashboardShell.tsx), ~10 lines added

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Validated against Strict Naming Conventions — camelCase vars, PascalCase components (LanguageSwitcher)
- [x] Confirmed Module-Based Directory Isolation — modifying existing admin module file, no cross-module imports
- [x] Checked against Security, Auth, Error Handling & Audit Trail Standards — no new endpoints, no auth changes
- [x] Ensured UI/UX Design System Compliance — using existing Tailwind tokens (h-16, bg-white, border-slate-200, sticky, z-30)
- [x] Aligned with Detailed Design "Contract" & Architecture — frontend-only change, no API or 4-layer model impact
- [x] Verified Performance Targets — no performance impact (single component)
- [x] Confirmed Git Branching, Commit & PR Standards — standard feature branch workflow

## Project Structure

### Documentation (this feature)

```text
specs/007-admin-global-header/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   └── Header.tsx          # Reference: non-admin header styling
│   │   └── shared/
│   │       └── LanguageSwitcher.tsx # Shared component to reuse
│   └── pages/
│       └── admin/
│           └── AdminDashboardShell.tsx  # TARGET: add header bar
```

**Structure Decision**: Frontend-only modification. Single file change to `AdminDashboardShell.tsx` — add a `<header>` element with `LanguageSwitcher` above `<Outlet />`.

## Complexity Tracking

> No constitution violations. This is a minimal, low-risk UI change.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |
