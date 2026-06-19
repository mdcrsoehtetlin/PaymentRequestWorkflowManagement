# DD_COMMON_05 — Shared UI Components

> **Doc ID:** PRWM-DD-COM-005 | **Version:** 1.0 | **Status:** Released  
> **Last Updated:** 2026-06-16

---

## 1. Overview

This document specifies all shared React components used across multiple dashboards. These components live in `frontend/src/components/` and must be built FIRST as part of the pioneer (Applicant) sprint.

---

## 2. Shared Components (`frontend/src/components/shared/`)

### 2.1 StatusBadge

Renders the payment request status as a colored inline badge.

```typescript
// Props
interface StatusBadgeProps {
  statusId: number;
  size?: 'sm' | 'md';        // Default: 'md'
}
```

| Property | Details |
|----------|---------|
| **File** | `frontend/src/components/shared/StatusBadge.tsx` |
| **Imports** | `PaymentStatus`, `STATUS_LABELS_JP`, `STATUS_COLORS` from `@/types` |
| **Rendering** | `<span className={STATUS_COLORS[statusId]}>{STATUS_LABELS_JP[statusId]}</span>` |
| **Base Classes** | `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium` |
| **Size `sm`** | `px-2 py-0.5 text-[10px]` |
| **Accessibility** | `role="status"`, `aria-label={STATUS_LABELS_JP[statusId]}` |

**Usage:**
```tsx
<StatusBadge statusId={request.statusId} />
<StatusBadge statusId={PaymentStatus.DRAFT} size="sm" />
```

---

### 2.2 ConfirmDialog

Modal dialog for destructive/important actions. Replaces `window.confirm()`.

```typescript
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;      // Default: '確認'
  cancelLabel?: string;       // Default: 'キャンセル'
  variant?: 'danger' | 'primary';  // Default: 'primary'
  isLoading?: boolean;        // Disables buttons during API call
}
```

| Property | Details |
|----------|---------|
| **File** | `frontend/src/components/shared/ConfirmDialog.tsx` |
| **Backdrop** | `fixed inset-0 bg-black/50 z-50`, click outside closes |
| **Dialog** | `bg-white rounded-xl shadow-xl max-w-md mx-auto p-6`, centered vertically |
| **Confirm Button (danger)** | `bg-red-600 hover:bg-red-700 text-white` |
| **Confirm Button (primary)** | `bg-blue-900 hover:bg-blue-800 text-white` |
| **Cancel Button** | `bg-white border border-slate-300 text-slate-700 hover:bg-slate-50` |
| **Animation** | Fade in 300ms (backdrop), scale up (dialog) |
| **Accessibility** | `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, focus trap, Escape key closes |

---

### 2.3 LoadingSpinner

```typescript
interface LoadingSpinnerProps {
  variant?: 'page' | 'inline';   // Default: 'inline'
  size?: 'sm' | 'md' | 'lg';    // Default: 'md'
  message?: string;              // Optional loading message
}
```

| Variant | Rendering |
|---------|-----------|
| `page` | Full viewport overlay, centered spinner, `z-40` |
| `inline` | Inline `<div>` with spinner icon |
| **Icon** | `lucide-react` `Loader2` with `animate-spin` |

---

### 2.4 EmptyState

```typescript
interface EmptyStateProps {
  icon?: React.ReactNode;        // lucide-react icon
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}
```

| Property | Details |
|----------|---------|
| **Container** | `flex flex-col items-center justify-center py-16 text-center` |
| **Icon** | `text-slate-300 w-16 h-16 mb-4` |
| **Title** | `text-lg font-semibold text-slate-600` |
| **Description** | `text-sm text-slate-400 mt-1` |
| **Action Button** | Optional primary button below description |

---

### 2.5 CurrencyDisplay

Formats a NUMERIC string with thousand separators and currency code.

```typescript
interface CurrencyDisplayProps {
  amount: string;                // NUMERIC as string e.g. "1234567.00"
  currencyCode?: string;         // Default: 'MMK'
  showCurrency?: boolean;        // Default: true
  className?: string;
}
```

| Example Input | Output |
|--------------|--------|
| `"1234567.00"`, `"MMK"` | `1,234,567.00 MMK` |
| `"500.50"`, `"USD"` | `500.50 USD` |
| `"0.00"` | `0.00 MMK` |

**Implementation Note:** Use `Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })` + currency code suffix.

---

### 2.6 ApprovalTimeline

Vertical timeline displaying approval history entries.

```typescript
interface ApprovalTimelineProps {
  logs: ApprovalLogWithUser[];
}
```

| Property | Details |
|----------|---------|
| **File** | `frontend/src/components/shared/ApprovalTimeline.tsx` |
| **Layout** | Vertical timeline with left border, circle nodes |
| **Each Entry** | Timestamp (local TZ), user name, action badge (colored), comment |
| **Rejection Highlight** | Comment box with `bg-red-50 border-l-4 border-red-400 p-3` |
| **Action Badge** | Uses `ACTION_LABELS_JP` and `ACTION_BADGE_COLORS` from types |
| **Timestamp Format** | `YYYY/MM/DD HH:mm` (UTC → local timezone conversion) |
| **Ordering** | Newest first (DESC by timestamp) |

---

### 2.7 FileUploadDropzone

```typescript
interface FileUploadDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  existingFiles?: ReceiptFile[];
  onFileRemove?: (fileId: number) => void;
  disabled?: boolean;
  maxFileSize?: number;          // Default: 10MB
  maxTotalSize?: number;         // Default: 50MB
  acceptedTypes?: string[];      // Default: ['application/pdf','image/png','image/jpeg']
}
```

| Property | Details |
|----------|---------|
| **Drop Zone** | `border-2 border-dashed border-slate-300 rounded-lg p-8 text-center`, hover: `border-blue-400 bg-blue-50` |
| **Drop Active** | `border-blue-500 bg-blue-50` |
| **Icon** | `Upload` from lucide-react |
| **File List** | Below dropzone, each: file name, size (formatted), remove button |
| **Validation** | Client-side MIME and size check on drop/select. Show error toast on invalid. |
| **Remove Button** | Red `X` icon, only visible when `disabled={false}` |

---

### 2.8 KpiCard

```typescript
interface KpiCardProps {
  label: string;
  count: number;
  icon: React.ReactNode;
  colorClasses: string;       // e.g. 'bg-blue-100 text-blue-800'
  onClick?: () => void;
}
```

| Property | Details |
|----------|---------|
| **Container** | `rounded-xl border border-slate-200 p-4 shadow-sm` + `colorClasses` |
| **Count** | `text-3xl font-bold` |
| **Label** | `text-sm text-slate-600 mt-1` |
| **Icon** | Top-right, `w-8 h-8 opacity-60` |
| **Hover** | `hover:shadow-md transition-shadow cursor-pointer` (when onClick provided) |

---

### 2.9 DataTable

Generic sortable/paginated table wrapper.

```typescript
interface Column<T> {
  key: string;
  header: string;                // Japanese column header
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  pagination?: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
  };
  sorting?: {
    sortBy: string;
    sortOrder: 'ASC' | 'DESC';
    onSortChange: (key: string) => void;
  };
}
```

| Property | Details |
|----------|---------|
| **Table** | `w-full border-collapse` |
| **Header** | `bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wider` |
| **Row** | `hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-100` |
| **Loading** | Skeleton rows (animated pulse) |
| **Pagination** | Bottom bar: "Page X of Y", Previous/Next buttons, page size select (10/20/50) |
| **Sort Icon** | `ChevronUp`/`ChevronDown` from lucide-react next to sortable headers |

---

### 2.10 PageHeader

```typescript
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;     // Right-aligned action buttons
}
```

| Property | Details |
|----------|---------|
| **Layout** | `flex items-center justify-between mb-6` |
| **Title** | `text-2xl font-bold text-slate-900` |
| **Subtitle** | `text-sm text-slate-500 mt-0.5` |
| **Actions** | `flex items-center gap-3` |

---

### 2.11 Toast

Simple toast notification system.

```typescript
interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;             // Default: 4000ms
}
```

| Type | Styling |
|------|---------|
| `success` | `bg-emerald-50 border-emerald-200 text-emerald-800`, CheckCircle icon |
| `error` | `bg-red-50 border-red-200 text-red-800`, XCircle icon |
| `warning` | `bg-amber-50 border-amber-200 text-amber-800`, AlertTriangle icon |
| `info` | `bg-blue-50 border-blue-200 text-blue-800`, Info icon |
| **Position** | Fixed top-right, stacked, `z-50` |
| **Animation** | Slide in from right, auto-dismiss after duration |

---

## 3. Layout Components (`frontend/src/components/layout/`)

### 3.1 DashboardLayout

Wraps all authenticated pages with sidebar + header + main content.

```typescript
interface DashboardLayoutProps {
  children: React.ReactNode;
}
```

```
┌─────────────────────────────────────────────────────┐
│ Header (h-16, bg-white, border-b)                   │
├──────────┬──────────────────────────────────────────┤
│          │                                          │
│ Sidebar  │  Main Content Area                       │
│ (w-64)   │  (flex-1, p-6, bg-slate-50)              │
│ bg-blue  │                                          │
│ -900     │  {children}                              │
│          │                                          │
├──────────┴──────────────────────────────────────────┤
│ Footer (py-4, text-center, border-t)                │
└─────────────────────────────────────────────────────┘
```

| Responsive | Behavior |
|-----------|----------|
| Desktop (≥1024px) | Sidebar visible, full layout |
| Tablet (768–1023px) | Sidebar hidden, hamburger button in header |
| Mobile (<768px) | Sidebar overlay, hamburger button |

### 3.2 Sidebar

```typescript
interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: string;
}
```

| Property | Details |
|----------|---------|
| **Width** | `w-64` fixed |
| **Background** | `bg-blue-900` |
| **Logo** | "PRWM System" in white, top |
| **Menu Items** | Role-based, active item highlighted with `bg-blue-800` |
| **User Info** | Bottom: avatar, name, role badge, logout button |
| **Mobile** | Overlay with backdrop, slide-in animation |

### 3.3 Header

```typescript
interface HeaderProps {
  user: JwtPayload;
  onMenuToggle: () => void;
  notificationCount?: number;
}
```

| Property | Details |
|----------|---------|
| **Layout** | `h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between` |
| **Left** | Hamburger button (mobile/tablet only) |
| **Right** | Notification bell (with badge count), user name, role badge |
| **Bell Badge** | Red circle with count, `animate-pulse` when > 0 |

---

## 4. Cross-References

| Related Document | Purpose |
|-----------------|---------|
| [DD_COMMON_03](./DD_COMMON_03_SHARED_TYPES.md) | Types consumed by components |
| [DD_COMMON_06](./DD_COMMON_06_SHARED_SERVICES_AND_HOOKS.md) | Hooks used by components |
| [DD_APPLICANT_02](../01_applicant/DD_APPLICANT_02_FRONTEND_REQUEST_LIST.md) | Uses KpiCard, DataTable, StatusBadge |
| [DD_APPLICANT_03](../01_applicant/DD_APPLICANT_03_FRONTEND_REQUEST_FORM.md) | Uses FileUploadDropzone, ConfirmDialog |
| [DD_APPLICANT_04](../01_applicant/DD_APPLICANT_04_FRONTEND_REQUEST_DETAIL.md) | Uses ApprovalTimeline, StatusBadge |
| [Development Rules §9](../../core_ja/02_開発ルール_DEVELOPMENT_RULES.md) | Design system colors and typography |
