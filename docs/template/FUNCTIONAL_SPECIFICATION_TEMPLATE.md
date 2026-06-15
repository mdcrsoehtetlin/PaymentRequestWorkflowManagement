# Functional Specification (機能設計書) — {{SCREEN_NAME}}

**Document ID:** PRWM-FSD-SCR-{{SEQUENTIAL_NUMBER}}  
**Target Screen:** {{Screen Display Name}} ({{画面日本語名}})  
**Subsystem:** Payment Request Lifecycle — {{Subsystem Operations Name}}  
**Function ID:** FN-{{FUNCTION_ID_NUMBER}}  
**Version:** 1.0  
**Created:** {{YYYY-MM-DD}}  
**Last Updated:** {{YYYY-MM-DD}}  
**Author:** {{Author Name / Role Title}}  
**Review Status:** Draft (下書き) | Under Review (レビュー中) | Approved (承認済み)  
**Classification:** Internal — Engineering Division

---

## Document Revision History

| Version | Date | Author | Description of Changes |
| :--- | :--- | :--- | :--- |
| 1.0 | {{YYYY-MM-DD}} | {{Author Name}} | Initial release. {{Brief summary of what this specification covers: use cases, business rules, state transitions, validation, error handling, permission control, real-time notification behavior, etc.}} |

---

## Table of Contents

1. [Functional Overview](#1-functional-overview)
2. [Use Cases and Business Workflow](#2-use-cases-and-business-workflow)
3. [State Transition Specification](#3-state-transition-specification)
4. [Business Rules](#4-business-rules)
5. [Screen Specifications](#5-screen-specifications)
6. [Functional Operation Specification](#6-functional-operation-specification)
7. [Input / Output Specification](#7-input--output-specification)
8. [Input Validation Rules](#8-input-validation-rules)
9. [Error Handling Specification](#9-error-handling-specification)
10. [Permission and Access Control](#10-permission-and-access-control)
11. [Real-Time Notification Behavior](#11-real-time-notification-behavior)
12. [Screen Transition Specification](#12-screen-transition-specification)
13. [Non-Functional Considerations](#13-non-functional-considerations)
14. [Configurable Items (External Definitions)](#14-configurable-items-external-definitions)
15. [Cross-Reference Traceability Matrix](#15-cross-reference-traceability-matrix)

---

## 1. Functional Overview

### 1.1 Purpose and Scope

<!--
  INSTRUCTIONS: Describe the purpose and operational scope of this screen/subsystem in the context
  of the Payment Request Workflow Management System. State clearly what lifecycle phases this screen
  covers and what it is the entry/exit point for.
-->

{{This screen serves as the primary operational portal for users assigned the `{{TARGET_ROLE}}` role within the Payment Request Workflow Management System. Describe the complete set of capabilities this screen provides and its position in the overall workflow.}}

### 1.2 Functional Responsibilities

<!--
  INSTRUCTIONS: Enumerate every functional area this screen is responsible for.
  Use a numbered list. Each item should have a bold title and a concise description.
-->

This screen is responsible for the following core functional areas:

1. **{{Responsibility Name}}** — {{Description of what the screen does in this area.}}
2. **{{Responsibility Name}}** — {{Description.}}
3. **{{Responsibility Name}}** — {{Description.}}

### 1.3 Target Users

| Attribute | Value |
| :--- | :--- |
| **Primary Actor** | Authenticated user with `{{ROLE_CODE}}` role (`role_code = '{{ROLE_CODE}}'`) |
| **Required Authentication** | JWT Bearer Token (validated per request) |
| **Data Scope** | {{Describe the data boundary — e.g., "Exclusively the authenticated user's own originated payment requests" or "All requests with `status_id = 8 (APPROVED)` assigned to the Accounting queue"}} |

### 1.4 Relationships with Other Functions and Peripheral Systems

<!--
  INSTRUCTIONS: Describe upstream triggers (what feeds data into this screen) and downstream
  events (what this screen's actions trigger for other screens/roles). Include an ASCII
  relationship diagram if it aids clarity.
-->

```text
┌──────────────────────────┐      ┌─────────────────────────────────────┐
│   {{Upstream Actor}}     │      │     {{Data Source / DB Table}}      │
│   ({{Triggering Action}})├─────►│  {{Resulting state/data change}}    │
└──────────────────────────┘      └──────────────┬────────────────────┘
                                                 │ {{Action}}
                                                 ▼
                                      ┌────────────────────────┐
                                      │  {{This Screen Name}}  │
                                      └──────────┬─────────────┘
                                                 │ {{Output Action}}
                                                 ▼
┌──────────────────────────┐      ┌─────────────────────────────────────┐
│   {{Downstream Actor}}   │      │     {{Data Destination / Table}}    │
│ ({{Notification/Display}})│◄────┤  {{Resulting state/data change}}    │
└──────────────────────────┘      └─────────────────────────────────────┘
```

### 1.5 Inputs / Outputs

| Input Information | Data Category | Source / Description |
| :--- | :--- | :--- |
| `{{table_name}}` | Database Table | {{Description of what data is consumed and how it is filtered.}} |
| `{{table_name}}` | Database Table | {{Description.}} |
| Filters & Search Parameters | User Input UI | {{Description of user-driven input filtering.}} |

| Output Information | Data Category | Destination / Description |
| :--- | :--- | :--- |
| Updated `{{table_name}}` | Database Table | {{Description of what changes this screen writes.}} |
| Created `{{table_name}}` | Database Table | {{Description of new records created.}} |
| WebSocket Event | Network Message | {{Description of real-time notifications dispatched.}} |
| Dashboard Toast / UI List | UI Display | {{Description of user-facing feedback.}} |

### 1.6 Related Documents

| No. | Document ID | Document Name | File Path / Reference | Remarks |
| :-- | :--- | :--- | :--- | :--- |
| 1 | PRWM-REQ-001 | Requirements Definition | `REQUIREMENT_DEFINITION.md` | {{Relevant sections, e.g., "Section 3.4.x, Section 4.x"}} |
| 2 | PRWM-DBS-001 | Database Design Specification | `DATABASE_DESIGN_SPECIFICATION.md` | Table structures, indexes, cache keys |
| 3 | {{DOC_ID}} | {{Document Name}} | {{File Path}} | {{Remarks}} |

---

## 2. Use Cases and Business Workflow

### 2.1 Use Case Catalog

<!--
  INSTRUCTIONS: Enumerate ALL use cases governed by this screen. Each use case gets a unique
  ID following the pattern UC-{{ROLE_PREFIX}}-NNN for traceability against the requirements
  definition and test case specifications.
-->

| UC-ID | Use Case Name | Precondition | Postcondition | Triggering Actor |
| :--- | :--- | :--- | :--- | :--- |
| UC-{{PREFIX}}-001 | {{Use Case Name}} | {{What must be true before this use case can execute.}} | {{What is true after successful execution.}} | {{Actor who initiates}} |
| UC-{{PREFIX}}-002 | {{Use Case Name}} | {{Precondition}} | {{Postcondition}} | {{Actor}} |
| UC-{{PREFIX}}-003 | {{Use Case Name}} | {{Precondition}} | {{Postcondition}} | {{Actor}} |

### 2.2 Primary Business Workflow

<!--
  INSTRUCTIONS: Provide a comprehensive ASCII art diagram or Mermaid flowchart illustrating the
  complete business workflow from this screen's perspective. Cover all possible paths including
  happy path, rejection recovery, and edge cases.
-->

```
                        ┌──────────────────┐
                        │  {{Entry Point}} │
                        └────────┬─────────┘
                                 │
                                 ▼
                   ┌─────────────────────────────┐
                   │   {{Main Screen View}}      │
                   │  ({{Data Load Description}})│
                   └──────────┬──────────────────┘
                              │
              ┌───────────────┼───────────────────┐
              ▼               ▼                   ▼
    ┌─────────────┐  ┌──────────────┐   ┌──────────────────┐
    │ {{Action 1}}│  │ {{Action 2}} │   │ {{Action 3}}     │
    └──────┬──────┘  └──────┬───────┘   └────────┬─────────┘
           │                │                    │
           ▼                ▼                    ▼
    ┌──────────────────────────────────────────────────┐
    │         {{Processing / Decision Gate}}            │
    └──────────────────┬───────────────────────────────┘
                       │
          ┌────────────┼────────────────┐
          ▼            ▼                ▼
   ┌────────────┐ ┌──────────────┐ ┌──────────────┐
   │ {{Path A}} │ │ {{Path B}}   │ │ {{Path C}}   │
   └────────────┘ └──────────────┘ └──────────────┘
```

### 2.3 Workflow Critical Path Summary

| Step | Action | Status Before | Status After | Assigned To |
| :---: | :--- | :--- | :--- | :--- |
| 1 | {{Action description}} | {{Status or N/A}} | `{{STATUS_CODE}}` ({{ID}}) | {{Role}} |
| 2 | {{Action description}} | `{{STATUS_CODE}}` ({{ID}}) | `{{STATUS_CODE}}` ({{ID}}) | {{Role}} |

### 2.4 Relevant Requirements Covered

<!--
  INSTRUCTIONS: List all requirement IDs from REQUIREMENT_DEFINITION.md that this screen implements.
  This provides immediate traceability.
-->

| Requirement ID | Requirement Summary |
| :--- | :--- |
| REQ-{{NNN}} | {{Brief description of the requirement.}} |
| REQ-{{NNN}} | {{Brief description.}} |

---

## 3. State Transition Specification

### 3.1 Actor-Controllable State Transitions

<!--
  INSTRUCTIONS: Document ONLY the state transitions that can be initiated by this screen's
  primary actor. All other transitions (system-initiated or other actors) should be referenced
  but not detailed here.
-->

| Transition ID | Origin Status | Target Status | Trigger Action | Guard Conditions |
| :--- | :--- | :--- | :--- | :--- |
| TR-{{PREFIX}}-01 | `{{ORIGIN_STATUS}}` ({{ID}}) | `{{TARGET_STATUS}}` ({{ID}}) | {{Button/Action name}} | {{All conditions that must be true for this transition to be permitted.}} |
| TR-{{PREFIX}}-02 | `{{ORIGIN_STATUS}}` ({{ID}}) | `{{TARGET_STATUS}}` ({{ID}}) | {{Button/Action name}} | {{Guard conditions.}} |

### 3.2 Actor-Observable Status Set

<!--
  INSTRUCTIONS: List ALL statuses that may appear on this screen. Define what the actor can do
  for each status. Use ✓ and ✗ symbols for boolean permissions.
-->

| Status ID | Status Code | Display Name | Can View | Can Edit | Can Delete | Can Submit / Act |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| 1 | `DRAFT` | Draft | ✓ | ✓ | ✓ | {{Allowed action or "—"}} |
| 2 | `SUBMITTED_MANAGER` | Submitted to Manager | ✓ | ✗ | ✗ | — |

### 3.3 Editable Status Set Definition

<!--
  INSTRUCTIONS: Per the payment_statuses master data, the editable statuses (is_editable_state = TRUE)
  are DRAFT (1), REJECTED_MANAGER (5), and REJECTED_APPROVER (9). Document which of these are
  relevant to this screen's actor.
-->

The system defines a request as "editable" when its `status_id` resolves to a record in the `payment_statuses` table where `is_editable_state = TRUE`. The editable statuses relevant to this screen are:

- `{{STATUS_CODE}}` (status_id: {{ID}})
- `{{STATUS_CODE}}` (status_id: {{ID}})

{{Describe what fields/elements become modifiable in these states.}}

---

## 4. Business Rules

### 4.1 Data Ownership and Access Isolation

<!--
  INSTRUCTIONS: Define how data is scoped to prevent unauthorized access. Every screen must
  enforce ownership/assignment-based isolation.
-->

| Rule ID | Rule Name | Description | Enforcement Layer |
| :--- | :--- | :--- | :--- |
| BR-{{PREFIX}}-001 | {{Rule Name}} | {{Complete description of the access isolation rule.}} | {{Backend (Guard/QueryBuilder), Frontend (response filtering), etc.}} |
| BR-{{PREFIX}}-002 | {{Rule Name}} | {{Description.}} | {{Enforcement layers.}} |

### 4.2 Edit Permission Rules

| Rule ID | Rule Name | Description |
| :--- | :--- | :--- |
| BR-{{PREFIX}}-003 | {{Rule Name}} | {{Description of when and what can be edited.}} |
| BR-{{PREFIX}}-004 | {{Rule Name}} | {{Description of post-action immutability.}} |

### 4.3 Deletion Rules

<!--
  INSTRUCTIONS: Only applicable if this screen's actor can delete records. If not, state
  "Not applicable to this screen — the {{ROLE}} actor has no deletion privileges."
-->

| Rule ID | Rule Name | Description |
| :--- | :--- | :--- |
| BR-{{PREFIX}}-005 | {{Rule Name}} | {{Description of soft-delete behavior and constraints.}} |

### 4.4 Receipt File Rules

<!--
  INSTRUCTIONS: Only applicable if this screen interacts with receipt files (upload, view, delete).
  If view-only, document the authorization and display rules.
-->

| Rule ID | Rule Name | Description |
| :--- | :--- | :--- |
| BR-{{PREFIX}}-006 | {{Rule Name}} | {{Description of receipt file handling.}} |

### 4.5 Amount Calculation Rules

<!--
  INSTRUCTIONS: Only applicable if this screen displays or validates monetary amounts.
  Document auto-calculation, precision, and constraints.
-->

| Rule ID | Rule Name | Description |
| :--- | :--- | :--- |
| BR-{{PREFIX}}-007 | {{Rule Name}} | {{Description.}} |

### 4.6 Workflow-Specific Rules

<!--
  INSTRUCTIONS: Document any rules unique to this screen's workflow position.
  Examples: Mandatory rejection comment, automatic status transition on open, workflow restart logic,
  branch-specific alert routing, etc.
-->

| Rule ID | Rule Name | Description |
| :--- | :--- | :--- |
| BR-{{PREFIX}}-008 | {{Rule Name}} | {{Description of workflow-specific rule.}} |
| BR-{{PREFIX}}-009 | {{Rule Name}} | {{Description.}} |

### 4.7 Audit Trail Rules

| Rule ID | Rule Name | Description |
| :--- | :--- | :--- |
| BR-{{PREFIX}}-010 | Immutable Approval Log | Every state-modifying action is recorded in the `approval_logs` table. Records are append-only and protected by the `trg_approval_logs_immutable` PostgreSQL trigger. Minimum retention: 5 years. |
| BR-{{PREFIX}}-011 | Timestamp Integrity | All timestamps are recorded in UTC with millisecond precision. Local timezone conversion is performed exclusively at the presentation layer. |

---

## 5. Screen Specifications

### 5.1 Screen: {{Screen Name}} ({{Route Path}})

<!--
  INSTRUCTIONS: For each distinct screen/view within this subsystem, document the layout,
  UI elements, and behavior. Use sub-sections for multiple screens.
-->

**Purpose:** {{What this screen displays and enables.}}

#### 5.1.1 UI Elements

<!--
  INSTRUCTIONS: List all visible UI elements on this screen. For data grids, list the columns.
  For forms, list the fields. For action areas, list the buttons.
-->

**Data Grid / List:**

| Column ID | Column Name | Data Source | Display Format | Sortable | Filterable |
| :--- | :--- | :--- | :--- | :---: | :---: |
| COL-01 | {{Column Name}} | `{{table.column}}` | {{Format description}} | ✓ | ✓ |
| COL-02 | {{Column Name}} | `{{table.column}}` | {{Format description}} | ✓ | ✗ |

**Action Controls:**

| UI Element | Type | Description / Behavior |
| :--- | :--- | :--- |
| {{Button/Control Name}} | Button (Primary) | {{What happens when clicked.}} |
| {{Button/Control Name}} | Button (Danger) | {{What happens when clicked. Include guard conditions.}} |
| {{Control Name}} | Text Area | {{Description of input, character limits, etc.}} |

**Default Filter:** {{Describe default filter state for the data display, e.g., "Status 2 (Submitted to Manager) and 3 (Manager Reviewing)".}}

### 5.2 Screen: {{Detail/Modal Screen Name}} ({{Route Path}})

**Purpose:** {{What this screen/modal displays.}}

#### 5.2.1 Read-Only Display Sections

<!--
  INSTRUCTIONS: List all information sections displayed in read-only mode. Group by logical area.
-->

**Applicant / Requester Information:**
- Employee Number (`employee_number`)
- Full Name (`full_name`)
- Branch (`branch`)

**Payment Information:**
- Application Date (`application_date`) — YYYY-MM-DD format
- Total Payment Amount (`total_amount`) — Decimal format (12,2) with currency prefix
- Desired Payment Date (`desired_payment_date`) — YYYY-MM-DD format
- Currency Type — resolved from `currencies.currency_code`
- Payment Type — resolved from `payment_types.payment_type_name`
- Payment Method — resolved from `payment_methods.payment_method_name`
- Purpose / Usage (`purpose`)
- Bank Account Info (`bank_account_info`) — conditional display

**Request Content & Attachments:**
- Payment Request Content (`request_content`)
- Receipt Present (`has_receipt`) — Yes/No indication
- Receipt Files — Hyperlinks to download stored digital attachments

**Payment Breakdown Table (支払内訳):**

| Column | Data Source | Format |
| :--- | :--- | :--- |
| No (行番号) | `line_number` | Integer 1–15 |
| Date (日付) | `item_date` | YYYY-MM-DD |
| Description (内容) | `description` | String (200 chars) |
| Amount (金額) | `amount` | Decimal (10,2) |

**Approval History (承認履歴):**

Timeline component rendering all previous `approval_logs` entries:

| Field | Data Source | Display Format |
| :--- | :--- | :--- |
| Date/Time (日時) | `timestamp` | UTC → Local timezone |
| User (担当者) | `action_taken_by_user_id` → `users.full_name` | Full name |
| Action (アクション) | `action_type_id` → `approval_action_types.action_type` | Action label |
| Comment (コメント) | `comment` | Text or "—" |

#### 5.2.2 Actor Controls

| UI Element | Type | Description / Behavior |
| :--- | :--- | :--- |
| {{Control Name}} | {{Type}} | {{Behavior description with guard conditions.}} |

#### 5.2.3 Dynamic Alert Evaluation

<!--
  INSTRUCTIONS: Only applicable if this screen has conditional alert/warning displays.
  Document each condition, its visual treatment, and the message displayed.
  Remove this section if not applicable.
-->

| Condition | Evaluation Logic | Alert Style | Display Message |
| :--- | :--- | :--- | :--- |
| {{Condition Name}} | `{{expression}}` | {{Warning (red) / Info (blue)}} | "{{Message text}}" |

---

## 6. Functional Operation Specification

<!--
  INSTRUCTIONS: Document EVERY operation this screen performs, in the same structured format.
  Each operation gets its own subsection.
-->

### 6.1 Operation: {{Operation Name}}

| Attribute | Specification |
| :--- | :--- |
| **Trigger** | {{What user action or system event initiates this operation.}} |
| **Data Source** | {{API endpoint or data retrieval method, e.g., `GET /api/payment-requests/my-requests`}} |
| **Query Filter** | {{SQL-level filter conditions, e.g., `applicant_user_id = current_user.user_id AND is_deleted = FALSE`}} |
| **Default Sort** | {{Sorting rules, e.g., "Primary: `status_id` (ascending per display_order), Secondary: `created_date` (descending)"}} |
| **Pagination** | {{Pagination strategy: server-side/client-side, default page size, query parameters.}} |
| **Display Fields** | {{List of fields rendered in the UI.}} |
| **Real-Time Update** | {{WebSocket event that triggers a refresh, if applicable.}} |

### 6.2 Operation: {{Operation Name}}

| Attribute | Specification |
| :--- | :--- |
| **Trigger** | {{Trigger description.}} |
| **Guard Condition** | {{Preconditions that must be true: status checks, ownership checks, role checks.}} |
| **API Endpoint** | {{HTTP method and path, e.g., `POST /api/payment-requests/:id/submit-manager`}} |
| **Request Content-Type** | {{`application/json` or `multipart/form-data`}} |
| **Authentication** | `Authorization: Bearer <JWT>` header required. |
| **Payload Structure** | {{Describe the request body format.}} |
| **Pre-Submission Validation** | {{Reference to Section 8 validation rules enforced before this operation proceeds.}} |
| **Processing Steps** | {{Numbered sequence of all processing steps:}} |
| | 1. Validate {{condition}}. |
| | 2. {{Begin database transaction if applicable.}} |
| | 3. {{Update/Create database records — specify table, fields, and values.}} |
| | 4. {{Write `approval_logs` entry — specify `action_type_id`, `previous_status_id`, `new_status_id`.}} |
| | 5. {{Commit transaction.}} |
| | 6. {{Cache invalidation — specify Redis key pattern to evict.}} |
| | 7. {{Dispatch WebSocket event — specify target room(s) and event payload.}} |
| | 8. {{Return HTTP response — specify status code and response body.}} |
| **Concurrency Control** | {{Optimistic locking strategy, e.g., "`modified_date` comparison, HTTP 409 on conflict."}} |
| **User Confirmation** | {{If a confirmation dialog is required, specify the dialog text and button labels.}} |
| **Button Visibility** | {{Conditions under which the triggering button is visible/hidden.}} |
| **Response Payload** | {{JSON structure of the API response.}} |
| **Rejection Behavior** | {{What happens if guard conditions fail — specify HTTP status and error payload.}} |

### 6.3 Operation: {{Operation Name}}

<!--
  INSTRUCTIONS: Repeat Section 6.x for every additional operation.
  Every screen typically has: List Display, Detail View, Primary Action(s), Secondary Action(s).
-->

| Attribute | Specification |
| :--- | :--- |
| **Trigger** | {{...}} |
| **...** | {{Continue with same structure as 6.2}} |

---

## 7. Input / Output Specification

### 7.1 Input Specification (入力定義)

<!--
  INSTRUCTIONS: If this screen has an editable form, document all input fields.
  If this screen is read-only (e.g., Manager review, Accounting processing), state that
  and reference Section 5 for the read-only display fields.
-->

| Section | Field (Physical Name) | Display Name (English) | Display Name (日本語) | Data Type & Length | Required | Auto-populated | Input Control | Notes |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| Header | `application_date` | Application Date | 申請日 | DATE | Yes | No | Date Picker | Today or earlier |
| Header | `employee_number` | Employee Number | 社員番号 | VARCHAR(20) | Yes | Yes | Read-Only Text | From User profile |
| Payment | `total_amount` | Total Payment Amount | 支払金額 | NUMERIC(12,2) | Yes | Yes | Auto-calculated | Sum of breakdown items |
| Payment | `currency_id` | Currency | 通貨選択 | INT (FK) | Yes | No | Dropdown | Active `currencies` records |

### 7.2 Output Specification (出力定義)

<!--
  INSTRUCTIONS: Document all output/display fields rendered on this screen, grouped by section.
  Reference the field source (table.column) and display format.
-->

#### 7.2.1 {{Section Name}}

| Field | Display Name | Data Source | Display Format |
| :--- | :--- | :--- | :--- |
| Request Number | 申請番号 | `payment_requests.request_number` | String (e.g., "PRF-2026-001") |
| Application Date | 申請日 | `payment_requests.application_date` | YYYY-MM-DD |

---

## 8. Input Validation Rules

### 8.1 Draft Save Validation (Relaxed Mode)

<!--
  INSTRUCTIONS: Only applicable if this screen allows incremental saves (e.g., Applicant drafts).
  Remove this section if the screen is read-only or action-only.
-->

During draft save operations, the system applies relaxed validation:

| Field | Validation Rule | Error Condition |
| :--- | :--- | :--- |
| `{{field_name}}` | {{Rule if provided.}} | {{What triggers the error.}} |

All other fields may be left empty during draft save without triggering validation errors.

### 8.2 Submission / Action Validation (Strict Mode)

<!--
  INSTRUCTIONS: Document the COMPLETE validation suite enforced before the primary action
  (e.g., submit to manager, verify, approve, mark as paid).
-->

| Section | Field (Physical Name) | Display Name | Validation Rule | Error Message |
| :--- | :--- | :--- | :--- | :--- |
| **{{Section}}** | `{{field_name}}` | {{Display Name}} | {{Complete validation rule.}} | "{{Exact error message displayed to the user.}}" |
| **{{Section}}** | `{{field_name}}` | {{Display Name}} | {{Validation rule.}} | "{{Error message.}}" |

### 8.3 Validation Enforcement Layers

All validation rules defined in this section are enforced at two independent layers to ensure defense-in-depth:

| Layer | Technology | Responsibility |
| :--- | :--- | :--- |
| **Frontend (Client)** | React form validation with real-time feedback | Provides immediate user feedback on input errors. Prevents submission of invalid forms. Reduces unnecessary API calls. |
| **Backend (Server)** | NestJS Service Layer + `class-validator` DTOs | Authoritative validation. Rejects invalid payloads with HTTP `400 Bad Request` and structured error response. Guards against client-side validation bypass. |

---

## 9. Error Handling Specification

### 9.1 Error Response Structure

All API error responses from the backend shall conform to the following JSON structure:

```json
{
  "statusCode": {{HTTP_STATUS_CODE}},
  "error": "{{ERROR_CODE}}",
  "message": "{{Human-readable summary message.}}",
  "details": [
    {
      "field": "{{field_name}}",
      "constraint": "{{constraint_name}}",
      "message": "{{Field-level error message.}}"
    }
  ],
  "timestamp": "{{ISO 8601 UTC timestamp}}",
  "path": "{{API endpoint path}}"
}
```

### 9.2 Error Classification Table

| HTTP Status | Error Code | Scenario | User-Facing Behavior |
| :---: | :--- | :--- | :--- |
| `400` | `BAD_REQUEST` | Validation failure on submitted data. | Display inline field-level error messages. Display a summary error banner at the top of the form. |
| `401` | `UNAUTHORIZED` | JWT token is missing, expired, or invalid. | Redirect user to the login screen. Display session expiration message. |
| `403` | `FORBIDDEN` | User attempts to access or modify a resource they do not own, or attempts a prohibited action. | Display an access denied message. Do not disclose details about the target resource. |
| `404` | `NOT_FOUND` | The specified resource does not exist or has been soft-deleted. | Display "The requested resource was not found or has been archived." |
| `409` | `CONFLICT` | Optimistic concurrency conflict — record was modified by another session. | Display "This record has been modified since you last loaded it. Please refresh the page and try again." |
| `413` | `PAYLOAD_TOO_LARGE` | Uploaded file exceeds the 10 MB size limit. | Display "The selected file exceeds the maximum allowed size of 10 MB." |
| `415` | `UNSUPPORTED_MEDIA_TYPE` | Uploaded file MIME type is not in the permitted set. | Display "The selected file type is not supported. Permitted types: PDF, PNG, JPG, JPEG." |
| `422` | `UNPROCESSABLE_ENTITY` | Business rule violation (e.g., invalid status transition, receipt required but not attached). | Display specific business rule violation message. |
| `500` | `INTERNAL_SERVER_ERROR` | Unexpected server error. | Display "An unexpected error occurred. Please try again or contact your system administrator." Log full stack trace server-side. |

### 9.3 Frontend Error Display Behavior

| Error Type | Display Method |
| :--- | :--- |
| **Field-Level Validation Error** | Red border on the invalid input field. Error message text displayed directly below the field in red. Field retains focus until corrected. |
| **Form-Level Validation Summary** | A dismissible error banner displayed at the top of the form listing all validation errors with anchor links to the corresponding fields. |
| **API Error (Non-Validation)** | Toast notification displayed in the top-right corner of the viewport. Auto-dismiss after 8 seconds. Manual dismiss available. Color-coded: red for errors, amber for warnings. |
| **Network Error / Timeout** | Full-width banner: "Unable to connect to the server. Please check your network connection and try again." Retry button provided. |
| **Concurrency Conflict (409)** | Modal dialog with "Refresh" action button that reloads the current data from the server. |

---

## 10. Permission and Access Control

### 10.1 Authentication Requirements

| Attribute | Specification |
| :--- | :--- |
| **Authentication Mechanism** | JSON Web Token (JWT) Bearer Token |
| **Token Transport** | `Authorization: Bearer <token>` HTTP header on every API request |
| **Token Validation** | Server-side verification of token signature, expiration (`exp` claim), and issuer (`iss` claim) on every incoming request. |
| **Session Management** | Stateless JWT with Redis-backed session caching for enhanced security. Session TTL: 3,600 seconds (1 hour, sliding window). |
| **Token Refresh** | Client-side token refresh before expiration. If token expires mid-session, user is redirected to the login screen with a session expiration notification. |

### 10.2 Authorization Guard Architecture

The following NestJS guards are applied in sequence to every API endpoint for this screen:

| Guard Order | Guard Name | Purpose | Failure Response |
| :---: | :--- | :--- | :--- |
| 1 | `JwtAuthGuard` | Validates the JWT Bearer token. Extracts and attaches the authenticated user context to the request object. | HTTP `401 Unauthorized` |
| 2 | `RolesGuard` | Validates that the authenticated user's `role_id` maps to the `{{ROLE_CODE}}` role code. | HTTP `403 Forbidden` |
| 3 | `{{OwnershipGuard / AssignmentGuard}}` | {{Describe the resource-specific authorization check — e.g., validates that `payment_requests.applicant_user_id` or `payment_requests.manager_user_id` matches the authenticated user.}} | HTTP `403 Forbidden` |

### 10.3 API Endpoint Permission Matrix

| Endpoint | Method | Required Role | Ownership / Assignment Check | Description |
| :--- | :---: | :--- | :---: | :--- |
| `/api/{{resource-path}}` | `GET` | `{{ROLE}}` | {{✓ / Implicit / N/A}} | {{Description.}} |
| `/api/{{resource-path}}/:id` | `GET` | `{{ROLE}}` | ✓ | {{Description.}} |
| `/api/{{resource-path}}/:id/{{action}}` | `POST` | `{{ROLE}}` | ✓ | {{Description.}} |

### 10.4 Security Audit Logging

Every state-modifying action performed by the actor is recorded in the `approval_logs` table with the following metadata:

| Field | Source | Purpose |
| :--- | :--- | :--- |
| `action_taken_by_user_id` | JWT `user_id` claim | Identifies the actor who performed the action. |
| `action_type_id` | Business logic mapping | Classifies the type of action (e.g., CREATED, EDITED, SUBMITTED, MGR_VERIFIED, APPROVED, PAYMENT_COMPLETED). |
| `previous_status_id` | Current `status_id` before transition | Records the originating state for audit trail reconstruction. |
| `new_status_id` | Target `status_id` after transition | Records the destination state. |
| `comment` | User input (if applicable) | Captures actor comments or system-generated notes. |
| `ip_address` | Request metadata (`X-Forwarded-For` or socket address) | Security audit — identifies the client network origin. |
| `user_agent` | Request header `User-Agent` | Security audit — identifies the client browser/device. |
| `timestamp` | Server-generated `CURRENT_TIMESTAMP` (UTC) | Precise temporal record of the action. |

---

## 11. Real-Time Notification Behavior

### 11.1 WebSocket Configuration

| Attribute | Specification |
| :--- | :--- |
| **Technology** | Socket.IO (via NestJS `@WebSocketGateway`) |
| **Gateway Port** | 3001 |
| **CORS Policy** | Configurable per environment. Development: `origin: '*'`. Production: restricted to application domain. |
| **Connection Protocol** | Upon login, the frontend client establishes a WebSocket connection and emits a `joinRoom` event with `{ role: '{{ROLE_CODE}}', userId: <user_id> }`. |
| **Room Membership** | Each user joins two rooms: (1) their role room (`'{{ROLE_CODE}}'`), and (2) their personal room (`'user:<user_id>'`). |

### 11.2 Notification Events Received by This Screen

| Event Name | Trigger Condition | Payload | UI Behavior |
| :--- | :--- | :--- | :--- |
| `statusUpdate` | {{Describe the upstream action that triggers this event.}} | `{ payment_request_id, request_number, previous_status, new_status, action_by, timestamp }` | 1. Display toast notification. 2. Update affected row in list. 3. Refresh detail view if open. |
| `notification` | {{Personal notification condition.}} | `{ type, title, message, payment_request_id, timestamp }` | 1. Display toast notification. 2. Increment unread badge counter. |

### 11.3 Notification Events Dispatched by This Screen's Actions

| Actor Action | Target Room | Event Name | Payload |
| :--- | :--- | :--- | :--- |
| {{Action name}} | `{{target_room}}` | `statusUpdate` | `{ payment_request_id, request_number, new_status: '{{STATUS}}', action_by: <actor_name>, timestamp }` |

### 11.4 Connection Resilience

| Scenario | Behavior |
| :--- | :--- |
| **Temporary Disconnection** | Socket.IO automatic reconnection with exponential backoff. Pending events are queued and delivered upon reconnection. |
| **Extended Disconnection** | Upon reconnection, the frontend issues a full data refresh request to synchronize the list with the latest server state. |
| **Latency Requirement** | Status change notifications must be delivered to connected clients within ≤ 500 milliseconds of the server-side transaction commit (per NFR-003). |

---

## 12. Screen Transition Specification

### 12.1 Inbound Navigation

| Source Screen | Navigation Path | Condition |
| :--- | :--- | :--- |
| Login Screen | Successful authentication with `{{ROLE_CODE}}` role → automatic redirect to `{{/route}}`. | User `role_id` maps to `{{ROLE_CODE}}`. |
| Global Navigation Header | Click "{{Navigation Label}}" link in the top navigation bar. | User is authenticated. |
| Root URL (`/`) | Automatic redirect via `<Navigate to="{{/route}}" replace />`. | Default landing route for role. |

### 12.2 Internal Screen States

| Screen State | Trigger | Content Displayed |
| :--- | :--- | :--- |
| **List View (Default)** | Dashboard initial load. | {{Description of default list view content.}} |
| **Detail View / Modal** | Click on a specific record from the list. | {{Description of detail view content.}} |
| **{{Custom State}}** | {{Trigger.}} | {{Content description.}} |

### 12.3 Outbound Navigation

| Destination | Trigger | Condition |
| :--- | :--- | :--- |
| Login Screen | JWT token expiration or manual logout action. | Session expired or user-initiated logout. |
| 404 Page | URL path does not match any defined route. | Invalid URL entered directly. |
| {{Previous Screen}} | {{Back button or action completion.}} | {{Condition.}} |

---

## 13. Non-Functional Considerations

### 13.1 Performance Requirements

| Metric | Target | Measurement Method |
| :--- | :--- | :--- |
| Page load time (initial render) | ≤ 2 seconds | Time from navigation initiation to full DOM paint with data populated. |
| Primary list query response | ≤ 1 second | Server-side API response time. Optimized by `{{relevant_index_names}}`. |
| Primary action round-trip | ≤ 2 seconds | Time from action initiation to server confirmation and UI update. |
| File upload (if applicable) | ≤ 5 seconds for 10 MB file | Time from upload initiation to server confirmation. |
| WebSocket notification delivery | ≤ 500 milliseconds | Time from server-side transaction commit to client-side toast display. |

### 13.2 Caching Strategy

| Cache Domain | Key Pattern | TTL | Invalidation Trigger |
| :--- | :--- | :--- | :--- |
| Master lookup tables | `lookup:<table_name>` | 86,400 seconds (24 hours) | Administrator modification of master data. |
| Payment request payload | `payment_request:payload:<id>` | 600 seconds (10 minutes) | Any status transition, field update, or action on the request. Evicted via `DEL` on transaction commit. |
| {{Screen-specific cache}} | `{{key_pattern}}` | {{TTL}} | {{Trigger.}} |

### 13.3 Responsive Design Requirements

| Device Category | Viewport Range | Layout Adaptation |
| :--- | :--- | :--- |
| Desktop | ≥ 1024px | {{Layout description, e.g., "Two-column layout with list/timeline on left, detail view on right."}} |
| Tablet | 768px – 1023px | {{Layout description, e.g., "Single-column stacked layout with collapsible sections."}} |
| Mobile | < 768px | {{Layout description, e.g., "Full-width single-column layout with accordion-style sections."}} |

### 13.4 Display Order / Sorting Rules

<!--
  INSTRUCTIONS: Define the default sorting order for the primary data display on this screen.
-->

The primary data list displays records in accordance with the following sorting rules:

1. **{{Column Name}} (`{{column_name}}`)**: {{Ascending/Descending}} — {{Rationale.}}
2. **{{Column Name}} (`{{column_name}}`)**: {{Ascending/Descending}} — {{Rationale.}}
3. **{{Column Name}} (`{{column_name}}`)**: {{Ascending/Descending}} — {{Rationale.}}

---

## 14. Configurable Items (External Definitions)

<!--
  INSTRUCTIONS: Document any system properties or configuration values that this screen depends on,
  defined externally in environment variables or configuration files.
  Remove this section if not applicable.
-->

The following system properties are defined externally in the application's configuration (`.env` or environment variables) and can be modified without altering compiled code:

| Definition Key | Parameter Classification | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `{{KEY_NAME}}` | {{System String / Integer / Path}} | `{{value}}` | {{Description of what this configures.}} |

---

## 15. Cross-Reference Traceability Matrix

### 15.1 Requirements Definition Traceability

| Requirement ID | Requirement Description | Covered By (This Document) |
| :--- | :--- | :--- |
| REQ-{{NNN}} | {{Requirement description from REQUIREMENT_DEFINITION.md.}} | {{UC-ID, Section number, BR-ID}} |
| REQ-{{NNN}} | {{Requirement description.}} | {{References within this document.}} |

### 15.2 Database Design Traceability

| Database Table | Relevant Functional Operations |
| :--- | :--- |
| `payment_requests` | {{UC-IDs and operations that read/write this table.}} |
| `payment_breakdown_items` | {{UC-IDs and operations.}} |
| `receipt_files` | {{UC-IDs and operations.}} |
| `approval_logs` | {{UC-IDs and operations.}} |
| `users` | {{UC-IDs and operations.}} |
| `payment_statuses` | {{Section references for state transition logic.}} |
| `currencies` | {{Section references.}} |
| `payment_types` | {{Section references.}} |
| `payment_methods` | {{Section references.}} |
| `approval_action_types` | {{Section references.}} |

### 15.3 Related Document References

| Document ID | Document Name | Relationship |
| :--- | :--- | :--- |
| PRWM-SIS-SCR-{{NNN}} | Screen Items Specification — {{Screen Name}} | Defines the physical field layout, input types, initial values, and display specifications for all UI elements referenced in this functional specification. |
| PRWM-DDS-SCR-{{NNN}} | Detail Design Specification — {{Screen Name}} | Defines API endpoint contracts, database query implementations, and processing sequence diagrams that implement the functional operations specified herein. |
| PRWM-REQ-001 | Requirements Definition (`REQUIREMENT_DEFINITION.md`) | Upstream requirements document. All functional operations and business rules trace to requirements defined in this document. |
| PRWM-DBS-001 | Database Design Specification (`DATABASE_DESIGN_SPECIFICATION.md`) | Defines the physical database schema, constraints, indexes, and data dictionary upon which this functional specification's data operations are built. |

---

## Appendix A: Status Code Quick Reference

<!--
  INSTRUCTIONS: This appendix provides a quick-reference for all payment statuses used across the system.
  Include this in every functional specification document verbatim for consistency.
-->

| Status ID | Status Code | Display Name | Editable | Terminal | Assigned To |
| :---: | :--- | :--- | :---: | :---: | :--- |
| 1 | `DRAFT` | Draft | ✓ | ✗ | Applicant |
| 2 | `SUBMITTED_MANAGER` | Submitted to Manager | ✗ | ✗ | Manager |
| 3 | `MANAGER_REVIEWING` | Manager Reviewing | ✗ | ✗ | Manager |
| 4 | `MANAGER_VERIFIED` | Manager Verified (OK) | ✗ | ✗ | Applicant |
| 5 | `REJECTED_MANAGER` | Rejected by Manager | ✓ | ✗ | Applicant |
| 6 | `SUBMITTED_APPROVER` | Submitted to Approver | ✗ | ✗ | Final Approver |
| 7 | `APPROVER_REVIEWING` | Approver Reviewing | ✗ | ✗ | Final Approver |
| 8 | `APPROVED` | Approved | ✗ | ✗ | Accounting |
| 9 | `REJECTED_APPROVER` | Rejected by Approver | ✓ | ✗ | Applicant |
| 10 | `PAID` | Paid (Completed) | ✗ | ✓ | N/A |

---

## Appendix B: Approval Action Types Quick Reference

| Action Type ID | Action Code | Action Type | Description |
| :---: | :--- | :--- | :--- |
| 1 | `CREATED` | Created | Payment request draft initialized. |
| 2 | `EDITED` | Edited | Draft or rejected request modified by applicant. |
| 3 | `SUBMITTED` | Submitted | Request submitted by applicant for review. |
| 4 | `MGR_REVIEW_START` | Manager Review Started | System auto-transition on manager open. |
| 5 | `MGR_VERIFIED` | Manager Verified | Manager completed verification successfully. |
| 6 | `MGR_REJECTED` | Manager Rejected | Manager rejected request back to applicant. |
| 7 | `APPR_REVIEW_START` | Approver Review Started | System auto-transition on approver open. |
| 8 | `APPROVED` | Approved | Final Approver authorized the payment request. |
| 9 | `APPR_REJECTED` | Approver Rejected | Final Approver rejected request back to applicant. |
| 10 | `PAYMENT_COMPLETED` | Payment Completed | Accounting completed payment processing. |

---

## Appendix C: Standard Database Schema Reference

<!--
  INSTRUCTIONS: Include the core entity tables relevant to this screen for quick developer reference.
  Copy from DATABASE_DESIGN_SPECIFICATION.md. Only include tables this screen directly interacts with.
-->

### C.1 Core Tables Used by This Screen

| Table Name | Purpose | Key Columns |
| :--- | :--- | :--- |
| `payment_requests` | {{How this screen uses this table.}} | `payment_request_id`, `status_id`, `applicant_user_id`, `manager_user_id`, ... |
| `payment_breakdown_items` | {{How this screen uses this table.}} | `payment_breakdown_item_id`, `payment_request_id`, `line_number`, `amount`, ... |
| `receipt_files` | {{How this screen uses this table.}} | `receipt_file_id`, `payment_request_id`, `file_storage_path`, `is_deleted`, ... |
| `approval_logs` | {{How this screen uses this table.}} | `approval_log_id`, `payment_request_id`, `action_type_id`, `comment`, ... |
| `users` | {{How this screen uses this table.}} | `user_id`, `role_id`, `full_name`, `branch`, `is_active`, ... |

---

## Appendix D: Glossary & Terminology (用語集)

| Term (English) | Term (Japanese) | Definition |
| :--- | :--- | :--- |
| State Transition | 状態遷移 | A change in `payment_requests.status_id` according to the defined state diagram. |
| Approval Log | 承認履歴ログ | Immutable audit table (`approval_logs`) tracking all actions, transitions, and comments. |
| Applicant | 申請者 | Employee submitting payment requests. |
| Manager | 担当マネージャー | First-level reviewer; verifies request details. |
| Final Approver | 最終承認者 | Second-level reviewer; makes final approval decision. |
| Accounting | 経理 | Finance team; processes payments and marks requests complete. |
| Soft Delete | 論理削除 | Logical deletion using `is_deleted` flag; physical records retained for audit. |
| RBAC | ロールベースアクセス制御 | Authorization model based on user's assigned role. |
| Receipt File | 領収書ファイル | Attachment (PDF, JPG, PNG) supporting the payment request. |
| Guard Condition | ガード条件 | Preconditions that must be satisfied before a state transition or action is permitted. |
| Optimistic Locking | 楽観的ロック | Concurrency control using `modified_date` comparison to detect conflicting updates. |
| WebSocket Room | WebSocketルーム | Named channel for targeted real-time notification delivery. |

---

*End of Functional Specification — {{Screen Display Name}} ({{画面日本語名}})*
