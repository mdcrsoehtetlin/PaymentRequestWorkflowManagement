# DD_APPROVER_03 — API Endpoints

> **Doc ID:** PRWM-DD-APPROVER-03 | **Version:** 1.0 | **Status:** Released  
> **Last Updated:** 2026-06-17

---

## 1. Controller Setup

- **File:** `src/modules/approver/approver.controller.ts`
- **Base Route:** `/api/v1/approver/payment-requests`
- **Guards:** `@UseGuards(JwtAuthGuard, RolesGuard)` with `@Roles('APPROVER')`

---

## 2. API Endpoints Contract

### 2.1 GET /

List requests assigned to or claimable by the Final Approver (paginated, sortable, filterable).

- **Query Params:** `QueryApproverRequestsDto` (page, pageSize, statusId, branch, dateFrom, dateTo, search, sortBy, sortOrder)
- **Response:** `200 OK` `PaginatedResponse<ApproverRequestListItem>`
- **Logic:** Calls `service.findAssignedRequests(userId, query)`

### 2.2 GET /:id

Get full details of a specific request for Final Approver review. If the request is `SUBMITTED_APPROVER`, opening it automatically starts review.

- **URL Params:** `id` (ParseIntPipe)
- **Response:** `200 OK` `ApproverRequestDetailView`
- **Logic:** Calls `service.findOneForReview(id, userId, auditContext)`

### 2.3 POST /:id/approve

Approve a request that is currently in `APPROVER_REVIEWING`.

- **URL Params:** `id` (ParseIntPipe)
- **Body:** `ApprovePaymentRequestDto`
- **Response:** `200 OK` `{ success: true }`
- **Logic:** Calls `service.approve(id, userId, dto, auditContext)`

### 2.4 POST /:id/reject

Reject a request that is currently in `APPROVER_REVIEWING` and return it to the Applicant.

- **URL Params:** `id` (ParseIntPipe)
- **Body:** `RejectPaymentRequestDto`
- **Response:** `200 OK` `{ success: true }`
- **Logic:** Calls `service.reject(id, userId, dto, auditContext)`

---

## 3. Lookup Endpoints

Located in a shared Lookup controller if needed by the Approver dashboard filters.

- `GET /api/v1/lookups/branches` -> Returns active branch options for filtering.
- `GET /api/v1/lookups/payment-statuses` -> Returns workflow statuses including `SUBMITTED_APPROVER`, `APPROVER_REVIEWING`, `APPROVED`, `REJECTED_APPROVER`.
- `GET /api/v1/lookups/accounting-users` -> Returns users with `role_id=4` if approve action supports direct Accounting assignment.

---

## 4. Cross-References

| Related Document | Purpose |
|-----------------|---------|
| [DD_COMMON_07](../00_common/DD_COMMON_07_AUTH_AND_MIDDLEWARE.md) | `JwtAuthGuard` and `RolesGuard` behavior |
| [DD_APPROVER_04](./DD_APPROVER_04_DTOS_AND_TYPES.md) | Full DTO definitions |
| [DD_APPROVER_05](./DD_APPROVER_05_BUSINESS_LOGIC.md) | Service methods called by these endpoints |
