# Implementation Plan: Table Sorting for Admin Workspaces

**Branch**: `003-table-sorting` | **Date**: 2026-06-22 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/003-table-sorting/spec.md`

## Summary

Add click-to-sort column headers to the Audit Log and User Management admin tables. Both tables use the existing `DataTable` component which already supports a `sorting` prop (`sortBy`, `sortOrder`, `onSortChange`). Implementation is purely frontend — add `useState` for sort state in each workspace and pass it to `DataTable`.

## Technical Context

**Language/Version**: TypeScript 5.7+ (React 19)

**Primary Dependencies**: lucide-react (ChevronUp/ChevronDown icons — already imported by DataTable)

**Storage**: N/A (client-side sort, no persistence)

**Testing**: Manual verification (sort clicks, indicator visibility, pagination reset)

**Target Platform**: Browser (same as existing admin workspace)

**Project Type**: Web SPA (React + Vite)

**Performance Goals**: Sort completes within same render cycle — no network calls

**Constraints**: Client-side sort only; server sort params out of scope

**Scale/Scope**: 2 workspaces × ~5–6 sortable columns each

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Validated against Strict Naming Conventions, Type Safety & Documentation Standards (I) — existing `DataTable` component uses `camelCase` props
- [x] Confirmed Module-Based Directory Isolation (II) — changes confined to `frontend/src/pages/admin/`
- [x] Checked against Security, Auth, Error Handling & Audit Trail Standards (IV) — no security impact, pure UI change
- [x] Ensured UI/UX Design System Compliance (V) — sort icons use existing lucide-react `ChevronUp`/`ChevronDown` components, no new colors
- [x] Aligned with Detailed Design "Contract" & Architecture (VI) — reuses shared `DataTable` component, no cross-module imports
- [x] Verified Performance Targets, API Design & Environment Standards (VII) — 300ms debounce already in place; sort is synchronous client-side
- [x] Confirmed Git Branching, Commit & PR Standards compliance (VIII)

## Project Structure

### Documentation (this feature)

```text
specs/003-table-sorting/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (N/A — no new data entities)
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A — no new interfaces)
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
frontend/src/pages/admin/
├── AuditLogWorkspace.tsx       # Add sorting state + pass to DataTable
├── UserManagementWorkspace.tsx  # Add sorting state + pass to DataTable
```

**Structure Decision**: Web SPA — changes only in `frontend/src/pages/admin/`. No backend changes. No new files.
