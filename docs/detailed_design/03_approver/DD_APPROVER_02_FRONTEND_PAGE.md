# DD_APPROVER_02 — Frontend Page Specification

> **Doc ID:** PRWM-DD-APPROVER-02 | **Version:** 1.0 | **Status:** Released  
> **Last Updated:** 2026-06-17

---

## 1. Overview

The Approver frontend provides the Final Approver dashboard and request detail screens. The dashboard displays sidebar summary cards and a paginated, sortable, filterable queue of requests submitted for final approval. The detail experience displays full read-only request information, approval history, and contextual approve/reject actions.

- **Dashboard File Path:** `frontend/src/pages/approver/ApproverDashboard.tsx`
- **Dashboard Route:** `/approver/dashboard`
- **Detail File Path:** `frontend/src/pages/approver/ApproverRequestDetail.tsx`
- **Detail Route:** `/approver/requests/:id`

---

## 2. Page Layout Structure

### 2.1 Approver Dashboard

The dashboard follows the screen item layout in `APPROVER_05`: a desktop workbench with a persistent left sidebar, content-area filter/search controls, a request queue grid, pagination, and a details panel shown as the next panel below the queue. On mobile, the sidebar becomes a drawer and the details panel opens as a full-screen detail view.

```text
+--------------------------------------------------------------------------------+
| Browser Viewport                                                               |
+------------+-------------------------------------------------------------------+
| [NAV]      | [A] Page Header                                                   |
| Sidebar    |     Final Approver Dashboard                                      |
| w-64       |     Approver badge | Notification bell                            |
|            +-------------------------------------------------------------------+
| [B]        | [C] Filter / Search Bar                                           |
| Summary    |     [Search Input] [Status Filter] [Branch] [Date Range]          |
| Cards      +-------------------------------------------------------------------+
| - Pending  | [D] Request Queue Data Grid                                       |
| - Reviewing|     Request# | Applicant | Branch | Status | Amount | Submitted   |
| - Overdue  |     Due | Action                                                  |
| - Activity |                                                                   |
|            | [E] Pagination / Page Controls                                    |
|            | [F] Details Panel                                                 |
+------------+-------------------------------------------------------------------+
```

### 2.2 Approver Request Detail

The request detail is opened from the dashboard queue. On desktop and tablet, it appears as the `[F]` next full page so the approver can review the selected request in place. On mobile and direct-route access, it becomes a full-screen detail page.

```text
+------------------------------------------------+
| Detail Header: Request#, StatusBadge, Close    |
+------------------------------------------------+
| Request Information                            |
| Applicant, payment, branch, amount, purpose    |
+------------------------------------------------+
| Breakdown Items                                |
| Date | Description | Amount                    |
+------------------------------------------------+
| Receipt Files                                  |
| File name | Size | Download                    |
+------------------------------------------------+
| Action Panel                                   |
| Approve / Reject, only for APPROVER_REVIEWING  |
+------------------------------------------------+
| Approval Timeline                              |
| Manager and approver logs/comments             |
+------------------------------------------------+
```

### 2.3 Responsive Layout Breakpoints

| Breakpoint | Min Width | Layout Behavior |
|------------|-----------|-----------------|
| Mobile | 0px | Single-column layout; sidebar hidden behind hamburger drawer; filter bar collapses to expandable panel; detail opens full-screen. |
| Tablet (`md`) | 768px | Sidebar may be drawer or narrow rail; queue remains primary; details appear as the next panel below the queue. |
| Desktop (`lg`) | 1024px | Persistent left sidebar (`w-64`) with summary cards; content area contains filter/search bar, queue grid, pagination, and a details panel below the queue. |
| Wide (`xl`) | 1280px | Expanded queue columns and stable multi-pane view. |

---

## 3. Component Details

### 3.1 SummarySidebar

Persistent desktop sidebar (`w-64`) containing compact summary cards for queue triage.

1. **Pending Requests:** Count of `SUBMITTED_APPROVER` (status 6)
2. **Reviewing:** Count of `APPROVER_REVIEWING` (status 7)
3. **Overdue:** Count of requests whose desired payment date requires urgent action
4. **Recent Activity:** Latest approval/rejection activity from `approvalLogs`

Clicking a status summary card updates the `FilterSearchBar` status dropdown and refreshes the queue table.

### 3.2 FilterSearchBar

State managed via `useApproverRequests` hook.

- **Search:** Free text search against `requestNumber`, applicant name, and purpose. Debounced by 300ms.
- **Status Filter:** Select `Submitted to Approver`, `Approver Reviewing`, or "All".
- **Branch Filter:** Select active branch options from lookup data.
- **Date Range Filter:** Filter by `submittedToApproverDate`.

### 3.3 DataTable (ApproverRequestTable)

| Column Header | Data Field | Component/Format | Sortable |
|---------------|------------|------------------|----------|
| Request# | `requestNumber` | String link / clickable row | Yes |
| Applicant | `applicant` | User display name / employee code | Yes |
| Branch | `branch` | Applicant branch | Yes |
| Status | `statusId` | `StatusBadge` | Yes |
| Amount | `totalAmount`, `currencyCode` | `CurrencyDisplay` | Yes |
| Submitted | `submittedToApproverDate` | Date/time display | Yes |
| Due | `desiredPaymentDate`, overdue flag | Icon/label indicator | No |
| Action | - | Review button/link | No |

**Action Column Rules:**
- If `status === SUBMITTED_APPROVER | APPROVER_REVIEWING`: Show Review action.
- Row click opens the dashboard details panel as the next panel below the queue on desktop and tablet.
- Mobile row click navigates to `/approver/requests/${id}` full-screen detail.

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
  const [summaryCounts, setSummaryCounts] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState<number | null>(null);
  const [branchFilter, setBranchFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>({});
  const [sortBy, setSortBy] = useState('submittedToApproverDate');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  const { page, pageSize, setPage, setPageSize } = usePagination(10);

  const fetchList = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await approverService.getRequests({
        page, pageSize, statusId: statusFilter, branch: branchFilter,
        search: searchQuery, dateFrom: dateRange.from, dateTo: dateRange.to,
        sortBy, sortOrder
      });
      setData(response.data);
      // set meta and summary counts...
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, statusFilter, branchFilter, searchQuery, dateRange, sortBy, sortOrder]);

  useEffect(() => { fetchList(); }, [fetchList]);

  return {
    data, isLoading, summaryCounts,
    filters: { statusFilter, setStatusFilter, branchFilter, setBranchFilter, searchQuery, setSearchQuery, dateRange, setDateRange },
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

1. **Row Click:** Open the `[F]` dashboard details panel below the queue on desktop/tablet; navigate to `/approver/requests/${id}` on mobile.
2. **Review Button:** Open the same detail experience. If the request is `SUBMITTED_APPROVER`, backend starts review and refreshes as `APPROVER_REVIEWING`.
3. **Approve Button:**
   - Call `useConfirmDialog.open()` with approval confirmation.
   - On confirm, call `approverService.approve(id, dto)`.
   - Call `refresh()` on success and show toast.
4. **Reject Button:**
   - Open rejection dialog with mandatory comment field.
   - Validate comment length before submit.
   - On confirm, call `approverService.reject(id, dto)`.
   - Call `refresh()` on success and show toast.
5. **Close / Back Button:** Clear or collapse the details panel on desktop/tablet; navigate to `/approver/dashboard` on full-screen detail.

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
