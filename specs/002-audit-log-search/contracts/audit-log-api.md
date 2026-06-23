# API Contract: Audit Log Query

**Date**: 2026-06-22

## Endpoint

```
GET /api/v1/admin/audit-logs
```

## Authentication

Requires `Bearer` token in `Authorization` header with valid JWT containing `role: 'ADMIN'`.

Protected by `JwtAuthGuard`, `RolesGuard`, and `AdminGuard`.

## Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `startDate` | string (date) | No | Start of date range filter (inclusive). Format: `YYYY-MM-DD` |
| `endDate` | string (date) | No | End of date range filter (inclusive). Format: `YYYY-MM-DD` |
| `actionTypeId` | integer | No | Filter by action type. Must be valid `action_type_id` from `approval_action_types` |
| `requestId` | integer | No | Filter by payment request ID. Must be positive integer |
| `actorName` | string | No | Filter by actor name (partial, case-insensitive). Max 200 chars |
| `page` | integer | No | Page number (default: 1). Must be ≥ 1 |
| `pageSize` | integer | No | Items per page (default: 50). Must be 1-100 |

## Removed Parameters

- `userId` — replaced by `actorName`

## Response

### Success (200 OK)

```json
{
  "data": [
    {
      "approvalLogId": 1,
      "paymentRequestId": 3,
      "actionTakenByUserId": 1,
      "actorName": "Soe Htet Lin",
      "actionTypeId": 3,
      "previousStatusId": 1,
      "newStatusId": 2,
      "comment": null,
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0 ...",
      "timestamp": "2026-06-22T04:30:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 50,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | `BAD_REQUEST` | Invalid parameter values (e.g., negative page, startDate after endDate) |
| 401 | `UNAUTHORIZED` | Missing or invalid JWT token |
| 403 | `FORBIDDEN` | User does not have ADMIN role |
| 500 | `INTERNAL_SERVER_ERROR` | Unexpected server error |

### Error Response Body

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "startDate must not be after endDate",
  "timestamp": "2026-06-22T12:00:00.000Z",
  "path": "/api/v1/admin/audit-logs"
}
```

## Examples

### Request: Filter by action type + date range

```
GET /api/v1/admin/audit-logs?actionTypeId=5&startDate=2026-06-01&endDate=2026-06-30&page=1&pageSize=20
```

### Request: Search by actor name

```
GET /api/v1/admin/audit-logs?actorName=Soe
```

### Request: Combined filters

```
GET /api/v1/admin/audit-logs?requestId=3&actionTypeId=8&startDate=2026-06-01&endDate=2026-06-30
```

## Validation Rules

- `startDate` must not be after `endDate` (if both provided)
- `actionTypeId` must reference an existing row in `approval_action_types`
- `requestId` must be a positive integer; zero and negative values are silently ignored
- `actorName` max length: 200 characters; exceeding truncates to 200
- Empty strings and null parameters are treated as "no filter" (excluded from query)
