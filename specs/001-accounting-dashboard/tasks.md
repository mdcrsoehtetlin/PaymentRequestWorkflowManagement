# Tasks: 001-accounting-dashboard

**Input**: Design documents from `/specs/001-accounting-dashboard/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `src/`, `frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Initialize Accounting module structure in backend (`src/modules/accounting/accounting.module.ts`)
- [x] T002 Initialize Accounting dashboard structure in frontend (`frontend/src/pages/accounting/AccountingDashboard.tsx`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**笞�・・CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 [P] Create Accounting DTOs (`src/modules/accounting/dto/accounting-requests.dto.ts`)
- [x] T004 [P] Create Accounting Controller with RolesGuard (`src/modules/accounting/accounting.controller.ts`)
- [x] T005 [P] Create Accounting Service (`src/modules/accounting/accounting.service.ts`)
- [x] T006 [P] Setup Accounting frontend API services (`frontend/src/pages/accounting/services/accounting.service.ts`)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - View and Filter Approved Payment Request Queue (Priority: P1) �識 MVP

**Goal**: Accountants need to see a consolidated, real-time list of all payment requests that have been approved by the final approver, so they can process settlements efficiently.

**Independent Test**: Log in as an `ACCOUNTING` user, navigate to `/accounting/dashboard` (or `/accounting`), and verify that the page displays the list of requests in `APPROVED` (status 8) status. Validate that search query and branch dropdown filters correctly update the displayed rows.

### Implementation for User Story 1

- [x] T007 [P] [US1] Implement `findApprovedRequests` in `src/modules/accounting/accounting.service.ts`
- [x] T008 [US1] Implement `GET /` endpoint in `src/modules/accounting/accounting.controller.ts`
- [x] T009 [P] [US1] Implement frontend queue table component `frontend/src/pages/accounting/components/AccountingQueueTable.tsx`
- [x] T010 [US1] Implement search, branch filter, and pagination hooks `frontend/src/pages/accounting/hooks/useAccountingQueue.ts`
- [x] T011 [US1] Integrate queue table, filters, and missing receipts summary card into `frontend/src/pages/accounting/AccountingDashboard.tsx`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Request Detail Review and Branch Alerts (Priority: P1)

**Goal**: Accountants need to inspect all request details in a read-only detail view to audit and authorize the payment.

**Independent Test**: Select a request from the queue, click its Request Number link or the "Process" button to open the Detail Modal. Verify that all fields are read-only, receipt links are available, and the branch-specific alert banner shows the correct message.

### Implementation for User Story 2

- [x] T012 [P] [US2] Implement `findOneForAccounting` in `src/modules/accounting/accounting.service.ts`
- [x] T013 [US2] Implement `GET /:id` endpoint in `src/modules/accounting/accounting.controller.ts`
- [x] T014 [P] [US2] Create Branch Alert banner component `frontend/src/pages/accounting/components/BranchAlertBanner.tsx`
- [x] T015 [P] [US2] Create read-only breakdown grid component `frontend/src/pages/accounting/components/ReadOnlyBreakdownGrid.tsx`
- [x] T016 [US2] Implement `frontend/src/pages/accounting/PaymentDetailModal.tsx` with Mismatched Totals and Missing Receipts edge case warnings

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Complete Payment and Audit Log Commit (Priority: P1)

**Goal**: Accountants need to mark requests as "Paid (Completed)" to finish the settlement process and update the request status.

**Independent Test**: Open the detail modal for an approved request, input an optional comment, click "Mark as Paid", confirm in the dialog box, and verify that the request's status changes to `PAID` (status 10).

### Implementation for User Story 3

- [x] T017 [P] [US3] Implement `completePayment` with atomic transaction and Redis cache eviction in `src/modules/accounting/accounting.service.ts`
- [x] T018 [US3] Implement `POST /:id/complete-payment` endpoint extracting IP and User Agent in `src/modules/accounting/accounting.controller.ts`
- [x] T019 [P] [US3] Create payment completion confirmation dialog component `frontend/src/pages/accounting/components/PaymentCompletionDialog.tsx`
- [x] T020 [US3] Integrate completion action and toast notification in `frontend/src/pages/accounting/PaymentDetailModal.tsx`

**Checkpoint**: All P1 user stories should now be independently functional

---

## Phase 6: User Story 4 - Real-Time Queue Synchronization (Priority: P2)

**Goal**: Accountants need the dashboard queue to refresh automatically when workflow updates occur.

**Independent Test**: Approve a request in the Approver session and check if it instantly appears on the Accountant dashboard.

### Implementation for User Story 4

- [ ] T021 [P] [US4] Implement WebSocket event broadcast for `statusUpdate` and `row-removed` in `src/modules/accounting/accounting.service.ts`
- [ ] T022 [US4] Implement WebSocket listener hooks and 60s fallback polling on connection drops in `frontend/src/pages/accounting/hooks/useAccountingWebSockets.ts`
- [ ] T023 [US4] Integrate WebSocket events to auto-refresh queue in `frontend/src/pages/accounting/AccountingDashboard.tsx`

**Checkpoint**: All user stories should now be independently functional

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T024 [P] Verify API response times and frontend performance targets (< 2s load, < 200ms P95 API, < 500ms WebSocket)
- [ ] T025 [P] Verify UI/UX design system 窶・colors, StatusBadge components, typography (Inter font), modal dialogs
- [ ] T026 [P] Verify accessibility compliance 窶・WCAG 2.1 AA contrast, focus indicators, ARIA labels, keyboard navigation
- [ ] T027 Security hardening 窶・RBAC guards on all endpoints, audit trail logging for all state transitions
- [ ] T028 JSDoc/TSDoc comments on all public services, controllers, gateways, guards, and hooks
- [ ] T029 Verify import ordering convention across all TypeScript files (5-group order)
- [ ] T030 Confirm all commits follow Conventional Commits semantic prefix convention
- [ ] T031 Run quickstart.md validation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- Different user stories can be worked on in parallel by different team members

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready
