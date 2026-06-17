# DD_APPROVER_02 — Frontend Page Specification

> **Doc ID:** PRWM-DD-APPROVER-02 | **Version:** 1.0 | **Status:** Released  
> **Last Updated:** 2026-06-17

---

## 1. Overview

The Approver frontend provides the Final Approver dashboard and request detail screens. The dashboard displays KPI summary cards and a paginated, sortable, filterable queue of requests submitted for final approval. The detail page displays full read-only request information, approval history, and contextual approve/reject actions.

- **Dashboard File Path:** `frontend/src/pages/approver/ApproverDashboard.tsx`
- **Dashboard Route:** `/approver/dashboard`
- **Detail File Path:** `frontend/src/pages/approver/ApproverRequestDetail.tsx`
- **Detail Route:** `/approver/requests/:id`

---

## 2. Page Layout Structure

### 2.1 Approver Dashboard

```
┌──────────────────────────────────────────────────────────┐
│ PageHeader (Title: "Approver Dashboard")                 │
├──────────────────────────────────────────────────────────┤
│ KpiCardRow (4 cards)                                     │
│ [Awaiting Review] [Reviewing] [Approved] [Rejected]      │
├──────────────────────────────────────────────────────────┤
│ FilterSearchBar                                          │
│ [Status Dropdown] [Branch] [Date Range] [Search Field]   │
├──────────────────────────────────────────────────────────┤
│ DataTable                                                │
│ [Request No] [Applicant] [Status] [Amount] [Actions]     │
└──────────────────────────────────────────────────────────┘
```

### 2.2 Approver Request Detail

The layout is a 2-column design on desktop: Left column (Main Content, 70%), Right column (Actions & Timeline, 30%).

```
┌──────────────────────────────────────────────────────────┐
│ PageHeader (Request Number, StatusBadge, Back Button)    │
├────────────────────────────────────┬─────────────────────┤
│ [Card: Request Information]        │ [Action Card]       │
│ Applicant, payment, branch, amount │ Approve / Reject    │
├────────────────────────────────────┼─────────────────────┤
│ [Card: Breakdown Items]            │ [Timeline Card]     │
│ DataTable (Date, Description, Amt) │ Approval Logs List  │
├────────────────────────────────────┤                     │
│ [Card: Receipt Files]              │                     │
│ List of files with Download links  │                     │
└────────────────────────────────────┴─────────────────────┘
```

---

## 3. Component Details

### 3.1 KpiCardRow

Four KPI cards showing counts by Approver status group.

1. **Awaiting Review:** Count of `SUBMITTED_APPROVER` (status 6)
2. **Reviewing:** Count of `APPROVER_REVIEWING` (status 7)
3. **Approved:** Count of `APPROVED` (status 8)
4. **Rejected:** Count of `REJECTED_APPROVER` (status 9)

Clicking a KPI card updates the `FilterSearchBar` status dropdown to filter the table.

### 3.2 FilterSearchBar

State managed via `useApproverRequests` hook.

- **Status Filter:** Select one from Approver-related `PaymentStatus` values, or "All".
- **Branch Filter:** Select active branch options from lookup data.
- **Date Range Filter:** Filter by manager verification or submitted-to-approver date.
- **Search:** Free text search against `requestNumber`, applicant name, and purpose. Debounced by 300ms.

### 3.3 DataTable (ApproverRequestTable)

| Column Header | Data Field | Component/Format | Sortable |
|---------------|------------|------------------|----------|
| Request No | `requestNumber` | String link to detail page | Yes |
| Applicant | `applicant` | User display name / employee code | Yes |
| Manager | `manager` | User display name | No |
| Status | `statusId` | `StatusBadge` | Yes |
| Purpose | `purpose` | Truncated string (max 30 chars) | No |
| Amount | `totalAmount`, `currencyCode` | `CurrencyDisplay` | Yes |
| Actions | - | View button | No |

**Action Column Rules:**
- If `status === SUBMITTED_APPROVER | APPROVER_REVIEWING`: Show View action.
- If `status === APPROVED | REJECTED_APPROVER`: Show read-only View action.
- Row click navigates to `/approver/requests/${id}`.

### 3.4 RequestInfoSection

Read-only grid display of the `PaymentRequest` entity fields and Manager verification information. Uses `<dl>`, `<dt>`, `<dd>` HTML tags for semantic layout.

### 3.5 BreakdownItems Display

Renders a standard `DataTable` component without sorting or pagination. Footer row displays total amount formatted with `CurrencyDisplay`.

### 3.6 ReceiptFiles Display

Renders a list of `ReceiptFile` records. Each row shows:
- Document icon
- `originalFileName`
- `fileSize` (formatted)
- Download button (triggers `window.open(file.fileStoragePath)`)

### 3.7 ApproverActionPanel

Shows contextual Approve and Reject buttons only when the request is in `APPROVER_REVIEWING`.

| Current Status | Available Actions | API Call | Post-Action Behavior |
|----------------|-------------------|----------|----------------------|
| `SUBMITTED_APPROVER` (6) | None | GET `/api/v1/approver/payment-requests/:id` | Backend starts review and detail refreshes as `APPROVER_REVIEWING` |
| `APPROVER_REVIEWING` (7) | Approve<br>Reject | POST `.../:id/approve`<br>POST `.../:id/reject` | Stay on detail and `refresh()` |
| `APPROVED` (8) | None | - | Read-only view |
| `REJECTED_APPROVER` (9) | None | - | Read-only view |

All approve/reject actions trigger `ConfirmDialog` before execution. Reject requires a valid comment before the API call is sent.

### 3.8 ApprovalTimeline

Uses the shared `ApprovalTimeline` component from `DD_COMMON_05`. Feeds `data.approvalLogs` into the timeline and highlights Manager and Approver comments.

---

## 4. State Management Hooks

### 4.1 `useApproverRequests`

```typescript
// frontend/src/pages/approver/hooks/useApproverRequests.ts
import { useState, useEffect, useCallback } from 'react';
import { approverService } from '../services/approver.service';
import { usePagination } from '@/hooks/usePagination';

export function useApproverRequests() {
  const [data, setData] = useState<ApproverRequestListItem[]>([]);
  const [kpiCounts, setKpiCounts] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState<number | null>(null);
  const [branchFilter, setBranchFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('managerVerificationDate');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  const { page, pageSize, setPage, setPageSize } = usePagination(10);

  const fetchList = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await approverService.getRequests({
        page, pageSize, statusId: statusFilter, branch: branchFilter,
        search: searchQuery, sortBy, sortOrder
      });
      setData(response.data);
      // set meta and KPI counts...
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, statusFilter, branchFilter, searchQuery, sortBy, sortOrder]);

  useEffect(() => { fetchList(); }, [fetchList]);

  return {
    data, isLoading, kpiCounts,
    filters: { statusFilter, setStatusFilter, branchFilter, setBranchFilter, searchQuery, setSearchQuery },
    sorting: { sortBy, sortOrder, setSortBy, setSortOrder },
    pagination: { page, pageSize, setPage, setPageSize },
    refresh: fetchList
  };
}
```

### 4.2 `useApproverRequestDetail`

```typescript
// frontend/src/pages/approver/hooks/useApproverRequestDetail.ts
export function useApproverRequestDetail(id: number) {
  const [data, setData] = useState<ApproverRequestDetailView | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDetail = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await approverService.getRequest(id);
      setData(response.data);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  return { data, isLoading, refresh: fetchDetail };
}
```

---

## 5. Event Handlers

1. **Row Click:** Navigate to `/approver/requests/${id}`.
2. **View Button:** Navigate to `/approver/requests/${id}`.
3. **Approve Button:**
   - Call `useConfirmDialog.open()` with approval confirmation.
   - On confirm, call `approverService.approve(id, dto)`.
   - Call `refresh()` on success and show toast.
4. **Reject Button:**
   - Open rejection dialog with mandatory comment field.
   - Validate comment length before submit.
   - On confirm, call `approverService.reject(id, dto)`.
   - Call `refresh()` on success and show toast.
5. **Back Button:** Navigate to `/approver/dashboard`.

---

## 6. Real-time Updates (WebSocket)

The dashboard and detail page listen to `statusUpdate` and `notification` events via the `useWebSocket` hook.

```typescript
const { onStatusUpdate, onNotification } = useWebSocket(userId, 'APPROVER');

useEffect(() => {
  const unsubscribe = onStatusUpdate((payload) => {
    if (!currentRequestId || payload.paymentRequestId === currentRequestId) {
      refresh();
    }
    showToast('info', `Request ${payload.requestNumber} was updated`);
  });
  return unsubscribe;
}, [onStatusUpdate, currentRequestId, refresh]);
```

---

## 7. Cross-References

| Related Document | Purpose |
|-----------------|---------|
| [DD_COMMON_05](../00_common/DD_COMMON_05_SHARED_COMPONENTS.md) | DataTable, KpiCard, ApprovalTimeline, and ConfirmDialog specs |
| [DD_APPROVER_03](./DD_APPROVER_03_API_ENDPOINTS.md) | Approver REST API contract |
| [DD_APPROVER_05](./DD_APPROVER_05_BUSINESS_LOGIC.md) | Approve/reject transition rules |
