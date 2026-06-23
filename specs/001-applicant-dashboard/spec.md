# Feature Specification: Applicant Dashboard

**Feature Branch**: `feature/applicant-dashboard`

**Created**: 2026-06-19

**Status**: Draft

**Input**: User description: source files — PRWM-REQ-001 (Requirements), PRWM-DBS-001 (Database Spec), PRWM-FSD-SCR-001 (Functional Spec), PRWM-SIS-SCR-001 (Screen Items Spec)

## Clarifications

### Session 2026-06-22
- Q: Authentication method for Applicants? → A: Email/password (simple username/password login, JWT issued)
- Q: Retention period for user‑related data (FR‑007)? → A: 5 years (matches audit‑log minimum retention).
- Q: Should the receipt‑file naming convention be enforced server‑side? → A: Yes, enforce `{Description}_{Date}_{Seq}.{ext}` on upload; reject non‑conforming files.

---

## User Scenarios & Testing *(mandatory)*

<!-- PRIORITIZED by business value. Each scenario is independently testable as a viable partial feature. -->

### Scenario 1 — Applicant views and manages their payment request list *(highest priority)*

> **As an** authenticated Applicant,
> **I want to** see a consolidated, real-time list of all my payment requests with their current statuses,
> **so that** I can track the progress of every request at a glance without contacting anyone.

**Given** I am logged in with the `APPLICANT` role,
**When** I navigate to the Applicant Dashboard (`/applicant`),
**Then** I see a paginated data grid showing all my non-deleted payment requests sorted by status priority (ascending `display_order`) then by creation date (descending), displaying Request Number, Application Date, Total Amount, Currency, Status Badge, and Created Date.

**And** the KPI summary cards at the top show correct live counts:
- **Total Requests** — all non-deleted requests
- **Pending Review** — requests in statuses: Submitted to Manager, Manager Reviewing, Submitted to Approver, Approver Reviewing
- **Approved** — requests in statuses: Approved and Paid
- **Rejected** — requests in statuses: Rejected by Manager and Rejected by Approver

**Acceptance tests:**
- [ ] Dashboard loads within 2 seconds
- [ ] Only the authenticated applicant's own requests are visible (no other users' data)
- [ ] Status badges render with correct color coding
- [ ] KPI counts match the actual data in the grid
- [ ] Search by request number (e.g., "PRF-2026-001") filters the list correctly with 300ms debounce
- [ ] Status dropdown filter narrows the list correctly
- [ ] Date range filter narrows by creation date correctly
- [ ] **Filtering by total amount range works and respects the UI controls** (REQ‑033)
- [ ] **Filtering by applicant’s branch works** (REQ‑034)
- [ ] Pagination controls work; default page size is 10 rows
- [ ] Display "No requests found on this page" empty state if navigating past the last page or if 0 requests exist

---

### Scenario 2 — Applicant creates a new payment request and saves it as a draft

> **As an** Applicant,
> **I want to** create a new payment request form and save it as a draft,
> **so that** I can prepare my request incrementally before formal submission.

**Given** I am on the Applicant Dashboard,
**When** I click "+ Create New Request" and fill in the Payment Request form, the form now includes the following **mandatory** fields (REQ‑002A):
	- Desired Payment Date (支払希望日) – must be today or later.
	- Currency Type (通貨選択) – mandatory dropdown (e.g., MMK, USD, JPY).
	- Payment Type (支払タイプ) – mandatory dropdown.
	- Payment Method (支払方法) – mandatory dropdown (Bank Transfer, Cash, Check).
	- Purpose / Usage (用途) – maximum 255 characters.
	- Payment Request Content (支払申請内容) – maximum 1000 characters.
	- Receipt Present (領収書の有無) – Yes/No radio.
	- Target Manager – live dropdown of active users with the MANAGER role (required for submission).
**Then** a new record is saved with status `DRAFT` and a system‑generated request number in format `PRF-YYYY-NNNNNN`.

**And** the system auto-populates my Employee Number, Full Name, Branch, and Department from my profile.
**And** the Total Payment Amount is auto‑calculated as the sum of all breakdown line item amounts (manual override is not possible). Each breakdown line item amount must be > 0 and ≤ 1,000,000,000.
**And** an `CREATED` entry is written to the approval log.

**Acceptance tests:**
- [ ] Employee info fields are pre-populated and read‑only
- [ ] Total Amount auto‑calculates in real‑time as breakdown amounts are entered
- [ ] Save Draft succeeds with relaxed validation (Only basic auth/user identity fields are mandatory; all functional fields are optional until submission)
- [ ] Request number is generated in `PRF-YYYY-NNNNNN` format (Sequence resets to 000001 at the start of every calendar year)
- [ ] Breakdown table accepts 1–15 rows; "Add Row" is disabled at 15; "Remove Row" is disabled at 1
- [ ] At least one breakdown line item is required on draft save
- [ ] `CREATED` audit log entry appears in approval history timeline after save
- [ ] Application Date defaults to today and cannot be set to a future date
- [ ] Desired Payment Date must be today or a future date
- [ ] Currency Type field must be selected before the request can be submitted
- [ ] Payment Type field must be selected before the request can be submitted
- [ ] Payment Method field must be selected before the request can be submitted
- [ ] When Payment Method is "Bank Transfer" or "Cash", Bank Account / Phone field is shown and mandatory; hidden otherwise
- [ ] Receipt Present radio must be chosen; if "Yes", at least one receipt file is required at submission time
- [ ] Target Manager dropdown must have a selection before submission

---

### Scenario 3 — Applicant submits a payment request to the Manager

> **As an** Applicant,
> **I want to** submit my completed draft to a Manager for verification,
> **so that** the approval workflow begins.

**Given** I have a payment request in `DRAFT` or `REJECTED_MANAGER` or `REJECTED_APPROVER` status,
**When** I click "Submit to Manager" after selecting a target manager,
**Then** the status transitions to `SUBMITTED_MANAGER`, the selected manager is notified via real-time notification, and a `SUBMITTED` audit log entry is recorded.

**And** I cannot submit unless all mandatory fields pass strict validation (including receipt attachment when "Receipt Present = Yes").

**Acceptance tests:**
- [ ] Submission blocked if any mandatory field is missing or invalid
- [ ] Submission blocked if `has_receipt = TRUE` but zero active receipt files are attached
- [ ] Submission blocked if no manager is selected from the dropdown
- [ ] Submission blocked if the previously selected Target Manager is no longer active; the UI must prompt the applicant to select a new active manager
- [ ] On success: status changes to `SUBMITTED_MANAGER`, row refreshes in the list, success toast shown
- [ ] If submission fails (e.g., server error or network timeout), a red error toast is displayed and the form remains in its editable state
- [ ] Manager receives a real-time WebSocket notification within 500ms
- [ ] `SUBMITTED` audit log entry contains the correct `previous_status_id` and `new_status_id`
- [ ] Desired Payment Date must be today or a future date
- [ ] Form becomes read-only immediately after successful submission
- [ ] Once submitted, the request is locked. The Applicant cannot recall it; the Manager must Reject it to return it to draft state

---

### Scenario 4 — Applicant uploads and manages receipt files

> **As an** Applicant,
> **I want to** attach receipt files to my payment request,
> **so that** reviewers can verify the expense evidence.

**Given** I have a payment request in an editable state (`DRAFT`, `REJECTED_MANAGER`, or `REJECTED_APPROVER`),
**When** I upload a receipt file via the drag-and-drop zone or file picker,
**Then** the file is stored and its metadata is saved, and it appears in the attached files list.

**Acceptance tests:**
- [ ] Accepted MIME types: PDF, PNG, JPG, JPEG only (all others are rejected with a clear error)
- [ ] Maximum file size: 10 MB per file; 50 MB total per request
- [ ] Uploaded file appears immediately in the list with its name and size
- [ ] Soft-delete of a receipt file removes it from the list (file is retained on disk, marked `is_deleted = TRUE`)
- [ ] Receipt upload zone is hidden when `has_receipt = FALSE`
- [ ] Both form fields and the receipt upload area must be completely disabled/hidden in non-editable states
- [ ] If upload fails (e.g., network timeout), show a red toast error message, and automatically remove the failed file from the UI list so they can try again

---

### Scenario 5 — Applicant submits a Manager-Verified request to the Final Approver

> **As an** Applicant,
> **I want to** forward my Manager-Verified request to the Final Approver,
> **so that** the second level of approval can begin.

**Given** my payment request is in `MANAGER_VERIFIED` status,
**When** I click "Submit to Final Approver",
**Then** the status transitions to `SUBMITTED_APPROVER` and the Final Approver is notified in real-time.

**Acceptance tests:**
- [ ] "Submit to Final Approver" button is visible ONLY when `status_id = 4` (Manager Verified)
- [ ] No additional field re-validation is required for this transition
- [ ] Status changes to `SUBMITTED_APPROVER` after click
- [ ] Approver room receives a real-time WebSocket `statusUpdate` event
- [ ] `SUBMITTED` audit log entry is recorded with correct status transition

---

### Scenario 6 — Applicant views rejection comments and edits/resubmits a rejected request

> **As an** Applicant,
> **I want to** see why my request was rejected and resubmit a corrected version,
> **so that** the workflow can continue.

**Given** my payment request is in `REJECTED_MANAGER` or `REJECTED_APPROVER` status,
**When** I open the request,
**Then** the approval history timeline shows the rejection comment and all previous actions.
**And** I can edit the request fields, breakdown items, and receipt files.
**And** when resubmitting from `REJECTED_APPROVER`, the entire approval chain restarts from the Manager.

**Acceptance tests:**
- [ ] Rejection comment is prominently displayed in the approval history timeline
- [ ] All header fields and breakdown items are editable in rejected states
- [ ] Resubmission from `REJECTED_MANAGER` transitions to `SUBMITTED_MANAGER`
- [ ] Resubmission from `REJECTED_APPROVER` transitions to `SUBMITTED_MANAGER` (full workflow restart)
- [ ] `EDITED` audit log entry is recorded on save
- [ ] `SUBMITTED` audit log entry is recorded on resubmission
- [ ] Applicant can add a reply comment via an “Add Comment” box; the comment is saved and appears in the approval‑history timeline immediately

---

### Scenario 7 — Applicant soft-deletes a draft request

> **As an** Applicant,
> **I want to** delete a draft request I no longer need,
> **so that** my request list stays clean.

**Given** my payment request is in `DRAFT` status,
**When** I click "Delete Draft" and confirm in the modal dialog,
**Then** the request is soft-deleted (`is_deleted = TRUE`) and disappears from my list.

**Acceptance tests:**
- [ ] "Delete Draft" button is visible ONLY when `status_id = 1` (Draft)
- [ ] A confirmation modal appears before deletion (no browser `confirm()` dialogs)
- [ ] After confirmation: request is removed from the list, success toast is shown
- [ ] The record is not physically deleted; it is excluded from all normal queries via `is_deleted = FALSE` filter
- [ ] Deletion is blocked (button hidden) for any status other than Draft
- [ ] Soft-delete the attached receipt files as well (`is_deleted = true`), keeping them on disk for audit purposes

---

### Scenario 8 — Applicant receives real-time status notifications

> **As an** Applicant,
> **I want to** be notified immediately when a reviewer takes action on my request,
> **so that** I can respond without having to manually refresh the page.

**Given** I am connected to the Applicant Dashboard,
**When** a Manager or Approver takes action on one of my requests,
**Then** a toast notification appears and the request list auto-refreshes to show the updated status.

**Acceptance tests:**
- [ ] Toast notification appears within 500ms of the remote status change
- [ ] Request list row updates to the new status automatically without a full page reload
- [ ] WebSocket reconnection is handled gracefully with silent exponential backoff
- [ ] On reconnect: a full background re-fetch of the requests list is triggered to catch up on missed events

---

## Functional Requirements *(mandatory)*

- **FR-001**: Applicant can view all their non-deleted payment requests in a paginated, sortable, and filterable list.
- **FR-002**: Applicant can create a new payment request, filling in all required fields including up to 15 breakdown line items, and save it as a Draft.
- **FR-003**: Applicant can upload receipt files (PDF, PNG, JPG/JPEG) with per‑file limit of 10 MB and a 50 MB aggregate per‑request limit. Uploaded files must follow the naming convention `{Description}_{Date}_{Seq}.{ext}`; the server validates this pattern and rejects non‑conforming uploads. Files are stored via an abstract storage service to allow future migration to cloud storage (AWS S3, Azure Blob, etc.).
- **FR-004**: System MUST authenticate Applicants via email/password login, issuing a JWT for session management.
- **FR-005**: System MUST adhere to the premium enterprise dashboard aesthetic and exact Color Tokens from the Design System (status badge colors, typography with Inter font, modal dialogs for confirmations).
- **FR-006**: System MUST meet Performance Targets (Dashboard Load < 2s, API Response P95 < 200ms, WebSocket delivery < 500ms).
- **FR-007**: System MUST produce an immutable audit log (`approval_logs`) for every workflow state transition and editing action.
- **FR-008**: System MUST retain user‑related data for a minimum of 5 years (aligned with audit‑log retention requirements).
- **FR-009**: Applicant can submit a Draft or Rejected request to a Manager (selected from a live dropdown of active Manager-role users), transitioning status to `SUBMITTED_MANAGER`.
- **FR-010**: Applicant can submit a `MANAGER_VERIFIED` request to the Final Approver, transitioning status to `SUBMITTED_APPROVER`.
- **FR-011**: Applicant can view a chronological approval history timeline for each request, showing actor, action type, timestamp (UTC → local), and comment.
- **FR-012**: Applicant can soft-delete their own `DRAFT` requests only (other statuses are locked from deletion).
- **FR-013**: Total Payment Amount is auto-calculated from breakdown line items; manual input of the total is forbidden.
- **FR-014**: System enforces all field-level validation rules: Application Date ≤ today, Desired Payment Date ≥ today, Bank Account Info required for Bank Transfer / Cash payment methods, receipt file required when `has_receipt = TRUE` at submission time.
- **FR-015**: Search, filter (by status, date range), and paginate the request list (server-side, 10 per page default).
- **FR-016**: Applicant receives real-time WebSocket push notifications when their requests' statuses change; the list auto-refreshes without a page reload.

---

## Non-Functional Requirements *(mandatory)*

- **NFR-001**: Dashboard initial load time ≤ 2 seconds (Lighthouse measure).
- **NFR-002**: Primary list API query response (P95) < 200ms for datasets up to 10,000 records.
- **NFR-003**: WebSocket status update delivery ≤ 500ms from server-side state change to client toast display.
- **NFR-004**: Receipt file search/filter query results returned within ≤ 3 seconds.
- **NFR-005**: System is responsive: Desktop (≥ 1024px) full dual-pane layout; Tablet (768–1023px) single-column collapsible; Mobile (< 768px) accordion stacked layout.
- **NFR-006**: Audit logs are immutable (protected by DB trigger); retained for minimum 5 years.
- **NFR-007**: Redis cache used for master lookup tables (24h TTL) and request payloads (10min TTL, evicted on state transition). If Redis is temporarily down, the system MUST fall back to querying the primary PostgreSQL database directly to remain available.
- **NFR-008**: All timestamps stored in UTC; timezone conversion performed in the presentation layer.
- **NFR-009**: Breakdown amount fields handled as `string` in JS/TS to avoid floating-point precision loss (NUMERIC(12,2) → string).
- **NFR-010**: 300ms debounce on search/filter inputs.

---

## Success Criteria *(mandatory)*

1. **Applicants can complete a full submission workflow end-to-end** — from creating a draft to submitting to a Manager — in under 5 minutes for a standard 3-line request. (Measurable via automated telemetry or QA stopwatch from "create" click to success toast).
2. **All applicant payment requests are visible and accurately tracked** — no request is lost, duplicated, or visible to another user.
3. **Status changes are visible without page refresh** — within 1 second of a reviewer taking action on any of the applicant's requests.
4. **Rejection handling enables timely resubmission** — applicants can view, edit, and resubmit a rejected request in a single session.
5. **Receipt compliance is enforced** — 100% of requests submitted with `has_receipt = TRUE` have at least one attached file.
6. **Audit trail is complete** — every state transition and editing action produces an audit log entry with actor identity, timestamps, and comments.
7. **System uptime > 99%** — Dashboard remains available to applicants during business hours.

---

## Key Entities *(data model)*

| Entity | DB Table | Description |
|---|---|---|
| Payment Request | `payment_requests` | Primary entity representing one payment request through its full lifecycle. |
| Payment Breakdown Item | `payment_breakdown_items` | 1–15 line items belonging to a payment request; their amounts sum to `total_amount`. |
| Receipt File | `receipt_files` | Uploaded file metadata linked to a payment request; physically stored in `/uploads/{id}/`. |
| Approval Log | `approval_logs` | Immutable audit record of every state transition and action; BIGSERIAL PK; protected by DB trigger. |
| User | `users` | Applicant identity source (employee number, name, branch, department, role). |
| Payment Status | `payment_statuses` | Lookup table defining workflow statuses, their editability, and display order. |
| Currency | `currencies` | Lookup table of approved currencies (MMK, USD, JPY, THB). |
| Payment Type | `payment_types` | Lookup table of payment types (Expense Reimbursement, Service Payment, etc.). |
| Payment Method | `payment_methods` | Lookup table of payment methods (Bank Transfer, Cash, Check). |
| Approval Action Type | `approval_action_types` | Lookup table of action codes used in audit logs (CREATED, EDITED, SUBMITTED, etc.). |

---

## Assumptions *(documented defaults)*

1. **Branch-specific alert logic (Mandalay rule)** is scoped to the Accounting dashboard, not the Applicant Dashboard — this feature spec does not implement it.
2. **Manager dropdown** lists all users with `role_code = 'MANAGER'` and `is_active = TRUE`; no branch-scoped filtering is applied at this stage.
3. **Paper receipt submission** (物理領収書) tracking is out of scope for this feature; only digital file uploads are handled.
4. **Email notifications** are out of scope; only WebSocket push notifications are implemented.
5. **File naming convention** guidance (matching breakdown descriptions) is a UI hint/tooltip, not a system-enforced constraint.
6. **Draft save** does not require all mandatory fields to be present (relaxed validation mode); submission does (strict validation mode).
7. **Optimistic concurrency locking** is implemented via `modified_date` comparison; a conflict returns HTTP 409. The UI will show a modal dialog: "This request was modified in another session. Please refresh the page to see the latest version."
8. **The Applicant Dashboard SPA route** is `/applicant`; form/detail view is `/applicant/requests/:id`.

---

## Scope Boundaries

**In scope:**
- All 10 use cases defined in PRWM-FSD-SCR-001 (UC-APP-001 through UC-APP-010)
- All screen sections A–F8 defined in PRWM-SIS-SCR-001
- All backend API endpoints under `/api/v1/applicant/`
- Real-time WebSocket events sent and received by the Applicant

**Out of scope:**
- Manager Dashboard, Approver Dashboard, Accounting Dashboard, Admin Panel
- Mandalay branch cash payment alert (Accounting feature)
- Email notifications
- Advanced reporting / PDF export
- Paper receipt physical tracking
- External banking system integration
