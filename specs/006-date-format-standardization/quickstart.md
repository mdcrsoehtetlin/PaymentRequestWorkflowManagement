# Quickstart: Date Format Standardization

**Feature**: 006-date-format-standardization
**Purpose**: Validate that date formatting works correctly across all screens

## Prerequisites

- Backend running on `http://localhost:3005`
- Frontend running on `http://localhost:5173`
- Admin user logged in (`yemaungmaung@prwm.local` / `Password@123`)

## Validation Scenarios

### Scenario 1: Utility Function Format

1. Open browser DevTools console
2. Verify `formatDate('2026-05-28')` returns `2026/5/28` (no zero-padding)
3. Verify `formatDateTime('2026-05-28T10:30:00Z')` returns `2026/5/28 HH:mm:ss` format
4. Verify `formatDate(null)` returns `—`
5. Verify `formatDate('')` returns `—`

### Scenario 2: Audit Log Timestamps

1. Navigate to **Admin → Audit Logs**
2. Verify the **Timestamp** column shows dates as `YYYY/M/D HH:mm:ss`
3. Verify no zero-padded months or days (e.g., `5/28` not `05/28`)
4. Verify forward slash `/` separator (not dash `-` or dot `.`)

### Scenario 3: MetadataDetailPanel

1. Navigate to **Admin → Audit Logs**
2. Click the **View Details** (eye icon) on any log entry
3. Verify the **Timestamp** field in the detail panel shows `YYYY/M/D HH:mm:ss`

### Scenario 4: User Management Dates

1. Navigate to **Admin → User Management**
2. Verify **Created Date**, **Modified Date**, and **Last Login** columns use the standardized format

### Scenario 5: Master Data Dates

1. Navigate to **Admin → Master Data Settings**
2. Click **Statuses** tab
3. Verify **Created Date** and **Modified Date** columns use the standardized format
4. Repeat for **Roles**, **Payment Types**, **Payment Methods**, **Currencies** tabs

### Scenario 6: Approval Timeline

1. Navigate to any payment request detail with approval history
2. Verify timestamps in the approval timeline use the standardized format

## Expected Outcomes

- All dates display as `YYYY/M/D` (no zero-padding)
- All date-times display as `YYYY/M/D HH:mm:ss`
- Empty/null dates display as `—`
- Zero instances of old formats (`YYYY-MM-DD`, `MM/DD/YYYY`, zero-padded dates)
