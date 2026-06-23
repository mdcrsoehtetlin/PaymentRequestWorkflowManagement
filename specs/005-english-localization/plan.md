# Implementation Plan: English Localization

**Branch**: `feature/005-english-localization` | **Date**: 2026-06-22 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/005-english-localization/spec.md`

## Summary

Replace all Japanese user-facing strings in the application with English equivalents. Full-stack change: frontend JSX labels and constants, backend error messages (services, guards, pipes), and DTO validation decorators. No i18n framework or language toggle — Japanese text is replaced inline with English. Dates remain ISO 8601 YYYY-MM-DD.

## Technical Context

**Language/Version**: TypeScript 5.7+ (React 19, NestJS 11)

**Primary Dependencies**: None beyond existing stack

**Storage**: N/A (all changes are hardcoded string replacements)

**Testing**: `npm run lint` (backend, 0 errors) + `npm run build` (frontend, 0 errors) + `npm run test` (backend, all pass)

**Target Platform**: Browser + Node.js server

**Project Type**: Web SPA (React + Vite) + NestJS API

**Performance Goals**: No performance impact — pure string replacements in source files

**Constraints**: Full-stack change affecting both `frontend/` and `src/` directories

**Scale/Scope**: ~25 source files across frontend (labels, components, validation) + backend (services, guards, pipes, DTOs)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Validated against Strict Naming Conventions, Type Safety & Documentation Standards (I) — constants renamed `_JP`→`_EN` suffix; no new types or interfaces
- [x] Confirmed Module-Based Directory Isolation — internal structure & shared layer access control (II) — changes confined to frontend shared, admin, and applicant modules; backend shared guards/pipes updated with Project Leader approval implied
- [x] Checked against Security, Auth, Error Handling & Audit Trail Standards (IV) — error messages in English, no security impact
- [x] Ensured UI/UX Design System Compliance — colors, typography, accessibility (V) — text-only changes, no layout or token changes
- [x] Aligned with Detailed Design "Contract" & Architecture (VI) — tech stack, 4-layer model, path aliases — no new contracts
- [x] Verified Performance Targets, API Design & Environment Standards (VII) — no performance impact
- [x] Confirmed Git Branching, Commit & PR Standards compliance (VIII)

## Project Structure

### Documentation (this feature)

```text
specs/005-english-localization/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 — inventory of all Japanese strings
├── quickstart.md        # Phase 1 — actionable implementation steps
├── checklists/
│   └── requirements.md  # Quality checklist
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (changes by area)

```text
# Backend — admin error messages
src/modules/admin/admin.service.ts

# Shared constants (both copies)
src/modules/shared/types/index.ts
frontend/src/types/index.ts

# Frontend — shared components
frontend/src/components/shared/StatusBadge.tsx
frontend/src/components/shared/ApprovalTimeline.tsx
frontend/src/components/shared/DataTable.tsx
frontend/src/components/shared/ConfirmDialog.tsx
frontend/src/components/shared/ErrorBoundary.tsx
frontend/src/components/shared/FileUploadDropzone.tsx

# Frontend — admin workspace
frontend/src/pages/admin/AuditLogWorkspace.tsx
frontend/src/pages/admin/UserManagementWorkspace.tsx
frontend/src/pages/admin/MasterDataWorkspace.tsx
frontend/src/pages/admin/AdminDashboardShell.tsx
frontend/src/pages/admin/components/UserFormModal.tsx
frontend/src/pages/admin/components/MetadataDetailPanel.tsx

# Frontend — other
frontend/src/pages/applicant/utils/validation.ts
frontend/src/services/api-client.ts
```

**Structure Decision**: Full-stack text replacement — no new files created. All changes are string replacements in existing source files.

## Implementation Phases

| Phase | Scope | Files | Est. Changes |
|-------|-------|-------|-------------|
| A | Admin backend errors | 1 | ~9 string replacements |
| B | Shared type constants rename + translate | 2 | ~48 value translations |
| C | Frontend shared components | 6 | ~20 string + import updates |
| D | Admin workspace pages | 6 | ~80 string replacements |
| E | Other frontend (validation, api-client) | 2 | ~17 string replacements |
