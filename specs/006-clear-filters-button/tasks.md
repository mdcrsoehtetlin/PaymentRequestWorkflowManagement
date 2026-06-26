# Tasks: Clear Filters Button for Admin Search Panels

**Input**: Design documents from `/specs/006-clear-filters-button/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Not requested — no test tasks included.

**Organization**: Tasks grouped by user story. Both stories are P1 and can be implemented sequentially.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)
- Exact file paths included in descriptions

---

## Phase 1: Setup

**Purpose**: Verify shared component readiness and prepare filter field definitions

- [x] T001 Verify SearchFilterBar shared component supports onClear, showClearButton, and local draft state in frontend/src/components/shared/SearchFilterBar.tsx
- [x] T002 [P] Define filter field configuration array (FilterField[]) for UserManagement screen in frontend/src/pages/admin/UserManagementWorkspace.tsx
- [x] T003 [P] Define filter field configuration array (FilterField[]) for AuditLog screen in frontend/src/pages/admin/AuditLogWorkspace.tsx

**Checkpoint**: Filter field definitions ready — migration can begin

---

## Phase 2: User Story 1 — Clear Filters on User Management Screen (Priority: P1) 🎯 MVP

**Goal**: Migrate UserManagementWorkspace to use SearchFilterBar, gaining built-in Clear Filters button support

**Independent Test**: Navigate to admin/users, apply filters, click Clear Filters, verify all fields reset and full user list displays

### Implementation for User Story 1

- [x] T004 [US1] Replace inline search panel div with SearchFilterBar component import and JSX in frontend/src/pages/admin/UserManagementWorkspace.tsx — remove lines 253-321 (hand-built filter div), add SearchFilterBar with filterFields, onApply, and onClear handlers
- [x] T005 [US1] Implement onApply handler in frontend/src/pages/admin/UserManagementWorkspace.tsx — receives draft values from SearchFilterBar, sets applied filters state, resets page to 1, calls fetchUsers()
- [x] T006 [US1] Implement onClear handler in frontend/src/pages/admin/UserManagementWorkspace.tsx — resets all filter values to empty strings, resets page to 1, calls fetchUsers()
- [x] T007 [US1] Remove legacy filter state management (filtersRef, manual handleSearch, onKeyDown Enter handler) in frontend/src/pages/admin/UserManagementWorkspace.tsx — clean up replaced code
- [x] T008 [US1] Verify UserManagement screen: Clear Filters button visible, disabled when no filters, enabled when filters active, resets all fields and refreshes list

**Checkpoint**: User Management screen fully migrated — Clear Filters button functional

---

## Phase 3: User Story 2 — Clear Filters on Audit Logs Screen (Priority: P1)

**Goal**: Migrate AuditLogWorkspace to use SearchFilterBar, gaining built-in Clear Filters button support with date validation error clearing

**Independent Test**: Navigate to admin/audit-logs, apply filters, click Clear Filters, verify all fields reset, date validation error cleared, full audit log list displays

### Implementation for User Story 2

- [x] T009 [US2] Replace inline search panel div with SearchFilterBar component import and JSX in frontend/src/pages/admin/AuditLogWorkspace.tsx — remove lines 225-329 (hand-built filter div), add SearchFilterBar with filterFields, onApply, and onClear handlers
- [x] T010 [US2] Implement onApply handler in frontend/src/pages/admin/AuditLogWorkspace.tsx — receives draft values, validates date range (startDate <= endDate), sets dateError if invalid, sets applied filters state, resets page to 1, calls fetchLogs()
- [x] T011 [US2] Implement onClear handler in frontend/src/pages/admin/AuditLogWorkspace.tsx — resets all filter values to empty strings, clears dateError state, resets page to 1, calls fetchLogs()
- [x] T012 [US2] Handle PRF- prefix via placeholder hint in filterFields — set requestNumber field placeholder to "PRF-..." and strip leading "PRF-" in onApply before passing to API
- [x] T013 [US2] Remove legacy filter state management (manual handleSearch, onKeyDown Enter handler, inline date error display) in frontend/src/pages/admin/AuditLogWorkspace.tsx — clean up replaced code
- [x] T014 [US2] Verify Audit Logs screen: Clear Filters button visible, disabled when no filters, enabled when filters active, resets all fields including date validation error, refreshes list

**Checkpoint**: Audit Logs screen fully migrated — Clear Filters button functional with date validation clearing

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup

- [x] T015 Run `npm run lint` in frontend/ directory — fix any lint errors from migrated code (0 errors required)
- [x] T016 Run `npm run build` in frontend/ directory — verify TypeScript compilation passes (0 errors required)
- [x] T017 [P] Verify both admin screens share identical SearchFilterBar styling — same grid layout, same button styling, same disabled state behavior
- [x] T018 Run quickstart.md validation scenarios — verify all 5 scenarios pass in browser
- [x] T019 Verify Clear Filters button accessibility — visible focus indicator (focus:ring-2 focus:ring-offset-2), keyboard navigable, disabled state communicated to screen readers

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **US1 (Phase 2)**: Depends on Phase 1 completion (filter field definitions)
- **US2 (Phase 3)**: Depends on Phase 1 completion; can run in parallel with US2 but sequential is simpler for this small scope
- **Polish (Phase 4)**: Depends on US1 and US2 completion

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 1 — no dependencies on US2
- **User Story 2 (P1)**: Can start after Phase 1 — no dependencies on US1
- Both stories are independent and can be tested separately

### Within Each User Story

- Replace inline panel first (T004/T009)
- Implement handlers next (T005/T010, T006/T011)
- Handle special cases (T012 for PRF- prefix)
- Clean up legacy code (T007/T013)
- Verify (T008/T014)

### Parallel Opportunities

- T002 and T003 can run in parallel (different files)
- US1 and US2 can be developed in parallel by different developers (different files)
- T017 can run independently after both stories complete

---

## Parallel Example: Setup + User Stories

```bash
# Setup (parallel):
Task T002: "Define filter fields for UserManagement in UserManagementWorkspace.tsx"
Task T003: "Define filter fields for AuditLog in AuditLogWorkspace.tsx"

# User Stories (parallel after Setup):
# Developer A: US1 tasks (T004-T008) in UserManagementWorkspace.tsx
# Developer B: US2 tasks (T009-T014) in AuditLogWorkspace.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: User Story 1 (User Management)
3. **STOP and VALIDATE**: Test Clear Filters on User Management screen
4. Deploy/demo if ready

### Incremental Delivery

1. Setup → Filter field definitions ready
2. US1 (User Management) → Clear Filters button works on admin/users → MVP!
3. US2 (Audit Logs) → Clear Filters button works on admin/audit-logs
4. Polish → Lint, build, accessibility verification

### Notes

- No backend changes required — frontend-only migration
- SearchFilterBar component requires no modifications
- Both screens use the same shared component for consistent UX
- PRF- prefix handled via placeholder (avoids shared layer modification)
- Date validation error clearing handled in parent's onClear handler
