# MANAGER_03 — Screen Layout Specification

> **Doc ID:** PRWM-UI-MGR-03 | **Version:** 1.0 | **Status:** Released  
> **Last Updated:** 2026-06-23  
> **Related Screens:** MANAGER_04_Functional_Spec, MANAGER_05_Screen_Items

---

## 1. Overview

The Manager Dashboard is the primary screen for authenticated managers to efficiently review, verify, or reject payment requests assigned to them.

- **URL Path:** `/manager` (list), `/manager/requests/:id` (detail)
- **Design Style:** Full-width table list page with dedicated detail page navigation (list page uses a full-width table; row click navigates to the dedicated detail page; detail page has a "Back to List" button to return)
- **UI Framework:** React + Tailwind CSS
- **Accessibility:** WCAG 2.1 AA contrast compliance

---

## 2. UI Hierarchy Tree

### 2.1 List Page — `/manager` Full-Width Table

```
+-----------------------------------------------------------------------------------+
| [Header] PRWM System                                     Manager Name (Logout)    |
+-----------------------------------------------------------------------------------+
| [Metrics summary card container]                                                  |
|  +------------------+  +------------------+  +------------------+  +------------+  |
|  | Pending Review   |  | Reviewing        |  | Verified         |  | Rejected   |  |
|  | [Pending count]  |  | [Reviewing count]|  | [Verified count] |  | [Rejected] |  |
|  +------------------+  +------------------+  +------------------+  +------------+  |
+-----------------------------------------------------------------------------------+
| [Full-Width Container]                                                            |
|  +---------------------------------------------------------------------------+   |
|  | [Filters & Search Row]                                                    |   |
|  | [Search Input] [Search Button] [Status] [Date picker]                    |   |
|  +---------------------------------------------------------------------------+   |
|  | [Request Grid Table — Full Width]                                         |   |
|  | ID | Applicant | Amount | Date | Status | Urgent | Action                |   |
|  |----+-----------+--------+------+--------+--------+-----------------------|   |
|  | PRF| John Doe  | 10k MMK| 6-22 | REVIEW |        | [View]                |   |
|  |    |           |        |      |        |        |                       |   |
|  +---------------------------------------------------------------------------+   |
|  | [Pagination]                                                                |   |
|  +---------------------------------------------------------------------------+   |
+-----------------------------------------------------------------------------------+
```

### 2.2 Detail Page — `/manager/requests/:id` Dedicated Page

```
+-----------------------------------------------------------------------------------+
| [Header] PRWM System                                     Manager Name (Logout)    |
+-----------------------------------------------------------------------------------+
| [← Back to List]  Request Details                                                 |
+-----------------------------------------------------------------------------------+
|  +---------------------------------------------------------------------------+   |
|  | [Detail Header] PRF-2026-0001                                              |   |
|  | status: MANAGER_REVIEWING [badge]                                          |   |
|  +---------------------------------------------------------------------------+   |
|  | [Applicant Info Section]                                                   |   |
|  | Name | Emp No. | Branch | Dept                                             |   |
|  +---------------------------------------------------------------------------+   |
|  | [Payment Info Details]                                                     |   |
|  | Amount | Desired Date | Method | Bank                                      |   |
|  +---------------------------------------------------------------------------+   |
|  | [Breakdown Item Grid]                                                      |   |
|  | No | Date | Description | Amount                                           |   |
|  +---------------------------------------------------------------------------+   |
|  | [Receipt Attachment Link]                                                  |   |
|  | File_01.pdf (Download/Preview)                                              |   |
|  +---------------------------------------------------------------------------+   |
|  | [Approval Timeline Logs]                                                   |   |
|  | Created -> Submitted -> Reviewing                                          |   |
|  +---------------------------------------------------------------------------+   |
|  | [Comment Textarea] (Max 500 ch)                                            |   |
|  | [Button: REJECT]    [Button: APPROVE]                                      |   |
|  +---------------------------------------------------------------------------+   |
+-----------------------------------------------------------------------------------+
```

---

## 3. Section Layout Details

### 3.1 Dashboard Header
- Display the dashboard title "Manager Dashboard" (`dashboard.manager.title`) at the top-left.
- Place a `Sparkles` icon to the left of the title for visual accent.
- Place a "Refresh" button at the top-right. Clicking it re-fetches the latest data from `GET /api/v1/manager/requests` and displays a spinning loading indicator (`RefreshCw` animation).

### 3.2 Metrics Summary Cards Row
- Display all 4 metric cards in an equal-width grid at the top of the dashboard.
- **Card Composition:**
  1. **Pending Review:** `SUBMITTED_MANAGER` (Status 2) — Amber border and text (`border-amber-500/20`)
  2. **Reviewing:** `MANAGER_REVIEWING` (Status 3) — Indigo (`border-indigo-500/20`)
  3. **Verified:** `MANAGER_VERIFIED` (Status 4) — Emerald (`border-emerald-500/20`)
  4. **Rejected:** `REJECTED_MANAGER` (Status 5) — Rose (`border-rose-500/20`)
- **Interactions:**
  - Clicking a card applies the corresponding status ID filter to the request table (toggle behavior).
  - A pulse ring animation (`animate-ping`) is displayed at the top-right of each card to indicate the current review state.

### 3.3 Search & Filters
- A 3-column horizontal filter panel is placed above the table.
  - **Applicant Search:** Text input with a magnifying glass icon (`Search`). Performs partial match search on applicant name.
  - **Status Selection:** Select dropdown. Options: All, Pending Review, Reviewing, Verified, Rejected.
  - **Date Selection:** HTML5 date picker (`type="date"`) with a calendar icon (`Calendar`).
- The data list is automatically re-fetched with a 300ms debounce whenever a filter is changed.

### 3.4 Request Table List
- Occupies the **full width** of the grid on desktop (no right-side panel).
- Column assignments:
  - **Request Number:** Fixed-width, monospace font (`font-mono text-indigo-600`)
  - **Applicant:** Text (bold)
  - **Amount:** Right-aligned (bold, formatted as `totalAmount` + currency code from `CURRENCY_CODES`)
  - **Application Date:** Date format (`YYYY/M/D`)
  - **Urgent Flag:** Displays a red pulse badge "Urgent" when `desiredPaymentDate` is within 48 hours of the current time.
  - **Status:** Right-aligned, rounded status badge with color coding (per `STATUS_COLORS`).
- Table rows highlight with a light gray on hover (`hover:bg-slate-50/80`). Row click navigates to the dedicated detail page at `/manager/requests/:id`.

### 3.5 Detail Page — `/manager/requests/:id` Dedicated Page
- A dedicated page navigated to via table row click on the list page.
- **Header:** A "← Back to List" button returns to the list page.
- **Skeleton Loading:** A skeleton placeholder is displayed during page transition; actual data is rendered after fetch completes.
- The following sections are displayed in a scrollable layout.

#### 3.5.1 Basic Attributes Grid
- Displays applicant name, employee number, branch/department, desired payment date, payment type, and payment method in a clean 2-column layout.
- Desired payment date is highlighted in red text (`text-rose-600`) to emphasize urgency.
- When the payment method is "Bank Transfer" etc., account information (`bankAccountInfo`) is displayed in a highlighted card frame (`bg-slate-50 border-slate-100`).

#### 3.5.2 Payment Breakdown Table (Breakdown Grid)
- Displays line items (1–15 rows) included in the request in a table layout.
- Header: No, Date, Description, Amount.
- Footer: Displays the total amount row in bold with a background color (`bg-slate-50/70`).

#### 3.5.3 Receipt Attachment Area
- Lists uploaded receipt files.
- Displays file size (KB) in gray auxiliary text.
- Clicking the "Preview" link opens the file safely in a new browser tab.

#### 3.5.4 Approval History Timeline
- A vertical timeline displayed in chronological order (oldest first).
- Shows the responsible person's name, date, action badge, and any entered comments.

#### 3.5.5 Verification Decision Form
- Displayed only when the current status is `SUBMITTED_MANAGER` or `MANAGER_REVIEWING`.
- **Comment Input Area:**
  - A text area with a 500-character limit. A real-time character counter is placed at the bottom-right (turns red when exceeding 500 characters).
- **Error Warning Display:**
  - When validation errors exist (e.g., rejection reason less than 10 characters), an error message is displayed in a red frame (`bg-rose-50 border-rose-200 text-rose-700`).
- **Action Button Components:**
  - **Reject:** Left button (red outline `border-rose-200 text-rose-700 bg-rose-50/30`).
  - **Approve:** Right button (solid indigo `bg-indigo-600 text-white shadow-md`).

---

## 4. Responsive Breakpoints

- **Desktop (Width >= 1024px):**
  - Metrics summary in a 4-column horizontal row.
  - List page: Table displayed at full width. Navigation to dedicated detail page for details.
  - Detail page: "← Back to List" button to return to list.
- **Tablet (768px <= Width < 1024px):**
  - Metrics summary in a 2x2 grid.
  - List page: Table displayed at full width. Row click navigates to dedicated detail page.
  - Detail page: Stacked layout.
- **Mobile (Width < 768px):**
  - Metric summary cards hidden or collapsed into an accordion.
  - List page: Table fills the entire screen. Row click navigates to dedicated detail page.
  - Detail page: Full-screen display. "← Back to List" button returns to list.

---

## 5. Real-Time Data Synchronization

- Listens to `statusUpdate` and `request:status-changed` events in the background via WebSocket (Socket.io) communication.
- When another user (applicant or system administrator) updates the status of a request, the dashboard list and any open detail view are automatically updated with the latest data without requiring a page reload.
