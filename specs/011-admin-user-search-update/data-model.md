# Data Model

No new database entities or schema changes are required.

## Target Entity: `User` (Shared Layer)
Existing fields involved in the search:
- `employee_number` (string or integer, representing the numeric ID)
- `name` (string, representing the employee's full name)

## Validation Rules
- `employeeNumber`: Numeric string. If the user accidentally types "EMP-123", the frontend UI MUST strip "EMP-" before sending to the backend.
- `employeeName`: Alphanumeric string. Partial matches allowed (SQL `LIKE %name%`).
