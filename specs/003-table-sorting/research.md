# Research: Table Sorting for Admin Workspaces

**Date**: 2026-06-22

## Overview

No open questions or unknowns. The existing `DataTable` component at `frontend/src/components/shared/DataTable.tsx` already implements the complete sorting infrastructure:

- **Props accepted**: `sorting?: { sortBy: string; sortOrder: 'ASC' | 'DESC'; onSortChange: (key: string) => void }`
- **Sort indicator**: `ChevronUp`/`ChevronDown` icons from lucide-react shown beside the active sort column header
- **Click handling**: `onSortChange(key)` called when a sortable column header is clicked
- **Existing sortable columns**: `AuditLogWorkspace` already marks `timestamp` as `sortable: true`; `UserManagementWorkspace` already marks `employeeNumber` and `fullName` as `sortable: true`

## Decisions

| Decision | Rationale |
|----------|-----------|
| Client-side sort only | DataTable sorting prop was designed for this purpose; server sort would require backend changes out of scope |
| No new dependencies | lucide-react already bundled; ChevronUp/ChevronDown already imported |
| Default sort: none | First click always starts ascending |
| Column switch: always ascending | New column starts ascending regardless of previous column's direction |

## Alternatives Considered

| Alternative | Rejected Because |
|-------------|-----------------|
| Server-side sort via API params | Out of scope per spec; would require backend query changes for both endpoints |
| Custom sort icon component | Unnecessary — DataTable already renders ChevronUp/ChevronDown conditionally |
