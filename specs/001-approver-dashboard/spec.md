# Feature Specification: Final Approver Dashboard

**Feature Branch**: `001-approver-dashboard`

**Created**: 2026-06-19

**Status**: Draft

**Input**: User description: "/speckit-specify @[docs/core_ja] @[docs/detailed_design/03_approver] @[docs/detailed_design/00_common] @[docs/screens/03_approver_dashboard] @[docs/detailed_design/ARCHITECTURE_EXPLANATION.md]"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Pending Requests Queue & Start Review (Priority: P1)

As a Final Approver, I want to view a list of all payment requests awaiting my decision and automatically mark them as under review when I inspect them, so that I can manage my workload and keep other stakeholders informed of the review status.

**Why this priority**: Crucial entry point for the Approver role. Without listing pending requests, no approval actions can take place. Auto-transitioning to review status prevents duplicate efforts by other approvers.

**Independent Test**: Can be fully tested by querying the pending queue API endpoint (returning only requests in SUBMITTED_APPROVER or APPROVER_REVIEWING status) and clicking on a request in SUBMITTED_APPROVER status to verify that its status immediately transitions to APPROVER_REVIEWING in the database and audit logs.

**Acceptance Scenarios**:

1. **Given** that there are pending requests in the system, **When** I log in as a Final Approver and access the dashboard, **Then** I should see a paginated list containing Request Number, Applicant Name, Branch, Application Date, Total Amount, Desired Payment Date, and Current Status, sorted by application date ascending.
2. **Given** a request has the status "Submitted to Approver", **When** I open the request detail page, **Then** the system must automatically update its status to "Approver Reviewing", set the assignee to my user ID, record an `APPR_REVIEW_START` entry in the `approval_logs`, and broadcast a `statusUpdate` WebSocket event.

---

### User Story 2 - Approve Request (Priority: P2)

As a Final Approver, I want to approve a verified payment request, so that it is queued for payment by the Accounting department.

**Why this priority**: Represents the core primary workflow (happy path) to complete the approval phase and advance the request to the final payout stage.

**Independent Test**: Can be tested by clicking the "Approve" button on a request in "Approver Reviewing" status, confirming the action, and verifying that the status transitions to "Approved", the assignee is set to the Accounting group, and a corresponding audit log is created.

**Acceptance Scenarios**:

1. **Given** a payment request in "Approver Reviewing" status, **When** I click the "Approve" button and confirm the action, **Then** the request status must transition to "Approved", its assignee must become the Accounting queue (null individual assignee), and an `APPROVED` entry must be written to `approval_logs`.
2. **Given** a request has been successfully approved, **When** I return to the dashboard queue, **Then** the approved request must be evicted from my active pending queue.

---

### User Story 3 - Reject Request (Priority: P3)

As a Final Approver, I want to reject a payment request with a mandatory explanation comment, so that the Applicant knows why it was rejected and can make the necessary corrections.

**Why this priority**: Represents the primary alternate workflow (rejection flow) to handle incorrect requests and return them to the Applicant for editing.

**Independent Test**: Can be tested by attempting to reject a request, verifying that rejection is blocked without a comment of at least 10 characters, and verifying that upon successful rejection the request status becomes "Rejected by Approver" and is assigned back to the applicant.

**Acceptance Scenarios**:

1. **Given** a payment request in "Approver Reviewing" status, **When** I click the "Reject" button and input a rejection comment of less than 10 characters, **Then** the submission must be blocked and a validation error displayed.
2. **Given** a payment request in "Approver Reviewing" status, **When** I click "Reject" and input a comment of at least 10 characters, **Then** the request status must transition to "Rejected by Approver", the assignee must be set to the Applicant, and a `REJECTED_APPROVER` entry containing my comment must be appended to the `approval_logs`.

---

### Edge Cases

- **Optimistic Locking Conflict**: If another Approver has approved or rejected the request while the current Approver has the details page open, any subsequent action (approve/reject) must fail with a `CONFLICT` error (HTTP 409). The user must be shown a refresh notification and returned to the dashboard.
- **Invalid Initial Status**: If an Approver attempts to perform an approval or rejection on a request that is not in the `APPROVER_REVIEWING` status (e.g. still in `SUBMITTED_APPROVER` or already `APPROVED`), the system must throw a `ConflictException` and block the action.
- **Unauthorized Role Access**: If a user without the `APPROVER` role attempts to hit any of the Approver API endpoints, the system must return a `ForbiddenException` (HTTP 403) and deny access.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users with the `APPROVER` role to view a paginated list of payment requests in `SUBMITTED_APPROVER` or `APPROVER_REVIEWING` status.
- **FR-002**: System MUST automatically transition the request status from `SUBMITTED_APPROVER` to `APPROVER_REVIEWING` when the Final Approver opens the detail view of that request, assigning it to the current Approver.
- **FR-003**: System MUST render all request details (header, amounts, breakdown line-items, digital receipt attachments) as read-only for the Final Approver.
- **FR-004**: System MUST allow the Final Approver to approve a request in `APPROVER_REVIEWING` status, transitioning it to `APPROVED`, assigning it to the Accounting queue, and registering an audit log entry.
- **FR-005**: System MUST allow the Final Approver to reject a request in `APPROVER_REVIEWING` status, requiring a rejection comment of at least 10 characters, transitioning the request status to `REJECTED_APPROVER`, returning it to the Applicant, and registering an audit log entry.
- **FR-006**: System MUST enforce Role-Based Access Control using `JwtAuthGuard` and `RolesGuard` on all Approver API endpoints.
- **FR-007**: System MUST adhere to the premium enterprise dashboard aesthetic and exact Color Tokens from the Design System.
- **FR-008**: System MUST meet Performance Targets (Dashboard Load < 2s, API Response P95 < 200ms, WebSocket delivery < 500ms).
- **FR-009**: System MUST produce an immutable audit log (`approval_logs`) for every workflow state transition.
- **FR-010**: System MUST comply with WCAG 2.1 AA accessibility requirements (contrast ratios, focus indicators, keyboard navigation, ARIA labels).

### Key Entities *(include if feature involves data)*

- **User**: Represents users in the system (Applicants, Managers, Approvers, Accounting). Key attributes: `userId`, `username`, `fullName`, `roleId`, `branch`.
- **PaymentRequest**: The central workflow document. Key attributes: `paymentRequestId`, `requestNumber`, `totalAmount`, `currencyId`, `statusId`, `applicantUserId`, `managerUserId`, `finalApproverUserId`, `currentAssignedToUserId`, `desiredPaymentDate`, `purpose`.
- **PaymentBreakdownItem**: Individual expense lines. Key attributes: `paymentBreakdownItemId`, `paymentRequestId`, `lineNo`, `itemDate`, `description`, `amount`.
- **ReceiptFile**: Attached digital documents. Key attributes: `receiptFileId`, `paymentRequestId`, `originalFileName`, `fileStoragePath`, `fileSize`.
- **ApprovalLog**: Immutable audit logs. Key attributes: `approvalLogId`, `paymentRequestId`, `actionTakenByUserId`, `actionTypeId`, `previousStatusId`, `newStatusId`, `comment`, `ipAddress`, `userAgent`, `timestamp`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Approvers can load the pending queue dashboard in under 2 seconds.
- **SC-002**: System automatically updates status to "Approver Reviewing" on open within 1.5 seconds.
- **SC-003**: System processes approvals and rejections, committing the transaction and evicting Redis cache, within 1 second.
- **SC-004**: WebSocket status updates are delivered to target user rooms (Applicant, Accounting) within 500ms of database commit.
- **SC-005**: 100% of transitions write an immutable entry to `approval_logs` with complete audit metadata.
- **SC-006**: All interactive page elements achieve WCAG 2.1 AA compliance (e.g. contrast ratio >= 4.5:1, keyboard tab-order support).

## Assumptions

- Standard JWT RS256 token-based authentication and roles mapping are already functional.
- Receipt storage and temporary authenticated download links are provided by the shared infrastructure.
- Rejection comments are limited to 1000 characters.
- Mobile viewport support collapses the persistent left sidebar into an expandable hamburger menu and renders detail views full-screen.
