# Interface Contracts: Applicant Dashboard

This document details the REST API endpoints and WebSocket events exposed by the Applicant module.

## REST API Endpoints

**Base URL:** `/api/v1/applicant`
**Authentication:** JWT Bearer Token required. `APPLICANT` role required.

### 1. Payment Requests (CRUD & Workflows)

#### `GET /payment-requests`
Retrieve a paginated, filterable list of non-deleted payment requests.
- **Query Params:** 
  - `page` (number, default 1)
  - `pageSize` (number, default 10)
  - `statusId` (optional number)
  - `dateFrom` (optional string, YYYY-MM-DD)
  - `dateTo` (optional string, YYYY-MM-DD)
  - `minAmount` (optional number)
  - `maxAmount` (optional number)
  - `search` (optional string, request_number prefix)
- **Response:** Paginated format with `data` array and `meta` pagination object.

#### `GET /payment-requests/:id`
Retrieve detailed view of a single payment request including breakdown items, receipt files, and approval history.
- **Response:** Detailed Payment Request JSON payload.

#### `POST /payment-requests`
Create a new payment request (Save as Draft).
- **Body:** `CreatePaymentRequestDto` (contains fields and breakdown items; validation is relaxed for draft).
- **Response:** Created Payment Request object.

#### `PATCH /payment-requests/:id`
Update an existing draft or rejected payment request.
- **Body:** `UpdatePaymentRequestDto`.
- **Response:** Updated Payment Request object.

#### `DELETE /payment-requests/:id`
Soft-delete a DRAFT payment request.
- **Response:** 204 No Content.

#### `POST /payment-requests/:id/submit-to-manager`
Submit a payment request to the Manager. Strict validation applies here.
- **Body:** `{ managerId: number }` (if not already set in draft).
- **Response:** Updated Payment Request object with `SUBMITTED_MANAGER` status.

#### `POST /payment-requests/:id/submit-to-approver`
Submit a Manager-Verified payment request to the Final Approver.
- **Response:** Updated Payment Request object with `SUBMITTED_APPROVER` status.

### 2. Receipt Files

#### `POST /payment-requests/:id/receipts`
Upload a new receipt file to a payment request.
- **Body:** `multipart/form-data` with `file` field.
- **Response:** Created Receipt File metadata.

#### `DELETE /payment-requests/:id/receipts/:receiptId`
Soft-delete a receipt file.
- **Response:** 204 No Content.

## WebSocket Events

**Namespace/Hub:** General connection on port `3001`
**Authentication:** JWT Token in `auth.token` handshake.

### Emitted to Applicant Client
- `request:status-changed`
  - **Payload:** `{ requestId, oldStatus, newStatus, updatedBy }`
  - **Trigger:** Manager or Approver changes the status of a request.
- `request:rejected`
  - **Payload:** `{ requestId, requestNumber, rejectedBy, comment }`
  - **Trigger:** Manager or Approver rejects a request.
- `request:payment-completed`
  - **Payload:** `{ requestId, requestNumber }`
  - **Trigger:** Accounting marks request as paid.
