# DD_APPLICANT_05 — API Endpoints

> **Doc ID:** PRWM-DD-APP-05 | **Version:** 1.0 | **Status:** Released  
> **Last Updated:** 2026-06-16

---

## 1. Controller Setup

- **File:** `src/modules/applicant/applicant.controller.ts`
- **Base Route:** `/api/v1/applicant/payment-requests`
- **Guards:** `@UseGuards(JwtAuthGuard, RolesGuard)` with `@Roles('APPLICANT')`

---

## 2. API Endpoints Contract

### 2.1 GET /

List own payment requests (paginated, sortable, filterable).

- **Query Params:** `QueryPaymentRequestsDto` (page, pageSize, statusId, search, sortBy, sortOrder)
- **Response:** `200 OK` `PaginatedResponse<PaymentRequestListItem>`
- **Logic:** Calls `service.findMyRequests(userId, query)`

### 2.2 GET /:id

Get full details of a specific request.

- **URL Params:** `id` (ParseIntPipe)
- **Guards:** `OwnershipGuard`
- **Response:** `200 OK` `PaymentRequestDetailView`
- **Logic:** Calls `service.findOneWithDetails(id, userId)`

### 2.3 POST /

Create a new draft payment request.

- **Body:** `CreatePaymentRequestDto` (Validation group: `draft`)
- **Response:** `201 Created` `{ paymentRequestId, requestNumber }`
- **Logic:** Calls `service.createDraft(userId, dto)`

### 2.4 PATCH /:id

Update an existing request (must be `DRAFT` or `REJECTED_*`).

- **URL Params:** `id` (ParseIntPipe)
- **Guards:** `OwnershipGuard`
- **Body:** `UpdatePaymentRequestDto` (Validation group: `draft`)
- **Response:** `200 OK` `{ success: true }`
- **Logic:** Calls `service.updateDraft(id, userId, dto)`

### 2.5 POST /:id/submit-manager

Submit a draft/rejected request to the Manager.

- **URL Params:** `id` (ParseIntPipe)
- **Guards:** `OwnershipGuard`
- **Body:** `SubmitToManagerDto` (Validation group: `submit`)
- **Response:** `200 OK` `{ success: true }`
- **Logic:** Calls `service.submitToManager(id, userId, dto)`

### 2.6 POST /:id/withdraw

Withdraw a submitted request back to draft (only if status is `SUBMITTED_MANAGER`).

- **URL Params:** `id` (ParseIntPipe)
- **Guards:** `OwnershipGuard`
- **Body:** None
- **Response:** `200 OK` `{ success: true }`
- **Logic:** Calls `service.withdraw(id, userId)`

### 2.7 DELETE /:id

Soft delete a draft request.

- **URL Params:** `id` (ParseIntPipe)
- **Guards:** `OwnershipGuard`
- **Response:** `200 OK` `{ success: true }`
- **Logic:** Calls `service.softDelete(id, userId)`

### 2.8 POST /:id/files

Upload a receipt file.

- **URL Params:** `id` (ParseIntPipe)
- **Guards:** `OwnershipGuard`
- **Middleware:** `FileInterceptor('file')`
- **Response:** `201 Created` `ReceiptFile`
- **Logic:** Validates file, saves to `uploads/:id/`, inserts `ReceiptFile` record.

### 2.9 DELETE /:id/files/:fileId

Delete a receipt file.

- **URL Params:** `id`, `fileId` (ParseIntPipe)
- **Guards:** `OwnershipGuard`
- **Response:** `200 OK` `{ success: true }`
- **Logic:** Soft deletes `ReceiptFile` record.

---

## 3. Lookup Endpoints

Located in `src/modules/applicant/applicant.controller.ts` (or a shared Lookup controller if preferred).

- `GET /api/v1/lookups/currencies` -> Returns `[{id:1, code:'MMK', name:'Kyat'}, ...]`
- `GET /api/v1/lookups/payment-types`
- `GET /api/v1/lookups/payment-methods`
- `GET /api/v1/lookups/managers/:branchId` -> Returns users with `role_id=2` for the branch.

---

## 4. Cross-References

| Related Document | Purpose |
|-----------------|---------|
| [DD_COMMON_07](../00_common/DD_COMMON_07_AUTH_AND_MIDDLEWARE.md) | `OwnershipGuard` behavior |
| [DD_APPLICANT_06](./DD_APPLICANT_06_DTOS_AND_TYPES.md) | Full DTO definitions |
