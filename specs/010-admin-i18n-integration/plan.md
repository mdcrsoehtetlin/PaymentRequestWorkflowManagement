# Implementation Plan: Admin Screen i18n Integration

**Branch**: `010-admin-i18n-integration` | **Date**: 2026-06-26 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/010-admin-i18n-integration/spec.md`

## Summary

Integrate internationalization (i18n) into all admin screen components so that switching language via the LanguageSwitcher immediately updates all displayed text. Currently, only `Sidebar.tsx` partially uses `useTranslation()` (2 keys). All other 6 admin files have ~118 hardcoded strings. The locale files (`en.json`, `ja.json`, `my.json`) already contain all 609 translation keys. The implementation adds `useTranslation()` to each component and replaces hardcoded strings with `t()` calls.

## Technical Context

**Language/Version**: TypeScript 5.7+, React 19

**Primary Dependencies**: react-i18next (already configured), lucide-react, Tailwind CSS 3.x

**Storage**: N/A (no new data storage)

**Testing**: Manual language switch verification, `npm run lint`, `npm run build`

**Target Platform**: Web (SPA, Vite 8.x)

**Project Type**: Web application (React SPA frontend)

**Performance Goals**: Language switch re-renders within 100ms (instant React re-render)

**Constraints**: Only modify `frontend/src/pages/admin/` files and `Sidebar.tsx`. No changes to locale files or other shared components.

**Scale/Scope**: 7 files to modify, ~118 hardcoded strings to replace

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Validated against Strict Naming Conventions, Type Safety & Documentation Standards (I) — `useTranslation()` hook usage follows React conventions; `camelCase` for variables, `PascalCase` for components maintained
- [x] Confirmed Module-Based Directory Isolation — only admin module files + one shared Sidebar modification (approved via clarification)
- [x] Checked against Security, Auth, Error Handling & Audit Trail Standards (IV) — no security impact; i18n is display-only
- [x] Ensured UI/UX Design System Compliance — no color/typography changes; only text source changes from hardcoded to `t()` calls
- [x] Aligned with Detailed Design "Contract" & Architecture — react-i18next is the mandated i18n framework; path aliases unchanged
- [x] Verified Performance Targets — no API changes; React re-render on language switch is near-instant
- [x] Confirmed Git Branching, Commit & PR Standards compliance (VIII)

## Project Structure

### Documentation (this feature)

```text
specs/010-admin-i18n-integration/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

```text
frontend/src/
├── pages/admin/
│   ├── AdminDashboardShell.tsx    # Verify only — no changes needed (layout shell, 0 hardcoded strings)
│   ├── UserManagementWorkspace.tsx # Modify — ~35 hardcoded strings → t() calls
│   ├── MasterDataWorkspace.tsx     # Modify — ~8 hardcoded strings → t() calls
│   ├── AuditLogWorkspace.tsx       # Modify — ~30 hardcoded strings → t() calls
│   └── components/
│       ├── MetadataDetailPanel.tsx # Modify — ~15 hardcoded strings → t() calls
│       └── UserFormModal.tsx       # Modify — ~30 hardcoded strings → t() calls
├── components/layout/
│   └── Sidebar.tsx                 # Modify — refactor roleMenuConfig to use t() for admin labels
└── locales/
    ├── en.json                     # Read-only — already contains 609 keys
    ├── ja.json                     # Read-only — already contains 609 keys
    └── my.json                     # Read-only — already contains 609 keys
```

**Structure Decision**: Web application structure (Option 2). Frontend-only changes within the existing `pages/admin/` module directory, plus one shared `Sidebar.tsx` modification for admin menu labels.

## Complexity Tracking

No constitution violations requiring justification. All changes are within normal module boundaries.
