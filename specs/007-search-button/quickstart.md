# Quickstart Validation Guide: Search Button

**Feature**: 007-search-button  
**Date**: 2026-06-23  

## Prerequisites

- Frontend dev server running at `http://localhost:5173`
- Admin user logged in (`yemaungmaung@prwm.local` / `Password@123`)

## Validation Scenarios

### Scenario 1: Search Button Triggers Search (User Management)

1. Navigate to **User Account Management** page
2. Enter "test" in the Keyword field
3. Verify: Results do NOT change automatically
4. Click **Search** button
5. Verify: Results update to show only matching users
6. **Expected**: Filtered results displayed

### Scenario 2: Search Button Triggers Search (Audit Logs)

1. Navigate to **Audit Log** page
2. Set date range filter
3. Click **Search** button
4. Verify: Audit logs filtered by date range
5. **Expected**: Filtered audit logs displayed

### Scenario 3: Reset Button Clears Filters

1. Navigate to **User Account Management** page
2. Enter "test" in Keyword field
3. Select "Admin" from Role dropdown
4. Click **Reset** button
5. Verify: Keyword field is empty
6. Verify: Role dropdown shows "All"
7. Verify: Results do NOT change (still show previous search results)
8. **Expected**: Filters cleared, results unchanged

### Scenario 4: Enter Key Triggers Search

1. Navigate to **User Account Management** page
2. Enter "test" in Keyword field
3. Press **Enter** key
4. Verify: Search executes (same as clicking Search button)
5. **Expected**: Results update

### Scenario 5: Loading State

1. Navigate to **User Account Management** page
2. Click **Search** button
3. Verify: Search button shows loading indicator
4. Verify: Search button is disabled during loading
5. **Expected**: Clear loading feedback

### Scenario 6: No Results

1. Navigate to **User Account Management** page
2. Enter "xyznonexistent" in Keyword field
3. Click **Search** button
4. Verify: "No users found" message displayed
5. **Expected**: Empty state handled gracefully

## Success Criteria

- All 6 scenarios pass
- No console errors
- Search button follows design system (blue-900, focus:ring-indigo-500)
- Keyboard accessible (Tab to button, Enter to activate)
