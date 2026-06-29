# Quickstart: Admin Screen i18n Integration

**Date**: 2026-06-26
**Feature**: 010-admin-i18n-integration

## Prerequisites

- Node.js 24+ installed
- Frontend dependencies installed (`npm install --legacy-peer-deps` in `frontend/`)
- Backend server running on `http://localhost:3005/`
- Frontend dev server running on `http://localhost:5173/`

## Validation Scenarios

### Scenario 1: User Management Screen Language Switch

1. Navigate to `http://localhost:5173/admin/users`
2. Verify page title shows "ユーザーアカウント管理" (Japanese default)
3. Click the LanguageSwitcher in the header
4. Select "English"
5. **Expected**: Page title changes to "User Account Management", column headers update, filter labels update, button labels update
6. Select "Myanmar"
7. **Expected**: All text updates to Myanmar language
8. Select "Japanese"
9. **Expected**: All text returns to Japanese

### Scenario 2: Master Data Screen Language Switch

1. Navigate to `http://localhost:5173/admin/master-data`
2. Click the LanguageSwitcher, select "English"
3. **Expected**: Category tabs show "Currencies", "Roles", "Statuses", "Payment Types", "Payment Methods"
4. Select "Japanese"
5. **Expected**: Category tabs show "通貨", "役割", "ステータス", "支払タイプ", "支払方法"

### Scenario 3: Audit Logs Screen Language Switch

1. Navigate to `http://localhost:5173/admin/audit-logs`
2. Click the LanguageSwitcher, select "English"
3. **Expected**: Filter labels, column headers, and buttons all show English text
4. Verify "Search" and "Clear Filters" buttons display correctly
5. Select "Myanmar"
6. **Expected**: All text updates to Myanmar

### Scenario 4: Sidebar Labels Language Switch

1. Navigate to any admin screen
2. Click the LanguageSwitcher, select "English"
3. **Expected**: Sidebar shows "User Management", "Master Data", "Audit Logs"
4. Select "Japanese"
5. **Expected**: Sidebar shows "ユーザー管理", "マスターデータ", "監査ログ"

### Scenario 5: User Form Modal Language Switch

1. Navigate to User Management screen
2. Click "New User" button to open the modal
3. Click the LanguageSwitcher, select "English"
4. **Expected**: Modal title, form labels, button text all update to English
5. Close the modal

### Scenario 6: Language Persistence

1. Switch language to English on any admin screen
2. Refresh the page
3. **Expected**: Language remains English (localStorage persistence)
4. Navigate to a different admin screen
5. **Expected**: New screen also displays in English

### Scenario 7: Metadata Detail Panel

1. Navigate to Audit Logs screen
2. Click the eye icon on any log row to open the detail panel
3. Click the LanguageSwitcher, select "English"
4. **Expected**: Panel title "Log Detail", field labels all update to English

## Build Verification

```bash
# From frontend/ directory
npm run lint        # Expected: 0 errors
npm run build       # Expected: 0 TypeScript errors, successful Vite build
```

## Regression Check

- Verify non-admin screens (applicant dashboard, manager dashboard, etc.) are NOT affected by changes
- Verify the LanguageSwitcher still works on non-admin screens
- Verify no console errors in browser developer tools
