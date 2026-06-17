# DD_MANAGER_06 — Test Specification

> **Doc ID:** PRWM-DD-MGR-07 | **Version:** 1.0 | **Status:** Released  
> **Last Updated:** 2026-06-16

---

## 1. Overview

This document defines the comprehensive testing strategy for the Manager Module, covering Unit Tests, Component Tests, Integration Tests, and End-to-End (E2E) Scenarios.

---

## 2. Backend Unit Tests (`src/modules/manager/tests/`)

### 2.1 `manager.service.spec.ts`

Mock dependencies: `Repository<PaymentRequest>`, `Repository<ApprovalLog>`, `Repository<User>`, `DataSource` (for transactions), `WebsocketGateway`, `FileStorageService`.

| Test Suite | Scenario | Expected Outcome |
|------------|----------|------------------|
| **getQueueRequests** | Valid managerId, page=1, pageSize=10 | Returns paginated ManagerQueueItem[], metrics object with counts by status |
| **getQueueRequests** | Filter by statusId=2 (SUBMITTED_MANAGER) | Returns only pending requests, count reflects filtered results |
| **getQueueRequests** | Filter by branch="Yangon" | Joins with User table, returns only applicants from Yangon |
| **getQueueRequests** | Search by "PRF-2026-001" | ILIKE query finds request by number |
| **getQueueRequests** | Sort by submittedDate ASC (default) | Oldest requests appear first (priority view) |
| **getQueueRequests** | Invalid sort field | Throws `BadRequestException` (SQL injection prevention) |
| **getQueueRequests** | pageSize > 100 | Throws `BadRequestException` (max 100 records) |
| **getRequestDetails** | Valid requestId, manager owns request | Returns full ManagerPaymentRequestDetailDto with signed download URLs |
| **getRequestDetails** | Status is SUBMITTED_MANAGER (2) | Auto-transitions to MANAGER_REVIEWING (3), logs action atomically |
| **getRequestDetails** | Status is MANAGER_REVIEWING (3) | No transition, returns current state |
| **getRequestDetails** | Manager does not own request | Throws `OwnershipException` (403) |
| **getRequestDetails** | Request not found | Throws `NotFoundException` (404) |
| **verifyRequest** | Valid VerifyRequestDto, status=3, modifiedDate matches | Updates status to 4, inserts ApprovalLog, fires WebSocket notification |
| **verifyRequest** | modifiedDate mismatch (concurrency conflict) | Throws `ConflictException` with errorCode `ERR-MGR-409` |
| **verifyRequest** | Optional comment < 500 chars | Saves successfully with comment in ApprovalLog |
| **verifyRequest** | Status is not MANAGER_REVIEWING (3) | Throws `BusinessRuleException` (cannot verify if not reviewing) |
| **verifyRequest** | Manager does not own request | Throws `OwnershipException` (403) |
| **rejectRequest** | Valid RejectRequestDto, status=3, comment ≥ 10 chars | Updates status to 5, inserts ApprovalLog with comment, fires notification |
| **rejectRequest** | Comment < 10 chars | Throws `BadRequestException` with errorCode `VAL-MGR-002` |
| **rejectRequest** | Comment > 500 chars | Throws `BadRequestException` with errorCode `VAL-MGR-001` |
| **rejectRequest** | Comment is empty/whitespace only | Throws `BadRequestException` (VAL-MGR-002) |
| **rejectRequest** | modifiedDate mismatch | Throws `ConflictException` with errorCode `ERR-MGR-409` |
| **rejectRequest** | Status is not MANAGER_REVIEWING (3) | Throws `BusinessRuleException` |
| **getMetricsSummary** | Valid managerId, default periodDays=7 | Returns ManagerMetricsDto with counts and averages |
| **getMetricsSummary** | Pending count calculation | Correctly counts records with statusId=2 |
| **getMetricsSummary** | Verified count (last 7 days) | Counts ApprovalLog entries with actionType='MANAGER_VERIFIED' and actionDate ≥ 7 days ago |
| **getMetricsSummary** | Overdue count (> 48 hours) | Counts records with status=2 and submittedToManagerDate older than 48 hours |
| **getMetricsSummary** | Average processing time | Calculates (AVG modifiedDate - submittedToManagerDate) / 60 for verified/rejected requests |

### 2.2 `verification.service.spec.ts`

Mock dependencies: `PaymentRequestRepository`, `ApprovalLogRepository`, `WebsocketGateway`.

| Test Suite | Scenario | Expected Outcome |
|------------|----------|------------------|
| **performVerification** | Valid parameters, transaction succeeds | Status updated, log created, notifications sent (in order) |
| **performVerification** | DB transaction fails (deadlock) | Throws `DatabaseException`, no state change |
| **performRejection** | Valid parameters, comment validated | Status updated to 5, comment stored in ApprovalLog |
| **performRejection** | WebSocket notification fails | Logs error, does not throw (notification is best-effort) |
| **autoTransitionToReviewing** | Status is SUBMITTED_MANAGER (2) | Updates to MANAGER_REVIEWING (3), creates log atomically |
| **autoTransitionToReviewing** | Status is already MANAGER_REVIEWING (3) | No change, no duplicate log entry |

### 2.3 `manager.controller.spec.ts`

Mock dependencies: `ManagerService`, `Request` object with user context.

| Test Suite | Scenario | Expected Outcome |
|------------|----------|------------------|
| **GET /queue** | Valid JWT, user is MANAGER | Returns `200 OK` with paginated queue data |
| **GET /queue** | User is APPLICANT (wrong role) | Returns `403 Forbidden` (RolesGuard) |
| **GET /queue** | Missing JWT token | Returns `401 Unauthorized` (JwtAuthGuard) |
| **GET /:id** | Valid requestId, manager owns it | Returns `200 OK` with full request details |
| **GET /:id** | User is not manager or owns different request | Returns `403 Forbidden` (ManagerOwnershipGuard) |
| **POST /:id/verify** | Valid payload, all guards pass | Calls `verificationService.performVerification`, returns `200 OK` |
| **POST /:id/verify** | Comment > 500 chars | DTO validation fails, returns `400 Bad Request` |
| **POST /:id/verify** | modifiedDate mismatch | Service throws `ConflictException`, returns `409 Conflict` |
| **POST /:id/reject** | Valid payload, comment ≥ 10 chars | Calls `verificationService.performRejection`, returns `200 OK` |
| **POST /:id/reject** | Comment < 10 chars | DTO validation fails, returns `400 Bad Request` (VAL-MGR-002) |
| **GET /metrics/summary** | Valid managerId | Returns `200 OK` with metrics object |

---

## 3. Frontend Component Tests (`src/pages/manager/components/`)

Using Vitest + React Testing Library.

### 3.1 `RequestQueueTable.test.tsx`

| Scenario | Expected Outcome |
|----------|------------------|
| Render rows from props | Displays 10 rows with correct columns: Request No, App Date, Applicant, Branch, Amount, Status, Elapsed Time |
| Row click | Calls `onRowClick(requestId)` callback |
| Status badge coloring | SUBMITTED_MANAGER = yellow, MANAGER_REVIEWING = blue, MANAGER_VERIFIED = green, REJECTED_MANAGER = red |
| Elapsed time formatting | Display "2h 30m" for 150 minutes, "1d 5h" for 1 day 5 hours |
| Elapsed time priority indicator | Shows red dot if elapsed > 24 hours AND status = SUBMITTED_MANAGER |
| Empty state | "No requests found" message when data is empty |
| Sorting | Clicking column header calls `onSort(field)` callback with correct field name |
| Pagination controls | "Previous" button disabled on page 1, "Next" disabled on last page |

### 3.2 `QueueMetricsRow.test.tsx`

| Scenario | Expected Outcome |
|----------|------------------|
| Render 4 metric cards | Displays Pending, Reviewing, Verified, Rejected counts |
| Card click | Clicking a card filters table to that status (calls `onStatusFilter`) |
| Loading state | Shows skeleton loaders while metrics are being fetched |
| Update metrics | When props.metrics change, display updates correctly |
| Color consistency | Status colors match StatusBadge colors |

### 3.3 `FilterSearchBar.test.tsx`

| Scenario | Expected Outcome |
|----------|------------------|
| Status dropdown change | Calls `onStatusChange(statusId)` with selected value |
| Branch dropdown change | Calls `onBranchChange(branch)` with selected value |
| Search input keystroke | Debounces 300ms, then calls `onSearch(query)` |
| Clear filters button | Resets status, branch, search to default/null values |
| Refresh button click | Calls `onRefresh()` to force API re-request |

### 3.4 `DetailPanel.test.tsx`

| Scenario | Expected Outcome |
|----------|------------------|
| Render request data | Displays applicant info, payment details, breakdown table, receipt files (read-only) |
| Receipt file preview | For PDF files, shows inline preview using PDF viewer; for images, shows inline image |
| Close button | Calls `onClose()` callback, clears detail state |
| Verify button disabled | While `isVerifying` true (shows spinner) |
| Reject button disabled | While `isRejecting` true (shows spinner); also disabled if comment < 10 chars |
| Comment error display | Shows red error text if comment < 10 chars when attempting to reject |
| Download file link | Clicking file generates download with signed URL |
| Approval history expandable | Clicking "History" section expands/collapses timeline |

### 3.5 `VerificationForm.test.tsx`

| Scenario | Expected Outcome |
|----------|------------------|
| Render form | Shows comment textarea, Verify button, Reject button, Close button |
| Comment input keystroke | Real-time character counter shows current length / 500 |
| Comment validation (real-time) | If length > 500, textarea border turns red, Verify button disabled |
| Verify button click | Calls `onVerify({ comment, modifiedDate })`, shows loading spinner |
| Reject button click | If comment < 10 chars, shows inline error (no API call) |
| Reject button click | If comment ≥ 10 chars, calls `onReject({ comment, modifiedDate })`, shows loading spinner |
| Error toast | On API error, displays toast with error message and error code |
| Success toast | On verify/reject success, displays success toast with message |

### 3.6 `ManagerDashboard.test.tsx`

| Scenario | Expected Outcome |
|----------|------------------|
| Initial load | Fetches queue data and metrics, renders table and metrics cards |
| WebSocket connection | Establishes connection on mount, listens for `statusUpdate` and `queueChange` events |
| Receive statusUpdate event | Queue list updates (removes row if status changed), toast shown, metrics refreshed |
| Row selection | Clicking row loads detail panel, detail panel displayed on right (desktop) or modal (mobile) |
| Verify/Reject workflow | After action, detail panel closes, queue refreshes, success toast shown |
| Real-time queue update | New request assigned via WebSocket displays immediately (no refresh needed) |

---

## 4. Integration Tests (`src/modules/manager/tests/integration/`)

### 4.1 `manager-workflow.integration.spec.ts`

**Setup:** Use real database (test DB) with seeded data. Real HTTP requests to test server.

| Test Scenario | Description | Expected Outcome |
|---|---|---|
| **Full Verify Workflow** | 1. Manager logs in<br>2. GET /queue (retrieves pending requests)<br>3. GET /:id (opens request, auto-transitions to REVIEWING)<br>4. POST /:id/verify with comment<br>5. GET /queue (request removed from pending) | All operations succeed in sequence. ApprovalLog captures all transitions. Applicant WebSocket event received. |
| **Full Reject Workflow** | 1. Open request in SUBMITTED_MANAGER<br>2. POST /:id/reject with 10+ char comment<br>3. GET /:id (verify new status)<br>4. GET /queue (request status updated) | Rejection logged. Comment stored. Applicant notified. Request returned to applicant queue (visible in applicant dashboard). |
| **Concurrency Conflict** | 1. Manager A opens request (modifiedDate = 10:00)<br>2. Applicant edits request (modifiedDate = 10:05)<br>3. Manager A attempts to verify with old modifiedDate (10:00)<br>4. System detects mismatch | Manager A receives `409 Conflict` with error code `ERR-MGR-409`. Queue automatically refreshes. Manager A must re-open request to verify with new timestamp. |
| **Metrics Accuracy** | 1. Seed 50 requests with mixed statuses<br>2. GET /metrics/summary<br>3. Verify counts match manual count | pendingCount, reviewingCount, verifiedCount, rejectedCount all accurate. Average processing time calculated correctly. Overdue count accurate. |
| **Data Integrity** | 1. Verify request<br>2. Check ApprovalLog entry exists<br>3. Check modifiedDate updated<br>4. Check applicant notification sent | All data changes transactional. No partial updates. ApprovalLog immutable. |

### 4.2 `manager-authorization.integration.spec.ts`

| Test Scenario | Expected Outcome |
|---|---|
| Manager accessing own request queue | Returns 200 with assigned requests only |
| Manager accessing request assigned to another manager | Returns 403 Forbidden |
| Applicant attempting manager endpoints | Returns 403 Forbidden (RolesGuard) |
| Expired JWT token | Returns 401 Unauthorized |
| JWT token for deleted user | Returns 401 Unauthorized (on token refresh) |

### 4.3 `manager-notifications.integration.spec.ts`

Using test WebSocket client connected to same room.

| Test Scenario | Expected Outcome |
|---|---|
| Verify sends statusUpdate to applicant | Applicant WebSocket client receives payload with newStatus='MANAGER_VERIFIED' |
| Reject sends statusUpdate with comment | Applicant receives rejection reason in comment field |
| New request assignment broadcasts to MANAGERS room | All connected managers receive queueChange event |
| Multiple concurrent managers broadcast order | Events arrive in order of transaction commit |

---

## 5. End-to-End (E2E) Scenarios (Playwright)

### 5.1 `E2E-MGR-01: Happy Path - Verify Request`

**Precondition:** Request exists with status=SUBMITTED_MANAGER, assigned to test manager.

**Steps:**
1. Login as manager (test-manager@example.com)
2. Navigate to `/manager/dashboard`
3. View queue metrics (verify Pending count > 0)
4. Click first row in pending queue (request PRF-2026-001)
5. Verify detail panel loads with:
   - Applicant name, branch, amount visible
   - Breakdown table displayed
   - Receipt files downloadable
   - Approval history showing prior actions
6. Add optional comment: "Verified after review"
7. Click "Verify" button
8. Verify success toast appears: "申請を承認しました"
9. Verify detail panel closes
10. Verify row removed from queue table
11. Verify Verified count incremented in metrics

**Expected Outcome:** Request status changes to MANAGER_VERIFIED (4). Applicant receives WebSocket notification. Manager dashboard updates in real-time.

---

### 5.2 `E2E-MGR-02: Reject Request with Mandatory Comment`

**Precondition:** Request exists with status=SUBMITTED_MANAGER.

**Steps:**
1. Open request detail (auto-transitions to MANAGER_REVIEWING)
2. Enter insufficient comment (e.g., "short")
3. Click "Reject" button
4. Verify inline error appears below comment field: "Comment is required and must be at least 10 characters long..."
5. Expand comment to: "領収書が不足しています。詳細な内訳を添付してください。"
6. Click "Reject" button
7. Verify success toast: "申請を差し戻しました"
8. Verify request removed from queue
9. Verify Rejected count incremented
10. Check applicant dashboard: request now shows "Rejected by Manager" with comment visible

**Expected Outcome:** Rejection recorded with comment. Applicant can edit and resubmit. Manager comment immutable in audit log.

---

### 5.3 `E2E-MGR-03: Concurrency Conflict Detection`

**Precondition:** Two browser windows, both logged in as same manager.

**Steps:**
1. Window A: Open request detail (auto-transitions to MANAGER_REVIEWING)
2. Window B: Use Applicant account to edit and resubmit same request
3. Window A: Attempt to verify request
4. Verify warning modal appears: "This request's status has changed since it was loaded. The list will now refresh."
5. Click "OK" on modal
6. Verify queue automatically refreshes
7. Verify request no longer in SUBMITTED_MANAGER status

**Expected Outcome:** Concurrency conflict detected via modifiedDate mismatch. Manager prevented from applying stale action. Queue refreshed to reflect current state.

---

### 5.4 `E2E-MGR-04: Search and Filter Queue`

**Precondition:** Multiple requests in queue with different statuses, branches, amounts.

**Steps:**
1. View dashboard with full queue
2. Filter by branch="Yangon"
3. Verify table shows only Yangon applicants
4. Search for request number "PRF-2026-005"
5. Verify table displays only matching request
6. Filter by status="Verified"
7. Verify table shows verified requests only
8. Clear filters
9. Verify full queue restored

**Expected Outcome:** Filters work independently and in combination. Pagination resets on filter change. Results accurate.

---

### 5.5 `E2E-MGR-05: Real-Time Queue Updates**

**Precondition:** Manager dashboard open, applicant in separate browser/window.

**Steps:**
1. Manager viewing queue with 5 pending requests
2. Applicant submits new request to this manager
3. Verify new request appears in manager's queue within 1 second (no refresh needed)
4. Verify pending count auto-increments
5. Applicant edits and resubmits a rejected request
6. Verify request reappears in manager's pending queue
7. Manager verifies a request
8. Verify request status updates in real-time (if other managers viewing shared queue)

**Expected Outcome:** WebSocket notifications propagate in real-time. Dashboard updates without manual refresh. User experience is responsive and current.

---

### 5.6 `E2E-MGR-06: Receipt File Download and Preview`

**Precondition:** Request has PDF and image receipt files attached.

**Steps:**
1. Open request detail
2. Scroll to "Receipt Files" section
3. Verify both files listed with names
4. Click PDF file preview (inline viewer loads)
5. Verify PDF displays in modal
6. Close PDF viewer
7. Click image file (inline preview loads)
8. Verify image displays
9. Click download link for PDF
10. Verify browser downloads file with correct filename

**Expected Outcome:** File previews work for supported types. Download links use signed URLs. File access logged for audit.

---

### 5.7 `E2E-MGR-07: Dashboard Metrics Accuracy**

**Precondition:** Multiple requests in various statuses in DB.

**Steps:**
1. Open dashboard
2. Note metric counts (Pending, Reviewing, Verified, Rejected)
3. Manually count requests in queue table
4. Verify queue count matches Pending metric
5. Verify total of all metrics equals total assigned requests
6. Perform a verify action
7. Verify Verified count increments and Pending count decrements
8. Open "/metrics/summary" API endpoint directly
9. Verify metrics match dashboard display

**Expected Outcome:** Metrics calculated accurately. Real-time updates on action. API and UI in sync.

---

### 5.8 `E2E-MGR-08: Keyboard Navigation & Accessibility**

**Steps:**
1. Open request detail
2. Use Tab key to navigate through all form controls
3. Focus on Verify button
4. Press Enter to activate
5. Verify action executes (no mouse click needed)
6. Open detail again
7. Focus comment field
8. Type comment
9. Focus Reject button
10. Press Space to activate
11. Verify rejection executes
12. Test screen reader announcement of status changes

**Expected Outcome:** All interactive elements keyboard accessible. Screen readers announce status and error messages. WCAG AA compliance met.

---

## 6. Performance & Load Testing

### 6.1 Load Test Scenario

Using k6 or Apache JMeter:

| Scenario | Load | Expected Result |
|----------|------|-----------------|
| Concurrent queue fetches | 50 concurrent users | Response time ≤ 2 seconds, no errors |
| Concurrent verify actions | 10 concurrent verify requests | All succeed, no race conditions, all logged correctly |
| Large queue (1000+ requests) | Pagination fetch | Page load ≤ 2 seconds, UI responsive |

---

## 7. Test Data & Seeding

### 7.1 Test Database Seeder

Create seed script (`scripts/seed-test-data.ts`):

```typescript
// src/scripts/seed-test-data.ts
async function seedManagerTestData() {
  // Create test managers (3)
  const managers = [
    { id: 5, email: 'manager1@test.local', fullName: 'Manager One' },
    { id: 6, email: 'manager2@test.local', fullName: 'Manager Two' },
    { id: 7, email: 'manager3@test.local', fullName: 'Manager Three' }
  ];

  // Create test requests in various statuses
  // SUBMITTED_MANAGER (2) x 5
  // MANAGER_REVIEWING (3) x 3
  // MANAGER_VERIFIED (4) x 10
  // REJECTED_MANAGER (5) x 2
  
  // Create with different branches (Yangon, Mandalay, Naypyidaw)
  // Create with different amounts
  // Attach sample receipt files
  
  // Create approval log history for each request
}
```

---

## 8. Continuous Integration (CI) Setup

### 8.1 Test Pipeline (GitHub Actions / GitLab CI)

```yaml
# .github/workflows/manager-tests.yml
name: Manager Module Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: test
          
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm install
        
      - name: Unit tests
        run: npm run test:unit:manager
        
      - name: Component tests
        run: npm run test:component:manager
        
      - name: Integration tests
        run: npm run test:integration:manager -- --db=postgres
        
      - name: E2E tests
        run: npm run test:e2e:manager
        
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## 9. Test Coverage Goals

| Module | Target Coverage |
|--------|-----------------|
| ManagerService | 90% |
| VerificationService | 95% |
| ManagerController | 85% |
| Frontend Components | 80% |
| E2E Critical Paths | 100% |

---

## 10. Cross-References

| Related Document | Purpose |
|-----------------|---------|
| [DD_MANAGER_05](./DD_MANAGER_05_BUSINESS_LOGIC.md) | Business logic being tested |
| [DD_MANAGER_04](./DD_MANAGER_04_API_ENDPOINTS.md) | API contracts being tested |
| [DD_MANAGER_02](./DD_MANAGER_02_FRONTEND_REQUEST_LIST.md) | UI components being tested |
| [DD_COMMON_10](../00_common/DD_COMMON_10_TESTING_FRAMEWORK.md) | Testing framework setup |

---

## Sign-Off

This test specification provides comprehensive coverage of the Manager Module across all test levels: unit, component, integration, and E2E. It ensures quality, reliability, and compliance with business requirements.

**Approval Status:** Released  
**Related Components:** DD_MANAGER_05, DD_MANAGER_04, DD_MANAGER_02

---

*End of DD_MANAGER_07_TEST_SPECIFICATION.md*