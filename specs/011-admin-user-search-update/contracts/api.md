# API Contract: Admin User Search

## GET `/api/v1/admin/users`

**Query Parameters (Updated):**
- `employeeNumber` (optional, string): The numeric employee ID (e.g., "12345"). MUST NOT contain the "EMP-" prefix.
- `employeeName` (optional, string): The partial or full name of the employee.
- `page` (optional, number): Pagination page.
- `limit` (optional, number): Pagination limit.
*(Note: `keyword` query parameter will be deprecated/removed for this endpoint)*

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "employeeNumber": "12345",
      "name": "John Doe",
      ...
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "lastPage": 1
  }
}
```
