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

---

## Phase 12: Convergence

**Purpose**: Close gaps identified between the implementation and the specification.

- [X] T056 CRITICAL: Add missing JSDoc comments to `ownership.guard.ts` and `useApplicantSocket.ts` per Constitution I (missing)
- [X] T057 Add missing FR-002 UI fields (Payment Type, Target Manager, Receipt Present, Purpose, Request Content, Employee Info) to frontend form and `create-payment-request.dto.ts` per FR-002 (missing)
- [X] T058 Enforce server-side receipt file naming convention validation `{Description}_{Date}_{Seq}.{ext}` in receipt upload per FR-003 (missing)
- [X] T059 Extract inline breakdown logic into `BreakdownItemTable.tsx` component per T021 (partial)
- [X] T060 Extract inline total calculation into `calculate-total.ts` per T023 (missing)
- [X] T061 Extract inline dashboard fetching logic into `use-payment-requests.ts` hook per T016 (missing)
- [X] T062 Rename `useApplicantSocket.ts` to `use-websocket.ts` to enforce kebab-case per Constitution I / T047 (contradicts)

---

## Phase 13: Convergence

**Purpose**: Close gaps identified between the implementation and the specification.

- [x] T063 Implement `submitToManager` logic in `applicant.service.ts` and `applicant.controller.ts` per US3 / T025, T026 (missing)
- [x] T064 Add server-side validation to `submitToManager` to block request submission if `has_receipt = true` but no receipts are attached per FR-014 (missing)
- [x] T065 Integrate `ReceiptUpload.tsx` component into `form.tsx` so applicants can upload receipts during draft creation/edit per US4 / T033 (missing)

---

## Phase 14: Convergence

**Purpose**: Close gaps identified between the implementation and the specification.

- [x] T066 Ensure receipt upload UI is visible during new draft creation in `form.tsx` (currently hidden without `createdDraftId`) per US4 / T065 (partial)

---

## Phase 15: Convergence

**Purpose**: Close critical gaps causing "Failed to save draft" error and other issues in the new payment request flow.

- [x] T067 CRITICAL: Fix entity property names in `applicant.service.ts` `createDraft` — use camelCase TS names (`requestNumber`, `applicantUserId`, `statusId`, `totalAmount`, `currencyId`, `applicationDate`, `requestContent`) instead of snake_case DB column names per Constitution I (contradicts)
- [x] T068 CRITICAL: Fix `PaymentBreakdownItem` FK assignment in `createDraft` — use `payment_request_id: savedRequest.id` instead of `id: savedRequest.id` per FR-002 (contradicts)
- [x] T069 CRITICAL: Fix `ApprovalLog` FK assignment across all service methods — use `paymentRequestId: savedRequest.id` instead of `id: savedRequest.id` per FR-007 (contradicts)
- [x] T070 Fix frontend `api.ts` submit-to-manager URL from `/submit-manager` to `/submit-to-manager` to match backend controller per FR-009 (contradicts)
- [x] T071 Fix `form.tsx` dropdown option values to match enums — Currency (MMK=1, USD=2, JPY=3, THB=4), Payment Method (Bank Transfer=1, Cash=2, Check=3) per FR-002 (contradicts)
- [x] T072 Replace all `alert()` calls in `form.tsx` with toast notifications via `globalToast` CustomEvent per Constitution V (contradicts)
- [x] T073 Integrate client-side validation in `form.tsx` with proper draft/submit mode validation per FR-014 (missing)
- [x] T074 Add conditional `bank_account_info` field in `form.tsx` when Payment Method is Bank Transfer or Cash per FR-014 / Scenario 2 (missing)
- [x] T075 Convert breakdown `amount` from string to number before sending to backend API per FR-013 (partial)
- [x] T076 Persist `target_manager_id` from DTO to entity `managerUserId` in backend `createDraft` per FR-009 (missing)
- [x] T077 Update focus ring colors from `focus:ring-blue-500` to `focus:ring-indigo-500` in `form.tsx` per Constitution V (contradicts)
- [x] T078 Add `max={today}` to `application_date` input to prevent future dates per Scenario 2 (partial)
- [x] T079 Add `maxLength` attributes — Purpose (255 chars), Request Content (1000 chars) per FR-002 (partial)
- [x] T080 Fix `submitToManager` action type from `actionTypeId: 2` (EDITED) to `actionTypeId: 3` (SUBMITTED) per FR-007 (contradicts)
- [x] T081 Add complete field validation in `submitToManager` — check purpose, requestContent, paymentTypeId, managerUserId per FR-014 (missing)
- [x] T082 Fix `detail.tsx` receipt upload visibility from `[1, 4]` to `EDITABLE_STATUSES [1, 5, 9]` per US4 / Scenario 4 (contradicts)
- [x] T083 Use `STATUS_LABELS_EN` for approval log status display in `detail.tsx` instead of hardcoded strings per FR-011 (missing)
- [x] T084 Write unit tests for fixed `createDraft` and `submitToManager` in `applicant.service.spec.ts` per Constitution testing standards (missing)
- [x] T085 Write unit tests for `form.tsx` validation logic covering draft save and submission modes per Constitution testing standards (NA: testing libraries not installed on frontend, backend validation fully tested)
- [x] T086 Fix `RequestNumberService` `generateNext()` algorithm to parse integer sequence numbers instead of string-based `MAX()`, resolving the 500 duplicate key error.
- [x] T087 Implement direct receipt file upload selection during new draft creation in `form.tsx`, automatically uploading the file upon successful draft save per user request.
- [x] T088 Change `apiClient.patch` to `apiClient.put` in `form.tsx` for updating a draft, since the backend controller uses `@Put(':id')` instead of `@Patch(':id')`.

---

## Phase 16: Convergence 2 (Detail View Gaps)

**Purpose**: Close remaining gaps in the applicant request detail view, specifically around editing rejected requests and commenting.

- [x] T089 Update `detail.tsx` to display all request fields (Purpose, Content, Target Manager, Payment Type, Currency Type, Bank Account Info) in read-only mode per FR-001. (missing)
- [x] T090 Update `detail.tsx` Edit mode (`isEditing`) to allow modifying all the aforementioned missing fields per Scenario 6. (missing)
- [x] T091 Implement the "Add Comment" box in `detail.tsx` to allow applicants to reply to rejection comments, displaying it in the activity log immediately per Scenario 6. (missing)

---

## Phase 17: Convergence

**Purpose**: Close gaps identified in the new applicant form data extraction and display.

- [x] T092 Include `department` in JWT payload in `auth.service.ts` and `frontend/src/types/index.ts` so that it is not hardcoded to 'Engineering' in the applicant form per FR-002 (partial)
- [x] T093 Remove hardcoded fallback mock data ('EMP-90210', 'Jane Doe', 'Yangon Main') in `frontend/src/pages/applicant/form.tsx` to ensure real employee data is always validated and displayed per FR-002 (partial)
- [x] T094 Fetch active managers dynamically from an API endpoint for the Target Manager dropdown in `frontend/src/pages/applicant/form.tsx` instead of using hardcoded values per FR-009 (missing)


---

## Phase 18: Convergence

**Purpose**: Align breakdown item implementation with NFR-009 precision requirements and the Data Model.

- [x] T095 Fix `amount` data type to `string` in `BreakdownItemDto` and frontend components to avoid floating-point precision loss per NFR-009 (contradicts)
- [x] T096 Align `BreakdownItemTable.tsx` columns with `PaymentBreakdownItem` entity by removing `department`/`projectName` and ensuring correct fields are captured per Data Model (contradicts)

---

## Phase 19: Convergence

**Purpose**: Close gaps identified regarding search and filter functionalities in the applicant dashboard.

- [X] T097 Implement server-side search by `requestNumber` and filters by `statusId`, date range, amount range, and branch in `getDashboardData` service method per FR-015 (missing)
- [X] T098 Add query parameters (`search`, `status`, `startDate`, `endDate`, `minAmount`, `maxAmount`, `branch`) to `GET /payment-requests` in `applicant.controller.ts` per FR-015 (missing)
- [X] T099 Update `use-payment-requests.ts` hook to accept and pass search and filter parameters to the API per FR-015 (missing)
- [X] T100 Add search bar and filter controls (Status, Date Range, Amount Range, Branch) to `ApplicantDashboard.tsx` UI per Scenario 1 / REQ-033 / REQ-034 (missing)
- [X] T101 Implement 300ms debounce logic for all search and filter inputs in `ApplicantDashboard.tsx` per NFR-010 (missing)

---

## Phase 20: Convergence

**Purpose**: Fix search and filter UI layout issue based on user feedback.

- [X] T102 Redesign search and filter UI controls in `ApplicantDashboard.tsx` to use a dedicated filter section/grid instead of cramping them inline with the header, ensuring a premium responsive layout per REQ-034 (partial)
