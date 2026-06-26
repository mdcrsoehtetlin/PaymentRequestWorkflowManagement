# Quickstart: Clear Filters Button for Admin Search Panels

**Date**: 2026-06-26
**Feature**: 006-clear-filters-button

## Prerequisites

- Backend running at `http://localhost:3005` (`npm run start:dev`)
- Frontend running at `http://localhost:5173` (`npm run dev`)
- PostgreSQL database with seed data (users + audit logs)
- Admin user credentials: `admin` / `admin123`

## Validation Scenarios

### Scenario 1: Clear Filters on User Management Screen

1. Navigate to `http://localhost:5173/admin/users`
2. Enter "test" in the keyword filter
3. Select "申請者" from the role dropdown
4. **Verify**: Clear Filters button is visible and enabled (not grayed out)
5. Click the **Clear Filters** button
6. **Verify**: All filter fields reset to empty/placeholder state
7. **Verify**: The user list refreshes to show all users (no filters applied)
8. **Verify**: Clear Filters button becomes disabled/grayed out (no active filters)

### Scenario 2: Clear Filters on Audit Logs Screen

1. Navigate to `http://localhost:5173/admin/audit-logs`
2. Enter "123" in the request number field
3. Enter "admin" in the actor name field
4. Select "承認" from the action type dropdown
5. Set a start date
6. **Verify**: Clear Filters button is visible and enabled
7. Click the **Clear Filters** button
8. **Verify**: All 5 filter fields reset to empty/placeholder state
9. **Verify**: The audit log list refreshes to show all records
10. **Verify**: Clear Filters button becomes disabled/grayed out

### Scenario 3: Clear Filters Resets Date Validation Error

1. Navigate to `http://localhost:5173/admin/audit-logs`
2. Set start date to "2026-12-31" and end date to "2026-01-01"
3. **Verify**: A date validation error message appears ("開始日は終了日より後に設定できません")
4. Click the **Clear Filters** button
5. **Verify**: Both date fields are cleared
6. **Verify**: The date validation error message disappears

### Scenario 4: Clear Filters Button Disabled State

1. Navigate to `http://localhost:5173/admin/users`
2. **Verify**: Clear Filters button is disabled/grayed out (no filters active)
3. Enter any text in the keyword field
4. **Verify**: Clear Filters button becomes enabled
5. Delete the text from the keyword field
6. **Verify**: Clear Filters button becomes disabled again

### Scenario 5: Search + Clear Interaction

1. Navigate to `http://localhost:5173/admin/users`
2. Enter "test" in keyword, select a role
3. Click **Search** (検索) — results filter
4. Click **Clear Filters** — results reset
5. **Verify**: Both buttons function correctly in sequence
6. **Verify**: No duplicate API calls or stale filter state

## Expected Outcomes

- All 5 scenarios pass without errors
- Clear Filters button appears consistently on both admin screens
- Button disabled state correctly reflects whether any filters are active
- API calls are made correctly (with filters on Search, without on Clear)
- Date validation error state is properly cleared on Audit Logs screen
