# Research: Clear Filters Button

**Date**: 2026-06-25
**Feature**: 006-clear-filters-button

## Research Items

### 1. Existing Button Styling Pattern

**Decision**: Reuse the exact same `className` as the existing Search button for the Clear Filters button, with disabled state styling.

**Rationale**: Both screens use identical button styling:
```
flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed
```
The Clear Filters button should use a secondary/ghost variant to visually distinguish it from the primary Search button, while maintaining design system consistency.

**Alternatives considered**:
- Using a completely different button style (e.g., outlined/ghost) — rejected because the project uses bg-blue-900 as the standard button pattern
- Creating a shared `ClearFiltersButton` component — rejected because only 2 screens use it; YAGNI applies

### 2. Filter State Reset Pattern

**Decision**: Use `setFilters` to reset to initial empty-string values for all fields, then call `handleSearch()` to trigger a fresh fetch.

**Rationale**: Both screens already use `useState` with empty-string initial values. The reset pattern is straightforward:
- UserManagement: `setFilters({ keyword: '', roleId: '', isActive: '' })`
- AuditLogs: `setFilters({ startDate: '', endDate: '', actionTypeId: '', requestNumber: '', actorName: '' })`

**Alternatives considered**:
- Creating a `clearFilters` utility function — rejected because the initial values differ between screens and the inline approach is clearer
- Using `useReducer` with a `CLEAR` action — rejected because it would require refactoring existing state management, which is out of scope

### 3. Button Disabled State Logic

**Decision**: Compute `hasActiveFilters` by checking if any filter field differs from its initial empty-string value. Button is disabled when `!hasActiveFilters || isLoading`.

**Rationale**: This satisfies FR-006 (disabled when no filters active) and FR-007 (disabled during loading). The computation is simple and local to each component — no shared utility needed.

**Alternatives considered**:
- Comparing current filters to initial values deep-equality — unnecessary since all fields are strings and initial values are all `''`
- Tracking a separate `isDirty` flag — rejected because it adds state that can drift from actual filter values

### 4. Audit Logs Date Error Clearing

**Decision**: In AuditLogWorkspace, the `clearFilters` handler also calls `setDateError('')` to clear any displayed validation error.

**Rationale**: FR-008 requires clearing date validation errors on filter reset. The `dateError` state is already managed separately and must be reset alongside filter fields.

**Alternatives considered**:
- Relying on the next fetch to clear the error — rejected because the error message would persist visually until the fetch completes, creating confusion
