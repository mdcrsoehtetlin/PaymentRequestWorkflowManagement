# DD_MANAGER_02 — Frontend Request Page (Dashboard)

> **Doc ID:** PRWM-DD-MGR-02 | **Version:** 1.1 | **Status:** Released  
> **Last Updated:** 2026-06-23

---

## 1. Overview

The `ManagerDashboard` is the landing page for the Manager role. It displays KPI summary cards, queue metrics, and a paginated, sortable, filterable list of payment requests assigned to the manager for verification. The layout uses a full-width table design: the list page displays the table at full width, and row click navigates to a dedicated detail page (`/manager/requests/:id`) with skeleton loading.

- **File Path:** `frontend/src/pages/manager/ManagerDashboard.tsx`
- **Detail Page Path:** `frontend/src/pages/manager/ManagerRequestDetail.tsx`
- **Routes:** `/manager` (list), `/manager/requests/:id` (detail)
- **Layout Type:** Full-Width Table + Dedicated Detail Page

---

## 2. Page Layout Structure

### 2.1 List Page — `/manager` (Full-Width Table)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              BROWSER VIEWPORT                                        │
├──────────┬──────────────────────────────────────────────────────────────────────────┤
│          │  ┌────────────────────────────────────────────────────────────────────┐  │
│          │  │ [A] COMMON HEADER AREA                                             │  │
│          │  │   System Logo & Title: "支払申請システム"                           │  │
│          │  │   User Badge: Manager Name  |  Role Badges   |  Logout Button      │  │
│  [NAV]   │  └────────────────────────────────────────────────────────────────────┘  │
│          │                                                                          │
│ Sidebar  │  ┌──────────────────────────────────────────────────────────────────┐    │
│ (w-64)   │  │ [B] QUEUE METRICS CARDS                                         │    │
│          │  │ - Pending Count | - Reviewing Count | - Verified Count | - Rejected │  │
│          │  └──────────────────────────────────────────────────────────────────┘    │
│          │                                                                          │
│          │  ┌──────────────────────────────────────────────────────────────────┐    │
│          │  │ [C] QUEUE CONTROLS & SEARCH                                     │    │
│          │  │ - Search Input [検索ボタン] - Status Filter - Refresh Button    │    │
│          │  └──────────────────────────────────────────────────────────────────┘    │
│          │                                                                          │
│          │  ┌──────────────────────────────────────────────────────────────────┐    │
│          │  │ [D] PENDING VERIFICATION LIST (FULL WIDTH TABLE)                │    │
│          │  │ Data Grid with Columns:                                         │    │
│          │  │ [申請番号] [申請者氏名] [合計金額] [申請日] [至急フラグ] [ステータス] │  │
│          │  │ (10 rows max per page, with pagination)                         │    │
│          │  │ Row Click → Navigates to /manager/requests/:id (Detail Page)    │    │
│          │  └──────────────────────────────────────────────────────────────────┘    │
└──────────┴──────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Detail Page — `/manager/requests/:id` (Dedicated Detail Page)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              BROWSER VIEWPORT                                        │
├─────────────────────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │ [A] COMMON HEADER AREA                                                       │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                     │
│  [← Back to List]  Request Details                                                  │
│                                                                                     │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │ [E] REQUEST DETAIL PAGE                                                      │  │
│  │ - Skeleton Loading (during data fetch)                                       │  │
│  │ - Request Details (Read-Only)                                                │  │
│  │ - Breakdown Items Table                                                      │  │
│  │ - Receipt Files & Preview                                                    │  │
│  │ - Approval History Timeline                                                  │  │
│  │ - Comment Box & Verify/Reject Buttons                                        │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Details

### 3.1 QueueMetricsRow (Section B)

Four KPI cards displaying counts of requests by status in the manager's queue.

1. **確認待ち (Pending Review):** Count of `SUBMITTED_MANAGER` (status 2)
2. **確認中 (Reviewing):** Count of `MANAGER_REVIEWING` (status 3)
3. **承認済み (Verified):** Count of `MANAGER_VERIFIED` (status 4)
4. **差戻し (Rejected):** Count of `REJECTED_MANAGER` (status 5)

**Additional Metrics (Optional Widgets):**
- **Average Processing Time:** Average duration from SUBMITTED_MANAGER → MANAGER_VERIFIED or REJECTED_MANAGER
- **Overdue Requests:** Count of requests pending > 48 hours (configurable threshold)

**Card Behavior:**
- Clicking a metric card updates the `FilterSearchBar` status dropdown to filter the table
- Cards display loading skeleton while metrics are being fetched
- Colors match status badge colors for consistency

### 3.2 FilterSearchBar (Section C)

State managed via `useManagerQueue` hook.

- **Status Filter:** Select one from manager-relevant statuses (2, 3, 4, 5) or "All"
- **Branch Filter:** Select applicant branch (e.g., "Yangon", "Mandalay", "Naypyidaw") or "All"
- **Search:** Free text search against `request_number`, `applicant_name`, and `purpose`. Debounced by 300ms.
- **Refresh Button:** Manual refresh to force API re-request if WebSocket dropped

### 3.3 DataTable (RequestQueueTable) - Section D

**Left Pane - Pending Verification List:**

| Column Header | Data Field | Component/Format | Sortable | Width |
|---------------|-----------|------------------|----------|-------|
| 申請番号 (Request ID) | `requestNumber` | String link to detail | Yes | 15% |
| 申請者氏名 (Applicant Name) | `applicantName` | String | Yes | 20% |
| 合計金額 (Amount) | `totalAmount`, `currency` | `CurrencyDisplay` | Yes | 18% |
| 申請日 (Date) | `applicationDate` | `formatDate()` YYYY-MM-DD | Yes | 12% |
| 至急フラグ (Urgent Flag) | `isUrgent` (computed) | Red Badge/Icon (Active if `desiredPaymentDate` <= 48 hours or overdue) | Yes | 15% |
| ステータス (Status) | `statusId` | `StatusBadge` | Yes | 15% |

**Table Behavior:**
- Row click navigates to dedicated detail page at `/manager/requests/:id`
- Detail page shows skeleton loading during data fetch, then renders full detail view
- Rows are highlighted if status = `MANAGER_REVIEWING` (yellow/light blue background) to indicate active review
- Rows with status = `SUBMITTED_MANAGER` show priority indicator (e.g., red dot) if elapsed time > 24 hours
- Default sort: `submittedDate` ASC (oldest first = highest priority)

**Pagination:**
- Default page size: 10 rows (configurable)
- Maximum page size: 100 rows (prevent abuse)
- Includes Previous/Next buttons and page indices

### 3.4 ManagerRequestDetail (Dedicated Detail Page)

**Detail Page — `/manager/requests/:id`:**

Displayed as a dedicated page when a row is clicked. Uses `ManagerRequestDetail.tsx` component.

**Contents:**
1. **Page Header**
   - "← Back to List" button (navigates to `/manager`)
   - Request Number (e.g., "PRF-2026-001")
   - Current Status Badge

2. **Skeleton Loading (during data fetch)**
   - Full-page skeleton mimicking the detail layout (header, fields, breakdown table, attachments, timeline)
   - Displayed while `apiClient.get()` fetches request data

3. **Applicant Info Section (Read-Only)**
   - Employee Name
   - Employee Number
   - Branch/Department
   - Application Date

4. **Payment Details Section (Read-Only)**
   - Total Amount
   - Tax Amount (if applicable)
   - Currency Type
   - Payment Method
   - Purpose/Description
   - Bank Account Info (if applicable)

5. **Payment Breakdown Section (Read-Only)**
   - Data Table: No, Date, Description, Amount
   - Footer: Total calculation

6. **Receipt Files Section**
   - File list with download links
   - Inline preview for images/PDFs
   - "No receipts uploaded" message if empty

7. **Approval History Section (Expandable)**
   - Timeline of prior actions and comments
   - Chronological sorting

8. **Verification Form**
   - Optional comment box (max 500 chars for verify)
   - Mandatory comment box (min 10 chars for reject)
   - Verify Button (green)
   - Reject Button (red)

---

## 4. State Management Hook (`useManagerQueue`)

```typescript
// frontend/src/pages/manager/hooks/useManagerQueue.ts
import { useState, useEffect, useCallback } from 'react';
import { managerService } from '../services/manager.service';
import { usePagination } from '@/hooks/usePagination';

export function useManagerQueue() {
  const [data, setData] = useState<PaymentRequestQueueItem[]>([]);
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<number | null>(null);
  const [branchFilter, setBranchFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('submittedDate');
  const [sortOrder, setSortOrder] = useState<'ASC'|'DESC'>('ASC'); // Oldest first (priority)
  
  const { page, pageSize, setPage, setPageSize } = usePagination(10);

  const fetchQueue = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await managerService.getQueueRequests({
        page, pageSize, statusId: statusFilter, 
        branch: branchFilter, search: searchQuery, 
        sortBy, sortOrder
      });
      setData(response.data);
      setMetrics(response.metrics); // Includes counts by status
      // set pagination meta...
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, statusFilter, branchFilter, searchQuery, sortBy, sortOrder]);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  return { 
    data, isLoading, metrics,
    filters: { statusFilter, setStatusFilter, branchFilter, setBranchFilter, 
               searchQuery, setSearchQuery },
    sorting: { sortBy, sortOrder, setSortBy, setSortOrder },
    pagination: { page, pageSize, setPage, setPageSize },
    refresh: fetchQueue
  };
}
```

---

## 5. Event Handlers

### 5.1 Row Click Handler

**Trigger:** User clicks a row in the request queue table.

**Processing Logic:**
1. Navigate to `/manager/requests/:id` using React Router
2. Detail page (`ManagerRequestDetail`) displays skeleton loading during data fetch
3. Fetch request details via `apiClient.get('/api/payment-requests/:id')`
4. **Automatic Status Transition:** If current status = `SUBMITTED_MANAGER` (2), the backend auto-transitions to `MANAGER_REVIEWING` (3) as part of the GET endpoint
5. Display detail page with full request information, breakdown, attachments, and verification form

**Error Handling:**
```typescript
const handleRowClick = (requestId: string) => {
  navigate(`/manager/requests/${requestId}`);
};
```

**Detail Page Data Fetch (`ManagerRequestDetail.tsx`):**
```typescript
useEffect(() => {
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get(`/api/payment-requests/${id}`);
      setRequestData(response.data);
    } catch (error) {
      if (error.response?.status === 403) {
        showToast('error', t('manager.detail.accessDenied'));
      } else if (error.response?.status === 404) {
        showToast('error', t('manager.detail.notFound'));
      } else {
        showToast('error', t('manager.detail.loadFailed'));
      }
    } finally {
      setIsLoading(false);
    }
  };
  fetchData();
}, [id, t]);
```

### 5.2 Verify Button Click

**Trigger:** Manager clicks "Verify" button in detail panel.

**Processing Logic:**
1. **Client-Side Validation:** Check comment length if provided (max 500 chars)
2. **Backend Dispatch:** Call `managerService.verifyRequest(requestId, { comment, modifiedDate })`
3. **Post-Execution UI:**
   - Show success toast: "申請を承認しました"
   - Close detail panel
   - Remove row from table (status changed, no longer in manager queue)
   - Refresh metrics
   - Notify applicant via WebSocket

### 5.3 Reject Button Click

**Trigger:** Manager clicks "Reject" button in detail panel.

**Processing Logic:**
1. **Client-Side Validation:**
   - Check comment field is not empty
   - Verify trimmed comment length ≥ 10 characters (VAL-MGR-002)
   - Show error if validation fails
2. **Backend Dispatch:** Call `managerService.rejectRequest(requestId, { comment, modifiedDate })`
3. **Post-Execution UI:**
   - Show success toast: "申請を差し戻しました"
   - Close detail panel
   - Remove row from table
   - Refresh metrics
   - Notify applicant via WebSocket with rejection reason

### 5.4 Refresh Button Click

**Trigger:** Manager clicks manual refresh button.

**Processing Logic:**
1. Call `refresh()` function from hook
2. Force API re-request (ignore any cached data)
3. Update table with fresh data
4. Update metrics
5. Show brief loading spinner during refresh

---

## 6. Real-Time Updates (WebSocket)

The dashboard listens to `statusUpdate` events via the `useWebSocket` hook.

```typescript
const { onStatusUpdate, onNewRequest } = useWebSocket(managerId, 'MANAGER');

useEffect(() => {
  const unsubscribe = onStatusUpdate((payload) => {
    // Another user updated one of our assigned requests
    if (payload.managerUserId === managerId) {
      showToast('info', `申請 ${payload.requestNumber} のステータスが更新されました`);
      refresh(); // Reload table and metrics
    }
  });
  
  const unsubscribeNew = onNewRequest((payload) => {
    // New request assigned to this manager
    showToast('info', `新しい申請 ${payload.requestNumber} が割り当てられました`);
    refresh();
  });
  
  return () => {
    unsubscribe();
    unsubscribeNew();
  };
}, [onStatusUpdate, onNewRequest, refresh, managerId]);
```

---

## 7. Responsive Design (Mobile/Tablet)

### 7.1 Desktop Layout (≥ 1024px)
- Full-width table on list page
- Dedicated detail page with skeleton loading on row click
- Metrics cards display in single row above table

### 7.2 Tablet Layout (768px - 1023px)
- Full-width table on list page
- Dedicated detail page with stacked layout on row click
- Metrics cards in 2x2 grid

### 7.3 Mobile Layout (< 768px)
- Full-width table view (metrics cards hidden or collapsed)
- Full-screen detail page on row click
- "← Back to List" navigation button
- Detail page scrollable vertically

---

## 8. Error Handling & Validation

### 8.1 Validation Rules

| Validation Code | Field | Condition | Error Message |
|---|---|---|---|
| **VAL-MGR-001** | Comment (Verify) | Length > 500 chars | "Comment cannot exceed 500 characters." |
| **VAL-MGR-002** | Comment (Reject) | Length < 10 chars when submitting reject | "Comment is required and must be at least 10 characters long to reject a request." |

### 8.2 Error Scenarios

| Error Code | Condition | Display | Action |
|---|---|---|---|
| **ERR-MGR-401** | JWT token expired | Modal alert | Redirect to login |
| **ERR-MGR-403** | User role ≠ MANAGER | Full-screen 403 page | Contact admin |
| **ERR-MGR-409** | Concurrency conflict (modified_date mismatch) | Modal warning | Auto-refresh queue |
| **ERR-MGR-500** | Server error | Toast error with Error ID | Show admin contact info |

---

## 9. Performance Considerations

### 9.1 Pagination
- Default page size: **10 rows** (configurable)
- Implement lazy loading for detail page on demand
- Cache request metadata but fetch full details on detail page load

### 9.2 Search Debounce
- Debounce search input by **300ms** before API call
- Cancel previous API call if new search initiated

### 9.3 WebSocket Optimization
- Group notifications to avoid excessive refreshes
- Batch queue updates if multiple requests change status simultaneously

### 9.4 Caching
- Cache branch list (static, fetched once on mount)
- Cache status options (static)
- Don't cache request list (changes frequently)
- Invalidate detail page cache on status change

---

## 10. Accessibility & Keyboard Navigation

- **Tab Navigation:** All buttons (Verify, Reject, Refresh) keyboard accessible via Tab key
- **Enter/Space:** Activate buttons via Enter or Space key
- **ARIA Labels:** All interactive elements have descriptive labels
- **Color Contrast:** Status badges meet WCAG AA standards
- **Screen Readers:** Status transitions announced to screen readers
- **Focus Management:** Focus returns to queue table after detail page navigation back

---

## 11. Component File Structure

```
frontend/src/pages/manager/
├── ManagerDashboard.tsx (Main list page component)
├── ManagerRequestDetail.tsx (Dedicated detail page with skeleton loading)
├── components/
│   ├── QueueMetricsRow.tsx (Metric cards)
│   ├── FilterSearchBar.tsx (Search & filter controls)
│   ├── RequestQueueTable.tsx (Main queue table — full width)
│   └── ManagerDashboard.module.css (Styles)
├── hooks/
│   └── useManagerQueue.ts (State management hook)
├── services/
│   └── manager.service.ts (API calls)
└── types/
    └── manager.types.ts (TypeScript interfaces)
```

---

## 12. Cross-References

| Related Document | Purpose |
|-----------------|---------|
| [DD_MANAGER_03](./DD_MANAGER_03_FRONTEND_VERIFICATION_PANEL.md) | Detail panel and verification form design |
| [DD_MANAGER_04](./DD_MANAGER_04_API_ENDPOINTS.md) | `GET /manager/queue`, `POST /manager/verify`, `POST /manager/reject` specs |
| [DD_MANAGER_05](./DD_MANAGER_05_BUSINESS_LOGIC.md) | Backend business rules for manager verification |
| [MANAGER_05_画面項目設計書_SCREEN_ITEMS.md](./MANAGER_05_画面項目設計書_SCREEN_ITEMS.md) | Detailed UI screen items specification |
| [MANAGER_04_機能設計書_FUNCTIONAL_SPEC.md](./MANAGER_04_機能設計書_FUNCTIONAL_SPEC.md) | Functional specification and workflows |
| [DD_COMMON_05](../00_common/DD_COMMON_05_SHARED_COMPONENTS.md) | DataTable, KpiCard, StatusBadge definitions |

---

## 13. Development Notes

### 13.1 Component Composition
- `ManagerDashboard` composes QueueMetricsRow, FilterSearchBar, RequestQueueTable
- `ManagerRequestDetail` is a standalone page component with skeleton loading
- Use React hooks for state management (useState, useCallback, useEffect)
- Custom hook `useManagerQueue` encapsulates queue fetch logic for list page

### 13.2 Data Flow
```
ManagerDashboard (List Page — /manager)
  ├── QueueMetricsRow (displays metrics from useManagerQueue)
  ├── FilterSearchBar (updates filters in useManagerQueue)
  ├── RequestQueueTable (displays data from useManagerQueue)
  │   └── Row Click → navigate(`/manager/requests/${id}`)
  │
ManagerRequestDetail (Detail Page — /manager/requests/:id)
  ├── Skeleton Loading (during data fetch)
  ├── apiClient.get(`/api/payment-requests/${id}`)
  ├── Request Details Display
  │   ├── Applicant Info Section
  │   ├── Payment Details Section
  │   ├── Breakdown Items Table
  │   ├── Receipt Files Section
  │   └── Approval History Timeline
  └── VerificationForm
      ├── Verify Button → POST /api/payment-requests/:id/verify
      └── Reject Button → POST /api/payment-requests/:id/reject-manager
```

### 13.3 WebSocket Integration
- Connect to WebSocket on component mount
- Subscribe to relevant events (statusUpdate, newRequest)
- Auto-refresh queue on status change notification
- Close connection on component unmount

---

## Sign-Off

This Manager Dashboard design provides the interface for initial payment request verification. It balances efficiency with clarity, allowing managers to quickly review and make decisions on assigned requests.

**Approval Status:** Released  
**Version History:**
- v1.0 (2026-06-16): Initial release with split-pane layout
- v1.1 (2026-06-23): Refactored to full-width table + dedicated detail page with skeleton loading

**Related Documents:** DD_MANAGER_03, DD_MANAGER_04, DD_MANAGER_05, MANAGER_05_画面項目設計書_SCREEN_ITEMS.md, MANAGER_04_機能設計書_FUNCTIONAL_SPEC.md

---

*End of DD_MANAGER_02_FRONTEND_REQUEST_LIST.md*