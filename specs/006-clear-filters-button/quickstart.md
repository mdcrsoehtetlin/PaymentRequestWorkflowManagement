# Quickstart Validation: Clear Filters Button

**Date**: 2026-06-25
**Feature**: 006-clear-filters-button

## Prerequisites

- Application running (`npm run start:dev` for backend, `npm run dev` for frontend)
- Admin user logged in
- Navigate to Admin > User Management or Admin > Audit Logs

## Validation Scenarios

### Scenario 1: Clear Filters — User Management

1. Navigate to User Management screen
2. Type "test" in the keyword field
3. Select "申請者" from the role dropdown
4. Click Search — verify filtered results appear
5. **Click Clear Filters** — verify:
   - Keyword field is empty
   - Role dropdown shows "すべて"
   - Status dropdown shows "すべて"
   - Full user list is displayed (not filtered)
   - Pagination shows page 1

### Scenario 2: Clear Filters — Audit Logs

1. Navigate to Audit Logs screen
2. Enter "001" in the request number field
3. Select "承認" from the action type dropdown
4. Set start date to 2026-01-01
5. Click Search — verify filtered results appear
6. **Click Clear Filters** — verify:
   - Request number field is empty
   - Actor name field is empty
   - Action type shows "すべて"
   - Start date is empty
   - End date is empty
   - Date error message (if any) is cleared
   - Full audit log is displayed
   - Pagination shows page 1

### Scenario 3: Disabled State — No Filters Active

1. Navigate to either screen with no filters applied
2. **Verify**: Clear Filters button is visible but grayed out (disabled)
3. Verify clicking the disabled button has no effect

### Scenario 4: Disabled State — Loading

1. Apply a filter and click Search
2. **During loading**: Verify Clear Filters button is disabled
3. After loading completes: Verify button state reflects whether filters are active

### Scenario 5: Clear Then Search

1. Apply filters and click Search
2. Click Clear Filters — verify full dataset loads
3. Modify a filter field — verify Clear Filters button becomes enabled
4. Click Clear Filters again — verify full dataset loads again

## Expected Outcomes

- All scenarios pass without errors in browser console
- No layout shift when Clear Filters button appears/disappears (it's always visible)
- Button styling matches the existing Search button (bg-blue-900, rounded-lg, etc.)
- Disabled state uses `opacity-50` and `cursor-not-allowed` per existing pattern
