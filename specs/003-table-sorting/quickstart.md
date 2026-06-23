# Quickstart: Table Sorting for Admin Workspaces

**Date**: 2026-06-22

## Prerequisites

- Frontend dev server running at `http://localhost:5173`
- Login as admin (`yemaungmaung@prwm.local`)

## Validation Scenarios

### 1. Audit Log Sort

1. Navigate to `監査ログ` (Audit Log) workspace
2. Click **日時** column header → table sorts by timestamp ascending (ChevronUp icon visible)
3. Click **日時** again → table sorts by timestamp descending (ChevronDown icon visible)
4. Click **リクエストID** → sort switches to paymentRequestId ascending, icon moves
5. Change a filter → sort order preserved on re-fetched data

### 2. User Management Sort

1. Navigate to `ユーザーアカウント管理` (User Management) workspace
2. Click **氏名** header → users sort by `fullName` ascending (ChevronUp icon visible)
3. Click **氏名** again → descending (ChevronDown icon visible)
4. Click **社員番号** → sort switches to `employeeNumber`, pagination resets to page 1
5. Change page → sort order preserved on the new page

## Expected Outcome

Both tables have clickable, visually-indicated sort headers that toggle ascending/descending on click. No page reload, no loading state.
