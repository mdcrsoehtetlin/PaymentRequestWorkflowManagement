# Feature Specification: Accounting Dashboard

**Feature Branch**: `feature/accounting-dashboard`

**Created**: 2026-06-19

**Status**: Draft

**Input**: User description: "@[docs/core_ja/01_要件定義書_REQUIREMENT_SPEC.md] @[docs/detailed_design/04_accounting] @[docs/detailed_design/00_common] @[docs/screens/04_accounting_dashboard]"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View and Filter Approved Payment Request Queue (Priority: P1)

Accounting team members need to see a consolidated, real-time list of all payment requests that have been approved by the final approver, so they can process settlements efficiently.

**Why this priority**: Core entry point for the entire accounting workflow. Without the queue display, no payments can be selected or completed.

**Independent Test**: Log in as an `ACCOUNTING` user, navigate to `/accounting/dashboard` (or `/accounting`), and verify that the page displays the list of requests in `APPROVED` (status 8) status. Validate that search query and branch dropdown filters correctly update the displayed rows.

**Acceptance Scenarios**:

1. **Given** an authenticated user with `ACCOUNTING` role, **When** they load the dashboard, **Then** they see a table containing only active (non-deleted) payment requests in `APPROVED` status, sorted first by `desired_payment_date` (ascending), then `application_date` (ascending), and then `request_number` (ascending).
2. **Given** an active queue list, **When** the user types a request number (e.g., "PRF-2026-001"), applicant name, or amount range in the search query box, **Then** the list is filtered to display matching rows with a 300ms input debounce.
3. **Given** the queue list, **When** the user selects "Mandalay" from the Branch filter dropdown, **Then** the grid displays only requests submitted by applicants belonging to the Mandalay branch.

---

### User Story 2 - Request Detail Review and Branch Alerts (Priority: P1)

Accountants need to inspect all request headers, applicant information, bank details, breakdown tables, digital receipts, and approval history in a read-only detail view to audit and authorize the payment.

**Why this priority**: Required for compliance and validation. Accountants must verify that the information is correct and see special payment instructions before committing the payout.

**Independent Test**: Select a request from the queue, click its Request Number link or the "Process" button to open the Detail Modal. Verify that all fields are read-only, receipt links are available, and the branch-specific alert banner shows the correct message.

**Acceptance Scenarios**:

1. **Given** the detail view is opened for a request where the applicant's branch is "Mandalay", **When** the screen renders, **Then** the system displays a prominent Warning Alert (`ALR-01`) with a red background: `⚠️ IMPORTANT: Coordinate with Toe San for Cash Payment`.
2. **Given** the detail view is opened for a request where the applicant's branch is "Yangon", **When** the screen renders, **Then** the system displays a neutral Information Alert (`ALR-02`) with a blue background: `Standard Bank Transfer Processing`.
3. **Given** a request detail view is active, **When** the accountant reviews the sections, **Then** they see the complete read-only grid of breakdown items (1 to 15 items), clickable links to download/preview attached receipt files, and a historical timeline of all prior approval log entries with comments.

---

### User Story 3 - Complete Payment and Audit Log Commit (Priority: P1)

Accountants need to mark requests as "Paid (Completed)" to finish the settlement process and update the request status.

**Why this priority**: Critical path terminal state transition. Without this action, payment request lifecycles cannot be concluded.

**Independent Test**: Open the detail modal for an approved request, input an optional comment, click "Mark as Paid", confirm in the dialog box, and verify that the request's status changes to `PAID` (status 10), and that it is removed from the active pending queue.

**Acceptance Scenarios**:

1. **Given** a selected approved request, **When** the user inputs an optional processing comment (up to 500 characters) and clicks "Mark as Paid", **Then** the system prompts a confirmation modal: `Are you sure you want to mark payment request [Request Number] as Paid? This action cannot be undone.`
2. **Given** the confirmation is accepted, **When** the transaction executes, **Then** the system performs an atomic database transaction that updates the payment request status to `PAID` (10), sets the `payment_completed_date` and `accounting_user_id` in `payment_requests`, inserts an immutable entry into `approval_logs`, invalidates the Redis cache, and displays a success toast message.
3. **Given** an approved request is already being processed, **When** another accountant attempts to mark it as paid concurrently, **Then** the system returns an HTTP 409 Conflict, displays `The request status has changed. Please refresh the queue.`, and refreshes the list.

---

### User Story 4 - Real-Time Queue Synchronization (Priority: P2)

Accountants need the dashboard queue to refresh automatically when workflow updates occur, preventing duplicate processing or delayed actions.

**Why this priority**: Improves operational coordination and efficiency for concurrent users.

**Independent Test**: Open two browser sessions (one as Final Approver, one as Accountant). Approve a request in the Approver session and check if it instantly appears on the Accountant dashboard. Then, mark it as paid and check if it disappears from the dashboard.

**Acceptance Scenarios**:

1. **Given** a connected accounting dashboard session, **When** a Final Approver approves a payment request (transitioning status to 8), **Then** a WebSocket event `statusUpdate` is received, displaying a toast notification and appending the request to the active grid.
2. **Given** a connected accounting dashboard session, **When** another accountant marks a payment request as Paid (transition status to 10), **Then** a WebSocket event `row-removed` is received, removing the request row from the active grid.

---

### Edge Cases

- **Mismatched Totals**: If the sum of breakdown line item amounts does not equal the `total_amount` in the request header, the system must highlight the total amount in the detail panel with a warning icon, though the accountant may still proceed if manually verified.
- **Missing Receipt Files**: If `has_receipt = TRUE` but no files are attached (due to legacy data or upload failures), the summary card "Missing Receipts" count must increment, and a warning note must be shown next to the receipt attachment section in the modal.
- **Connection Drops**: If the WebSocket connection drops, the system must show a small indicator in the header ("Real-time updates disconnected") and fallback to polling every 60 seconds or manual refresh.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users with `ACCOUNTING` role to view the list of pending approved requests at base route `/accounting/dashboard` (frontend) and `/api/v1/accounting/payment-requests` (backend).
- **FR-002**: System MUST sort the approved queue by `desired_payment_date` ascending, then `application_date` ascending, and then `request_number` ascending.
- **FR-003**: System MUST support paginated responses (10 records per page) with search queries debounced by 300ms matching request number, applicant name, and branch.
- [x] **FR-004**: System MUST enforce Role-Based Access Control using JwtAuthGuard and RolesGuard on all endpoints.
- [x] **FR-005**: System MUST adhere to the premium enterprise dashboard aesthetic and exact Color Tokens from the Design System.
- [x] **FR-006**: System MUST meet Performance Targets (Dashboard Load < 2s, API Response P95 < 200ms, WebSocket delivery < 500ms).
- [x] **FR-007**: System MUST produce an immutable audit log (approval_logs) for every workflow state transition.
- [x] **FR-008**: System MUST comply with WCAG 2.1 AA accessibility requirements (contrast ratios, focus indicators, keyboard navigation, ARIA labels).
- **FR-009**: System MUST dynamically render alert banner `ALR-01` (`⚠️ IMPORTANT: Coordinate with Toe San for Cash Payment`) if applicant's branch is "Mandalay".
- **FR-010**: System MUST dynamically render alert banner `ALR-02` (`Standard Bank Transfer Processing`) if applicant's branch is NOT "Mandalay".
- **FR-011**: System MUST present a read-only detail view containing applicant profile, payment attributes (method, type, desired date, bank info), breakdown grid, receipt download links, and approval timeline.
- **FR-012**: System MUST enforce that all payment request core details are read-only for `ACCOUNTING` users; they cannot edit headers, line items, or attachments.
- **FR-013**: System MUST provide an optional textarea for payment comments (max 500 characters) to be captured during completion.
- **FR-014**: System MUST prompt a custom modal confirmation dialog before executing the payment completion action.
- **FR-015**: System MUST perform payment completion inside an atomic transaction updating the status to `PAID` (10), setting `payment_completed_date` and `accounting_user_id`, and writing the log to `approval_logs` containing IP address and user agent.
- **FR-016**: System MUST invalidate the Redis cache `payment_request:payload:{id}` immediately upon successful transaction commit.
- **FR-017**: System MUST broadcast a `statusUpdate` WebSocket event to the applicant's room and a `row-removed` WebSocket event to the `"Accounting"` room upon payment completion.

### Key Entities *(include if feature involves data)*

- **PaymentRequest**: Represents the core document entity. Filtered in the queue where `status_id = 8` (`APPROVED`) and `is_deleted = FALSE`. Status transitions to `10` (`PAID`) and records `payment_completed_date` and `accounting_user_id` on completion.
- **ApprovalLog**: Represents the immutable audit trail log. A new record is inserted upon payment completion referencing action type `PAYMENT_COMPLETED` (10), including transition states, user comment, IP address, and user agent.
- **User**: Represents the actors. Authenticated user must have role `ACCOUNTING`. Applicant user's branch is evaluated to trigger branch alert banners.
- **PaymentBreakdownItem**: Represents detail items contributing to the total sum. Displayed in the detail modal's read-only grid.
- **ReceiptFile**: Represents receipt documents uploaded to the server directory (`wwwroot/uploads/{PaymentRequestID}/`). Linked in the detail view for verification.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Page load time for the Accounting Dashboard is under 2 seconds.
- **SC-002**: Database updates and Redis cache eviction on payment completion execute in under 1 second (P95).
- **SC-003**: 100% of payment requests submitted by applicants from the Mandalay branch render the red Warning Banner (`ALR-01`) upon selection.
- **SC-004**: Real-time queue updates (appending new rows, removing paid rows) are received by active sessions within 500ms of status changes.
- **SC-005**: 100% of payment completions write an immutable record to the `approval_logs` database table.

## Assumptions

- **Existing Authentication**: The system uses a working JWT RS256 token verification pattern and role-based guards.
- **Configurable Branch Rules**: The branch name "Mandalay" and contact person "Toe San" are defined in configuration files and can be updated without rebuilding the application.
- **Local File System**: Uploaded receipt files are stored in `wwwroot/uploads/` and are accessible to authenticated sessions via HTTP endpoints.
- **Single Currency Queue**: Payment requests do not require multi-currency conversion or live exchange rates on this screen; amounts are displayed in their submitted currency.
