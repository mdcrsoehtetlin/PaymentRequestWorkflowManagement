# Quickstart Validation Guide: Search Button for Admin Screens

**Date**: 2026-06-24

## Prerequisites

- Development server running (`npm run start:dev`)
- Admin user account with access to user management and audit logs

## Validation Scenarios

### Scenario 1: User Management - Search Button

**Steps**:
1. Login as admin user
2. Navigate to `/admin/users`
3. Verify "検索" button is visible next to filter fields
4. Enter "テスト" in keyword field
5. Click "検索" button

**Expected Result**:
- Results filter to show only matching users
- Button is disabled during loading
- Results appear within 1 second

### Scenario 2: User Management - Enter Key

**Steps**:
1. Navigate to `/admin/users`
2. Enter "テスト" in keyword field
3. Press Enter key

**Expected Result**:
- Search triggers (same as clicking button)
- Results filter to show only matching users

### Scenario 3: User Management - Initial Load

**Steps**:
1. Navigate to `/admin/users`
2. Observe initial page load

**Expected Result**:
- All users are displayed on initial load
- No empty state shown

### Scenario 4: Audit Logs - Search Button

**Steps**:
1. Navigate to `/admin/audit-logs`
2. Verify "検索" button is visible next to filter fields
3. Enter "PR-2026" in request number field
4. Click "検索" button

**Expected Result**:
- Results filter to show only matching audit logs
- Button is disabled during loading

### Scenario 5: Audit Logs - Enter Key

**Steps**:
1. Navigate to `/admin/audit-logs`
2. Enter "PR-2026" in request number field
3. Press Enter key

**Expected Result**:
- Search triggers (same as clicking button)
- Results filter to show only matching audit logs

### Scenario 6: Empty Filters Search

**Steps**:
1. Navigate to `/admin/users`
2. Clear all filter fields
3. Click "検索" button

**Expected Result**:
- All users are displayed (default view)
