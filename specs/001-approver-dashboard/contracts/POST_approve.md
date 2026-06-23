# API Contract: Approve Request

Approves a request that is currently in `APPROVER_REVIEWING` status.

- **Endpoint**: `POST /api/v1/approver/payment-requests/:id/approve`
- **Headers**:
  - `Authorization: Bearer <JWT_TOKEN>`
  - `Content-Type: application/json`

---

## Request Body

```json
{
  "comment": "Reimbursement is within department budget. Approved.",
  "accountingUserId": 15
}
```

- **Constraints**:
  - `comment` (optional): String, max 500 characters.
  - `accountingUserId` (optional): Number, ID of the accountant user to assign.

---

## Response Body (200 OK)

```json
{
  "success": true,
  "message": "Request successfully approved."
}
```

---

## Error Responses

### 409 Conflict (Request not in review or already processed)
```json
{
  "statusCode": 409,
  "error": "Conflict",
  "message": "This request has already been processed by another user."
}
```

### 403 Forbidden (Non-approver role trying to access)
```json
{
  "statusCode": 403,
  "error": "Forbidden",
  "message": "Access denied. You do not have the required permissions for this action."
}
```
