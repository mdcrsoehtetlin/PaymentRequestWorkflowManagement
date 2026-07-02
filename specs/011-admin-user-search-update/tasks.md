# Tasks: Admin User Search Update

**Input**: Design documents from `/specs/011-admin-user-search-update/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Verify project structure and branch readiness per plan.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

*(No foundational tasks required as this is an update to an existing search feature)*

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Search by Employee Number (Priority: P1) 🎯 MVP

**Goal**: Search for a user by their specific employee number using a dedicated input field with an "EMP-" prefix.

**Independent Test**: Can be fully tested by entering a known employee number and verifying the matching user is displayed.

### Implementation for User Story 1

- [x] T002 [P] [US1] Update API endpoint contract in src/modules/admin/admin.controller.ts to accept `employeeNumber`
- [x] T003 [P] [US1] Implement `employeeNumber` exact match filter in src/modules/admin/admin.service.ts
- [x] T004 [P] [US1] Update frontend API service to send `employeeNumber` in frontend/src/pages/admin/services/admin.api.ts
- [x] T005 [US1] Add Employee Number input with non-editable "EMP-" prefix to frontend/src/pages/admin/components/UserFilterBar.tsx (ensure prefix stripping logic)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Search by Employee Name (Priority: P1)

**Goal**: Search for users by their name using a dedicated input field.

**Independent Test**: Can be fully tested by entering a partial or full name and verifying the list filters.

### Implementation for User Story 2

- [x] T006 [P] [US2] Update API endpoint contract in src/modules/admin/admin.controller.ts to accept `employeeName`
- [x] T007 [P] [US2] Implement `employeeName` partial match filter (Like) and AND combination logic in src/modules/admin/admin.service.ts
- [x] T008 [P] [US2] Update frontend API service to send `employeeName` in frontend/src/pages/admin/services/admin.api.ts
- [x] T009 [US2] Add Employee Name input field to frontend/src/pages/admin/components/UserFilterBar.tsx

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T010 Verify 300ms debounce is applied to both search inputs in UserFilterBar.tsx
- [x] T011 [P] Write unit tests for admin.service.ts verifying AND logic in src/modules/admin/tests/admin.service.spec.ts
- [x] T012 Verify UI/UX design system — exact Tailwind Color Tokens and spacing
- [x] T013 Verify accessibility compliance — focus indicators, keyboard navigation, ARIA labels for inputs
- [x] T014 Run quickstart.md validation manually to confirm end-to-end functionality

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (Phase 1)**: No dependencies
- **User Stories (Phase 3/4)**: Depend on Phase 1. US1 and US2 can be implemented mostly in parallel, though they touch the same files.
- **Polish (Phase 5)**: Depends on US1 and US2 being complete.

### User Story Dependencies
- **US1 & US2**: Highly independent at API level, but touch the same UI component (`UserFilterBar.tsx`).

### Parallel Opportunities
- Backend and Frontend changes for each story can be done in parallel.
