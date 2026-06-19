# DD_ACCOUNTING_03 — API Endpoints

> **Doc ID:** PRWM-DD-ACC-03 | **Version:** 1.0 | **Status:** Released  
> **Last Updated:** 2026-06-17

---

## 1. Controller Setup

- **File:** `src/modules/accounting/accounting.controller.ts`
- **Base Route:** `/api/v1/accounting/payment-requests`
- **Guards:** `@UseGuards(JwtAuthGuard, RolesGuard)` with `@Roles('ACCOUNTING')`

---

## 2. API Endpoints Contract

### 2.1 GET /

List approved payment requests for accounting review.

- **Query Params:** `QueryAccountingRequestsDto` (page, pageSize, statusId, search, sortBy, sortOrder)
- **Response:** `200 OK` `PaginatedResponse<PaymentRequestListItem>`
- **Logic:** Calls `service.findApprovedRequests(query)`

### 2.2 GET /:id

Get full details of a specific request for accounting processing.

- **URL Params:** `id` (ParseIntPipe)
- **Response:** `200 OK` `PaymentRequestDetailView`
- **Logic:** Calls `service.findOneForAccounting(id)`

### 2.3 POST /:id/complete-payment

Complete payment for an approved request.

- **URL Params:** `id` (ParseIntPipe)
- **Body:** `CompletePaymentDto`
- **Response:** `200 OK` `{ success: true }`
- **Logic:** Calls `service.completePayment(id, accountingUserId, dto)`

---

## 3. Lookup Endpoints

Located under the accounting module or shared lookup area if implemented separately.

- `GET /api/v1/lookups/payment-statuses` -> Returns status definitions used by the accounting dashboard.
- `GET /api/v1/lookups/branches` -> Returns branch information used for display and filtering.

---

## 4. Cross-References

| Related Document | Purpose |
|-----------------|---------|
| [DD_ACCOUNTING_04](./DD_ACCOUNTING_04_DTOS_AND_TYPES.md) | Full DTO definitions |
| [DD_ACCOUNTING_05](./DD_ACCOUNTING_05_BUSINESS_LOGIC.md) | Service logic used by the endpoints |
| [DD_COMMON_07](../00_common/DD_COMMON_07_AUTH_AND_MIDDLEWARE.md) | Role guard behavior |
| [DD_COMMON_08](../00_common/DD_COMMON_08_ERROR_HANDLING.md) | Standard error responses |
