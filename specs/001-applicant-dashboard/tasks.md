# Tasks: Applicant Dashboard

**Input**: Design documents from `specs/001-applicant-dashboard/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/api.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Initialize Applicant module backend structure in `src/modules/applicant/applicant.module.ts`
- [X] T002 [P] Create empty `src/modules/applicant/applicant.controller.ts` and `applicant.service.ts`
- [X] T003 [P] Initialize frontend routing and base pages in `frontend/src/pages/applicant/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Ensure `payment_requests` and `payment_breakdown_items` entities exist in `src/modules/shared/entities/`
- [X] T005 [P] Ensure `receipt_files` and `approval_logs` entities exist in `src/modules/shared/entities/`
- [X] T006 [P] Implement `OwnershipGuard` in `src/modules/applicant/guards/ownership.guard.ts` for strict RBAC
- [X] T007 Configure `src/modules/applicant/applicant.module.ts` to import required TypeORM shared entities

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Applicant views and manages payment request list (Priority: P1) 🎯 MVP

**Goal**: Applicant sees a consolidated, real-time list of all their payment requests sorted by status.

**Independent Test**: Load the dashboard URL and verify the paginated grid and KPI cards display correctly.

### Implementation for User Story 1

- [X] T008 [P] [US1] Create `payment-request-response.dto.ts` in `src/modules/applicant/dto/`
- [X] T009 [US1] Implement `getPaymentRequests` logic with pagination and caching in `src/modules/applicant/applicant.service.ts`
- [X] T010 [US1] Implement `GET /payment-requests` in `src/modules/applicant/applicant.controller.ts`
- [X] T011 [P] [US1] Create frontend API service `frontend/src/pages/applicant/services/api.ts` with `fetchPaymentRequests`
- [X] T012 [US1] Implement UI List component and KPI cards in `frontend/src/pages/applicant/dashboard.tsx`
- [X] T013 [US1] Integrate data fetching with the UI in `dashboard.tsx`
- [X] T013b [US1] Integrate nested routing for Dashboard, Form, and Detail pages in `ApplicantDashboard.tsx`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently.

---

## Phase 4: User Story 2 - Applicant creates draft (Priority: P2)

**Goal**: Applicant can create a new payment request form and save it as a draft.

**Independent Test**: Fill out form with relaxed validation, click Save Draft, and see it appear in the list.

### Implementation for User Story 2

- [X] T014 [P] [US2] Create `create-payment-request.dto.ts` in `src/modules/applicant/dto/`
- [X] T015 [US2] Implement `createDraft` logic and ID generation in `src/modules/applicant/applicant.service.ts`
- [X] T016 [US2] Implement `POST /payment-requests/draft` in `src/modules/applicant/applicant.controller.ts`
- [X] T017 [P] [US2] Implement Payment Form UI in `frontend/src/pages/applicant/form.tsx`
- [X] T018 [US2] Integrate save draft API in `form.tsx`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently.

---

## Phase 5: User Story 3 - Submit to Manager (Priority: P3)

**Goal**: Applicant submits a completed draft to a Manager for verification.

**Independent Test**: Attempt submission with missing fields (should fail). Attempt with all required fields (should transition to `SUBMITTED_MANAGER`).

### Implementation for User Story 3

- [X] T019 [P] [US3] Create `submit-manager.dto.ts` in `src/modules/applicant/dto/`
- [X] T020 [US3] Implement strict validation, state transition, and audit logging in `src/modules/applicant/applicant.service.ts`
- [X] T021 [US3] Implement `POST /payment-requests/:id/submit-manager` in `src/modules/applicant/applicant.controller.ts`
- [X] T022 [P] [US3] Implement Detail view UI in `frontend/src/pages/applicant/detail.tsx`
- [X] T023 [US3] Integrate submit action and validation handling in `detail.tsx`

---

## Phase 6: User Story 4 - Upload Receipts (Priority: P4)

**Goal**: Applicant attaches receipt files to their payment request.

**Independent Test**: Upload a PDF < 10MB to a Draft request and verify it saves.

### Implementation for User Story 4

- [X] T024 [P] [US4] Create `upload-receipt.dto.ts` in `src/modules/applicant/dto/`
- [X] T025 [US4] Implement file validation and storage logic in `src/modules/applicant/applicant.service.ts`
- [X] T026 [US4] Implement `POST /payment-requests/:id/receipts` in `src/modules/applicant/applicant.controller.ts`
- [X] T027 [P] [US4] Create drag-and-drop UI component in `frontend/src/pages/applicant/components/ReceiptUpload.tsx`
- [X] T028 [US4] Integrate receipt upload API in `detail.tsx`

---

## Phase 6a: User Story 5 - Submit to Final Approver (Priority: P4)

**Goal**: Applicant forwards a Manager-Verified request to the Final Approver.

**Independent Test**: Transition a `MANAGER_VERIFIED` request to `SUBMITTED_APPROVER`.

### Implementation for User Story 5

- [X] T041 [US5] Implement strict validation and state transition logic for Approver submission in `applicant.service.ts`
- [X] T042 [US5] Implement `POST /payment-requests/:id/submit-approver` in `src/modules/applicant/applicant.controller.ts`
- [X] T043 [US5] Integrate submit to approver action in `detail.tsx`

---

## Phase 6b: User Story 6 - Edit/Resubmit Rejected Requests (Priority: P4)

**Goal**: Applicant views rejection comments, edits fields, and resubmits.

**Independent Test**: Edit a rejected request and verify it transitions back to `SUBMITTED_MANAGER`.

### Implementation for User Story 6

- [X] T044 [P] [US6] Create `update-payment-request.dto.ts` in `src/modules/applicant/dto/`
- [X] T045 [US6] Implement edit logic for rejected states and restart approval workflow in `applicant.service.ts`
- [X] T046 [US6] Implement `PUT /payment-requests/:id` in `src/modules/applicant/applicant.controller.ts`
- [X] T047 [US6] Integrate rejection comment display and edit mode toggle in `detail.tsx`

---

## Phase 6c: User Story 7 - Soft-delete Draft (Priority: P4)

**Goal**: Applicant can soft-delete a draft they no longer need.

**Independent Test**: Delete a draft and verify it no longer appears in the list but remains in the DB.

### Implementation for User Story 7

- [X] T048 [US7] Implement soft-delete logic for request and associated receipts in `applicant.service.ts`
- [X] T049 [US7] Implement `DELETE /payment-requests/:id` in `src/modules/applicant/applicant.controller.ts`
- [X] T050 [US7] Implement delete confirmation modal and action in `dashboard.tsx`

---

## Phase 7: User Story 8 - Real-time WebSocket Notifications (Priority: P5)

**Goal**: Applicant receives live status updates without refreshing.

**Independent Test**: Trigger a status change from backend and observe the frontend toast and auto-refresh.

### Implementation for User Story 8

- [X] T029 [P] [US8] Create WebSocket gateway `src/modules/applicant/applicant.gateway.ts`
- [X] T030 [US8] Dispatch `statusUpdate` events from `applicant.service.ts` state transitions
- [X] T031 [P] [US8] Create custom hook `frontend/src/pages/applicant/hooks/useApplicantSocket.ts`
- [X] T032 [US8] Integrate WebSocket hook in `dashboard.tsx` to trigger toast and re-fetch

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T033 Verify API response times and frontend performance targets (< 2s load, < 200ms P95 API, < 500ms WebSocket)
- [X] T034 [P] Verify UI/UX design system — colors, StatusBadge components, typography (Inter font), modal dialogs
- [X] T035 Verify accessibility compliance — WCAG 2.1 AA contrast, focus indicators, ARIA labels, keyboard navigation
- [X] T036 Security hardening — RBAC guards on all endpoints, audit trail logging for all state transitions verified
- [X] T037 [P] JSDoc/TSDoc comments on all public services, controllers, gateways, guards, and hooks
- [X] T038 Verify import ordering convention across all TypeScript files (5-group order)
- [X] T039 Confirm all commits follow Conventional Commits semantic prefix convention
- [X] T040 Run quickstart.md validation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### Parallel Opportunities

- DTO creation across stories (T008, T014, T019, T024) can run in parallel.
- Frontend UI components (T011, T017, T022, T027) can be built in parallel with backend endpoints.
