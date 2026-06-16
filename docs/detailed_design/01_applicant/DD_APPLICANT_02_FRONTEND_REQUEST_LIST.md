# DD_APPLICANT_02 — Frontend Request List (Dashboard)

> **Doc ID:** PRWM-DD-APP-02 | **Version:** 1.0 | **Status:** Released  
> **Last Updated:** 2026-06-16

---

## 1. Overview

The `ApplicantDashboard` is the landing page for the Applicant role. It displays KPI summary cards and a paginated, sortable, filterable list of their payment requests.

- **File Path:** `frontend/src/pages/applicant/ApplicantDashboard.tsx`
- **Route:** `/applicant/dashboard`

---

## 2. Page Layout Structure

```
┌────────────────────────────────────────────────────────┐
│ PageHeader (Title: "申請一覧", Action: "+ 新規作成")   │
├────────────────────────────────────────────────────────┤
│ KpiCardRow (4 cards)                                   │
│ [Draft] [Pending Review] [Returned/Rejected] [Paid]    │
├────────────────────────────────────────────────────────┤
│ FilterSearchBar                                        │
│ [Status Dropdown] [Month Dropdown] [Search Field]      │
├────────────────────────────────────────────────────────┤
│ DataTable                                              │
│ [申請番号] [申請日] [ステータス] [金額] [アクション]   │
└────────────────────────────────────────────────────────┘
```

---

## 3. Component Details

### 3.1 KpiCardRow

Four KPI cards showing counts of requests by status group.

1. **下書き (Drafts):** Count of `DRAFT` (status 1)
2. **確認中 (Pending Review):** Count of statuses `2, 3, 6, 7`
3. **差戻し (Returned):** Count of statuses `5, 9` (Red color)
4. **完了 (Paid):** Count of `PAID` (status 10)

Clicking a KPI card updates the `FilterSearchBar` status dropdown to filter the table.

### 3.2 FilterSearchBar

State managed via `usePaymentRequests` hook.

- **Status Filter:** Select one from `PaymentStatus` (or "All").
- **Month Filter:** Select YYYY-MM based on `application_date`.
- **Search:** Free text search against `request_number` and `purpose`. Debounced by 300ms.

### 3.3 DataTable (RequestTable)

| Column Header | Data Field | Component/Format | Sortable |
|---------------|------------|------------------|----------|
| 申請番号 (Request No) | `requestNumber` | String link to detail page | Yes |
| 申請日 (App Date) | `applicationDate` | `formatDate()` | Yes |
| ステータス (Status) | `statusId` | `StatusBadge` | Yes |
| 目的 (Purpose) | `purpose` | Truncated string (max 30 chars) | No |
| 合計金額 (Amount) | `totalAmount`, `currency` | `CurrencyDisplay` | Yes |
| アクション (Actions) | — | Action buttons (Edit/View/Delete) | No |

**Action Column Rules:**
- If `status === DRAFT | REJECTED_MANAGER | REJECTED_APPROVER`: Show ✏️ (Edit) and 👁️ (View).
- If `status === DRAFT`: Show 🗑️ (Delete).
- Otherwise: Show only 👁️ (View).

---

## 4. State Management Hook (`usePaymentRequests`)

```typescript
// frontend/src/pages/applicant/hooks/usePaymentRequests.ts
import { useState, useEffect, useCallback } from 'react';
import { applicantService } from '../services/applicant.service';
import { usePagination } from '@/hooks/usePagination';

export function usePaymentRequests() {
  const [data, setData] = useState<PaymentRequestListItem[]>([]);
  const [kpiCounts, setKpiCounts] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('createdDate');
  const [sortOrder, setSortOrder] = useState<'ASC'|'DESC'>('DESC');
  
  const { page, pageSize, setPage, setPageSize } = usePagination(10);

  const fetchList = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await applicantService.getRequests({
        page, pageSize, statusId: statusFilter, 
        search: searchQuery, sortBy, sortOrder
      });
      setData(response.data);
      // set meta...
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, statusFilter, searchQuery, sortBy, sortOrder]);

  // Fetch KPI counts separately
  // ...

  useEffect(() => { fetchList(); }, [fetchList]);

  return { 
    data, isLoading, kpiCounts,
    filters: { statusFilter, setStatusFilter, searchQuery, setSearchQuery },
    sorting: { sortBy, sortOrder, setSortBy, setSortOrder },
    pagination: { page, pageSize, setPage, setPageSize },
    refresh: fetchList
  };
}
```

---

## 5. Event Handlers

1. **Row Click:** Navigate to `/applicant/requests/${id}`
2. **Edit Button:** Navigate to `/applicant/requests/${id}/edit`
3. **Delete Button:**
   - Call `useConfirmDialog.open()` with warning "この下書きを削除しますか？"
   - On confirm, call `applicantService.deleteRequest(id)`
   - Call `refresh()` on success and show toast.
4. **Create Button:** Navigate to `/applicant/requests/new`

---

## 6. Real-time Updates (WebSocket)

The dashboard listens to `statusUpdate` events via the `useWebSocket` hook.

```typescript
const { onStatusUpdate } = useWebSocket(userId, 'APPLICANT');

useEffect(() => {
  const unsubscribe = onStatusUpdate((payload) => {
    if (payload.actionByUserId !== userId) {
      // Someone else updated our request (e.g., manager approved)
      showToast('info', `申請 ${payload.requestNumber} のステータスが更新されました`);
      refresh(); // Reload table and KPIs
    }
  });
  return unsubscribe;
}, [onStatusUpdate, refresh]);
```

---

## 7. Cross-References

| Related Document | Purpose |
|-----------------|---------|
| [DD_COMMON_05](../00_common/DD_COMMON_05_SHARED_COMPONENTS.md) | DataTable and KpiCard definitions |
| [DD_APPLICANT_05](./DD_APPLICANT_05_API_ENDPOINTS.md) | `GET /applicant/payment-requests` spec |
