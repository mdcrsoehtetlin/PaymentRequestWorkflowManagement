# Screen Items Specification (画面項目設計書) — [Screen Name]

**Document ID:** PRWM-SIS-SCR-[XXX]  
**Target Screen:** [Screen Name (EN)] ([Screen Name (JP)])  
**Subsystem:** Payment Request Lifecycle — [Module Name]  
**Function ID:** FN-[XXX]  
**Version:** 1.0  
**Created:** [YYYY-MM-DD]  
**Last Updated:** [YYYY-MM-DD]  
**Author:** [Author Name / Role]  
**Review Status:** [Draft / Reviewing / Approved (承認済み)]  
**Classification:** Internal — Engineering Division

---

## 1. Document Control (ドキュメント管理)

### 1.1 Document Revision History

| Version | Date | Author | Description of Changes |
| :--- | :--- | :--- | :--- |
| 1.0 | [YYYY-MM-DD] | [Author] | Initial release. |

### 1.2 Related Documents

| No. | Document ID | Document Name | File Path | Remarks |
| :-- | :--- | :--- | :--- | :--- |
| 1 | PRWM-REQ-001 | Requirements Definition | `01_要件定義書_REQUIREMENT_SPEC.md` | Business workflow logic, required fields, and rules. |
| 2 | PRWM-DBS-001 | Database Design Specification | `03_データベース設計書_DATABASE_SPEC.md` | Table structures, constraints, and data types. |
| 3 | PRWM-DEV-001 | Development Rules | `02_開発ルール_DEVELOPMENT_RULES.md` | Security rules, design tokens, error responses. |
| 4 | PRWM-FSD-[XXX] | Functional Specification — [Module] | `[MODULE]_04_機能設計書_FUNCTIONAL_SPEC.md` | Use cases, state transitions, validation rules. |

---

## 2. Screen Overview & Purpose (画面概要・目的)

### 2.1 Purpose (目的)
[Describe the primary objective of this screen. Who uses it, what business operations are performed here, and what value does it provide within the Payment Request Workflow Management System?]

### 2.2 Target Users & Roles (対象ユーザーと権限)

| Attribute | Value |
| :--- | :--- |
| **Primary Actor** | Authenticated user with `[ROLE_CODE]` role (`role_code = '[ROLE_CODE]'`) |
| **Required Authentication** | JWT Bearer Token (RS256, validated per request) |
| **Data Scope** | [Define what data this user is allowed to see, e.g., exclusively their own originated requests, or department-wide requests] |
| **Access Control** | [Define Guards, e.g., `JwtAuthGuard` → `RolesGuard` → `OwnershipGuard` (sequential execution)] |

### 2.3 Core Functions & Basic Design Principles (主要機能・基本設計方針)
1. **[Function/Principle 1]** — [Detailed Description]
2. **[Function/Principle 2]** — [Detailed Description]
3. **[Function/Principle 3]** — [Detailed Description]

---

## 3. Screen Layout (画面レイアウト構成)

### 3.1 Overall Page Structure (全体画面構成)

```text
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              BROWSER VIEWPORT                                        │
├──────────┬──────────────────────────────────────────────────────────────────────────┤
│          │  ┌────────────────────────────────────────────────────────────────────┐  │
│          │  │ [A] PAGE HEADER                                                    │  │
│          │  │   Page Title: "[Screen Name]" (h1)                                 │  │
│          │  │   User Info Badge   |   Notification Bell                          │  │
│  [NAV]   │  └────────────────────────────────────────────────────────────────────┘  │
│          │                                                                          │
│ Sidebar  │  ┌────────────────────────────────────────────────────────────────────┐  │
│ (w-64)   │  │ [B] [SECTION NAME] (e.g., KPI Summary Cards / Filter Bar)          │  │
│          │  │                                                                    │  │
│ - Logo   │  └────────────────────────────────────────────────────────────────────┘  │
│ - Menu   │                                                                          │
│ - User   │  ┌────────────────────────────────────────────────────────────────────┐  │
│          │  │ [C] [SECTION NAME] (e.g., Main Data Grid / Form Area)              │  │
│          │  │                                                                    │  │
│          │  └────────────────────────────────────────────────────────────────────┘  │
└──────────┴──────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Responsive Layout Breakpoints (レスポンシブ対応)

| Breakpoint | Min Width | Layout Behavior |
| :--- | :--- | :--- |
| Mobile (default) | 0px | [e.g., Single column, hidden sidebar (hamburger menu), stacked KPI cards, accordion sections] |
| Tablet (`md:`) | 768px | [e.g., Single column stacked with collapsible panes, 2-column KPI grid] |
| Desktop (`lg:`) | 1024px | [e.g., Full layout, fixed sidebar `w-64`, 4-column KPI grid, dual-pane list + detail] |

---

## 4. Item Definitions (画面項目定義)

### 4.1 Section [A]: [Section Name] (セクション名)

| No. | Item ID | Item Name (Logical) | Component Type | Data Type & Max Length | Required | Initial State / Default Value | Input Constraints / Formats | Data Source / DB Mapping | Remarks / Business Rules |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| 1 | `[element_id]` | [Logical Name] | [e.g., Text Input, Label, Select] | [e.g., String(50), DATE, NUMERIC] | [Mandatory / Optional / —] | [Default state, e.g., Empty] | [e.g., Regex bounds, valid dates] | `[table].[column]` | [Additional notes, CSS styling hints, Tooltips] |
| 2 | | | | | | | | | |

### 4.2 Section [B]: [Section Name] (セクション名)

| No. | Item ID | Item Name (Logical) | Component Type | Data Type & Max Length | Required | Initial State / Default Value | Input Constraints / Formats | Data Source / DB Mapping | Remarks / Business Rules |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| 3 | `[element_id]` | [Logical Name] | [e.g., Button (Primary)] | [—] | [—] | [e.g., Enabled, Visible] | [—] | [e.g., Triggers API or Navigation] | [Additional notes, CSS styling hints, Tooltips] |

*(Duplicate the section blocks as needed to map exactly to the Screen Layout wireframe.)*

---

## 5. Item Behaviors & Event Specifications (各項目における挙動・イベント仕様)

### 5.1 [Action/Event Name] (`[element_id]` [Event Type])
- **Trigger:** [Describe the exact user action or system event that triggers this behavior (e.g., Button Click, Row Select, Change Event).]
- **Processing Logic:**
  1. **Client-Side Pre-Check:** [e.g., Validate form fields, check character counts.]
  2. **Backend Dispatch:** [e.g., Send POST request to `/api/v1/...` with payload.]
  3. **Backend Execution:** [e.g., Verify optimistic locking (`hdn_modified_date`), update database records, log action to `approval_logs`.]
  4. **Post-Execution UI:** [e.g., Dispatch real-time WebSocket events, refresh data grid, display success toast message, reset form.]
- **Exception Handling:** [Detail what happens on failure, e.g., trigger optimistic lock conflict modal (`ERR-[MOD]-409`), or display inline validation errors.]

*(Duplicate the block above for each major interactive element, modal trigger, or form submission.)*

---

## 6. Validation & Error Message Mapping (バリデーション及びエラーメッセージマッピング)

| Error Code | Target Field | Condition / Evaluation Logic | UI/UX Display Presentation Style | Default Error Message Text |
| :--- | :--- | :--- | :--- | :--- |
| **VAL-[MOD]-001** | `[element_id]` | [e.g., Character count exceeds limit or mandatory field is empty during submit.] | [e.g., Red boundary outline, display error text directly under the input field.] | "[Exact validation message text]" |
| **ERR-[MOD]-401** | Full Viewport / API | [e.g., JWT is missing, expired, or invalid.] | [e.g., Floating modal alert, redirect to login screen.] | "Session expired. Please log in again." |
| **ERR-[MOD]-403** | Full Viewport / API | [e.g., Logged-in user lacks required role or tries to access unauthorized records.] | [e.g., Screen replacement with HTTP 403 Forbidden page.] | "Access Denied. You do not have permission to view this resource." |
| **ERR-[MOD]-409** | `[element_id]` / Panel | [e.g., Database `modified_date` does not match client-side tracking state (Optimistic Lock failure).] | [e.g., High-importance floating modal forcing data list reload.] | "This record has been modified by another user. The data will now refresh." |
| **ERR-[MOD]-500** | Full Viewport / API | [e.g., Unhandled backend exception or database connectivity issue.] | [e.g., Standard error modal exposing UUID trace string.] | "An unexpected error occurred. Please contact support with ID: <UUID>." |

---

## 7. Special UI Notes & Styling Constraints (特記事項・UI仕様)

- **Responsive Viewport Design Boundaries:** [e.g., Layout optimized primarily for standard desktop configurations (1280px+). Panels stack gracefully into scrollable rows on tablet/mobile screens.]
- **Accessibility Execution Rules:** [e.g., Every actionable control must be keyboard navigable via sequential `Tab` focus tracking and executable using `Enter` or `Space`.]
- **Performance & Loading States:** [e.g., Use skeleton loaders during data fetch. Action buttons must display spinners and enter `disabled` state while asynchronousPI calls are running to prevent double-submission.]
- **Security Provision (Sanitization Indicator):** [e.g., Explicitly sanitize and escape all user input fields (e.g., textareas) on both client and server sides to prevent Cross-Site Scripting (XSS) injection.]
- **Design System Rules:** [e.g., Adhere strictly to the color palettes, fonts, and micro-animations defined in `02_開発ルール_DEVELOPMENT_RULES.md`.]
