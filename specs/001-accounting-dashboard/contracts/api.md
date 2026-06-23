# API Contracts: Accounting Module

Base Route: `/api/v1/accounting/payment-requests`
Guards: `JwtAuthGuard`, `RolesGuard('ACCOUNTING')`

## Endpoints

### 1. List Approved Requests
`GET /`
- **Query Parameters**:
  - `page` (optional, default 1)
  - `pageSize` (optional, default 10)
  - `statusId` (optional, filter by status, e.g. 8 for APPROVED, 10 for PAID)
  - `search` (optional, string)
  - `branch` (optional, string)
- **Response**: `200 OK`
  ```json
  {
    "data": [
      {
        "paymentRequestId": 1,
        "requestNumber": "PRF-2026-001",
        "applicantName": "John Doe",
        "branch": "Yangon",
        "totalAmount": "185000.00",
        "currencyCode": "MMK",
        "statusId": 8,
        "applicationDate": "2026-06-12",
        "desiredPaymentDate": "2026-06-25"
      }
    ],
    "meta": {
      "total": 1,
      "page": 1,
      "lastPage": 1
    }
  }
  ```

### 2. Get Request Details
`GET /:id`
- **URL Parameters**: `id` (integer)
- **Response**: `200 OK` (returns `PaymentRequestDetailView` type containing full breakdown, audit logs, receipt links, and branch guidance).

### 3. Complete Payment
`POST /:id/complete-payment`
- **URL Parameters**: `id` (integer)
- **Body**:
  ```json
  {
    "comment": "Optional completion remark"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "success": true
  }
  ```
