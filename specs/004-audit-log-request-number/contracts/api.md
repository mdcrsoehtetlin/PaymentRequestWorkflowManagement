# API Contract: Audit Log Search

## Endpoint

```
GET /admin/audit-logs
```

## Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| startDate | string (ISO 8601 date) | No | - | Filter logs from this date |
| endDate | string (ISO 8601 date) | No | - | Filter logs to this date |
| actionTypeId | integer | No | - | Filter by action type ID |
| requestNumber | string | No | - | Search by request number (partial match, case-insensitive) |
| actorName | string | No | - | Search by actor name (partial match) |
| page | integer | No | 1 | Page number |
| pageSize | integer | No | 50 | Items per page (max 100) |

## Response

### Success (200)

```json
{
  "data": [
    {
      "approvalLogId": "uuid-string",
      "paymentRequestId": 123,
      "requestNumber": "PR-2026-001",
      "actionTakenByUserId": 456,
      "actorName": "John Doe",
      "actionTypeId": 5,
      "previousStatusId": 2,
      "newStatusId": 3,
      "comment": "Approved after review",
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "timestamp": "2026-06-24T10:30:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 50,
    "totalItems": 150,
    "totalPages": 3
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| data[].approvalLogId | string | Unique audit log identifier |
| data[].paymentRequestId | integer | Internal payment request ID |
| data[].requestNumber | string \| null | Human-readable request number (null if payment request deleted) |
| data[].actionTakenByUserId | integer | User ID who performed the action |
| data[].actorName | string | Full name of the actor |
| data[].actionTypeId | integer | Action type ID (see ACTION_LABELS mapping) |
| data[].previousStatusId | integer \| null | Status before transition |
| data[].newStatusId | integer \| null | Status after transition |
| data[].comment | string \| null | Action comment |
| data[].ipAddress | string | Client IP address |
| data[].userAgent | string | Client user agent string |
| data[].timestamp | string (ISO 8601) | When the action occurred |
| meta.page | integer | Current page number |
| meta.pageSize | integer | Items per page |
| meta.totalItems | integer | Total matching items |
| meta.totalPages | integer | Total pages |

## Example Requests

### Search by Request Number

```
GET /admin/audit-logs?requestNumber=PR-2026-001
```

### Partial Search

```
GET /admin/audit-logs?requestNumber=PR-2026
```

### Combined Filters

```
GET /admin/audit-logs?requestNumber=PR-2026&actionTypeId=5&startDate=2026-01-01
```

## Error Responses

### 400 Bad Request

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": ["requestNumber must be a string"],
  "timestamp": "2026-06-24T10:30:00.000Z",
  "path": "/admin/audit-logs"
}
```

### 401 Unauthorized

```json
{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Invalid or expired token",
  "timestamp": "2026-06-24T10:30:00.000Z",
  "path": "/admin/audit-logs"
}
```

### 403 Forbidden

```json
{
  "statusCode": 403,
  "error": "Forbidden",
  "message": "Insufficient permissions",
  "timestamp": "2026-06-24T10:30:00.000Z",
  "path": "/admin/audit-logs"
}
```
