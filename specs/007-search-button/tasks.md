# Tasks: Search Button

**Input**: Design documents from `/specs/007-search-button/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, quickstart.md

**Tests**: Not requested in feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: No setup required — existing project with established patterns

- [x] T001 Verify existing button styling patterns in `frontend/src/pages/admin/` for Search/Reset button consistency

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: No foundational tasks — changes confined to individual page components

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - User Management Search (Priority: P1) 🎯 MVP

**Goal**: Add Search and Reset buttons to User Management page; remove auto-search behavior

**Independent Test**: Navigate to User Management, enter filter values, click Search — results update only on Search click

### Implementation for User Story 1

- [x] T002 [P] [US1] Add Search and Reset button imports (lucide-react `Search`, `RotateCcw`) in `frontend/src/pages/admin/UserManagementWorkspace.tsx`
- [x] T003 [US1] Add `isSearching` state variable in `frontend/src/pages/admin/UserManagementWorkspace.tsx`
- [x] T004 [US1] Remove `useEffect` auto-search debounce logic (lines 107-113) in `frontend/src/pages/admin/UserManagementWorkspace.tsx`
- [x] T005 [US1] Create `handleSearch` function that calls `fetchUsers()` with current filters in `frontend/src/pages/admin/UserManagementWorkspace.tsx`
- [x] T006 [US1] Create `handleReset` function that clears all filters (keyword, roleId, isActive) without triggering search in `frontend/src/pages/admin/UserManagementWorkspace.tsx`
- [x] T007 [US1] Add Search button to filter section (disabled during loading, shows loading state) in `frontend/src/pages/admin/UserManagementWorkspace.tsx`
- [x] T008 [US1] Add Reset button to filter section in `frontend/src/pages/admin/UserManagementWorkspace.tsx`
- [x] T009 [US1] Add Enter key handler on filter inputs to trigger `handleSearch` in `frontend/src/pages/admin/UserManagementWorkspace.tsx`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Audit Log Search (Priority: P2)

**Goal**: Add Search and Reset buttons to Audit Log page; remove auto-search behavior

**Independent Test**: Navigate to Audit Log, set filter values, click Search — results update only on Search click

### Implementation for User Story 2

- [x] T010 [P] [US2] Add Search and Reset button imports (lucide-react `Search`, `RotateCcw`) in `frontend/src/pages/admin/AuditLogWorkspace.tsx`
- [x] T011 [US2] Add `isSearching` state variable in `frontend/src/pages/admin/AuditLogWorkspace.tsx`
- [x] T012 [US2] Remove `useEffect` auto-search debounce logic in `frontend/src/pages/admin/AuditLogWorkspace.tsx`
- [x] T013 [US2] Create `handleSearch` function that calls `fetchAuditLogs()` with current filters in `frontend/src/pages/admin/AuditLogWorkspace.tsx`
- [x] T014 [US2] Create `handleReset` function that clears all filters (startDate, endDate, actionTypeId, requestId, actorName) without triggering search in `frontend/src/pages/admin/AuditLogWorkspace.tsx`
- [x] T015 [US2] Add Search button to filter section (disabled during loading, shows loading state) in `frontend/src/pages/admin/AuditLogWorkspace.tsx`
- [x] T016 [US2] Add Reset button to filter section in `frontend/src/pages/admin/AuditLogWorkspace.tsx`
- [x] T017 [US2] Add Enter key handler on filter inputs to trigger `handleSearch` in `frontend/src/pages/admin/AuditLogWorkspace.tsx`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T018 Run `npm run build` in `frontend/` — verify 0 TypeScript errors
- [x] T019 Run `npm run lint` in `frontend/` — verify 0 errors
- [ ] T020 Visual walkthrough per `specs/007-search-button/quickstart.md` — verify all 6 scenarios pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: No dependencies - can start immediately
- **User Stories (Phase 3+)**: Can start after Setup (Phase 1) — no blocking prerequisites
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start immediately — No dependencies on other stories
- **User Story 2 (P2)**: Can start immediately — No dependencies on other stories

### Within Each User Story

- Imports before state variables
- State variables before functions
- Functions before UI components
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- User Stories 1 and 2 can run in parallel (different files)
- All tasks within a story marked [P] can run in parallel

---

## Parallel Example: User Stories 1 & 2

```bash
# Launch both user stories together (different files):
Task: "US1 - Add Search/Reset buttons to UserManagementWorkspace.tsx"
Task: "US2 - Add Search/Reset buttons to AuditLogWorkspace.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 3: User Story 1
3. **STOP and VALIDATE**: Test User Story 1 independently
4. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup together
2. Once Setup is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
