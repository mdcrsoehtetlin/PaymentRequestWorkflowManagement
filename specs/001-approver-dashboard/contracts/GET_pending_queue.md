# API Contract: Get Pending Queue

Retrieves a paginated list of payment requests assigned to or reviewable by the authenticated Final Approver.

- **Endpoint**: `GET /api/v1/approver/payment-requests`
- **Headers**:
  - `Authorization: Bearer <JWT_TOKEN>`
- **Query Parameters**:
  - `page` (optional, default: `1`): Number, current page.
  - `pageSize` (optional, default: `10`): Number, items per page.
  - `statusId` (optional): Number, filter by status ID (`6` for Submitted to Approver, `7` for Approver Reviewing).
  - `search` (optional): String, searches request number, applicant name, and purpose.
  - `branch` (optional): String, filter by applicant branch.
  - `dateFrom` (optional): String (ISO-8601 date), submission range start.
  - `dateTo` (optional): String (ISO-8601 date), submission range end.
  - `sortBy` (optional, default: `'managerVerificationDate'`): Sort field.
  - `sortOrder` (optional, default: `'DESC'`): `'ASC'` or `'DESC'`.

---

## Response Body (200 OK)

```json
{
  "data": [
    {
      "paymentRequestId": 101,
      "requestNumber": "PRF-2026-001",
      "applicant": {
        "userId": 10,
        "fullName": "Hanako Tanaka",
        "employeeNumber": "EMP-00010",
        "branch": "Tokyo Head Office"
      },
      "manager": {
        "userId": 5,
        "fullName": "Ichiro Sato",
        "employeeNumber": "EMP-00005"
      },
      "applicationDate": "2026-06-15",
      "desiredPaymentDate": "2026-06-25",
      "totalAmount": "1500.00",
      "currencyCode": "USD",
      "statusId": 6,
      "purpose": "Office Stationery Supplies",
      "managerVerificationDate": "2026-06-17T08:30:00.000Z",
      "submittedToApproverDate": "2026-06-17T09:00:00.000Z",
      "createdDate": "2026-06-15T02:00:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "pageSize": 10,
    "totalPages": 1
  }
}
```
