# Functional Specification (機能設計書) — Admin Panel

**Document ID:** PRWM-FSD-SCR-005  
**Target Screen:** Admin Panel (システム管理者パネル)  
**Subsystem:** Payment Request Lifecycle — Admin Operations  
**Function ID:** FN-005001  
**Version:** 1.2  
**Created:** 2026-06-12  
**Last Updated:** 2026-06-15  
**Author:** System Architect  
**Review Status:** Approved (承認済み)  
**Classification:** Internal — Engineering Division

---

## Document Revision History

| Version | Date | Author | Description of Changes |
| :--- | :--- | :--- | :--- |
| 1.0 | 2026-06-12 | System Architect | Initial release in Japanese (Approved). |
| 1.1 | 2026-06-15 | System Architect | Modified structure based on standard template, expanded details, and translated to English. |
| 1.2 | 2026-06-15 | System Architect | Removed "Export to CSV" feature from functional specification. |

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

This screen serves as the primary operational portal for users assigned the `ADMIN` role within the Payment Request Workflow Management System. It acts as an administrative console allowing system administrators to manage system users (creation, editing, and activation/deactivation), view static lookup tables to verify system master configurations, and search/inspect global audit trails (approval logs) generated across the application lifecycle.

### 1.2 Functional Responsibilities

This screen is responsible for the following core functional areas:

1. **User Account Management** — Allows registering new users, editing user profiles, and enabling or disabling user accounts (`is_active` flag control).
2. **Master Data Verification** — Provides a read-only consolidated view of the application's lookup tables (Roles, Statuses, Currencies, Payment Types, and Payment Methods) to verify system configuration state and cache state.
3. **Global Audit Log Inspection** — Allows administrators to view, filter, and export a complete historical log (`approval_logs`) of all transactional status changes, including IP address auditing and action timestamps.

### 1.3 Target Users

| Attribute | Value |
| :--- | :--- |
| **Primary Actor** | Authenticated user with `ADMIN` role (`role_code = 'ADMIN'`) |
| **Required Authentication** | JWT Bearer Token (validated per request) |
| **Data Scope** | System-wide read/write for user accounts; system-wide read-only for master data tables and approval logs. Cannot create or edit payment requests. |

### 1.4 Relationships with Other Functions and Peripheral Systems

```text
┌──────────────────────────┐      ┌─────────────────────────────────────┐
│       ADMIN User         │      │             users Table             │
│   (Creates/Updates User) ├─────►│  Writes new/updated user records    │
└──────────────────────────┘      └──────────────┬────────────────────┘
                                                 │ 
                                                 ▼
                                      ┌────────────────────────┐
                                      │   Admin Panel Screen   │
                                      └──────────┬─────────────┘
                                                 │ Reads Logs & Masters
                                                 ▼
┌──────────────────────────┐      ┌─────────────────────────────────────┐
│  Auditing/System Admin   │      │   approval_logs / Master Tables     │
│      (Searches Logs)     ◄──────┤ Reads global audit trail data       │
└──────────────────────────┘      └─────────────────────────────────────┘
```

### 1.5 Inputs / Outputs

| Input Information | Data Category | Source / Description |
| :--- | :--- | :--- |
| `users` | Database Table | User details including names, emails, branches, roles, and active flags. |
| `approval_logs` | Database Table | Global audit history entries detailing transaction timestamps, actions, IP addresses, and user agents. |
| Master tables | Database Tables | Static lookup data (`roles`, `currencies`, `payment_statuses`, `payment_types`, `payment_methods`). |
| Filters & Search Parameters | User Input UI | Text-based search for users, dropdown filters for roles, status filters, and timestamp ranges for logs. |

| Output Information | Data Category | Destination / Description |
| :--- | :--- | :--- |
| Updated `users` | Database Table | User account properties and `is_active` flags. |
| Created `users` | Database Table | Newly registered user accounts. |

### 1.6 Related Documents

| No. | Document ID | Document Name | File Path / Reference | Remarks |
| :-- | :--- | :--- | :--- | :--- |
| 1 | PRWM-REQ-001 | Requirements Definition | `REQUIREMENT_DEFINITION.md` | Section 3.4 (User Administration), Section 4.5 (Audit Logging) |
| 2 | PRWM-DBS-001 | Database Design Specification | `DATABASE_DESIGN_SPECIFICATION.md` | Table schemas for `users`, `roles`, `approval_logs` |

---

## 2. Use Cases and Business Workflow

### 2.1 Use Case Catalog

| UC-ID | Use Case Name | Precondition | Postcondition | Triggering Actor |
| :--- | :--- | :--- | :--- | :--- |
| UC-ADM-001 | Register New User | Admin is logged in and user list view is loaded. | User account created and stored in the database. | Admin |
| UC-ADM-002 | Update User Profile | Target user exists in the database. | User details (name, email, branch, role) updated. | Admin |
| UC-ADM-003 | Toggle User Activation | Target user exists in the database. | User's `is_active` status updated (toggled between active and inactive). | Admin |
| UC-ADM-004 | View Master Configurations | Admin accesses the Master Configuration tab. | Static lookup configurations are rendered on screen. | Admin |
| UC-ADM-005 | Inspect Audit Logs | Admin accesses the Audit Logs tab. | Global audit log grid loaded with filtered timestamps. | Admin |

### 2.2 Primary Business Workflow

```text
[Admin Console Login] ──► [Admin Panel Dashboard]
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         ▼                          ▼                          ▼
  [User Management]          [Master Configuration]      [Audit Log Viewer]
  - UC-ADM-001 (Register)    - UC-ADM-004 (View Masters) - UC-ADM-005 (View Logs)
  - UC-ADM-002 (Update)
  - UC-ADM-003 (Toggle Active)
```

### 2.3 Workflow Critical Path Summary

| Step | Action | Status Before | Status After | Assigned To |
| :---: | :--- | :--- | :--- | :--- |
| 1 | Register User | N/A | Active / Inactive Profile in `users` | Admin |
| 2 | Toggle `is_active` | `is_active = TRUE` | `is_active = FALSE` (or vice versa) | Admin |
| 3 | Read Master Cache | Cache/DB Configuration | Rendered on screen | Admin |

### 2.4 Relevant Requirements Covered

| Requirement ID | Requirement Summary |
| :--- | :--- |
| REQ-005-01 | Support user account registration and activation/deactivation control by administrators. |
| REQ-005-02 | Provide read-only verification views of lookup master configurations. |
| REQ-005-03 | Maintain an immutable, searchable global audit trail of all lifecycle events. |

---

## 3. State Transition Specification

### 3.1 Actor-Controllable State Transitions

System administrators do not have access to mutate the states of payment request transactions. The only state transitions controlled by this actor are the activation states of user accounts.

| Transition ID | Origin Status | Target Status | Trigger Action | Guard Conditions |
| :--- | :--- | :--- | :--- | :--- |
| TR-ADM-01 | User: Inactive (`is_active = FALSE`) | User: Active (`is_active = TRUE`) | Click "Activate" button | Valid user target selected; Target is not the current logged-in Admin. |
| TR-ADM-02 | User: Active (`is_active = TRUE`) | User: Inactive (`is_active = FALSE`) | Click "Deactivate" button | Valid user target selected; Target is not the current logged-in Admin. |

### 3.2 Actor-Observable Status Set

Since system administrators serve an auditing function, they can observe all statuses of payment requests system-wide.

| Status ID | Status Code | Display Name | Can View | Can Edit | Can Delete | Can Submit / Act |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| 1 | `DRAFT` | Draft | ✓ | ✗ | ✗ | — |
| 2 | `SUBMITTED_MANAGER` | Submitted to Manager | ✓ | ✗ | ✗ | — |
| 3 | `MANAGER_REVIEWING` | Manager Reviewing | ✓ | ✗ | ✗ | — |
| 4 | `MANAGER_VERIFIED` | Manager Verified (OK) | ✓ | ✗ | ✗ | — |
| 5 | `REJECTED_MANAGER` | Rejected by Manager | ✓ | ✗ | ✗ | — |
| 6 | `SUBMITTED_APPROVER` | Submitted to Approver | ✓ | ✗ | ✗ | — |
| 7 | `APPROVER_REVIEWING` | Approver Reviewing | ✓ | ✗ | ✗ | — |
| 8 | `APPROVED` | Approved | ✓ | ✗ | ✗ | — |
| 9 | `REJECTED_APPROVER` | Rejected by Approver | ✓ | ✗ | ✗ | — |
| 10 | `PAID` | Paid (Completed) | ✓ | ✗ | ✗ | — |

---

## 4. Business Rules

### 4.1 Data Ownership and Access Isolation

| Rule ID | Rule Name | Description | Enforcement Layer |
| :--- | :--- | :--- | :--- |
| BR-ADM-001 | Admin Role Exclusivity | Access to `/admin/*` routes is strictly restricted to authenticated users with `role_code = 'ADMIN'`. | Backend (RolesGuard), Frontend (Router) |
| BR-ADM-002 | Transaction Non-Intervention | Administrators are forbidden from initiating, updating, deleting, or approving payment requests to prevent audit conflicts of interest. | Backend (Service guards) |

### 4.2 Edit Permission Rules

| Rule ID | Rule Name | Description |
| :--- | :--- | :--- |
| BR-ADM-003 | Self-Modification Prevention | Administrators cannot deactivate or modify their own active status to prevent accidental lockout. |
| BR-ADM-004 | System Master Immutability | Administrators can view static lookup configurations but cannot modify them via this interface (configurations are managed via migrations). |

### 4.3 Deletion Rules

| Rule ID | Rule Name | Description |
| :--- | :--- | :--- |
| BR-ADM-005 | Soft Deactivation Only | User accounts cannot be physically deleted from the database. Inactive users must have their `is_active` flag set to `FALSE`. |

### 4.4 Audit Trail Rules

| Rule ID | Rule Name | Description |
| :--- | :--- | :--- |
| BR-ADM-006 | Immutable Approval Logs | The `approval_logs` entries are append-only. No system user, including administrators, has permission to modify or delete logs. |
| BR-ADM-007 | Mandatory Audit Logging | Every state-modifying action on users or payment requests must be logged with the actor's ID, action type, timestamp, IP address, and browser User Agent. |

---

## 5. Screen Specifications

### 5.1 Screen: User Management Dashboard (`/admin/users`)

**Purpose:** Displays a grid containing all users in the system and provides action triggers to register new users, edit details, or change activation status.

#### 5.1.1 UI Elements

**Users Data Grid:**

| Column ID | Column Name | Data Source | Display Format | Sortable | Filterable |
| :--- | :--- | :--- | :--- | :---: | :---: |
| COL-USR-01 | Employee Number | `users.employee_number` | Plain Text | ✓ | ✓ |
| COL-USR-02 | Full Name | `users.full_name` | Plain Text | ✓ | ✓ |
| COL-USR-03 | Email | `users.email` | Plain Text | ✓ | ✓ |
| COL-USR-04 | Branch | `users.branch` | Plain Text | ✓ | ✓ |
| COL-USR-05 | System Role | `roles.role_name` | Badge (e.g., ADMIN, MANAGER) | ✓ | ✓ |
| COL-USR-06 | Account Status | `users.is_active` | Toggle / Status Badge (Active/Inactive) | ✓ | ✓ |

**Action Controls:**

| UI Element | Type | Description / Behavior |
| :--- | :--- | :--- |
| "Register User" | Button (Primary) | Opens a registration modal containing fields to add a new user. |
| "Edit Details" | Button (Link) | Opens the edit modal populated with the selected user's profile details. |
| "Status Toggle" | Toggle Switch | Invokes immediate status change. Shows confirmation prompt prior to deactivation. |

---

### 5.2 Screen: Master Configuration Viewer (`/admin/master-data`)

**Purpose:** Provides tabs to display system configurations, ensuring lookups match expected database state.

#### 5.2.1 UI Elements

**Static Configuration Tabs:**
- **Roles:** Lists system roles and codes (`roles`).
- **Currencies:** Lists supported currencies and exchange code mappings (`currencies`).
- **Statuses:** Lists payment statuses, display order, and editable indicators (`payment_statuses`).
- **Payment Types:** Lists active categories (`payment_types`).
- **Payment Methods:** Lists modes of settlement (`payment_methods`).

---

### 5.3 Screen: Global Audit Log Viewer (`/admin/audit-logs`)

**Purpose:** Displays a chronologically sorted listing of all application state changes and supports filtering.

#### 5.3.1 UI Elements

**Audit Log Data Grid:**

| Column ID | Column Name | Data Source | Display Format | Sortable | Filterable |
| :--- | :--- | :--- | :--- | :---: | :---: |
| COL-LOG-01 | Timestamp | `approval_logs.timestamp` | YYYY-MM-DD HH:mm:ss (Local) | ✓ | ✗ |
| COL-LOG-02 | Request Number | `payment_requests.request_number` | Link to request details | ✓ | ✓ |
| COL-LOG-03 | Action Performed | `approval_action_types.action_type` | Action tag (e.g., SUBMITTED) | ✓ | ✓ |
| COL-LOG-04 | Performed By | `users.full_name` | Text | ✓ | ✓ |
| COL-LOG-05 | Client IP Address | `approval_logs.ip_address` | IPv4/IPv6 Address | ✗ | ✓ |
| COL-LOG-06 | Comment | `approval_logs.comment` | Text snippet | ✗ | ✗ |

**Action Controls:**

| UI Element | Type | Description / Behavior |
| :--- | :--- | :--- |
| "Search / Filter" | Form Inputs | Submits query params for username, request number, IP, and date range. |

---

## 6. Functional Operation Specification

### 6.1 Operation: Fetch Users List

| Attribute | Specification |
| :--- | :--- |
| **Trigger** | Initial loading of User Management Dashboard (`/admin/users`). |
| **Data Source** | API Endpoint `GET /api/admin/users` |
| **Query Filter** | `is_deleted = FALSE` (if soft-delete applied to users) |
| **Default Sort** | Primary: `users.employee_number` (ascending) |
| **Pagination** | Server-side pagination. Default limit: 20 per page. |
| **Display Fields** | Employee Number, Full Name, Email, Branch, Role Code, Active Status. |

### 6.2 Operation: Register User

| Attribute | Specification |
| :--- | :--- |
| **Trigger** | Clicking the "Save" button in the Register User Modal. |
| **Guard Condition** | Authenticated actor must have `role_code = 'ADMIN'`. |
| **API Endpoint** | `POST /api/admin/users` |
| **Request Content-Type** | `application/json` |
| **Authentication** | `Authorization: Bearer <JWT>` header required. |
| **Payload Structure** | `{ "employee_number": "string", "full_name": "string", "email": "string", "branch": "string", "role_id": number, "is_active": boolean }` |
| **Pre-Submission Validation** | Valid email syntax; alphanumeric employee number; mandatory role. |
| **Processing Steps** | 1. Check if `employee_number` is already registered. If yes, reject. <br> 2. Insert record into `users` table. <br> 3. Evict user directory cache. <br> 4. Return HTTP `201 Created`. |
| **User Confirmation** | None required. |

### 6.3 Operation: Update User Profile

| Attribute | Specification |
| :--- | :--- |
| **Trigger** | Clicking the "Save Changes" button in the Edit Details Modal. |
| **Guard Condition** | Target user must exist; actor must be ADMIN. |
| **API Endpoint** | `PATCH /api/admin/users/:id` |
| **Request Content-Type** | `application/json` |
| **Authentication** | Required. |
| **Payload Structure** | `{ "full_name": "string", "email": "string", "branch": "string", "role_id": number, "is_active": boolean }` |
| **Processing Steps** | 1. Update the record in `users` matching the given `:id`. <br> 2. If `is_active` is changed to `FALSE`, immediately evict session tokens from Redis cache to force logout. <br> 3. Return HTTP `200 OK`. |

### 6.4 Operation: Fetch Global Audit Logs

| Attribute | Specification |
| :--- | :--- |
| **Trigger** | Initial load or search filter submission in Audit Log Viewer. |
| **Data Source** | API Endpoint `GET /api/admin/audit-logs` |
| **Query Filter** | Filters supported: `username`, `request_number`, `ip_address`, `start_date`, `end_date`. |
| **Default Sort** | `approval_logs.timestamp` (descending) |
| **Pagination** | Server-side pagination. Default: 50 records per page. |

---

## 7. Input / Output Specification

### 7.1 Input Specification (入力定義)

**User Registration Form:**

| Section | Field (Physical Name) | Display Name (English) | Display Name (日本語) | Data Type & Length | Required | Auto-populated | Input Control | Notes |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| User Profile | `employee_number` | Employee Number | 社員番号 | VARCHAR(20) | Yes | No | Text Field | Must be unique |
| User Profile | `full_name` | Full Name | 氏名 | VARCHAR(100) | Yes | No | Text Field | |
| User Profile | `email` | Email Address | メールアドレス | VARCHAR(255) | Yes | No | Text Field | Valid email format |
| User Profile | `branch` | Branch | 支店 | VARCHAR(100) | Yes | No | Text Field | |
| Authority | `role_id` | Role Assignment | ロール | INT (FK) | Yes | No | Dropdown | From `roles` lookup |
| Status | `is_active` | Account Status | 有効化ステータス | BOOLEAN | Yes | No | Checkbox / Toggle | Default: True |

### 7.2 Output Specification (出力定義)

No file outputs are defined for this subsystem.

---

## 8. Input Validation Rules

### 8.1 Submission / Action Validation (Strict Mode)

| Section | Field (Physical Name) | Display Name | Validation Rule | Error Message |
| :--- | :--- | :--- | :--- | :--- |
| **User Profile** | `employee_number` | Employee Number | Must not be empty, maximum 20 characters, alphanumeric characters only. Must be unique in system database. | "Employee number must be unique and contain only alphanumeric characters." |
| **User Profile** | `email` | Email Address | Must not be empty. Must conform to RFC 5322 email syntax validation regex. | "Please enter a valid email address." |
| **User Profile** | `full_name` | Full Name | Must not be empty. Maximum 100 characters. | "Full name is required (max 100 characters)." |
| **Authority** | `role_id` | Role | Must correspond to an active primary role ID. | "A valid system role assignment is required." |

---

## 9. Error Handling Specification

### 9.1 Error Classification Table

| HTTP Status | Error Code | Scenario | User-Facing Behavior |
| :---: | :--- | :--- | :--- |
| `400` | `BAD_REQUEST` | Validation error (e.g. employee number format wrong). | Highlight affected input fields; display helper message. |
| `403` | `FORBIDDEN` | JWT payload lacks ADMIN permission claim. | Show access denied banner; redirect user to home route. |
| `409` | `CONFLICT` | Registering an `employee_number` that already exists. | Display error banner stating: "This Employee Number is already registered." |

---

## 10. Permission and Access Control

### 10.1 Authentication Requirements

Stateless authorization using signed JSON Web Tokens (JWT). The token must declare the payload claim: `role_code: 'ADMIN'`.

### 10.2 Authorization Guard Architecture

```text
Incoming Admin Request 
  ──► [JwtAuthGuard] (Validate JWT Signature and exp)
        ──► [RolesGuard] (Verify user's role matches 'ADMIN')
              ──► Access Granted to endpoint
```

### 10.3 API Endpoint Permission Matrix

| Endpoint | Method | Required Role | Ownership / Assignment Check | Description |
| :--- | :---: | :--- | :---: | :--- |
| `/api/admin/users` | `GET` | `ADMIN` | N/A | Fetch all user profiles. |
| `/api/admin/users` | `POST` | `ADMIN` | N/A | Register a new user profile. |
| `/api/admin/users/:id` | `PATCH` | `ADMIN` | N/A | Update specific user details. |
| `/api/admin/audit-logs` | `GET` | `ADMIN` | N/A | Search global state changes. |

---

## 11. Real-Time Notification Behavior

### 11.1 WebSocket Configuration

System administrators do not receive transactional workflow status change warnings directly. However, they subscribe to `'admin:system'` WebSocket room for system health events (e.g. Redis disconnection warning, database lock warning).

---

## 12. Screen Transition Specification

### 12.1 Inbound Navigation

- **Default Landing:** Authenticated user with `role_code = 'ADMIN'` login redirect → `/admin/users`.
- **Navigation Menu:** Accessible via the sidebar "System Admin Console" link.

### 12.2 Outbound Navigation

- **Session Terminate:** Clicking logout triggers token eviction, redirection to `/login`.

---

## 13. Non-Functional Considerations

### 13.1 Performance Requirements

- **Audit Log Query Performance:** Search query execution over global logs table (`approval_logs`) must resolve within ≤ 1.5 seconds, optimized by indexes on `timestamp`, `action_taken_by_user_id`, and `payment_request_id`.
- **Session Revocation Latency:** If an admin toggles a user status to inactive, the corresponding session tokens in Redis must be invalidated immediately (≤ 200ms).

---

## 14. Configurable Items (External Definitions)

No configurable items are defined for this subsystem.

---

## 15. Cross-Reference Traceability Matrix

### 15.1 Requirements Definition Traceability

| Requirement ID | Requirement Description | Covered By (This Document) |
| :--- | :--- | :--- |
| REQ-005-01 | User account registration and activation. | Section 2.1, Section 6.2, Section 6.3 |
| REQ-005-02 | Lookup data configuration audit. | Section 5.2 |
| REQ-005-03 | Global immutable logs. | Section 4.4, Section 5.3, Section 6.4 |

### 15.2 Database Design Traceability

| Database Table | Relevant Functional Operations |
| :--- | :--- |
| `users` | Read/write in UC-ADM-001, UC-ADM-002, UC-ADM-003. |
| `roles` | Read in UC-ADM-001, UC-ADM-004. |
| `approval_logs` | Read in UC-ADM-005. |

---

## Appendix A: Status Code Quick Reference

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

### C.1 Core Tables Used by This Screen

| Table Name | Purpose | Key Columns |
| :--- | :--- | :--- |
| `users` | Stores user credentials, profiles, branches, status flags, and roles. | `user_id`, `employee_number`, `full_name`, `email`, `role_id`, `branch`, `is_active` |
| `roles` | Defines authorization role permissions in RBAC hierarchy. | `role_id`, `role_code`, `role_name` |
| `approval_logs` | Stores immutable history of transitions, timestamps, client metadata. | `approval_log_id`, `payment_request_id`, `action_taken_by_user_id`, `action_type_id`, `comment`, `ip_address`, `user_agent`, `timestamp` |

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
| Guard Condition | ガード条件 | Preconditions that must be satisfied before a state transition or action is permitted. |

---

*End of Functional Specification — Admin Panel (システム管理者パネル)*
