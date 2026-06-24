# Quickstart Validation Guide: Audit Log Request Number Display

**Date**: 2026-06-24

## Prerequisites

- Development server running (`npm run start:dev`)
- Admin user account with audit log access
- At least one payment request with audit log entries

## Validation Scenarios

### Scenario 1: Search by Request Number

**Steps**:
1. Login as admin user
2. Navigate to `/admin/audit-logs`
3. Verify search field label shows "リクエスト番号"
4. Enter a known request number (e.g., "PR-2026-001")
5. Wait for debounce (300ms)

**Expected Result**:
- Table filters to show only audit logs for that specific request
- Each row shows the matching request number

### Scenario 2: Partial Search

**Steps**:
1. Clear search field
2. Enter partial request number (e.g., "PR-2026")
3. Wait for debounce

**Expected Result**:
- Table shows all audit logs with request numbers containing "PR-2026"
- Multiple results may appear if multiple requests match

### Scenario 3: No Results

**Steps**:
1. Enter non-existent request number (e.g., "PR-9999-999")
2. Wait for debounce

**Expected Result**:
- Table shows empty state message
- Message: "該当するログが見つかりません"

### Scenario 4: Display Verification

**Steps**:
1. View audit log table
2. Check request number column

**Expected Result**:
- Column header: "リクエスト番号"
- Values: Human-readable format (PR-YYYY-NNN)
- No "PRF-{id}" format visible

### Scenario 5: Detail Panel

**Steps**:
1. Click on any audit log row
2. View detail panel

**Expected Result**:
- Detail panel shows request number
- Request number matches table display

### Scenario 6: API Verification

**Steps**:
1. Open browser DevTools → Network tab
2. Perform search
3. Inspect API response

**Expected Result**:
- Request URL contains `requestNumber` parameter (not `requestId`)
- Response includes `requestNumber` field in each log entry
