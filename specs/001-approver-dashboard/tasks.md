# Tasks: Final Approver Dashboard

**Input**: Design documents from `/specs/001-approver-dashboard/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Included as unit and integration test specifications in backend and frontend.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g. US1, US2, US3)
- Includes exact file paths in descriptions

## Path Conventions

- **Web app**: `src/` (backend), `frontend/src/` (frontend)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and registration check.

- [X] T001 Verify that `src/modules/approver/approver.module.ts` imports `SharedModule` and controller/service providers are registered.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core model and TypeORM dependencies confirmation.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 Verify that `src/modules/approver/approver.service.ts` can inject `Repository<PaymentRequest>` and query PostgreSQL database tables successfully.

---

## Phase 3: User Story 1 - View Pending Requests Queue & Start Review (Priority: P1) 🎯 MVP

**Goal**: Load pending queue with filters, sorting, and pagination. Transition to "Approver Reviewing" status when detail is opened.

**Independent Test**: Fetch the dashboard page, see lists load. Open details for a request in status 6 and confirm status changes to 7 in database and timeline logs.

### Implementation for User Story 1

- [X] T003 [P] [US1] Create the query DTO `QueryApproverRequestsDto` in `src/modules/approver/dto/query-approver-requests.dto.ts`.
- [X] T004 [US1] Implement `findAssignedRequests` query logic with status, branch, date range, search, pagination, and sorting filters in `src/modules/approver/approver.service.ts`.
- [X] T005 [US1] Implement transaction-wrapped review-start status update and `APPR_REVIEW_START` log insertion inside `findOneForReview` in `src/modules/approver/approver.service.ts`.
- [X] T006 [US1] Implement queue list and request details endpoints mapping to query DTOs in `src/modules/approver/approver.controller.ts`.
- [X] T007 [P] [US1] Create API service methods for list and details queries in `frontend/src/pages/approver/services/approver.service.ts`.
- [X] T008 [P] [US1] Implement list state management custom hook in `frontend/src/pages/approver/hooks/useApproverRequests.ts`.
- [X] T009 [P] [US1] Implement detail view custom hook in `frontend/src/pages/approver/hooks/useApproverRequestDetail.ts`.
- [X] T010 [P] [US1] Create summary dashboard sidebar `SummarySidebar.tsx` displaying pending counts at `frontend/src/pages/approver/components/SummarySidebar.tsx`.
- [X] T011 [P] [US1] Create search and filter panel `FilterSearchBar.tsx` at `frontend/src/pages/approver/components/FilterSearchBar.tsx`.
- [X] T012 [P] [US1] Create data grid table `ApproverRequestTable.tsx` for listing requests at `frontend/src/pages/approver/components/ApproverRequestTable.tsx`.
- [X] T013 [US1] Create read-only information grid and log timeline component in `frontend/src/pages/approver/ApproverRequestDetail.tsx`.
- [X] T014 [US1] Update `frontend/src/pages/approver/ApproverDashboard.tsx` to mount summary sidebar, filters, data grid table, and detail panel.
- [X] T015 [P] [US1] Create and execute unit test suites `src/modules/approver/tests/approver.service.spec.ts` and `src/modules/approver/tests/approver.controller.spec.ts` for list queries and auto-review start logic.

---

## Phase 4: User Story 2 - Approve Request (Priority: P2)

**Goal**: Final Approver authorizes a payment request, transitions status to APPROVED, and transfers assignment to Accounting queue.

**Independent Test**: Open details pane, click "Approve" button, confirm modal. Verify status transitions to 8, assignee is cleared, and approval log entry is recorded.

### Implementation for User Story 2

- [X] T016 [P] [US2] Create approval payload DTO `ApprovePaymentRequestDto` in `src/modules/approver/dto/approve-payment-request.dto.ts`.
- [X] T017 [US2] Implement transaction-wrapped request approval logic, Redis cache eviction, and WebSocket notifications inside `approve` in `src/modules/approver/approver.service.ts`.
- [X] T018 [US2] Implement approval endpoint `POST /:id/approve` in `src/modules/approver/approver.controller.ts`.
- [X] T019 [P] [US2] Add approve request API method in `frontend/src/pages/approver/services/approver.service.ts`.
- [X] T020 [US2] Implement Approve action button and confirmation dialog modal in `frontend/src/pages/approver/components/ApproverActionPanel.tsx`.
- [X] T021 [US2] Integrate Approve button action and list refresh trigger in `frontend/src/pages/approver/ApproverRequestDetail.tsx`.
- [X] T022 [P] [US2] Add unit test cases for successful approval flow, cache invalidation check, and optimistic locking status guard checks in `src/modules/approver/tests/approver.service.spec.ts` and `src/modules/approver/tests/approver.controller.spec.ts`.

---

## Phase 5: User Story 3 - Reject Request (Priority: P3)

**Goal**: Final Approver rejects a request with an explanation comment, transitions status to REJECTED_APPROVER, and returns assignment to Applicant.

**Independent Test**: Attempt rejection with less than 10 characters and verify failure. Submit with a valid comment and verify status updates to 9, assignment transfers to Applicant, and log comment is recorded.

### Implementation for User Story 3

- [X] T023 [P] [US3] Create rejection payload DTO `RejectPaymentRequestDto` in `src/modules/approver/dto/reject-payment-request.dto.ts`.
- [X] T024 [US3] Implement transaction-wrapped rejection logic, character length validation check, cache eviction, and WebSocket notifications inside `reject` in `src/modules/approver/approver.service.ts`.
- [X] T025 [US3] Implement rejection endpoint `POST /:id/reject` in `src/modules/approver/approver.controller.ts`.
- [X] T026 [P] [US3] Add reject request API method in `frontend/src/pages/approver/services/approver.service.ts`.
- [X] T027 [US3] Implement Reject action button and comments dialog modal in `frontend/src/pages/approver/components/ApproverActionPanel.tsx`.
- [X] T028 [US3] Integrate Reject button action, comment length validation checks, and list refresh trigger in `frontend/src/pages/approver/ApproverRequestDetail.tsx`.
- [X] T029 [P] [US3] Add unit test cases for comment validation limits, status constraints, and transaction rollback checks in `src/modules/approver/tests/approver.service.spec.ts` and `src/modules/approver/tests/approver.controller.spec.ts`.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories.

- [X] T030 [P] Add JSDoc/TSDoc headers and formatting in `src/modules/approver/approver.controller.ts` and `src/modules/approver/approver.service.ts`.
- [X] T031 [P] Ensure 5-group import ordering rules are satisfied in all controller, service, DTO, component, and hook files.
- [X] T032 Verify there are zero TypeScript compilation and ESLint errors.
- [X] T033 Verify dashboard loading times (≤ 2s) and API response speeds (P95 ≤ 200ms).
- [X] T034 Validate styling compliance with corporate HSL colors and badge layout constraints.
- [X] T035 Verify WCAG 2.1 AA accessibility (focus rings, ARIA labels, keyboard tab order) in `frontend/src/pages/approver/ApproverDashboard.tsx`.
- [X] T036 Validate RBAC security decorators and AssignmentGuard configurations on all Approver API routes.
- [X] T037 Confirm `approval_logs` database constraints and append-only trigger work correctly.
- [X] T038 Execute end-to-end confirmation checks defined in `specs/001-approver-dashboard/quickstart.md`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion. BLOCKS all user stories.
- **User Stories (Phases 3 to 5)**: Depends on Foundational completion. Can run in parallel once foundation is complete.
- **Polish (Phase 6)**: Depends on all user stories being completed.

### Parallel Opportunities

- DTO creation and API helper methods (T003, T007, T016, T023) can run in parallel.
- Hook creation (T008, T009) and independent UI component templates (T010, T011, T012) can be built in parallel.
- Once the Foundational phase (Phase 2) is verified, backend controller logic and frontend layout logic can be worked on concurrently.

---

## Parallel Example: User Story 1

```bash
# Implement model/query DTOs and API interfaces together:
Task: "Create QueryApproverRequestsDto in src/modules/approver/dto/query-approver-requests.dto.ts"
Task: "Create API service methods in frontend/src/pages/approver/services/approver.service.ts"

# Implement custom hooks and standalone UI components:
Task: "Implement useApproverRequests.ts in frontend/src/pages/approver/hooks/useApproverRequests.ts"
Task: "Implement SummarySidebar.tsx in frontend/src/pages/approver/components/SummarySidebar.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (Setup) and Phase 2 (Foundational) check.
2. Build User Story 1 (T003 to T015) to enable pending queue load, details check, and auto-transition to Reviewing.
3. Run verification checks in T015.
4. Stop and demo.

### Incremental Delivery

1. Verify User Story 1 is fully functional.
2. Deliver User Story 2 (Approve action and workflow progress).
3. Deliver User Story 3 (Reject action and feedback flow).
4. Perform final Polish tasks (Phase 6) for audit trails, security compliance, and accessibility checks.
