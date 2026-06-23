---

description: "Task list for Table Sorting feature"
---

# Tasks: Table Sorting for Admin Workspaces

**Input**: Design documents from `specs/003-table-sorting/`

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `frontend/src/` for SPA changes
- No backend changes

---

## Phase 1: User Story 1 - Sort Audit Log Results (Priority: P1) 🎯 MVP

**Goal**: Admin users can click column headers in the audit log table to sort by any data column.

**Independent Test**: Navigate to Audit Log workspace, click any column header — results reorder with sort indicator visible.

### Implementation for User Story 1

- [x] T001 [US1] Add sorting state (sortBy, sortOrder) to `AuditLogWorkspace` in `frontend/src/pages/admin/AuditLogWorkspace.tsx`
- [x] T002 [US1] Mark all data columns as sortable on the Column definition in `frontend/src/pages/admin/AuditLogWorkspace.tsx` (paymentRequestId, actorName, actionTypeId, ipAddress — timestamp is already sortable)
- [x] T003 [US1] Pass sorting prop to DataTable in `frontend/src/pages/admin/AuditLogWorkspace.tsx`, wire onSortChange to update state and reset pagination to page 1 on column switch

**Checkpoint**: Audit log table supports click-to-sort on all data columns with visual indicators.

---

## Phase 2: User Story 2 - Sort User Management Results (Priority: P2)

**Goal**: Admin users can click column headers in the user management table to sort by any data column.

**Independent Test**: Navigate to User Management workspace, click any column header — results reorder with sort indicator visible.

### Implementation for User Story 2

- [x] T004 [US2] Add sorting state (sortBy, sortOrder) to `UserManagementWorkspace` in `frontend/src/pages/admin/UserManagementWorkspace.tsx`
- [x] T005 [US2] Mark all data columns as sortable on the Column definition in `frontend/src/pages/admin/UserManagementWorkspace.tsx` (email, branch, roleId, isActive — employeeNumber and fullName are already sortable)
- [x] T006 [US2] Pass sorting prop to DataTable in `frontend/src/pages/admin/UserManagementWorkspace.tsx`, wire onSortChange to update state and reset pagination to page 1 on column switch

**Checkpoint**: User management table supports click-to-sort on all data columns with visual indicators.

---

## Phase 3: Polish & Cross-Cutting Concerns

**Purpose**: Verify sort behavior across both tables.

- [x] T007 Verify audit log sort works: click column → ascending click again → descending click different column → ascending
- [x] T008 Verify user management sort works: click column → ascending click again → descending click different column → ascending
- [x] T009 Verify pagination resets to page 1 when sort column changes (both tables)
- [x] T010 Verify sort order is preserved when changing page (both tables)
- [x] T011 Run `npm run build` in frontend to confirm zero TypeScript errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **US1 (Phase 1)**: No dependencies on other stories — can start immediately
- **US2 (Phase 2)**: No dependencies on US1 — can run in parallel
- **Polish (Phase 3)**: Depends on US1 and US2 completion

### Parallel Opportunities

- T001 → T002 → T003 are sequential within US1 (same file)
- T004 → T005 → T006 are sequential within US2 (same file)
- US1 (Phase 1) and US2 (Phase 2) can be implemented in parallel by different developers

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: US1 (Audit Log sort) — deliverable as standalone MVP
2. **STOP and VALIDATE**: Test audit log sort independently
3. Complete Phase 2: US2 (User Management sort)
4. Complete Phase 3: Polish & verify

### Incremental Delivery

1. US1 done → Deploy/Demo (admin can sort audit logs)
2. US2 done → Deploy/Demo (admin can sort both tables)
3. Polish done → Final validation
