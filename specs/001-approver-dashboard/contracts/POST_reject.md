# API Contract: Reject Request

Rejects a request that is currently in `APPROVER_REVIEWING` status and returns it to the Applicant.

- **Endpoint**: `POST /api/v1/approver/payment-requests/:id/reject`
- **Headers**:
  - `Authorization: Bearer <JWT_TOKEN>`
  - `Content-Type: application/json`

---

## Request Body

```json
{
  "comment": "Rejection reason: Item 2 unit price does not match standard rates."
}
```

- **Constraints**:
  - `comment` (mandatory): String, minimum 10 characters, maximum 500 characters.

---

## Response Body (200 OK)

```json
{
  "success": true,
  "message": "Request successfully rejected and returned to applicant."
}
```

---

## Error Responses

### 400 Bad Request (Validation fails, e.g. comment too short)
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Rejection comment is mandatory and must be at least 10 characters long."
}
```

### 409 Conflict (Request state has changed)
```json
{
  "statusCode": 409,
  "error": "Conflict",
  "message": "This request has already been processed by another user."
}
```
