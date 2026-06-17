# DD_MANAGER_03 — API Endpoints

> **Doc ID:** PRWM-DD-MGR-04 | **Version:** 1.0 | **Status:** Released  
> **Last Updated:** 2026-06-16

---

## 1. Controller Setup

- **File:** `src/modules/manager/manager.controller.ts`
- **Base Route:** `/api/v1/manager/payment-requests`
- **Guards:** `@UseGuards(JwtAuthGuard, RolesGuard)` with `@Roles('MANAGER')`

---

## 2. API Endpoints Contract

### 2.1 GET /queue

List payment requests assigned to the current manager for verification (paginated, sortable, filterable).

- **Query Params:** `QueryManagerQueueDto`
  - `page` (number, default: 1)
  - `pageSize` (number, default: 10)
  - `statusId` (number, optional) — Filter by status (2, 3, 4, 5)
  - `branch` (string, optional) — Filter by applicant branch
  - `search` (string, optional) — Search by request number, applicant name, purpose
  - `sortBy` (string, default: 'submittedDate') — Sort field
  - `sortOrder` ('ASC' | 'DESC', default: 'ASC') — Sort direction
  
- **Response:** `200 OK` `PaginatedResponse<ManagerQueueItem>`
  ```typescript
  {
    data: [
      {
        paymentRequestId: number,
        requestNumber: string,
        applicationDate: string (YYYY-MM-DD),
        applicantName: string,
        applicantBranch: string,
        totalAmount: number,
        currency: string,
        statusId: number,
        statusName: string,
        submittedToManagerDate: string (ISO),
        elapsedTimeMinutes: number,
        managerId: number
      }
    ],
    pagination: { page, pageSize, totalRecords, totalPages },
    metrics: {
      pendingCount: number,        // status = 2
      reviewingCount: number,       // status = 3
      verifiedCount: number,        // status = 4
      rejectedCount: number         // status = 5
    }
  }
  ```

- **Logic:** Calls `service.getQueueRequests(managerId, query)`
- **Data Isolation:** Automatically filters `WHERE manager_user_id = :managerId AND status_id IN (2, 3, 4, 5)`

---

### 2.2 GET /:id

Get full details of a specific payment request assigned to the manager.

- **URL Params:** `id` (ParseIntPipe) — Payment request ID
- **Guards:** `ManagerOwnershipGuard` (verifies `manager_user_id === currentUserId` AND `status_id IN (2, 3, 4, 5)`)
- **Response:** `200 OK` `ManagerPaymentRequestDetailView`
  ```typescript
  {
    paymentRequestId: number,
    requestNumber: string,
    applicantInfo: {
      userId: number,
      employeeNumber: string,
      fullName: string,
      branch: string,
      department: string
    },
    applicationDate: string (YYYY-MM-DD),
    desiredPaymentDate: string (YYYY-MM-DD),
    paymentDetails: {
      totalAmount: number,
      taxAmount: number (nullable),
      currency: string,
      paymentType: string,
      paymentMethod: string
    },
    purpose: string,
    bankAccountInfo: string (nullable),
    paymentBreakdown: [
      {
        lineNumber: number,
        itemDate: string (YYYY-MM-DD),
        description: string,
        amount: number
      }
    ],
    receiptFiles: [
      {
        fileId: number,
        fileName: string,
        filePath: string,
        mimeType: string,
        uploadedDate: string (ISO)
      }
    ],
    statusId: number,
    statusName: string,
    currentStatus: string,
    submittedToManagerDate: string (ISO),
    modifiedDate: string (ISO), // For optimistic locking
    approvalHistory: [
      {
        logId: number,
        actionType: string,
        actionDate: string (ISO),
        actionByUser: { userId, fullName },
        comment: string (nullable),
        previousStatus: string,
        newStatus: string
      }
    ]
  }
  ```

- **Logic:** Calls `service.getRequestDetails(id, managerId)`
- **Side Effect:** If current status = `SUBMITTED_MANAGER` (2), automatically transition to `MANAGER_REVIEWING` (3) and record in ApprovalLog

---

### 2.3 POST /:id/verify

Verify (approve) a payment request after manager review.

- **URL Params:** `id` (ParseIntPipe) — Payment request ID
- **Guards:** `ManagerOwnershipGuard`
- **Body:** `VerifyRequestDto`
  ```typescript
  {
    comment?: string,           // Optional comment (max 500 chars)
    modifiedDate: string (ISO)  // Timestamp for optimistic locking
  }
  ```

- **Response:** `200 OK` `{ success: true, message: string }`

- **Validation:**
  - Verify `modifiedDate` matches current DB record (optimistic locking check)
  - If mismatch → return `409 Conflict` with error code `ERR-MGR-409`
  - Verify current status is `MANAGER_REVIEWING` (3)

- **Logic:** Calls `service.verifyRequest(id, managerId, dto)`
  1. Update request status to `MANAGER_VERIFIED` (4)
  2. Record action in `ApprovalLog` with action type "MANAGER_VERIFIED"
  3. Set `modified_date` to current timestamp
  4. Notify applicant via WebSocket: `statusUpdate` event with payload
  5. Return success response

- **WebSocket Notification (to Applicant):**
  ```typescript
  {
    event: 'statusUpdate',
    paymentRequestId: number,
    requestNumber: string,
    previousStatus: 'MANAGER_REVIEWING',
    newStatus: 'MANAGER_VERIFIED',
    actionByUserId: number,
    actionByName: string,
    comment: string (optional),
    timestamp: ISO 8601
  }
  ```

---

### 2.4 POST /:id/reject

Reject a payment request during manager review.

- **URL Params:** `id` (ParseIntPipe) — Payment request ID
- **Guards:** `ManagerOwnershipGuard`
- **Body:** `RejectRequestDto`
  ```typescript
  {
    comment: string,            // Required, min 10 chars, max 500 chars (VAL-MGR-002)
    modifiedDate: string (ISO)  // Timestamp for optimistic locking
  }
  ```

- **Response:** `200 OK` `{ success: true, message: string }`

- **Validation:**
  - Verify comment is not empty and length ≥ 10 (VAL-MGR-002)
  - Verify comment length ≤ 500 (VAL-MGR-001)
  - Verify `modifiedDate` matches current DB record (optimistic locking)
  - If validation fails → return `400 Bad Request` with error details
  - If concurrency conflict → return `409 Conflict` with error code `ERR-MGR-409`
  - Verify current status is `MANAGER_REVIEWING` (3)

- **Logic:** Calls `service.rejectRequest(id, managerId, dto)`
  1. Update request status to `REJECTED_MANAGER` (5)
  2. Record action in `ApprovalLog` with action type "MANAGER_REJECTED"
  3. Store comment in `ApprovalLog.comment` field
  4. Set `modified_date` to current timestamp
  5. Notify applicant via WebSocket: `statusUpdate` event
  6. Return success response

- **WebSocket Notification (to Applicant):**
  ```typescript
  {
    event: 'statusUpdate',
    paymentRequestId: number,
    requestNumber: string,
    previousStatus: 'MANAGER_REVIEWING',
    newStatus: 'REJECTED_MANAGER',
    actionByUserId: number,
    actionByName: string,
    comment: string,
    timestamp: ISO 8601
  }
  ```

---

### 2.5 GET /:id/details

Get request details with receipt file download links.

- **URL Params:** `id` (ParseIntPipe) — Payment request ID
- **Guards:** `ManagerOwnershipGuard`
- **Query Params:**
  - `includeHistory` (boolean, default: true) — Include approval history

- **Response:** `200 OK` `ManagerPaymentRequestDetailView` (same as GET /:id)

- **Logic:** Calls `service.getRequestDetails(id, managerId)`
- **Special Handling:** Generate secure, time-limited signed URLs for receipt file downloads

---

### 2.6 GET /:id/files/:fileId/download

Download a receipt file.

- **URL Params:** `id` (ParseIntPipe), `fileId` (ParseIntPipe)
- **Guards:** `ManagerOwnershipGuard`
- **Response:** `200 OK` File stream (Content-Type based on mime type)

- **Logic:**
  1. Verify manager has access to request
  2. Verify receipt file belongs to request
  3. Log file access for audit trail
  4. Stream file from storage

- **Error Handling:**
  - `404 Not Found` if file doesn't exist
  - `403 Forbidden` if manager not authorized

---

### 2.7 GET /metrics/summary

Get summary metrics for manager dashboard.

- **Query Params:**
  - `periodDays` (number, default: 7) — Last N days

- **Response:** `200 OK` `ManagerMetricsSummary`
  ```typescript
  {
    pendingCount: number,
    reviewingCount: number,
    verifiedCount: number,
    rejectedCount: number,
    totalAssignedCount: number,
    averageProcessingTimeMinutes: number,
    overdueCount: number,        // Pending > 48 hours
    verifiedThisPeriod: number,
    rejectedThisPeriod: number,
    lastRefreshedAt: string (ISO)
  }
  ```

- **Logic:** Calls `service.getMetricsSummary(managerId, periodDays)`

---

## 3. Lookup Endpoints

Located in shared Lookup controller (`src/modules/common/lookups.controller.ts`).

### 3.1 GET /api/v1/lookups/payment-statuses

Returns all payment request statuses (including manager-relevant ones).

- **Response:** `200 OK`
  ```typescript
  [
    { id: 2, code: 'SUBMITTED_MANAGER', label: '確認待ち' },
    { id: 3, code: 'MANAGER_REVIEWING', label: '確認中' },
    { id: 4, code: 'MANAGER_VERIFIED', label: '承認済み' },
    { id: 5, code: 'REJECTED_MANAGER', label: '差戻し' },
    ...
  ]
  ```

### 3.2 GET /api/v1/lookups/branches

Returns list of organization branches.

- **Response:** `200 OK`
  ```typescript
  [
    { id: 1, name: 'Yangon', code: 'YGN' },
    { id: 2, name: 'Mandalay', code: 'MDY' },
    { id: 3, name: 'Naypyidaw', code: 'NPT' }
  ]
  ```

### 3.3 GET /api/v1/lookups/currencies

Returns supported currencies.

- **Response:** `200 OK`
  ```typescript
  [
    { id: 1, code: 'MMK', name: 'Myanmar Kyat' },
    { id: 2, code: 'USD', name: 'US Dollar' },
    { id: 3, code: 'JPY', name: 'Japanese Yen' }
  ]
  ```

---

## 4. Error Response Format

All error responses follow a consistent format:

```typescript
{
  statusCode: number,
  errorCode: string,           // e.g., 'ERR-MGR-409'
  message: string,
  timestamp: string (ISO),
  details?: {
    field?: string,           // For validation errors
    rule?: string,
    value?: any
  }
}
```

### 4.1 Common Error Codes (Manager Context)

| Error Code | HTTP Status | Description |
|---|---|---|
| **ERR-MGR-401** | 401 | JWT token absent, expired, or invalid |
| **ERR-MGR-403** | 403 | User role is not MANAGER or request not assigned to manager |
| **ERR-MGR-404** | 404 | Payment request not found |
| **ERR-MGR-409** | 409 | Concurrency conflict (modified_date mismatch) — Optimistic locking |
| **VAL-MGR-001** | 400 | Comment exceeds 500 characters |
| **VAL-MGR-002** | 400 | Comment is required and must be ≥ 10 characters (reject action) |
| **ERR-MGR-500** | 500 | Internal server error |

---

## 5. Request/Response Examples

### 5.1 Example: GET /api/v1/manager/payment-requests/queue

**Request:**
```bash
GET /api/v1/manager/payment-requests/queue?page=1&pageSize=10&statusId=2&sortBy=submittedDate&sortOrder=ASC
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "paymentRequestId": 101,
      "requestNumber": "PRF-2026-001",
      "applicationDate": "2026-06-15",
      "applicantName": "山田太郎",
      "applicantBranch": "Yangon",
      "totalAmount": 150000,
      "currency": "MMK",
      "statusId": 2,
      "statusName": "確認待ち",
      "submittedToManagerDate": "2026-06-15T10:30:00Z",
      "elapsedTimeMinutes": 120,
      "managerId": 5
    },
    {
      "paymentRequestId": 102,
      "requestNumber": "PRF-2026-002",
      "applicationDate": "2026-06-14",
      "applicantName": "佐藤花子",
      "applicantBranch": "Mandalay",
      "totalAmount": 250000,
      "currency": "MMK",
      "statusId": 3,
      "statusName": "確認中",
      "submittedToManagerDate": "2026-06-14T14:00:00Z",
      "elapsedTimeMinutes": 480,
      "managerId": 5
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "totalRecords": 25,
    "totalPages": 3
  },
  "metrics": {
    "pendingCount": 8,
    "reviewingCount": 2,
    "verifiedCount": 12,
    "rejectedCount": 3
  }
}
```

---

### 5.2 Example: GET /api/v1/manager/payment-requests/:id

**Request:**
```bash
GET /api/v1/manager/payment-requests/101
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
  "paymentRequestId": 101,
  "requestNumber": "PRF-2026-001",
  "applicantInfo": {
    "userId": 10,
    "employeeNumber": "EMP001",
    "fullName": "山田太郎",
    "branch": "Yangon",
    "department": "IT"
  },
  "applicationDate": "2026-06-15",
  "desiredPaymentDate": "2026-06-20",
  "paymentDetails": {
    "totalAmount": 150000,
    "taxAmount": 10000,
    "currency": "MMK",
    "paymentType": "Expense Reimbursement",
    "paymentMethod": "Bank Transfer"
  },
  "purpose": "Office supplies and equipment",
  "bankAccountInfo": "Account: 123456789, Name: 山田太郎",
  "paymentBreakdown": [
    {
      "lineNumber": 1,
      "itemDate": "2026-06-10",
      "description": "Printer cartridges",
      "amount": 50000
    },
    {
      "lineNumber": 2,
      "itemDate": "2026-06-12",
      "description": "Office chairs",
      "amount": 100000
    }
  ],
  "receiptFiles": [
    {
      "fileId": 201,
      "fileName": "PrinterCartridges_20260610.pdf",
      "filePath": "/uploads/101/uuid_PrinterCartridges_20260610.pdf",
      "mimeType": "application/pdf",
      "uploadedDate": "2026-06-15T09:00:00Z"
    },
    {
      "fileId": 202,
      "fileName": "OfficeChairs_20260612.jpg",
      "filePath": "/uploads/101/uuid_OfficeChairs_20260612.jpg",
      "mimeType": "image/jpeg",
      "uploadedDate": "2026-06-15T09:05:00Z"
    }
  ],
  "statusId": 3,
  "statusName": "確認中",
  "currentStatus": "Manager Reviewing",
  "submittedToManagerDate": "2026-06-15T10:30:00Z",
  "modifiedDate": "2026-06-15T10:30:00Z",
  "approvalHistory": [
    {
      "logId": 501,
      "actionType": "CREATED",
      "actionDate": "2026-06-15T08:00:00Z",
      "actionByUser": {
        "userId": 10,
        "fullName": "山田太郎"
      },
      "comment": null,
      "previousStatus": null,
      "newStatus": "DRAFT"
    },
    {
      "logId": 502,
      "actionType": "SUBMITTED_MANAGER",
      "actionDate": "2026-06-15T10:30:00Z",
      "actionByUser": {
        "userId": 10,
        "fullName": "山田太郎"
      },
      "comment": "Please review this expense report",
      "previousStatus": "DRAFT",
      "newStatus": "SUBMITTED_MANAGER"
    },
    {
      "logId": 503,
      "actionType": "MANAGER_REVIEW_START",
      "actionDate": "2026-06-15T10:30:00Z",
      "actionByUser": {
        "userId": 5,
        "fullName": "田中マネージャー"
      },
      "comment": null,
      "previousStatus": "SUBMITTED_MANAGER",
      "newStatus": "MANAGER_REVIEWING"
    }
  ]
}
```

---

### 5.3 Example: POST /api/v1/manager/payment-requests/:id/verify

**Request:**
```bash
POST /api/v1/manager/payment-requests/101/verify
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "comment": "申請内容を確認しました。承認します。",
  "modifiedDate": "2026-06-15T10:30:00Z"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "申請を承認しました。申請者に通知されます。"
}
```

**Response (409 Conflict - Concurrency Error):**
```json
{
  "statusCode": 409,
  "errorCode": "ERR-MGR-409",
  "message": "This request's status has changed since it was loaded. The list will now refresh.",
  "timestamp": "2026-06-15T10:35:00Z"
}
```

---

### 5.4 Example: POST /api/v1/manager/payment-requests/:id/reject

**Request:**
```bash
POST /api/v1/manager/payment-requests/101/reject
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "comment": "領収書が不足しています。詳細な内訳が必要です。修正後に再申請してください。",
  "modifiedDate": "2026-06-15T10:30:00Z"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "申請を差し戻しました。申請者に通知されます。"
}
```

**Response (400 Bad Request - Validation Error):**
```json
{
  "statusCode": 400,
  "errorCode": "VAL-MGR-002",
  "message": "Comment is required and must be at least 10 characters long to reject a request.",
  "timestamp": "2026-06-15T10:35:00Z",
  "details": {
    "field": "comment",
    "rule": "minLength",
    "value": "短い"
  }
}
```

---

## 6. Authentication & Authorization

### 6.1 JWT Token Validation
- All endpoints require valid JWT Bearer token in `Authorization` header
- Token validated via `JwtAuthGuard`
- Token must contain `userId`, `role`, and other required claims

### 6.2 Role Authorization
- All endpoints enforce `@Roles('MANAGER')` decorator
- User role must be exactly 'MANAGER' (role_id = 2)
- Verified via `RolesGuard`

### 6.3 Ownership Guard (ManagerOwnershipGuard)
- Verifies `manager_user_id === currentUserId` on request-specific endpoints
- Prevents manager from accessing requests not assigned to them
- Returns `403 Forbidden` if ownership check fails

---

## 7. Rate Limiting & Throttling

- **Rate Limit:** 100 requests per minute per user (manager)
- **Throttle Decorator:** `@Throttle(100, 60)` on controller
- **Excess Requests:** Return `429 Too Many Requests` with retry-after header

---

## 8. Logging & Audit Trail

- All verify/reject actions logged to `ApprovalLog` table
- Logged fields: `action_type`, `previous_status`, `new_status`, `comment`, `timestamp`, `ip_address`, `manager_user_id`
- Access to sensitive endpoints (verify, reject) logged for compliance

---

## 9. Cross-References

| Related Document | Purpose |
|-----------------|---------|
| [DD_MANAGER_03](./DD_MANAGER_03_FRONTEND_VERIFICATION_PANEL.md) | Frontend integration with these endpoints |
| [DD_MANAGER_02](./DD_MANAGER_02_FRONTEND_REQUEST_LIST.md) | Queue list frontend using GET /queue endpoint |
| [DD_MANAGER_05](./DD_MANAGER_05_BUSINESS_LOGIC.md) | Service layer business logic |
| [DD_MANAGER_06](./DD_MANAGER_06_DTOS_AND_TYPES.md) | Full DTO and TypeScript type definitions |
| [DD_COMMON_07](../00_common/DD_COMMON_07_AUTH_AND_MIDDLEWARE.md) | Authentication and middleware details |

---

## 10. Testing Considerations

### 10.1 Unit Tests
- Test service methods in isolation (verify, reject, getQueueRequests)
- Mock repository and external dependencies
- Validate business logic and error handling

### 10.2 Integration Tests
- Test full API endpoint flows
- Verify request/response contracts
- Test error scenarios (concurrency, validation, auth)
- Verify WebSocket notifications sent correctly

### 10.3 E2E Tests
- Test manager workflow: login → view queue → open request → verify/reject → notifications
- Verify real-time updates propagate correctly
- Test concurrent manager access (concurrency conflict detection)

---

## Sign-Off

This API endpoint specification provides the complete contract for manager operations in the payment request system. All endpoints are secured with authentication and authorization controls.

**Approval Status:** Released  