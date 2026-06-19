# DD_APPLICANT_04 — Frontend Request Detail

> **Doc ID:** PRWM-DD-APP-04 | **Version:** 1.0 | **Status:** Released  
> **Last Updated:** 2026-06-16

---

## 1. Overview

The `RequestDetail` page displays all information for a specific payment request in a read-only format, alongside the approval history timeline and contextual action buttons.

- **File Path:** `frontend/src/pages/applicant/RequestDetail.tsx`
- **Route:** `/applicant/requests/:id`

---

## 2. Layout Structure

The layout is a 2-column design on desktop: Left column (Main Content, 70%), Right column (Timeline & Actions, 30%).

```
┌────────────────────────────────────────────────────────┐
│ PageHeader (Title: "申請詳細", StatusBadge)            │
├────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────┐ ┌───────────────┐ │
│ │ [Card: 基本情報 (Basic Info)]    │ │ [Action Card] │ │
│ │ 申請番号, 申請日, 支払希望日     │ │ Contextual    │ │
│ │ 目的, 申請内容                   │ │ Action        │ │
│ │ 通貨, 支払種別, 支払方法         │ │ Buttons       │ │
│ │                                  │ └───────────────┘ │
│ ├──────────────────────────────────┤ ┌───────────────┐ │
│ │ [Card: 明細 (Line Items)]        │ │ [Timeline     │ │
│ │ DataTable (Date, Desc, Amount)   │ │ Card]         │ │
│ │ 総計 (Total Amount Footer)       │ │ Approval      │ │
│ │                                  │ │ Logs List     │ │
│ ├──────────────────────────────────┤ │               │ │
│ │ [Card: 添付ファイル (Receipts)]  │ │               │ │
│ │ List of files with Download links│ │               │ │
│ └──────────────────────────────────┘ └───────────────┘ │
└────────────────────────────────────────────────────────┘
```

---

## 3. Data Fetching

State managed via `usePaymentRequestDetail` hook.

```typescript
// frontend/src/pages/applicant/hooks/usePaymentRequestDetail.ts
export function usePaymentRequestDetail(id: number) {
  const [data, setData] = useState<PaymentRequestDetailView | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDetail = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await applicantService.getRequest(id);
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

## 4. Contextual Actions

The buttons in the `[Action Card]` are rendered conditionally based on `statusId`. All actions trigger a `ConfirmDialog` before execution.

| Current Status | Available Actions | API Call | Post-Action Behavior |
|----------------|-------------------|----------|----------------------|
| `DRAFT` (1) | 編集 (Edit)<br>削除 (Delete) | -<br>DELETE `/api/v1/applicant/.../:id` | Navigate to Edit<br>Navigate to List |
| `SUBMITTED_MANAGER` (2) | 取下げ (Withdraw) | POST `.../:id/withdraw` | Stay, `refresh()` (Status changes to DRAFT) |
| `REJECTED_MANAGER` (5) | 編集して再提出 (Edit & Resubmit) | - | Navigate to Edit |
| `REJECTED_APPROVER` (9) | 編集して再提出 (Edit & Resubmit) | - | Navigate to Edit |
| *All others* | (None) | - | - |

---

## 5. UI Components

### 5.1 RequestInfoSection

Read-only grid display of the `PaymentRequest` entity fields. Uses `<dl>`, `<dt>`, `<dd>` HTML tags for semantic layout.

### 5.2 BreakdownItems Display

Renders a standard `DataTable` component but without sorting/pagination. Footer row displays `Σ amount` formatted with `CurrencyDisplay`.

### 5.3 ReceiptFiles Display

Renders a list of `ReceiptFile` records. Each row shows:
- Document Icon
- `originalFileName`
- `fileSize` (formatted)
- Download Button (triggers `window.open(file.fileStoragePath)`)

### 5.4 ApprovalTimeline (Right Column)

Uses the shared `ApprovalTimeline` component from `DD_COMMON_05`.
Feeds `data.approvalLogs` into the timeline. If the request was rejected, the timeline will explicitly highlight the rejection comment in red.

---

## 6. Real-time Updates

Listens to `statusUpdate` via WebSocket. If the viewed request is updated by a Manager/Approver:
1. Show toast notification.
2. Auto-trigger `refresh()` to reload the detail data and timeline without manual refresh.

---

## 7. Cross-References

| Related Document | Purpose |
|-----------------|---------|
| [DD_COMMON_05](../00_common/DD_COMMON_05_SHARED_COMPONENTS.md) | `ApprovalTimeline`, `ConfirmDialog` specs |
| [DD_APPLICANT_05](./DD_APPLICANT_05_API_ENDPOINTS.md) | `GET /:id` endpoint spec |
