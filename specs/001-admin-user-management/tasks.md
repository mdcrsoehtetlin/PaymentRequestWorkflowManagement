# Tasks: User Management Page of Admin Panel

**Input**: Design documents from `specs/001-admin-user-management/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/user-management-api.md, quickstart.md

**Tests**: Test-driven and integration verification tasks are explicitly generated as requested in the specification's test boundary criteria.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story increment.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Contains exact file paths in description

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic directory structure for the admin module.

- [x] T001 Create admin backend module, controller, and service files: `src/modules/admin/admin.module.ts`, `src/modules/admin/admin.controller.ts`, `src/modules/admin/admin.service.ts`
- [x] T002 [P] Create admin frontend workspaces pages: `frontend/src/pages/admin/AdminDashboardShell.tsx`, `frontend/src/pages/admin/UserManagementWorkspace.tsx`, `frontend/src/pages/admin/MasterDataWorkspace.tsx`, `frontend/src/pages/admin/AuditLogWorkspace.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core model configurations and route guards required before any user stories can be implemented.

**⚠️ CRITICAL**: No user story implementation can begin until this phase is complete.

- [x] T003 Configure TypeORM User Entity optimistic locking `version` integer column: `src/modules/shared/entities/user.entity.ts`
- [x] T004 [P] Implement administrator route guard validating active ADMIN roles: `src/modules/shared/guards/admin.guard.ts`
- [x] T004A [P] Create frontend `AdminRoute` higher-order component for role-based route protection: `frontend/src/components/guards/AdminRoute.tsx`
- [x] T005 Setup dependency injection for TypeORM databases repositories inside admin module: `src/modules/admin/admin.module.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - User Registration and Profile Modification (Priority: P1) 🎯 MVP

**Goal**: Admin can register new users (auto-generating secure random temp password) and edit user profile details.

**Independent Test**: Register user, display temp password, edit name/branch, verify DB record and users grid.

### Tests for User Story 1
> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**
- [x] T006 [P] [US1] Write unit tests for user registration & editing validation in `src/modules/admin/tests/admin.service.spec.ts`
- [x] T007 [P] [US1] Write integration tests for registration & update API endpoints in `src/modules/admin/tests/admin.controller.spec.ts`

### Implementation for User Story 1
- [x] T008 [US1] Implement user registration logic (crypto random temporary password generation + 12-round bcrypt hash) in `src/modules/admin/admin.service.ts`
- [x] T009 [US1] Implement user update logic (with version checks for optimistic locking) in `src/modules/admin/admin.service.ts`
- [x] T010 [US1] Expose REST HTTP endpoints (`GET /api/v1/admin/users`, `POST /api/v1/admin/users`, `PATCH /api/v1/admin/users/:id`) in `src/modules/admin/admin.controller.ts`
- [x] T011 [P] [US1] Create frontend users list grid component (displaying Emp No, Name, Email, Branch, Role, Status) in `frontend/src/pages/admin/UserManagementWorkspace.tsx`
- [x] T012 [US1] Create frontend register and edit modal popups (integrating branch approved dropdown options) in `frontend/src/pages/admin/components/UserFormModal.tsx`
- [x] T013 [US1] Connect users grid and form modals to backend admin API endpoints in `frontend/src/pages/admin/UserManagementWorkspace.tsx`

**Checkpoint**: User Story 1 is fully functional and testable independently.

---

## Phase 4: User Story 2 - User Account Activation & Deactivation (Priority: P2)

**Goal**: Admin can toggle user active status (instantly evicting Redis sessions) and trigger password resets.

**Independent Test**: Deactivate user, verify session eviction in Redis, verify login blocked. Trigger password reset, verify new random temporary password is shown and saved.

### Tests for User Story 2
- [x] T014 [P] [US2] Write tests verifying active session eviction in Redis upon deactivation in `src/modules/admin/tests/admin.service.spec.ts`

### Implementation for User Story 2
- [x] T015 [US2] Implement active status toggle service logic and Redis session deletion in `src/modules/admin/admin.service.ts`
- [x] T016 [US2] Implement self-deactivation blocker preventing admins from disabling their own account in `src/modules/admin/admin.service.ts`
- [x] T017 [US2] Connect frontend grid status toggle event to backend toggle API in `frontend/src/pages/admin/UserManagementWorkspace.tsx`
- [x] T018 [US2] Add password reset button to edit modal, implementing temporary password regeneration service in `src/modules/admin/admin.service.ts` and `frontend/src/pages/admin/components/UserFormModal.tsx`
- [x] T018A [US2] Expose password reset endpoint (`POST /api/v1/admin/users/:id/reset-password`) in `src/modules/admin/admin.controller.ts`

**Checkpoint**: User Stories 1 AND 2 work independently.

---

## Phase 5: User Story 3 - Global Audit Log & Master Data Inspection (Priority: P3)

**Goal**: Admin can view static configurations and search global transaction audit logs.

**Independent Test**: Open configurations tabs, query audit logs using filters, inspect metadata panel.

### Tests for User Story 3
- [x] T019 [P] [US3] Write tests for configurations lookups fetch and audit log query filters in `src/modules/admin/tests/admin.service.spec.ts`

### Implementation for User Story 3
- [x] T020 [US3] Implement global audit log querying with date filters and server-side pagination in `src/modules/admin/admin.service.ts`
- [x] T020A [US3] Implement master data lookup query service (Currencies, Roles, Statuses, Payment Types, Payment Methods) in `src/modules/admin/admin.service.ts`
- [x] T021 [US3] Expose audit log endpoint (`GET /api/v1/admin/audit-logs`) and master data endpoints (`GET /api/v1/admin/master-data/:category`) in `src/modules/admin/admin.controller.ts`
- [x] T022 [P] [US3] Create frontend master data config tabs and lookup grids (Currencies, Statuses, Types, Methods) in `frontend/src/pages/admin/MasterDataWorkspace.tsx`
- [x] T023 [US3] Create frontend audit logs search filter inputs and chronological grid in `frontend/src/pages/admin/AuditLogWorkspace.tsx`
- [x] T024 [US3] Create audit log metadata docked detail panel displaying client IP and User Agent in `frontend/src/pages/admin/components/MetadataDetailPanel.tsx`

**Checkpoint**: All user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Code cleanup, auditing requirements, and accessibility/performance checks.

- [x] T025 Configure PostgreSQL trigger `protect_approval_logs_immutable` inside database migrations: `src/modules/shared/entities/approval-log.entity.ts`
- [x] T026 Add detailed JSDoc/TSDoc comments on all services, controllers, and custom hooks.
- [ ] T027 [P] Verify import ordering convention across all modified TypeScript files.
- [ ] T028 Verify accessibility compliance (WCAG 2.1 AA contrast ratios, focus outlines, ARIA labels).
- [ ] T029 Run full automated test suite (`npm run test -- --testPathPattern=admin` and E2E) and verify `quickstart.md` flows.

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Phase 1 completion. Blocks all user stories.
- **User Stories (Phase 3+)**: All depend on Foundational phase completion.
  - Can proceed in parallel once Phase 2 is complete.
- **Polish (Final Phase)**: Depends on all user stories being complete.

### Within Each User Story
- Service unit tests are written and fail before implementation.
- Backend services before endpoints.
- Endpoints before frontend components.
- Core UI screens before integration connections.

### Parallel Opportunities
- Setup tasks `T001` and `T002` can run in parallel.
- Foundational task `T004` can run in parallel with database tasks.
- Developer A can work on User Story 1 (Phase 3) while Developer B implements User Story 2 (Phase 4) and Developer C implements User Story 3 (Phase 5).

---

## Parallel Example: User Story 1

```bash
# Launch model and endpoint tests together:
Task: "Write unit tests for user registration & editing validation in src/modules/admin/tests/admin.service.spec.ts"
Task: "Write integration tests for registration & update API endpoints in src/modules/admin/tests/admin.controller.spec.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Phase 1 (Setup)
2. Complete Phase 2 (Foundational - CRITICAL blocks all stories)
3. Complete Phase 3 (User Story 1 - Register/Edit Users)
4. **STOP and VALIDATE**: Test User Story 1 independently in isolation.

### Incremental Delivery
1. Complete Setup + Foundational → Foundation ready.
2. Complete User Story 1 → Test independently → Deploy/Demo (MVP ready).
3. Complete User Story 2 → Test independently → Deploy/Demo.
4. Complete User Story 3 → Test independently → Deploy/Demo.
5. Apply Phase 6 Polish concerns.
