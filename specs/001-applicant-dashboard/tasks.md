# Tasks: Applicant Dashboard

**Input**: Design documents from `/specs/001-applicant-dashboard/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/api-endpoints.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure for the applicant module.

- [X] T001 Create backend module structure in `backend/src/modules/applicant/applicant.module.ts`
- [X] T002 Create backend controller in `backend/src/modules/applicant/applicant.controller.ts`
- [X] T003 [P] Create backend service in `backend/src/modules/applicant/applicant.service.ts`
- [X] T004 Create frontend directory structure in `frontend/src/pages/applicant/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Verify/Create `PaymentRequest` entity in `backend/src/modules/shared/entities/payment-request.entity.ts`
- [X] T006 [P] Verify/Create `PaymentBreakdownItem` entity in `backend/src/modules/shared/entities/payment-breakdown-item.entity.ts`
- [X] T007 [P] Verify/Create `ReceiptFile` entity in `backend/src/modules/shared/entities/receipt-file.entity.ts`
- [X] T008 [P] Verify/Create `ApprovalLog` entity in `backend/src/modules/shared/entities/approval-log.entity.ts`
- [X] T009 Create `ownership.guard.ts` in `backend/src/modules/applicant/guards/ownership.guard.ts` to ensure applicants can only access their own requests.
- [X] T010 Setup API routing for `/api/v1/applicant` in the NestJS application

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - View Request List (Priority: P1) 🎯 MVP

**Goal**: Applicant views and manages their payment request list

**Independent Test**: Applicant logs in, navigates to `/applicant`, and sees their payment requests with correct statuses and KPI summaries.

### Implementation for User Story 1

- [X] T011 [P] [US1] Create response DTO `payment-request-response.dto.ts` in `backend/src/modules/applicant/dto/`
- [X] T012 [US1] Implement `getPaymentRequests` in `backend/src/modules/applicant/applicant.service.ts`
- [X] T013 [US1] Expose `GET /payment-requests` endpoint in `backend/src/modules/applicant/applicant.controller.ts`
- [X] T014 [US1] Implement `getPaymentRequestById` service and `GET /payment-requests/:id` endpoint
- [X] T015 [P] [US1] Create `StatusBadge.tsx` component in `frontend/src/pages/applicant/components/StatusBadge.tsx`
- [X] T016 [US1] Implement `use-payment-requests.ts` custom hook in `frontend/src/pages/applicant/hooks/`
- [X] T017 [US1] Create `ApplicantDashboard.tsx` in `frontend/src/pages/applicant/ApplicantDashboard.tsx` with list and KPI cards

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Create Draft (Priority: P2)

**Goal**: Applicant creates a new payment request and saves it as a draft

**Independent Test**: Applicant clicks "Create New Request", fills required fields, and successfully saves as draft.

### Implementation for User Story 2

- [X] T018 [P] [US2] Create `create-payment-request.dto.ts` in `backend/src/modules/applicant/dto/`
- [X] T019 [US2] Implement `createDraftRequest` logic in `backend/src/modules/applicant/applicant.service.ts`
- [X] T020 [US2] Expose `POST /payment-requests` endpoint in `backend/src/modules/applicant/applicant.controller.ts`
- [X] T021 [P] [US2] Create `BreakdownItemTable.tsx` in `frontend/src/pages/applicant/components/BreakdownItemTable.tsx`
- [X] T022 [US2] Create `CreateRequestForm.tsx` in `frontend/src/pages/applicant/CreateRequestForm.tsx`
- [X] T023 [US2] Implement `calculate-total.ts` utility in `frontend/src/pages/applicant/utils/calculate-total.ts`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Submit to Manager (Priority: P3)

**Goal**: Applicant submits a payment request to the Manager

**Independent Test**: Applicant submits a draft, status changes to SUBMITTED_MANAGER, and it locks from editing.

### Implementation for User Story 3

- [X] T024 [P] [US3] Create `submit-to-manager.dto.ts` in `backend/src/modules/applicant/dto/`
- [X] T025 [US3] Implement `submitToManager` logic with strict validation in `applicant.service.ts`
- [X] T026 [US3] Expose `POST /payment-requests/:id/submit-to-manager` in `applicant.controller.ts`
- [X] T027 [US3] Add "Submit to Manager" button and confirmation modal to `CreateRequestForm.tsx` / `EditRequestForm.tsx`
- [X] T028 [US3] Implement read-only view in `RequestDetailView.tsx` for submitted requests

---

## Phase 6: User Story 4 - Upload Receipt Files (Priority: P4)

**Goal**: Applicant uploads and manages receipt files

**Independent Test**: Applicant attaches a PDF receipt to a draft request successfully.

### Implementation for User Story 4

- [X] T029 [P] [US4] Create `upload-receipt.dto.ts` in `backend/src/modules/applicant/dto/`
- [X] T030 [US4] Implement `uploadReceiptFile` logic in `applicant.service.ts`
- [X] T031 [US4] Expose `POST /payment-requests/:id/receipts` endpoint in `applicant.controller.ts`
- [X] T032 [US4] Create `ReceiptUploader.tsx` component in `frontend/src/pages/applicant/components/ReceiptUploader.tsx`
- [X] T033 [US4] Integrate `ReceiptUploader.tsx` into `CreateRequestForm.tsx`

---

## Phase 7: User Story 5 - Submit to Approver (Priority: P5)

**Goal**: Applicant submits a Manager-Verified request to the Final Approver

**Independent Test**: Applicant submits verified request, status changes to SUBMITTED_APPROVER.

### Implementation for User Story 5

- [X] T034 [US5] Implement `submitToApprover` logic in `applicant.service.ts`
- [X] T035 [US5] Expose `POST /payment-requests/:id/submit-to-approver` in `applicant.controller.ts`
- [X] T036 [US5] Add "Submit to Final Approver" button to `RequestDetailView.tsx` when status is MANAGER_VERIFIED

---

## Phase 8: User Story 6 - Edit/Resubmit Rejected (Priority: P6)

**Goal**: Applicant views rejection comments and edits/resubmits a rejected request

**Independent Test**: Applicant opens rejected request, sees rejection comment, edits amount, and resubmits.

### Implementation for User Story 6

- [X] T037 [P] [US6] Create `update-payment-request.dto.ts` in `backend/src/modules/applicant/dto/`
- [X] T038 [US6] Implement `updateDraftRequest` logic in `applicant.service.ts`
- [X] T039 [US6] Expose `PATCH /payment-requests/:id` in `applicant.controller.ts`
- [X] T040 [US6] Create `EditRequestForm.tsx` in `frontend/src/pages/applicant/EditRequestForm.tsx`
- [X] T041 [US6] Display approval history timeline in frontend component

---

## Phase 9: User Story 7 - Soft-Delete Draft (Priority: P7)

**Goal**: Applicant soft-deletes a draft request

**Independent Test**: Applicant deletes draft, it vanishes from the list, database shows `is_deleted = true`.

### Implementation for User Story 7

- [X] T042 [US7] Implement `softDeleteDraft` logic in `applicant.service.ts`
- [X] T043 [US7] Expose `DELETE /payment-requests/:id` in `applicant.controller.ts`
- [X] T044 [US7] Add "Delete Draft" button and confirmation modal to `EditRequestForm.tsx`

---

## Phase 10: User Story 8 - Real-Time Notifications (Priority: P8)

**Goal**: Applicant receives real-time status notifications

**Independent Test**: Request status changes remotely, Applicant receives toast and list updates instantly.

### Implementation for User Story 8

- [X] T045 [P] [US8] Verify/Setup `NotificationGateway` in `backend/src/modules/shared/gateways/notification.gateway.ts`
- [X] T046 [US8] Integrate `NotificationGateway` in `applicant.service.ts` to emit events when Applicant takes action
- [X] T047 [US8] Create `use-websocket.ts` hook in `frontend/src/pages/applicant/hooks/use-websocket.ts`
- [X] T048 [US8] Integrate WebSocket listener in `ApplicantDashboard.tsx` to update request list in real-time

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T049 [P] Write unit tests for `applicant.controller.ts`
- [X] T050 [P] Write unit tests for `applicant.service.ts`
- [X] T051 Verify UI/UX design system — colors, StatusBadge components, typography (Inter font), modal dialogs
- [X] T052 Verify accessibility compliance — WCAG 2.1 AA contrast, focus indicators, ARIA labels, keyboard navigation
- [X] T053 Verify all API response times (< 200ms) and WebSocket delivery (< 500ms)
- [X] T054 Add JSDoc/TSDoc comments on all public services and controllers in the applicant module
- [X] T055 Ensure Strict Naming Conventions & Type Safety are followed

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-10)**: All depend on Foundational phase completion
  - Sequentially in priority order (P1 → P8)
- **Polish (Phase 11)**: Depends on all user stories being complete

### Parallel Opportunities

- Setup tasks and Foundational tasks marked [P] can run in parallel.
- DTO creation across different user stories can run in parallel.
- Frontend component UI design (like `StatusBadge.tsx`, `BreakdownItemTable.tsx`) can be built in parallel with backend services.
