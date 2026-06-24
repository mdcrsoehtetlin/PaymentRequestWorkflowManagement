# Tasks: Search Button for Admin Screens

**Input**: Design documents from `/specs/005-search-button-admin-screens/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md (available)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify development environment and existing code patterns

- [ ] T001 Verify existing button styling pattern in `frontend/src/pages/admin/UserManagementWorkspace.tsx` (e.g., "新規ユーザー登録" button)
- [ ] T002 [P] Confirm debounce useEffect pattern in both target files

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: No foundational tasks needed for this UI-only change

---

## Phase 3: User Story 1 - Explicit Search Button (Priority: P1) 🎯 MVP

**Goal**: Add explicit search button to user management and audit logs screens, replacing automatic debounced search with manual search button click or Enter key press

**Independent Test**: Navigate to either screen, enter filter criteria, click the search button or press Enter to see results update

### Implementation for User Story 1

- [x] T003 [P] [US1] Add search handler function `handleSearch()` in `frontend/src/pages/admin/UserManagementWorkspace.tsx`
- [x] T004 [P] [US1] Remove debounce useEffect and keep initial load useEffect in `frontend/src/pages/admin/UserManagementWorkspace.tsx`
- [x] T005 [US1] Add "検索" button with Search icon next to filter fields in `frontend/src/pages/admin/UserManagementWorkspace.tsx`
- [x] T006 [US1] Add onKeyDown handler for Enter key on text inputs in `frontend/src/pages/admin/UserManagementWorkspace.tsx`
- [x] T007 [US1] Disable search button during loading state in `frontend/src/pages/admin/UserManagementWorkspace.tsx`
- [x] T008 [P] [US1] Add search handler function `handleSearch()` in `frontend/src/pages/admin/AuditLogWorkspace.tsx`
- [x] T009 [P] [US1] Remove debounce useEffect and keep initial load useEffect in `frontend/src/pages/admin/AuditLogWorkspace.tsx`
- [x] T010 [US1] Add "検索" button with Search icon next to filter fields in `frontend/src/pages/admin/AuditLogWorkspace.tsx`
- [x] T011 [US1] Add onKeyDown handler for Enter key on text inputs in `frontend/src/pages/admin/AuditLogWorkspace.tsx`
- [x] T012 [US1] Disable search button during loading state in `frontend/src/pages/admin/AuditLogWorkspace.tsx`

**Checkpoint**: User Story 1 complete - both screens have explicit search button with Enter key support

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Verification and quality checks

- [x] T013 Run `npm run lint` in `frontend/` and fix any errors
- [x] T014 Run `npm run build` in `frontend/` and verify zero TypeScript errors
- [x] T015 Verify button styling matches design system (blue-900, white text, rounded-lg) in both files
- [x] T016 Verify focus indicators and ARIA labels on search buttons in both files
- [x] T017 Run quickstart.md validation scenarios

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Skipped for this feature
- **User Story 1 (Phase 3)**: Depends on Setup completion
- **Polish (Phase 4)**: Depends on Phase 3 completion

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Setup (Phase 1) - No dependencies on other stories

### Within Each User Story

- Search handlers must be implemented before adding buttons
- Buttons must be added before adding Enter key handlers
- All UI changes must be complete before disabling during loading

### Parallel Opportunities

- T003 and T008 can run in parallel (different files)
- T004 and T009 can run in parallel (different files)
- T005 and T010 can run in parallel (different files)
- T006 and T011 can run in parallel (different files)
- T007 and T012 can run in parallel (different files)

---

## Parallel Example: User Story 1

```bash
# Launch search handlers for both files together:
Task: "Add search handler function `handleSearch()` in frontend/src/pages/admin/UserManagementWorkspace.tsx"
Task: "Add search handler function `handleSearch()` in frontend/src/pages/admin/AuditLogWorkspace.tsx"

# Launch debounce removal for both files together:
Task: "Remove debounce useEffect and keep initial load useEffect in frontend/src/pages/admin/UserManagementWorkspace.tsx"
Task: "Remove debounce useEffect and keep initial load useEffect in frontend/src/pages/admin/AuditLogWorkspace.tsx"

# Launch button additions for both files together:
Task: "Add "検索" button with Search icon next to filter fields in frontend/src/pages/admin/UserManagementWorkspace.tsx"
Task: "Add "検索" button with Search icon next to filter fields in frontend/src/pages/admin/AuditLogWorkspace.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 3: User Story 1 (both screens)
3. **STOP and VALIDATE**: Test User Story 1 independently using quickstart.md
4. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup → Environment ready
2. Add search button to User Management screen → Test independently
3. Add search button to Audit Logs screen → Test independently
4. Run polish phase → Final validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- This is a UI-only change - no backend modifications needed
- Both screens should have identical search button behavior for consistency
- Button label is "検索" (Search) in Japanese to match existing UI language
- Initial page load displays all records; search button only applies to filter changes
- Commit after each task or logical group with `feat:` prefix
- Stop at any checkpoint to validate story independently
