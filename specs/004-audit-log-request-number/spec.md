# Feature Specification: Audit Log Request Number Display

**Feature Branch**: `fix/audit-log-request-number`

**Created**: 2026-06-24

**Status**: Draft

**Input**: User description: "in auditlogs screen. request id search and showing in result column is wrong. it should be request number of paymentrequest table. and it should be searchable by request number not request id."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Search Audit Logs by Request Number (Priority: P1)

As an administrator, I want to search audit logs by request number (e.g., PR-2026-001) instead of internal payment request ID, so that I can easily find logs for specific requests that I'm familiar with.

**Why this priority**: This is the core issue - the current search uses an internal ID that administrators don't know. Request numbers are human-readable and used throughout the application.

**Independent Test**: Can be fully tested by entering a request number in the search field and verifying matching audit logs are returned.

**Acceptance Scenarios**:

1. **Given** the audit log screen is displayed, **When** I enter "PR-2026-001" in the request number search field, **Then** only audit logs for that specific request number are displayed
2. **Given** I enter a partial request number (e.g., "PR-2026"), **When** I search, **Then** audit logs matching that partial number are displayed
3. **Given** I enter a request number that doesn't exist, **When** I search, **Then** an empty result set is displayed with an appropriate message

---

### User Story 2 - Display Request Number in Audit Log Results (Priority: P1)

As an administrator, I want to see the human-readable request number (e.g., PR-2026-001) in the audit log results column instead of an internal ID, so that I can quickly identify which request each log entry belongs to.

**Why this priority**: This is the core display issue - showing "PRF-{internal_id}" is confusing when users expect to see the request number used elsewhere in the system.

**Independent Test**: Can be fully tested by viewing the audit log table and verifying the request number column shows formatted request numbers.

**Acceptance Scenarios**:

1. **Given** audit logs are displayed in the table, **When** I view the request number column, **Then** I see the request number from the payment_requests table (e.g., PR-2026-001)
2. **Given** audit logs are displayed, **When** I click on a row, **Then** the detail panel shows the request number

---

### Edge Cases

- What happens when a payment request record is deleted but audit logs still exist? The request number should display as "Unknown" or similar.
- How does system handle search with special characters in request number? The search should handle standard alphanumeric characters and hyphens.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Audit log search field MUST accept request number (e.g., PR-2026-001) instead of internal payment request ID
- **FR-002**: Audit log results table MUST display the request_number from the payment_requests table in the request column
- **FR-003**: Search MUST support partial matching on request number (e.g., searching "PR-2026" matches "PR-2026-001")
- **FR-004**: Backend API MUST accept requestNumber parameter instead of requestId for filtering
- **FR-005**: Backend API MUST return request_number in the response data
- **FR-006**: Audit log detail panel MUST display the request number

### Key Entities

- **Approval Log (audit_logs)**: Records all workflow state transitions, linked to payment requests via payment_request_id
- **Payment Request**: Contains both payment_request_id (internal PK) and request_number (human-readable unique identifier)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Administrators can search audit logs by request number in under 5 seconds
- **SC-002**: 100% of audit log entries display correct request numbers from the payment_requests table
- **SC-003**: Search results accurately filter by partial or complete request number matches

## Assumptions

- The request_number column exists and is populated in the payment_requests table
- Existing audit logs have valid payment_request_id references
- The UI label should change from "リクエストID" to "リクエスト番号" (Request Number)
- The "PRF-" prefix in the search field should be removed since request numbers already include their own prefix format
