# API Contracts: Applicant Dashboard

**Feature**: Applicant Dashboard
**Base Path**: `/api/v1/applicant`

All endpoints require JWT Authentication (`Authorization: Bearer <token>`) and the `APPLICANT` role.

## Endpoints

### 1. `GET /payment-requests`
Fetch paginated list of the applicant's requests.
- **Query Params**:
  - `page` (default: 1)
  - `limit` (default: 10)
  - `statusId` (optional)
  - `dateFrom` (optional)
  - `dateTo` (optional)
  - `search` (optional)
- **Response**: `200 OK`
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "requestNumber": "PRF-2026-000001",
        "totalAmount": "1500.00",
        "statusId": 1,
        "createdDate": "2026-06-19T10:00:00Z"
      }
    ],
    "meta": { "total": 1, "page": 1, "lastPage": 1 }
  }
  ```

### 2. `POST /payment-requests/draft`
Create or update a draft request.
- **Body**: `CreatePaymentRequestDto` (allows partial fields)
- **Response**: `201 Created` / `200 OK` with request ID and generated number.

### 3. `POST /payment-requests/:id/submit-manager`
Submit a draft to a manager.
- **Body**: `SubmitManagerDto`
  ```json
  { "managerId": "uuid" }
  ```
- **Response**: `200 OK`

### 4. `POST /payment-requests/:id/submit-approver`
Submit a manager-verified request to final approver.
- **Response**: `200 OK`

### 5. `DELETE /payment-requests/:id`
Soft-delete a draft.
- **Response**: `204 No Content`

### 6. `POST /payment-requests/:id/receipts`
Upload a receipt file (multipart/form-data).
- **Body**: `file` (binary)
- **Response**: `201 Created` with receipt metadata.

## WebSocket Events

**Namespace**: `/`
**Room**: `applicant_<user_id>`

### Event: `statusUpdate`
Server pushes real-time status changes.
- **Payload**:
  ```json
  {
    "paymentRequestId": "uuid",
    "requestNumber": "PRF-2026-000001",
    "oldStatusId": 1,
    "newStatusId": 2,
    "timestamp": "2026-06-19T10:05:00Z"
  }
  ```
