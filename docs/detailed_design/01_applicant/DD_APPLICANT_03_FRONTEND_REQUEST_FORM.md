# DD_APPLICANT_03 — Frontend Request Form

> **Doc ID:** PRWM-DD-APP-03 | **Version:** 1.0 | **Status:** Released  
> **Last Updated:** 2026-06-16

---

## 1. Overview

The `PaymentRequestForm` component is used by both the `CreateRequest` (New) and `EditRequest` (Edit) pages. It supports dynamic breakdown items, file uploads, and dual submission modes ("Save as Draft" vs "Submit to Manager").

- **File Path:** `frontend/src/pages/applicant/components/PaymentRequestForm.tsx`
- **Route (New):** `/applicant/requests/new`
- **Route (Edit):** `/applicant/requests/:id/edit`

---

## 2. Layout Structure

The form uses a 2-column grid on desktop, single column on mobile.

```
┌────────────────────────────────────────────────────────┐
│ PageHeader (Title: "新規申請" or "申請編集")           │
├────────────────────────────────────────────────────────┤
│ [Card 1: 基本情報 (Basic Info)]                        │
│ ├── 申請日 (App Date)  ├── 支払希望日 (Desired Date)   │
│ ├── 通貨 (Currency)    ├── 支払種別 (Type)             │
│ ├── 目的 (Purpose)                                     │
│ └── 申請内容 (Request Content)                         │
├────────────────────────────────────────────────────────┤
│ [Card 2: 支払情報 (Payment Info)]                      │
│ ├── 支払方法 (Method)                                  │
│ └── 銀行口座情報 (Bank Account - conditional)          │
├────────────────────────────────────────────────────────┤
│ [Card 3: 担当マネージャー (Manager Assignment)]        │
│ └── マネージャー (Manager Dropdown)                    │
├────────────────────────────────────────────────────────┤
│ BreakdownItemsGrid (Line Items)                        │
│ [Date] [Description] [Amount] [Qty] [Unit] [Total] [x] │
│ + 行を追加 (Add Row)               [Auto-Sum Total]    │
├────────────────────────────────────────────────────────┤
│ ReceiptUploadSection                                   │
│ [Checkbox: 領収書あり] -> Shows FileUploadDropzone     │
├────────────────────────────────────────────────────────┤
│ ActionButtonBar (Sticky Bottom)                        │
│ [キャンセル]           [下書き保存] [マネージャーに提出] │
└────────────────────────────────────────────────────────┘
```

---

## 3. Form State & Validation (React Hook Form)

The form uses `react-hook-form` without an external resolver, relying on the custom validation functions defined in `DD_COMMON_04`.

### 3.1 Setup Hook

```typescript
// frontend/src/pages/applicant/hooks/usePaymentRequestForm.ts
import { useForm, useFieldArray } from 'react-hook-form';
import { validateDraft, validateSubmit } from '../utils/validation';

export function usePaymentRequestForm(initialData?: PaymentRequestFormValues) {
  const methods = useForm<PaymentRequestFormValues>({
    defaultValues: initialData || {
      applicationDate: new Date().toISOString().split('T')[0], // Today default
      breakdownItems: [{ lineNumber: 1, amount: '' }], // 1 empty row
      hasReceipt: false,
      currencyId: 1, // MMK default
    },
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({
    control: methods.control,
    name: 'breakdownItems',
  });

  return { methods, fields, append, remove };
}
```

### 3.2 Dynamic Amount Calculation

The `BreakdownItemsGrid` automatically sums the `amount` of all line items to calculate the `totalAmount`. This is read-only and displayed at the bottom of the grid.

```typescript
const items = methods.watch('breakdownItems');
const totalAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
// Prevent submission if totalAmount is 0 or negative
```

---

## 4. Sub-Components

### 4.1 BreakdownItemsGrid

- Renders `fields.map()` from `useFieldArray`.
- Each row has `itemDate`, `description`, `amount`, `quantity`, `unitPrice`.
- If `quantity` and `unitPrice` are entered, `amount` is auto-calculated (`qty * price`) and disabled. Otherwise, `amount` is manually entered.
- **Validation**: Minimum 1 row, maximum 15 rows.
- **Delete**: Show trash icon. Cannot delete if only 1 row remains.

### 4.2 ReceiptUploadSection

- Shows a checkbox: `[ ] 領収書あり (Has Receipt)`.
- If checked, renders the `FileUploadDropzone` (from `DD_COMMON_05`).
- State: Maintains an array of `File` objects (new uploads) and `ReceiptFile` objects (existing files in Edit mode).
- If checked, validation requires at least 1 file (new or existing) on "Submit".

---

## 5. Action Buttons & Handlers

There are two primary action paths, managed by standard HTML button types and custom click handlers.

### 5.1 Save as Draft (下書き保存)

- **Button Type:** `button`
- **Validation:** Uses `validateDraft()`. Only partial data is checked.
- **Action:**
  1. Call `applicantService.saveDraft(formData)`.
  2. Upload files via `applicantService.uploadFiles(id, files)`.
  3. Navigate to Dashboard with success toast.

### 5.2 Submit to Manager (マネージャーに提出)

- **Button Type:** `submit`
- **Validation:** Uses `validateSubmit()`. Strict validation.
- **Action:**
  1. `useConfirmDialog.open()` -> "この内容でマネージャーに提出しますか？"
  2. On confirm:
     - Save/Update request data via `applicantService.saveDraft()`.
     - Upload any new files.
     - Call `applicantService.submitToManager(id, { managerUserId, comment })`.
  3. Navigate to Dashboard with success toast.

---

## 6. Lookup Data

The form requires dropdown options fetched on mount:
- `currencies` (MMK, USD, JPY)
- `paymentTypes` (Expense, Advance, etc.)
- `paymentMethods` (Bank, Cash, Check)
- `managers` (Users with role_id=2 in the same branch)

Handled via `useLookupData` hook.

---

## 7. Cross-References

| Related Document | Purpose |
|-----------------|---------|
| [DD_COMMON_04](../00_common/DD_COMMON_04_SHARED_VALIDATION.md) | Frontend validation functions `validateDraft` and `validateSubmit` |
| [DD_APPLICANT_05](./DD_APPLICANT_05_API_ENDPOINTS.md) | Backend POST/PATCH endpoints |
