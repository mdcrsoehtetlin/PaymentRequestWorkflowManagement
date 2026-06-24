# Research: Audit Log Request Number Display

**Date**: 2026-06-24

## Research Tasks

### 1. Current Implementation Analysis

**Finding**: The audit log system currently uses `payment_request_id` (internal numeric ID) for search and display.

**Current State**:
- DTO: `audit-log-query.dto.ts` defines `requestId` as `@IsInt()` 
- Service: `admin.service.ts` filters by `log.payment_request_id = :requestId`
- Frontend: `AuditLogWorkspace.tsx` displays `PRF-{paymentRequestId}` format
- Search field has "PRF-" prefix and accepts numeric input

**Problem**: Users don't know internal IDs. They know request numbers (e.g., PR-2026-001) used elsewhere in the system.

### 2. Payment Request Entity Structure

**Finding**: The `payment_requests` table has both `payment_request_id` (PK) and `request_number` (unique varchar).

**Key Fields**:
- `payment_request_id`: integer, auto-generated PK
- `request_number`: varchar(50), unique, format "PR-YYYY-NNN"

**Relationship**: `approval_logs.payment_request_id` → `payment_requests.payment_request_id`

### 3. TypeORM Query Pattern

**Finding**: Existing code in `approver.service.ts` demonstrates the join pattern needed.

**Reference Code** (approver.service.ts:170):
```typescript
.where('request.request_number LIKE :search', { search: `%${search}%` })
```

**Recommended Pattern**:
```typescript
qb.leftJoinAndSelect('log.payment_request', 'request')
  .andWhere('request.request_number ILIKE :requestNumber', { 
    requestNumber: `%${requestNumber}%` 
  });
```

### 4. Frontend Search UX

**Finding**: Current search field uses "PRF-" prefix with numeric input.

**Recommended Changes**:
- Remove "PRF-" prefix from search field
- Change input placeholder to "リクエスト番号で検索"
- Change label to "リクエスト番号"
- Keep 300ms debounce (already implemented)

### 5. Response Data Mapping

**Finding**: Current response maps `paymentRequestId` but not `request_number`.

**Required Change**: Add `requestNumber` field to response mapping using joined `payment_request` entity.

**Edge Case**: If payment_request is deleted, `requestNumber` should be null (LEFT JOIN handles this).

### 6. Test Updates

**Finding**: `admin.service.spec.ts` has test cases using `requestId` parameter.

**Required Updates**:
- Change test data to use `requestNumber` parameter
- Update mock expectations to verify ILIKE query
- Add test case for partial matching
- Add test case for null request_number (deleted payment request)
