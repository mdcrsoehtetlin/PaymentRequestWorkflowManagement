# Data Model: Clear Filters Button

**Date**: 2026-06-25
**Feature**: 006-clear-filters-button

## Entity Changes

**None.** This feature is purely UI — no new entities, no schema changes, no migrations.

## Filter State Shape (Existing — No Changes)

### UserManagementWorkspace

```typescript
interface Filters {
  keyword: string;     // Free-text search by employee number or full name
  roleId: string;      // '' = all, '1'-'5' = specific role
  isActive: string;    // '' = all, 'true' = active, 'false' = inactive
}
```

**Initial values**: `{ keyword: '', roleId: '', isActive: '' }`

### AuditLogWorkspace

```typescript
// Inferred from useState (no explicit interface)
{
  startDate: string;      // Date string or ''
  endDate: string;        // Date string or ''
  actionTypeId: string;   // '' = all, '1'-'10' = specific action
  requestNumber: string;  // PRF- prefix handled by UI, raw value stored
  actorName: string;      // Free-text search
}
```

**Initial values**: `{ startDate: '', endDate: '', actionTypeId: '', requestNumber: '', actorName: '' }`

## Validation Rules

No new validation rules. Existing rules apply:
- `startDate` must be <= `endDate` (AuditLogs only, validated on fetch)
- All fields accept empty string as "no filter" / "show all"
