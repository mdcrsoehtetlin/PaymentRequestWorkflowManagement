# Tasks: Clear Filters Button

**Input**: Design documents from `/specs/006-clear-filters-button/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: Not explicitly requested in the feature specification. Tests are omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Foundational - Enhance Shared SearchFilterBar

**Purpose**: Add `disabled`, `clearDisabled`, and `prefix` support to the shared SearchFilterBar component before user story implementation.

- [ ] T001 Add `disabled` and `clearDisabled` props to `SearchFilterBarProps` interface in `frontend/src/components/shared/SearchFilterBar.tsx` — `disabled` disables both buttons (loading state), `clearDisabled` disables only the Clear button (no active filters)
- [ ] T002 Add `prefix` property to `FilterField` interface in `frontend/src/components/shared/SearchFilterBar.tsx` — static text rendered before text input (e.g. "PRF-")
- [ ] T003 Update Clear Filters button in `frontend/src/components/shared/SearchFilterBar.tsx` — apply `disabled || clearDisabled`, change label to "フィルタをクリア", add `disabled:opacity-50 disabled:cursor-not-allowed` classes
- [ ] T004 Update Search button in `frontend/src/components/shared/SearchFilterBar.tsx` — apply `disabled` prop, add `disabled:opacity-50 disabled:cursor-not-allowed` classes
- [ ] T005 Update `DebouncedTextInput` in `frontend/src/components/shared/SearchFilterBar.tsx` — accept and render `prefix` prop with styled prefix span before input
- [ ] T006 Run `npm run lint` and `npm run build` from `frontend/` — verify zero errors

**Checkpoint**: SearchFilterBar supports disabled states and prefix — ready for screen migration

---

## Phase 2: User Story 1 - Clear All Filters in User Management (Priority: P1) 🎯 MVP

**Goal**: Migrate UserManagementWorkspace to use the shared SearchFilterBar with onClear support.

**Independent Test**: Apply filters in User Management, click Clear Filters, verify all fields reset and full user list loads. Verify button is grayed out when no filters are active.

### Implementation for User Story 1

- [ ] T007 [US1] Import `SearchFilterBar` and `FilterField` in `frontend/src/pages/admin/UserManagementWorkspace.tsx` — remove unused `Search` icon import from lucide-react
- [ ] T008 [US1] Define `filterFields` array in `frontend/src/pages/admin/UserManagementWorkspace.tsx` — map keyword (text), roleId (select), isActive (select) to FilterField definitions
- [ ] T009 [US1] Add `hasActiveFilters` memo in `frontend/src/pages/admin/UserManagementWorkspace.tsx` — compute by checking if any filter field is non-empty
- [ ] T010 [US1] Add `handleFilterChange` and `handleClearFilters` callbacks in `frontend/src/pages/admin/UserManagementWorkspace.tsx` — filterChange updates individual field + resets page, clearFilters resets all fields + dateError + page + triggers fetch
- [ ] T011 [US1] Replace inline filter panel JSX in `frontend/src/pages/admin/UserManagementWorkspace.tsx` — use `<SearchFilterBar>` with `fields`, `values`, `onChange`, `onSubmit`, `onClear`, `disabled={isLoading}`, `clearDisabled={!hasActiveFilters}`
- [ ] T012 [US1] Verify the Clear Filters button resets all fields, resets pagination, triggers fetch, and is disabled when no filters are active

**Checkpoint**: User Story 1 fully functional — Clear Filters button works in User Management screen via shared SearchFilterBar

---

## Phase 3: User Story 2 - Clear All Filters in Audit Logs (Priority: P2)

**Goal**: Migrate AuditLogWorkspace to use the shared SearchFilterBar with onClear support, including PRF- prefix for request number.

**Independent Test**: Apply filters in Audit Logs, click Clear Filters, verify all fields reset, date error clears, and full audit log loads. Verify button is grayed out when no filters are active.

### Implementation for User Story 2

- [ ] T013 [US2] Import `SearchFilterBar` and `FilterField` in `frontend/src/pages/admin/AuditLogWorkspace.tsx` — remove unused `Search` icon import from lucide-react
- [ ] T014 [US2] Define `filterFields` array in `frontend/src/pages/admin/AuditLogWorkspace.tsx` — map requestNumber (text with prefix "PRF-"), actorName (text), actionTypeId (select), startDate (date), endDate (date) to FilterField definitions
- [ ] T015 [US2] Add `hasActiveFilters` memo in `frontend/src/pages/admin/AuditLogWorkspace.tsx` — compute by checking if any filter field is non-empty
- [ ] T016 [US2] Add `handleFilterChange` and `handleClearFilters` callbacks in `frontend/src/pages/admin/AuditLogWorkspace.tsx` — filterChange updates individual field + resets page, clearFilters resets all fields + dateError + page + triggers fetch
- [ ] T017 [US2] Replace inline filter panel JSX in `frontend/src/pages/admin/AuditLogWorkspace.tsx` — use `<SearchFilterBar>` with `fields`, `values`, `onChange`, `onSubmit`, `onClear`, `disabled={isLoading}`, `clearDisabled={!hasActiveFilters}`. Keep dateError display below SearchFilterBar.
- [ ] T018 [US2] Verify the Clear Filters button resets all fields, clears date error, resets pagination, triggers fetch, and is disabled when no filters are active

**Checkpoint**: User Story 2 fully functional — Clear Filters button works in Audit Logs screen via shared SearchFilterBar

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and quality checks

- [ ] T019 Run `npm run lint` from `frontend/` — verify zero errors
- [ ] T020 Run `npm run build` from `frontend/` — verify zero TypeScript errors
- [ ] T021 Run quickstart.md validation scenarios in browser — verify all 5 scenarios pass
- [ ] T022 Verify button styling consistency across both screens — same label ("フィルタをクリア"), same disabled states, same positioning via shared SearchFilterBar

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies — can start immediately. BLOCKS all user stories.
- **User Story 1 (Phase 2)**: Depends on Phase 1 completion
- **User Story 2 (Phase 3)**: Depends on Phase 1 completion — can run in parallel with US1
- **Polish (Phase 4)**: Depends on both US1 and US2 being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 1 — works on `UserManagementWorkspace.tsx` only
- **User Story 2 (P2)**: Can start after Phase 1 — works on `AuditLogWorkspace.tsx` only
- Both stories can be implemented in parallel since they modify different files

### Parallel Opportunities

- Phase 1 tasks (T001-T005) are sequential (same file)
- T007-T012 (US1) and T013-T018 (US2) can run in parallel — different files
- T019 and T020 can run in parallel — independent validation commands

---

## Parallel Example: User Story 1 + User Story 2

```bash
# US1 and US2 can be launched together after Phase 1 (different files):
Task: "T007-T012 User Management migration in frontend/src/pages/admin/UserManagementWorkspace.tsx"
Task: "T013-T018 Audit Logs migration in frontend/src/pages/admin/AuditLogWorkspace.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Enhance SearchFilterBar
2. Complete Phase 2: User Management migration
3. **STOP and VALIDATE**: Test User Management screen independently
4. Deploy/demo if ready

### Incremental Delivery

1. Enhance shared SearchFilterBar → Foundation ready
2. Migrate User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Migrate User Story 2 → Test independently → Deploy/Demo
4. Run Polish phase → Final validation

### Parallel Team Strategy

With multiple developers:
1. Developer A: Phase 1 (SearchFilterBar enhancement)
2. Once Phase 1 done:
   - Developer A: User Story 1 (UserManagementWorkspace)
   - Developer B: User Story 2 (AuditLogWorkspace)
3. Both merge → Polish phase

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
