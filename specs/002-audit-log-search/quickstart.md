# Quickstart: Audit Log Search Enhancement

**Date**: 2026-06-22

## Prerequisites

- Backend server running on `http://localhost:3005`
- Frontend dev server running on `http://localhost:5173`
- Admin user logged in with role `ADMIN` (e.g., `yemaungmaung@prwm.local`)
- Database has sample data in `approval_logs` table (created during normal workflow operations)

## Setup

No database migrations or new dependencies required. The feature only modifies existing code.

## Verification Scenarios

### 1. Action Type Filter

1. Navigate to `/admin/audit-logs`
2. Verify the Action Type dropdown is visible with Japanese labels: 作成, 編集, 提出, マネージャー確認開始, マネージャー確認, マネージャー差戻し, 承認者確認開始, 承認, 承認者差戻し, 支払完了
3. Select "承認" (actionTypeId=8)
4. Verify only logs with action type "Approved" are displayed
5. Clear the filter
6. Verify all logs are displayed again

**API test**:
```bash
curl -H "Authorization: Bearer <token>" "http://localhost:3005/api/v1/admin/audit-logs?actionTypeId=8"
```

### 2. Request ID Search

1. Enter a valid payment request ID (e.g., `3`) in the Request ID field
2. Verify only logs for that payment request appear
3. Enter a non-existent ID
4. Verify empty state: "該当するログが見つかりません"

**API test**:
```bash
curl -H "Authorization: Bearer <token>" "http://localhost:3005/api/v1/admin/audit-logs?requestId=3"
```

### 3. Actor Name Search (Replaces userId)

1. Verify the old numeric userId field is gone
2. Type a partial actor name (e.g., "Soe") in the 実行者名 field
3. Verify logs where actor name contains "Soe" are displayed (case-insensitive)
4. Type a name with no matches
5. Verify empty state message

**API test**:
```bash
curl -H "Authorization: Bearer <token>" "http://localhost:3005/api/v1/admin/audit-logs?actorName=Soe"
```

### 4. Auto-Debounced Search

1. Open browser DevTools → Network tab
2. Change any filter value (e.g., select an action type)
3. Verify no API request fires immediately
4. After ~300ms, verify exactly one API request fires
5. Rapidly change multiple filters
6. Verify only one request fires after the last change (debounce coalescing)

### 5. Date Range Validation

1. Set Start Date after End Date
2. Verify an inline error message appears: "開始日は終了日より後に設定できません"
3. Verify no API request is sent

### 6. Combined Filters

1. Apply multiple filters simultaneously: action type + date range + request ID + actor name
2. Verify the grid shows logs matching ALL criteria (AND logic)

**API test**:
```bash
curl -H "Authorization: Bearer <token>" "http://localhost:3005/api/v1/admin/audit-logs?actionTypeId=5&requestId=3&actorName=Soe&startDate=2026-06-01&endDate=2026-06-30"
```

## Expected Outcomes

| Scenario | Expected Result |
|----------|----------------|
| Action type filter | Grid filtered to matching action_type_id |
| Request ID search | Grid filtered to matching payment_request_id |
| Actor name search | Grid filtered to matching actor full_name (ILIKE) |
| Debounce | 1 request per filter change sequence after 300ms |
| Date validation | Inline error, no request sent |
| Combined filters | All filters applied with AND logic |
| Empty results | "該当するログが見つかりません" displayed |
| No userId field | Numeric userId input not present in UI |
