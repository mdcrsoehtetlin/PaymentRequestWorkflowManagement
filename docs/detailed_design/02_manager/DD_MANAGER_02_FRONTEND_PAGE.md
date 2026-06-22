# DD_MANAGER_02 — Frontend Request Page (Dashboard)

> **Doc ID:** PRWM-DD-MGR-02 | **Version:** 1.0 | **Status:** Released  
> **Last Updated:** 2026-06-16

---

## 1. Overview

The `ManagerDashboard` is the landing page for the Manager role. It displays KPI summary cards, queue metrics, and a paginated, sortable, filterable list of payment requests assigned to the manager for verification. The layout uses a split-pane design on desktop: left side shows the pending verification queue list, right side displays request details and verification controls when a request is selected.

- **File Path:** `frontend/src/pages/manager/ManagerDashboard.tsx`
- **Route:** `/manager/dashboard`
- **Layout Type:** Split-Pane (Desktop) | Stacked (Mobile/Tablet)

---

## 2. Page Layout Structure

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
│ Sidebar  │  ┌───────────────────────────────┐┌──────────────────────────────────────┐  │
│ (w-64)   │  │ [B] QUEUE METRICS CARDS       ││ [C] QUEUE CONTROLS & SEARCH         │  │
│          │  │ - Pending Count               ││ - Status Filter Dropdown            │  │
│ - Logo   │  │ - Reviewing Count             ││ - Branch Filter Dropdown            │  │
│ - Menu   │  │ - Verified Count              ││ - Search by Request/Applicant       │  │
│ - User   │  │ - Rejected Count              ││ - Refresh Button                   │  │
│          │  └───────────────────────────────┘└──────────────────────────────────────┘  │
│          │                                                                          │
│          │  ┌──────────────────────────────────────────────────────────────────────┐  │
│          │  │ [D] PENDING VERIFICATION LIST (LEFT PANE)                          │  │
│          │  │ Data Grid with Columns:                                             │  │
│          │  │ [申請番号 (Request ID)] [申請者氏名] [合計金額] [申請日] [至急フラグ] [ステータス] │  │
│          │  │ (10 rows max per page, with pagination)                             │  │
│          │  │ Row Click → Triggers Detail Panel Load (RIGHT PANE)                 │  │
│          │  └──────────────────────────────────────────────────────────────────────┘  │
│          │                                                                          │
│          │  ┌──────────────────────────────────────────────────────────────────────┐  │
│          │  │ [E] REQUEST DETAIL & VERIFICATION PANEL (RIGHT PANE)               │  │
│          │  │ (Displayed on desktop split-pane; modal on mobile)                  │  │
│          │  │ - Request Details (Read-Only)                                       │  │
│          │  │ - Breakdown Items Table                                             │  │
│          │  │ - Receipt Files & Preview                                           │  │
│          │  │ - Approval History Timeline                                         │  │
│          │  │ - Comment Box & Verify/Reject Buttons                               │  │
│          │  └──────────────────────────────────────────────────────────────────────┘  │
└──────────┴──────────────────────────────────────────────────────────────────────────┘
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
- Row click triggers detail panel load on right side (split-pane layout on desktop)
- On mobile/tablet, row click navigates to detail page or shows detail panel in modal
- Rows are highlighted if status = `MANAGER_REVIEWING` (yellow/light blue background) to indicate active review
- Rows with status = `SUBMITTED_MANAGER` show priority indicator (e.g., red dot) if elapsed time > 24 hours
- Default sort: `submittedDate` ASC (oldest first = highest priority)

**Pagination:**
- Default page size: 10 rows (configurable)
- Maximum page size: 100 rows (prevent abuse)
- Includes Previous/Next buttons and page indices

### 3.4 VerificationPanel (Section E)

**Right Pane - Request Detail & Verification Controls:**

Displayed only when a row is selected. On desktop, displays as fixed right panel; on mobile, as full-screen modal.

**Contents:**
1. **Panel Header**
   - Request Number (e.g., "PRF-2026-001")
   - Current Status Badge
   - Close Button

2. **Applicant Info Section (Read-Only)**
   - Employee Name
   - Employee Number
   - Branch/Department
   - Application Date

3. **Payment Details Section (Read-Only)**
   - Total Amount
   - Tax Amount (if applicable)
   - Currency Type
   - Payment Method
   - Purpose/Description
   - Bank Account Info (if applicable)

4. **Payment Breakdown Section (Read-Only)**
   - Data Table: No, Date, Description, Amount
   - Footer: Total calculation

5. **Receipt Files Section**
   - File list with download links
   - Inline preview for images/PDFs
   - "No receipts uploaded" message if empty

6. **Approval History Section (Expandable)**
   - Timeline of prior actions and comments
   - Chronological sorting

7. **Verification Form**
   - Optional comment box (max 500 chars for verify)
   - Mandatory comment box (min 10 chars for reject)
   - Verify Button (green)
   - Reject Button (red)
   - Close Button

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
1. Store selected request ID in component state
2. Load request details via `managerService.getRequestDetails(id)`
3. Fetch receipt files and approval log
4. **Automatic Status Transition:** If current status = `SUBMITTED_MANAGER` (2), dispatch API call to auto-transition to `MANAGER_REVIEWING` (3)
5. Display detail panel on right side (desktop) or modal (mobile)
6. Update hidden field with `modified_date` for optimistic locking

**Error Handling:**
```typescript
const handleRowClick = async (requestId: string) => {
  setSelectedRequestId(requestId);
  try {
    // Fetch details
    const details = await managerService.getRequestDetails(requestId);
    
    // Auto-transition if status = SUBMITTED_MANAGER
    if (details.statusId === 2) {
      await managerService.updateRequestStatus(requestId, {
        action: 'REVIEW_START',
        modifiedDate: details.modifiedDate
      });
      details.statusId = 3; // Status now = MANAGER_REVIEWING
    }
    
    setRequestDetails(details);
    setModifiedDateHidden(details.modifiedDate);
    showDetailPanel(true);
    refresh(); // Refresh table to update status display
  } catch (error) {
    if (error.code === 'ERR-MGR-409') {
      showToast('warning', '別のユーザーがこの申請を更新しました。リストを更新します。');
      refresh();
    } else {
      showToast('error', error.message);
    }
  }
};
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
      if (selectedRequestId === payload.requestId) {
        setShowDetailPanel(false); // Close detail panel
      }
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
}, [onStatusUpdate, onNewRequest, refresh, managerId, selectedRequestId]);
```

---

## 7. Responsive Design (Mobile/Tablet)

### 7.1 Desktop Layout (≥ 1024px)
- Split-pane: Left side = table (60%), Right side = detail panel (40%)
- Side-by-side layout allows simultaneous viewing
- Metrics cards display in single row above table

### 7.2 Tablet Layout (768px - 1023px)
- Stacked layout: Metrics cards → Queue table → Detail panel (collapsed)
- Detail panel displays as collapsible accordion or slide-up drawer
- Single column for better fit

### 7.3 Mobile Layout (< 768px)
- Full-screen table view (metrics cards hidden or collapsed)
- Row click opens detail panel as full-screen modal or slide-up drawer
- Navigation: Back button to close detail, return to table
- Detail panel scrollable vertically

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
- Implement lazy loading for detail panel on demand
- Cache request metadata but fetch full details on panel open

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
- Invalidate detail panel cache on status change

---

## 10. Accessibility & Keyboard Navigation

- **Tab Navigation:** All buttons (Verify, Reject, Refresh) keyboard accessible via Tab key
- **Enter/Space:** Activate buttons via Enter or Space key
- **ARIA Labels:** All interactive elements have descriptive labels
- **Color Contrast:** Status badges meet WCAG AA standards
- **Screen Readers:** Status transitions announced to screen readers
- **Focus Management:** Focus returns to queue table after panel closes

---

## 11. Component File Structure

```
frontend/src/pages/manager/
├── ManagerDashboard.tsx (Main page component)
├── components/
│   ├── QueueMetricsRow.tsx (Metric cards)
│   ├── FilterSearchBar.tsx (Search & filter controls)
│   ├── RequestQueueTable.tsx (Main queue table)
│   ├── VerificationPanel.tsx (Right-side/modal detail view)
│   ├── DetailPanel/
│   │   ├── ApplicantInfoSection.tsx
│   │   ├── PaymentDetailsSection.tsx
│   │   ├── BreakdownItemsDisplay.tsx
│   │   ├── ReceiptFilesSection.tsx
│   │   ├── ApprovalHistorySection.tsx
│   │   └── ReceiptPreviewModal.tsx
│   ├── VerificationForm.tsx (Comment, Verify, Reject buttons)
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
- `ManagerDashboard` composes multiple sub-components for separation of concerns
- Use React hooks for state management (useState, useCallback, useEffect)
- Custom hook `useManagerQueue` encapsulates queue fetch logic

### 13.2 Data Flow
```
ManagerDashboard
  ├── QueueMetricsRow (displays metrics from useManagerQueue)
  ├── FilterSearchBar (updates filters in useManagerQueue)
  ├── RequestQueueTable (displays data from useManagerQueue)
  │   └── Row Click → handleRowClick()
  │       └── Load RequestDetails
  │           └── VerificationPanel (right pane)
  └── VerificationPanel
      └── VerificationForm
          ├── Verify Button → managerService.verifyRequest()
          └── Reject Button → managerService.rejectRequest()
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
**Related Documents:** DD_MANAGER_03, DD_MANAGER_04, DD_MANAGER_05, MANAGER_05_画面項目設計書_SCREEN_ITEMS.md, MANAGER_04_機能設計書_FUNCTIONAL_SPEC.md

---

*End of DD_MANAGER_02_FRONTEND_REQUEST_LIST.md*