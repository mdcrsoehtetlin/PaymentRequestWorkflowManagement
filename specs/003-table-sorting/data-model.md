# Data Model: Table Sorting for Admin Workspaces

**Date**: 2026-06-22

No new data entities. The feature reuses existing types:

- `AuditLogRecord` — defined in `AuditLogWorkspace.tsx` (fields: `approvalLogId`, `paymentRequestId`, `actionTakenByUserId`, `actorName`, `actionTypeId`, `previousStatusId`, `newStatusId`, `comment`, `ipAddress`, `userAgent`, `timestamp`)
- `UserRecord` — defined in `UserManagementWorkspace.tsx` (fields: `userId`, `employeeNumber`, `fullName`, `email`, `branch`, `roleId`, `isActive`, `version`)

No database changes, no DTOs, no API contract changes.
