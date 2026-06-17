# DD_MANAGER_05 — Business Logic

> **Doc ID:** PRWM-DD-MGR-05 | **Version:** 1.0 | **Status:** Released  
> **Last Updated:** 2026-06-16

---

## 1. Overview

This document specifies the core business logic, transaction boundaries, state transition rules, and validation enforcement implemented in the `ManagerService` and `VerificationService`.

- **Location:** 
  - `src/modules/manager/manager.service.ts`
  - `src/modules/manager/verification.service.ts`

---

## 2. Core Service Methods

### 2.1 `getQueueRequests(managerId: number, query: QueryManagerQueueDto)`

Retrieves paginated list of payment requests assigned to the manager for verification.

**Logic:**
1. **Data Isolation:** Query `PaymentRequest` records where:
   - `manager_user_id = managerId`
   - `status_id IN (2, 3, 4, 5)` (manager-relevant statuses only)
   - `is_deleted = false`

2. **Filtering:**
   - If `query.statusId` provided: Add `AND status_id = query.statusId`
   - If `query.branch` provided: Join with `User` table and filter `user.branch = query.branch`
   - If `query.search` provided: Search across `request_number`, `applicant_name`, `purpose` (case-insensitive, ILIKE query)

3. **Sorting:**
   - Default sort: `submitted_to_manager_date ASC` (oldest first = highest priority)
   - Support sorting by: `submittedDate`, `applicationDate`, `applicantName`, `totalAmount`, `elapsedTime`
   - Prevent SQL injection: Whitelist allowed sort fields

4. **Pagination:** Return paginated results with metadata (page, pageSize, totalRecords, totalPages)

5. **Metrics Calculation:**
   - Count records by `statusId` (2, 3, 4, 5)
   - Return counts in response metadata
   - Counts must be fast (consider caching if expensive)

6. **Elapsed Time Calculation:**
   ```typescript
   const elapsedTimeMinutes = Math.floor(
     (new Date().getTime() - new Date(record.submittedToManagerDate).getTime()) / 60000
   );
   ```

**Transaction Boundaries:** Read-only operation; no transaction needed.

---

### 2.2 `getRequestDetails(id: number, managerId: number)`

Retrieves full details of a specific payment request assigned to the manager.

**Guards:**
- Verify `request.manager_user_id === managerId` (ManagerOwnershipGuard)
- Verify `status_id IN (2, 3, 4, 5)` (manager-relevant statuses)

**Logic:**
1. **Fetch Request:** Query full `PaymentRequest` record with all related data:
   - Applicant user info (via join with `User` table)
   - Payment details (amount, currency, payment type, method)
   - `PaymentBreakdownItem` records (all line items)
   - `ReceiptFile` records (with soft-delete check)
   - `ApprovalLog` records (full approval history, ordered by timestamp DESC)

2. **Generate Download URLs:** For each receipt file, create time-limited signed URL:
   ```typescript
   const signedUrl = generateSignedUrl(
     `/api/v1/manager/payment-requests/${id}/files/${fileId}/download`,
     expirySeconds = 3600  // 1 hour expiry
   );
   ```

3. **Automatic Status Transition:**
   - If current `status_id === 2 (SUBMITTED_MANAGER)`, automatically transition to `status_id = 3 (MANAGER_REVIEWING)`:
     ```typescript
     UPDATE payment_requests 
     SET status_id = 3, modified_date = NOW()
     WHERE id = ? AND status_id = 2;
     
     INSERT INTO approval_logs (payment_request_id, action_type, previous_status, new_status, action_date)
     VALUES (?, 'MANAGER_REVIEW_START', 2, 3, NOW());
     ```
   - This transition records an entry in `ApprovalLog` with action type `MANAGER_REVIEW_START`
   - **Important:** This transition is recorded for audit purposes but may not trigger external notifications

4. **Concurrency Check Preparation:** Return `modified_date` timestamp in response for optimistic locking validation on subsequent verify/reject actions.

**Transaction Boundaries:** 
- Status transition (if applicable) must be transactional with ApprovalLog insertion
- Fetch and transition should be atomic to prevent race conditions

**Error Handling:**
- `404 Not Found` if request doesn't exist or not assigned to manager
- `403 Forbidden` if ownership check fails
- `409 Conflict` if status transition race condition detected

---

### 2.3 `verifyRequest(id: number, managerId: number, dto: VerifyRequestDto)`

Manager approves a payment request, transitioning it to manager-verified state.

**Guards:**
- Verify `request.manager_user_id === managerId`
- Verify current `status_id === 3 (MANAGER_REVIEWING)` (cannot verify if not actively reviewing)

**Validation:**
1. **Optimistic Locking Check:**
   ```typescript
   const currentRecord = await paymentRequestRepo.findOne({ where: { id } });
   if (currentRecord.modifiedDate !== dto.modifiedDate) {
     throw new ConflictException({
       errorCode: 'ERR-MGR-409',
       message: 'This request\'s status has changed since it was loaded. The list will now refresh.'
     });
   }
   ```

2. **Comment Validation:**
   - If `dto.comment` provided:
     - Length ≤ 500 characters (VAL-MGR-001)
     - No additional content validation needed for verify action

**Logic:**
1. **Update Request Status:**
   ```typescript
   await paymentRequestRepo.update(
     { id },
     {
       statusId: 4,  // MANAGER_VERIFIED
       modifiedDate: new Date(),
       currentAssignedToUserId: null  // Unassign from manager; moves to applicant
     }
   );
   ```

2. **Insert Approval Log:**
   ```typescript
   await approvalLogRepo.create({
     paymentRequestId: id,
     actionType: 'MANAGER_VERIFIED',
     previousStatusId: 3,  // MANAGER_REVIEWING
     newStatusId: 4,       // MANAGER_VERIFIED
     actionByUserId: managerId,
     comment: dto.comment || null,
     actionDate: new Date(),
     ipAddress: request.ip  // For audit trail
   });
   ```

3. **WebSocket Notification (to Applicant):**
   - Send status update event to applicant:
     ```typescript
     const payload = {
       event: 'statusUpdate',
       paymentRequestId: id,
       requestNumber: request.requestNumber,
       previousStatus: 'MANAGER_REVIEWING',
       newStatus: 'MANAGER_VERIFIED',
       actionByUserId: managerId,
       actionByName: currentManager.fullName,
       comment: dto.comment || null,
       timestamp: new Date().toISOString()
     };
     
     await websocketGateway.sendPersonalNotification(
       request.applicantUserId,
       payload
     );
     ```

4. **Update Manager Dashboard (WebSocket):**
   - Broadcast queue change event to manager room:
     ```typescript
     await websocketGateway.sendToRoom(
       `MANAGERS`,
       { event: 'queueChange', action: 'VERIFIED', requestId: id, ... }
     );
     ```

**Transaction Boundaries:** 
- Status update, log insertion, and notifications must be transactional
- Notifications fire *after* database commit succeeds

**Response:**
```typescript
{ 
  success: true, 
  message: '申請を承認しました。申請者に通知されます。' 
}
```

---

### 2.4 `rejectRequest(id: number, managerId: number, dto: RejectRequestDto)`

Manager rejects a payment request, returning it to the applicant for revision.

**Guards:**
- Verify `request.manager_user_id === managerId`
- Verify current `status_id === 3 (MANAGER_REVIEWING)`

**Validation:**
1. **Optimistic Locking Check:** (Same as verify)
   ```typescript
   if (currentRecord.modifiedDate !== dto.modifiedDate) {
     throw new ConflictException('ERR-MGR-409');
   }
   ```

2. **Comment Validation (Mandatory & Strict):**
   ```typescript
   const trimmedComment = dto.comment.trim();
   
   // VAL-MGR-002: Min length 10 chars
   if (trimmedComment.length < 10) {
     throw new BadRequestException({
       errorCode: 'VAL-MGR-002',
       message: 'Comment is required and must be at least 10 characters long to reject a request.'
     });
   }
   
   // VAL-MGR-001: Max length 500 chars
   if (trimmedComment.length > 500) {
     throw new BadRequestException({
       errorCode: 'VAL-MGR-001',
       message: 'Comment cannot exceed 500 characters.'
     });
   }
   ```

**Logic:**
1. **Update Request Status:**
   ```typescript
   await paymentRequestRepo.update(
     { id },
     {
       statusId: 5,  // REJECTED_MANAGER
       modifiedDate: new Date(),
       currentAssignedToUserId: applicantUserId  // Return to applicant
     }
   );
   ```

2. **Insert Approval Log:**
   ```typescript
   await approvalLogRepo.create({
     paymentRequestId: id,
     actionType: 'MANAGER_REJECTED',
     previousStatusId: 3,  // MANAGER_REVIEWING
     newStatusId: 5,       // REJECTED_MANAGER
     actionByUserId: managerId,
     comment: trimmedComment,  // Mandatory comment stored
     actionDate: new Date(),
     ipAddress: request.ip
   });
   ```

3. **WebSocket Notification (to Applicant):**
   - Send rejection notice with reason:
     ```typescript
     const payload = {
       event: 'statusUpdate',
       paymentRequestId: id,
       requestNumber: request.requestNumber,
       previousStatus: 'MANAGER_REVIEWING',
       newStatus: 'REJECTED_MANAGER',
       actionByUserId: managerId,
       actionByName: currentManager.fullName,
       comment: trimmedComment,  // Rejection reason
       timestamp: new Date().toISOString()
     };
     
     await websocketGateway.sendPersonalNotification(
       request.applicantUserId,
       payload
     );
     ```

4. **Update Manager Dashboard (WebSocket):**
   - Broadcast queue change:
     ```typescript
     await websocketGateway.sendToRoom(
       `MANAGERS`,
       { event: 'queueChange', action: 'REJECTED', requestId: id, ... }
     );
     ```

**Transaction Boundaries:** Same as verify (update + log + notifications atomic).

**Response:**
```typescript
{ 
  success: true, 
  message: '申請を差し戻しました。申請者に通知されます。' 
}
```

---

### 2.5 `getMetricsSummary(managerId: number, periodDays: number = 7)`

Calculates and returns dashboard metrics for the manager.

**Logic:**
1. **Count Requests by Status:**
   ```typescript
   const pendingCount = await paymentRequestRepo.count({
     where: { managerId, statusId: 2 }  // SUBMITTED_MANAGER
   });
   const reviewingCount = await paymentRequestRepo.count({
     where: { managerId, statusId: 3 }  // MANAGER_REVIEWING
   });
   const verifiedCount = await paymentRequestRepo.count({
     where: { managerId, statusId: 4 }  // MANAGER_VERIFIED
   });
   const rejectedCount = await paymentRequestRepo.count({
     where: { managerId, statusId: 5 }  // REJECTED_MANAGER
   });
   ```

2. **Average Processing Time:**
   ```typescript
   // Average time from SUBMITTED_MANAGER to MANAGER_VERIFIED or REJECTED_MANAGER
   const avgProcessingTime = await paymentRequestRepo
     .createQueryBuilder('pr')
     .select('AVG(EXTRACT(EPOCH FROM (pr.modifiedDate - pr.submittedToManagerDate))/60)', 'avgMinutes')
     .where('pr.managerId = :managerId', { managerId })
     .andWhere('pr.statusId IN (4, 5)')  // Verified or Rejected
     .getRawOne();
   ```

3. **Overdue Count (Pending > 48 hours):**
   ```typescript
   const overdueThreshold = new Date(Date.now() - 48 * 60 * 60 * 1000);
   const overdueCount = await paymentRequestRepo.count({
     where: {
       managerId,
       statusId: 2,  // SUBMITTED_MANAGER (still pending)
       submittedToManagerDate: LessThan(overdueThreshold)
     }
   });
   ```

4. **Period Calculations (Last N days):**
   ```typescript
   const periodStart = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
   
   const verifiedThisPeriod = await approvalLogRepo.count({
     where: {
       actionByUserId: managerId,
       actionType: 'MANAGER_VERIFIED',
       actionDate: GreaterThanOrEqual(periodStart)
     }
   });
   
   const rejectedThisPeriod = await approvalLogRepo.count({
     where: {
       actionByUserId: managerId,
       actionType: 'MANAGER_REJECTED',
       actionDate: GreaterThanOrEqual(periodStart)
     }
   });
   ```

5. **Return Metrics Object:**
   ```typescript
   return {
     pendingCount,
     reviewingCount,
     verifiedCount,
     rejectedCount,
     totalAssignedCount: pendingCount + reviewingCount + verifiedCount + rejectedCount,
     averageProcessingTimeMinutes: avgProcessingTime?.avgMinutes || 0,
     overdueCount,
     verifiedThisPeriod,
     rejectedThisPeriod,
     lastRefreshedAt: new Date()
   };
   ```

**Performance Note:** Consider caching this for up to 5 minutes or compute asynchronously if expensive.

**Transaction Boundaries:** Read-only operation; no transaction needed.

---

## 3. Business Rules & Constraints

### 3.1 Status Transition Rules (Manager Context)

**Allowed Transitions:**
```
SUBMITTED_MANAGER (2)
  ↓ (auto on open)
MANAGER_REVIEWING (3)
  ├→ MANAGER_VERIFIED (4) [via verify action]
  └→ REJECTED_MANAGER (5) [via reject action]

MANAGER_VERIFIED (4)
  ↓ (Applicant submits to approver)
  SUBMITTED_APPROVER (6)

REJECTED_MANAGER (5)
  ↓ (Applicant edits and resubmits)
  SUBMITTED_MANAGER (2)
```

**Constraints:**
- Manager **cannot** transition from VERIFIED back to SUBMITTED
- Manager **cannot** transition from REJECTED to VERIFIED without applicant resubmission
- Manager **cannot** access or modify requests not assigned to them

### 3.2 Optimistic Locking Enforcement

**Rule:** Every verify/reject action includes a `modifiedDate` timestamp from the client. This timestamp must match the current DB record's `modified_date`.

**Purpose:** Prevent race conditions where:
- Manager A opens request at 10:00 (modified_date = 10:00:00)
- Applicant B edits and resubmits at 10:05 (modified_date = 10:05:00)
- Manager A attempts to verify with outdated timestamp (10:00:00) at 10:10
- System detects mismatch and rejects action with `ERR-MGR-409`

**Implementation:**
```typescript
if (request.modifiedDate !== dto.modifiedDate) {
  throw new ConflictException('ERR-MGR-409');
}
```

### 3.3 Mandatory Comment on Rejection

**Rule:** When rejecting, comment is **mandatory** with these constraints:
- Minimum: 10 characters (VAL-MGR-002)
- Maximum: 500 characters (VAL-MGR-001)
- No empty or whitespace-only comments allowed

**Purpose:** Ensure applicants receive actionable feedback for corrections.

### 3.4 Automatic Status Transition on Access

**Rule:** When manager opens a request with status `SUBMITTED_MANAGER` (2), system automatically transitions to `MANAGER_REVIEWING` (3).

**Purpose:** Indicate that the request is actively being reviewed and prevent other actors from reassigning.

**Implementation:** Atomic operation in `getRequestDetails` method.

### 3.5 Data Read-Only for Manager

**Rule:** Managers **cannot** edit request data (form fields, breakdown items, amounts). All request details are read-only.

**Enforcement:** API does not expose PATCH or DELETE endpoints for request data. Only verify/reject actions allowed.

---

## 4. Error Handling & Exception Codes

### 4.1 Manager-Specific Error Codes

| Code | HTTP | Scenario | Action |
|------|------|----------|--------|
| **ERR-MGR-401** | 401 | JWT expired or invalid | Redirect to login |
| **ERR-MGR-403** | 403 | User role ≠ MANAGER or request not assigned | Deny access, show 403 page |
| **ERR-MGR-404** | 404 | Payment request not found | Show not found error |
| **ERR-MGR-409** | 409 | Concurrency conflict (modified_date mismatch) | Auto-refresh queue, show warning |
| **VAL-MGR-001** | 400 | Comment > 500 chars | Show field error |
| **VAL-MGR-002** | 400 | Rejection comment < 10 chars | Show field error |
| **ERR-MGR-500** | 500 | Server error | Show error ID, suggest admin contact |

### 4.2 Exception Throwing

```typescript
// Optimistic locking failure
throw new ConflictException({
  errorCode: 'ERR-MGR-409',
  message: 'This request\'s status has changed since it was loaded. The list will now refresh.'
});

// Validation failure (comment too short)
throw new BadRequestException({
  errorCode: 'VAL-MGR-002',
  message: 'Comment is required and must be at least 10 characters long to reject a request.',
  details: { field: 'comment', rule: 'minLength', value: trimmedComment.length }
});

// Access denied
throw new ForbiddenException({
  errorCode: 'ERR-MGR-403',
  message: 'You do not have permission to access this request.'
});
```

---

## 5. Transaction & Data Integrity

### 5.1 ACID Guarantees

All state-modifying operations (verify, reject) must be:
- **Atomic:** All-or-nothing (status update + log insertion)
- **Consistent:** Modified_date updated, status transition valid
- **Isolated:** Concurrent requests handled via optimistic locking
- **Durable:** Changes persisted to DB before notifications sent

### 5.2 Transaction Wrapping Example

```typescript
async verifyRequest(id: number, managerId: number, dto: VerifyRequestDto) {
  const transaction = await this.dataSource.transaction(async (manager) => {
    // 1. Fetch and lock
    const request = await manager.findOne(PaymentRequest, {
      where: { id },
      lock: { mode: 'pessimistic_write' }  // Prevent concurrent updates
    });
    
    // 2. Validation
    if (request.modifiedDate !== dto.modifiedDate) {
      throw new ConflictException('ERR-MGR-409');
    }
    
    // 3. Update status
    request.statusId = 4;
    request.modifiedDate = new Date();
    await manager.save(request);
    
    // 4. Insert log
    const log = new ApprovalLog({
      paymentRequestId: id,
      actionType: 'MANAGER_VERIFIED',
      actionByUserId: managerId,
      comment: dto.comment,
      actionDate: new Date()
    });
    await manager.save(log);
    
    return { request, log };
  });
  
  // 5. Notifications fire after transaction commit
  await this.notificationService.sendVerificationNotification(transaction.request);
  
  return { success: true };
}
```

---

## 6. Performance Considerations

### 6.1 Query Optimization

- **Index on manager_user_id:** Required for fast queue filtering
- **Index on status_id:** Required for status-based filtering
- **Index on submitted_to_manager_date:** Required for sorting (oldest first)
- **Composite index on (manager_user_id, status_id):** Highly recommended for queue queries

### 6.2 Caching Strategy

- **Metrics Caching:** Cache metrics for up to 5 minutes per manager; invalidate on verify/reject
- **Branch Lookup Caching:** Cache list of branches (static); refresh hourly or on admin update
- **Request Data:** Do NOT cache individual request details (freshness critical)

### 6.3 Pagination

- Default page size: 10 rows
- Maximum page size: 100 rows (prevent abuse)
- Validate user-provided page/pageSize to prevent injection

---

## 7. Audit & Compliance

### 7.1 Approval Log Tracking

Every manager action is logged:
- **Action Type:** MANAGER_VERIFIED, MANAGER_REJECTED, MANAGER_REVIEW_START
- **Timestamp:** ISO 8601 UTC
- **User ID:** Manager's user ID
- **IP Address:** Request source IP (for compliance)
- **Comment:** If applicable (mandatory for reject)
- **Status Transition:** Previous and new status IDs

### 7.2 Immutability

Approval log entries are **never deleted or modified** after creation. They form an immutable audit trail.

### 7.3 Data Retention

- Approval logs retained indefinitely for compliance
- Soft-deleted requests remain in DB with `is_deleted = true` flag
- No purging of historical data without explicit policy

---

## 8. Cross-References

| Related Document | Purpose |
|-----------------|---------|
| [DD_MANAGER_04](./DD_MANAGER_04_API_ENDPOINTS.md) | API endpoints implementing these methods |
| [DD_MANAGER_02](./DD_MANAGER_02_FRONTEND_REQUEST_LIST.md) | Frontend consuming this logic |
| [DD_COMMON_09](../00_common/DD_COMMON_09_DATABASE_ACCESS_PATTERNS.md) | Transaction patterns and examples |
| [Requirement Spec](../../core_ja/01_要件定義書_REQUIREMENT_SPEC.md) | Source business requirements |

---

## 9. Testing Strategy

### 9.1 Unit Tests

```typescript
describe('ManagerService.verifyRequest', () => {
  it('should verify a request and update status', async () => {
    // Setup
    const managerId = 5;
    const requestId = 101;
    const dto = { comment: 'Approved', modifiedDate: '2026-06-15T10:30:00Z' };
    
    // Execute
    const result = await service.verifyRequest(requestId, managerId, dto);
    
    // Assert
    expect(result.success).toBe(true);
    expect(await repo.findOne(requestId)).toHaveProperty('statusId', 4);
  });
  
  it('should throw ERR-MGR-409 on concurrency conflict', async () => {
    // Setup: DB has modified_date = 10:35, but DTO has 10:30
    const dto = { comment: '', modifiedDate: '2026-06-15T10:30:00Z' };
    
    // Execute & Assert
    await expect(service.verifyRequest(101, 5, dto))
      .rejects.toThrow('ERR-MGR-409');
  });
});

describe('ManagerService.rejectRequest', () => {
  it('should require comment ≥ 10 chars', async () => {
    const dto = { comment: 'short', modifiedDate: '2026-06-15T10:30:00Z' };
    
    await expect(service.rejectRequest(101, 5, dto))
      .rejects.toThrow('VAL-MGR-002');
  });
});
```

### 9.2 Integration Tests

- Verify full workflow: open request → review → verify → notification
- Verify rejection workflow with comments
- Verify concurrency conflict detection and handling
- Verify metrics calculation correctness

### 9.3 E2E Tests

- Manager login → view queue → select request → verify/reject → notifications received
- Concurrent manager access (race condition testing)

---

## Sign-Off

This business logic specification defines the complete verification workflow for the Manager module, including state transitions, validations, error handling, and audit trails.

**Approval Status:** Released  
**Related Components:** DD_MANAGER_04, DD_MANAGER_02, DD_MANAGER_03

---

*End of DD_MANAGER_05_BUSINESS_LOGIC.md*