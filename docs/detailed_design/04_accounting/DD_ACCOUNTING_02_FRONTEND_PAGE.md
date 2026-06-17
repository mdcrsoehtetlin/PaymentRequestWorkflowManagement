# DD_ACCOUNTING_02 — Frontend Page Specification

> **Doc ID:** PRWM-DD-ACC-02 | **Version:** 1.0 | **Status:** Released  
> **Last Updated:** 2026-06-17

---

## 1. Overview

The Accounting dashboard is the main page for the accounting role. It shows the approved payment queue, applies branch-specific guidance, and allows the user to complete payments.

- **File Path:** `frontend/src/pages/accounting/AccountingDashboard.tsx`
- **Route:** `/accounting/dashboard`

---

## 2. Layout Structure

```
┌────────────────────────────────────────────────────────┐
│ PageHeader (Title: "支払処理一覧")                    │
├────────────────────────────────────────────────────────┤
│ KPI Cards: Approved / Paid / Mandalay / Today         │
├────────────────────────────────────────────────────────┤
│ Branch Alert Banner                                   │
├────────────────────────────────────────────────────────┤
│ Filter/Search Area                                    │
├────────────────────────────────────────────────────────┤
│ DataTable: Request No | Applicant | Branch | Amount | Status | Action │
└────────────────────────────────────────────────────────┘
```

---

## 3. Data Fetching & Hooks

```typescript
// frontend/src/pages/accounting/hooks/useAccountingRequests.ts
export function useAccountingRequests() {
  // fetch approved requests
  // manage search, filter, pagination
  // refresh on websocket events
}
```

### 3.1 Data Flow
1. On mount, call `GET /api/v1/accounting/payment-requests`.
2. Use `usePagination` for paging.
3. Use `useWebSocket` or shared websocket service to refresh data when a request changes.

---

## 4. Sub-Components

### 4.1 AccountingQueueTable
- **Purpose:** Renders the list of approved requests.
- **Shared Components:** `DataTable`, `StatusBadge`, `CurrencyDisplay`
- **Behavior:** Clicking a row navigates to the detail page.

### 4.2 PaymentAlertBanner
- **Purpose:** Displays branch-specific guidance.
- **Behavior:** Shows a warning style banner for Mandalay requests.

### 4.3 ActionButtonCell
- **Purpose:** Adds a `支払完了` action.
- **Behavior:** Opens `ConfirmDialog` before sending a payment completion request.

---

## 5. Contextual Actions / Business Logic

| Action / Button | Triggers API | Post-Action Behavior |
|-----------------|--------------|----------------------|
| `支払完了` | `POST /api/v1/accounting/payment-requests/:id/complete-payment` | Refresh queue, show success toast, update badge |
| Row click | `GET /api/v1/accounting/payment-requests/:id` | Navigate to detail page |

---

## 6. Real-time Updates (WebSocket)

- Listens to: `statusUpdate`
- Action on event: refresh the dashboard and update visible counts

---

## 7. Cross-References

| Related Document | Purpose |
|-----------------|---------|
| [DD_COMMON_05](../00_common/DD_COMMON_05_SHARED_COMPONENTS.md) | Shared UI building blocks |
| [DD_COMMON_06](../00_common/DD_COMMON_06_SHARED_SERVICES_AND_HOOKS.md) | Shared hooks and API service |
| [DD_ACCOUNTING_03](./DD_ACCOUNTING_03_API_ENDPOINTS.md) | API contract |
| [DD_ACCOUNTING_05](./DD_ACCOUNTING_05_BUSINESS_LOGIC.md) | Business rules |
