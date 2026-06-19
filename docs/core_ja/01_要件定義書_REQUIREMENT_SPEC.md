# Requirements Definition (要件定義)

---

## Document Control (ドキュメント管理)

| Attribute | Value |
| :--- | :--- |
| **Document ID** | PRWM-REQ-001 |
| **System** | Payment Request Workflow Management System (支払申請ワークフロー管理システム) |
| **Version** | 1.1 |
| **Created** | 2026-06-10 |
| **Last Updated** | 2026-06-10 |
| **Author** | Software Architect |
| **Status** | Released (承認済み) |

### Document Revision History

| Version | Date | Author | Description of Changes |
| :--- | :--- | :--- | :--- |
| 1.0 | 2026-06-10 | Software Architect | Initial requirements definition |
| 1.1 | 2026-06-10 | Software Architect | Updated with Payment Request Form Template (支払申請書) details and form field specifications |

---

## Table of Contents

1. [Project Overview & Background](#1-project-overview--background)
2. [User Roles & Permissions](#2-user-roles--permissions)
3. [Functional Requirements](#3-functional-requirements)
4. [Special Business Rules](#4-special-business-rules)
5. [Non-Functional Requirements](#5-non-functional-requirements)
6. [System Architecture Context](#6-system-architecture-context)

---

## 1. Project Overview & Background

### 1.1 Project Name
**Payment Request Workflow Management System** (支払申請ワークフロー管理システム)

### 1.2 Purpose & Objectives
The system manages the complete lifecycle of employee payment requests within the organization, from initial application through manager verification, final approval, and accounting payment processing. The system ensures transparent tracking, proper authorization control, and real-time visibility of payment request status.

### 1.3 Business Context
- **Problem Statement:** Manual payment request tracking is error-prone, lacks transparency, and delays payment processing. Approvers and applicants cannot track request status in real-time.
- **Solution Approach:** Implement a centralized, role-based workflow system with automated status transitions, real-time notifications via WebSocket, and a clear audit trail.
- **Expected Outcomes:**
  - Reduced payment processing time
  - Improved transparency for all stakeholders
  - Automated status tracking with real-time updates
  - Proper documentation and compliance with payment authorization rules

### 1.4 Project Scope
- **Included:** Core workflow management, user authentication/authorization by role, payment request lifecycle management, real-time status tracking, receipt file management, accounting dashboard.
- **Excluded:** Integration with external banking APIs, automated payment execution, advanced reporting/analytics, multi-language support.

### 1.5 Technology Stack
- **Backend:** TypeScript + NestJS (REST APIs)
  - Framework: NestJS with Express.js
  - Language: TypeScript
  - API Pattern: RESTful JSON APIs
- **Frontend:** React (PC/Smartphone compatible UI)
  - UI Framework: React with responsive design
  - Compatibility: Desktop and mobile browsers
- **Database:** PostgreSQL (Primary) + Redis (Caching/Session Management)
  - Primary Database: PostgreSQL for persistent data
  - Cache/Session: Redis for high-speed session management and caching
  - ORM: TypeORM or Prisma
- **Real-Time Communication:** WebSocket (Socket.io) for real-time notifications
- **File Storage:** Local file system abstraction layer (designed for future cloud migration)

---

## 2. User Roles & Permissions

### 2.1 User Roles Overview

| Role | Japanese Name | Primary Responsibility | Key Permissions |
|------|---------------|----------------------|-----------------|
| **Applicant** | 申請者 | Submit payment requests and manage their own requests | • Create payment request<br>• Edit own Draft requests<br>• Upload receipt files<br>• View own request history<br>• Resubmit after rejection<br>• Submit to Final Approver (when Manager Verified)<br>• Respond to feedback |
| **Manager** | 担当マネージャー | Initial verification of payment requests | • View assigned requests<br>• Verify (approve) requests<br>• Reject requests with comments<br>• Return requests to Applicant<br>• View request details and attachments |
| **Final Approver** | 最終承認者 | Make final approval decision | • View requests at approval stage<br>• Approve requests<br>• Reject requests with comments<br>• Return requests to Applicant<br>• View audit trail |
| **Accounting** | 経理 | Process approved payments | • View approved payment queue<br>• Mark payments as completed<br>• View special branch handling notes<br>• Generate payment reports<br>• View transaction history |
| **System Administrator** | システム管理者 | System configuration and user management | • Manage user accounts and roles<br>• Configure system settings<br>• View audit logs |

### 2.2 Role-Based Access Control (RBAC)

Access control is enforced at both controller and page level:

- **Applicant Dashboard:** View own requests, create new requests, edit drafts, upload receipts, submit to approver.
- **Manager Dashboard:** View requests in review queue, perform verification actions, add comments.
- **Final Approver Dashboard:** View requests awaiting final approval, make approval decisions, add comments.
- **Accounting Dashboard:** View approved requests, perform payment completion actions, view special branch alerts.
- **Admin Panel:** User management, system configuration, audit log review.

---

## 3. Functional Requirements

### 3.1 Core Entities & Data Model

The system manages the following core entities:

#### 3.1.1 User Entity
Represents system users with role assignments.

**Attributes:**
- UserID (Primary Key)
- Email
- FullName
- Department
- Branch (e.g., "Yangon", "Mandalay", "Naypyidaw")
- Role (Applicant, Manager, Final Approver, Accounting, Admin)
- IsActive
- CreatedDate
- ModifiedDate

#### 3.1.2 PaymentRequest Entity
Represents a single payment request through its complete lifecycle. Modeled after the standard Payment Request Form (支払申請書).

**Attributes:**
- PaymentRequestID (Primary Key)
- ApplicantUserID (Foreign Key to User)
- ManagerUserID (Foreign Key to User, nullable)
- FinalApproverUserID (Foreign Key to User, nullable)
- AccountingUserID (Foreign Key to User, nullable)
- RequestNumber (Unique identifier, auto-generated; e.g., "PRF-2026-001")

**Payment Request Information:**
- ApplicationDate (Date, required) - 申請日: Date when request is submitted
- DesiredPaymentDate (Date, required) - 支払希望日: When applicant wants payment processed
- TotalAmount (Decimal, required) - 支払金額: Total payment amount
- CurrencyType (String, required) - 通貨選択: Currency (e.g., "MMK", "USD")
- PaymentType (String, required) - 支払タイプ: Type of payment (e.g., "Expense Reimbursement", "Service Payment", "Other")
- PaymentMethod (String, required) - 支払方法: Payment method (e.g., "Bank Transfer", "Cash", "Check")

**Applicant Details (Auto-populated from User):**
- ApplicantEmployeeNumber (String, required) - 社員番号: Employee number from User profile
- ApplicantFullName (String, required) - 氏名: Employee name from User profile
- ApplicantBranch (String, required) - Branch from User profile

**Breakdown Details:**
- Purpose (String, required) - 用途: Purpose/usage of payment
- BankAccountInfo (String, optional) - 銀行口座・口座名/電話番号: Bank account, account holder name, or phone number for cash payment
- RequestContent (String, required) - 支払申請内容: Description of payment request content
- HasReceipt (Boolean, required) - 領収書の有無: Whether receipt is attached (yes/no)
- ReceiptFilesPaths (String, nullable) - Receipt file paths (comma-separated; supports multiple files)
- PaymentBreakdownItems (Collection of PaymentBreakdownItem, required) - 支払内訳: Line-by-line breakdown table

**Status & Workflow:**
- Status (String, required) - See Section 3.2 for valid statuses
- CurrentAssignedTo (UserID, nullable) - Indicates who needs to take action

**Timestamps:**
- CreatedDate (DateTime)
- SubmittedToManagerDate (DateTime, nullable)
- ManagerVerificationDate (DateTime, nullable)
- SubmittedToApproverDate (DateTime, nullable)
- ApprovalDate (DateTime, nullable)
- PaymentCompletedDate (DateTime, nullable)
- ModifiedDate (DateTime)
- IsDeleted (Boolean, soft delete flag)

#### 3.1.3 PaymentBreakdownItem Entity
Represents a single line item in the payment breakdown table (支払内訳) of a payment request. Each request can have multiple breakdown items (up to 15 lines based on form template).

**Attributes:**
- PaymentBreakdownItemID (Primary Key)
- PaymentRequestID (Foreign Key to PaymentRequest)
- LineNumber (Integer, 1-15) - No: Line number in breakdown table
- ItemDate (Date, required) - 日付: Date of the expense item
- Description (String, required) - 内容: Content/description of the breakdown item
- Amount (Decimal, required) - Amount for this line item
- Quantity (Decimal, optional) - Quantity if applicable
- UnitPrice (Decimal, optional) - Unit price if applicable
- CreatedDate (DateTime)
- ModifiedDate (DateTime)

**Calculated Field:**
- Total (Decimal, calculated) - 合計: Sum of all line item amounts for the payment request

#### 3.1.4 ApprovalLog Entity
Tracks all state transitions and actions taken on payment requests for audit purposes.

**Attributes:**
- ApprovalLogID (Primary Key)
- PaymentRequestID (Foreign Key to PaymentRequest)
- ActionTakenByUserID (Foreign Key to User)
- ActionType (e.g., "Created", "Submitted", "ManagerReview", "ManagerVerified", "ManagerRejected", "ApproverReview", "Approved", "ApproverRejected", "PaymentCompleted", "Edited")
- PreviousStatus
- NewStatus
- Comment
- Timestamp
- IPAddress (For security audit)

### 3.2 Lifecycle Statuses

The system enforces these exact statuses. All transitions must be explicit and tracked:

| Status Code | Status Name | Triggered By | Assigned To | Can Edit | Description |
|-------------|-------------|--------------|-------------|----------|-------------|
| 1 | **Draft** | System (on create) | Applicant | Yes | Initial state; applicant is composing the request |
| 2 | **Submitted to Manager** | Applicant action | Manager | No | Applicant has submitted; awaiting Manager action |
| 3 | **Manager Reviewing** | Manager opens request | Manager | No | Manager is actively reviewing (automatic on Manager viewing) |
| 4 | **Manager Verified (OK)** | Manager verification action | Applicant | No | Manager approved; awaiting Applicant to submit to Final Approver |
| 5 | **Rejected by Manager** | Manager rejection action | Applicant | Yes | Manager rejected with comment; Applicant can edit and resubmit |
| 6 | **Submitted to Approver** | Applicant action (from Manager Verified state only) | Final Approver | No | Ready for Final Approver review |
| 7 | **Approver Reviewing** | Final Approver opens request | Final Approver | No | Final Approver is actively reviewing (automatic on Final Approver viewing) |
| 8 | **Approved** | Final Approver approval action | Accounting | No | Approved and sent to Accounting for payment processing |
| 9 | **Rejected by Approver** | Final Approver rejection action | Applicant | Yes | Final Approver rejected with comment; workflow restarts if resubmitted |
| 10 | **Paid (Completed)** | Accounting completion action | N/A | No | Payment processing complete; workflow ended |

### 3.3 State Transition Table

The following state transitions are **allowed and enforced**:

```
Draft
  └─> Submitted to Manager (by Applicant)

Submitted to Manager
  └─> Manager Reviewing (automatic, when Manager opens)

Manager Reviewing
  ├─> Manager Verified (OK) (by Manager)
  └─> Rejected by Manager (by Manager)

Manager Verified (OK)
  └─> Submitted to Approver (by Applicant)

Rejected by Manager
  └─> Submitted to Manager (by Applicant after editing)

Submitted to Approver
  └─> Approver Reviewing (automatic, when Final Approver opens)

Approver Reviewing
  ├─> Approved (by Final Approver)
  └─> Rejected by Approver (by Final Approver)

Approved
  └─> Paid (Completed) (by Accounting)

Rejected by Approver
  └─> Submitted to Manager (by Applicant after editing; workflow restarts)

Paid (Completed)
  └─> [END STATE - No further transitions]
```

### 3.4 Functional Requirements by Feature

#### 3.4.1 Payment Request Creation & Submission
- **REQ-001:** Applicant can create a new payment request with initial status "Draft".
- **REQ-002:** Applicant can edit a payment request while in "Draft" status.
- **REQ-002A:** Payment request form must capture the following required fields:
  - Application Date (申請日)
  - Employee Number (社員番号) - auto-populated from user profile
  - Employee Name (氏名) - auto-populated from user profile
  - Total Payment Amount (支払金額) - auto-calculated from breakdown items
  - Desired Payment Date (支払希望日)
  - Currency Type (通貨選択) - dropdown: MMK, USD, JPY, etc.
  - Payment Type (支払タイプ) - dropdown options defined by organization
  - Payment Method (支払方法) - dropdown: Bank Transfer, Cash, Check
  - Purpose/Usage (用途)
  - Bank Account/Phone Info (銀行口座・口座名/電話番号) - required if payment method is Bank Transfer or Cash
  - Receipt Present (領収書の有無) - checkbox/radio (Yes/No)
  - Payment Request Content (支払申請内容) - text area for description
  - Target Manager (Dropdown selected from Active Users with MANAGER role)
- **REQ-002B:** Payment Breakdown Table (支払内訳) with 1-15 line items. Each line item must include:
  - Line Number (No) - auto-numbered 1-15
  - Date (日付) - date of expense
  - Description (内容) - what was purchased/expense description
  - Amount (金額) - amount for this line
  - Total (合計) - auto-calculated sum of all line amounts
- **REQ-003:** Applicant can upload and attach receipt files (e.g., PDF, JPG, PNG) to the payment request. Attachment is saved to `wwwroot/uploads/` directory structure with abstracted storage interface.
- **REQ-003A:** Receipt file naming convention must follow the Payment Breakdown content format (支払内訳の内容に従って設定).
- **REQ-004:** Applicant can submit a "Draft" request to Manager, changing status to "Submitted to Manager".
- **REQ-005:** Applicant can edit requests in "Rejected by Manager" or "Rejected by Approver" states and resubmit.
- **REQ-006:** Once a request is "Manager Verified (OK)", Applicant must click "Submit to Final Approver" button to transition to "Submitted to Approver" state.

#### 3.4.2 Manager Verification Workflow
- **REQ-007:** When a Manager opens a request in "Submitted to Manager" status, the status automatically changes to "Manager Reviewing".
- **REQ-008:** Manager can review all details of a payment request including receipt attachments.
- **REQ-009:** Manager can verify (approve) a request, changing status to "Manager Verified (OK)". The request is returned to Applicant for submission to Final Approver.
- **REQ-010:** Manager can reject a request, changing status to "Rejected by Manager". A mandatory comment field must be provided.
- **REQ-011:** When Manager performs an action (verify or reject), an ApprovalLog entry is created capturing the action and comment.

#### 3.4.3 Final Approver Workflow
- **REQ-012:** When a Final Approver opens a request in "Submitted to Approver" status, the status automatically changes to "Approver Reviewing".
- **REQ-013:** Final Approver can review all details and approval history (ApprovalLog).
- **REQ-014:** Final Approver can approve a request, changing status to "Approved" and routing it to Accounting queue.
- **REQ-015:** Final Approver can reject a request, changing status to "Rejected by Approver". A mandatory comment field must be provided. The request returns to Applicant.
- **REQ-016:** When Final Approver performs an action, an ApprovalLog entry is created.

#### 3.4.4 Accounting Payment Processing
- **REQ-017:** Accounting team sees a dashboard displaying all requests in "Approved" status.
- **REQ-018:** Accounting can view detailed information for each approved payment request including receipt attachment.
- **REQ-019:** Accounting can mark a payment as "Paid (Completed)", ending the workflow for that request.
- **REQ-020:** For requests where the Applicant's branch is "Mandalay", Accounting dashboard displays a prominent alert: "Coordinate with Toe San for Cash Payment".
- **REQ-021:** For requests where the Applicant's branch is NOT "Mandalay", Accounting dashboard displays: "Standard Bank Transfer".
- **REQ-022:** When Accounting marks a request as paid, an ApprovalLog entry is created and timestamp is recorded.

#### 3.4.5 Dashboard & Status Tracking
- **REQ-023:** Applicant dashboard displays all their payment requests with current status.
- **REQ-024:** Applicant can view comments and feedback from Manager and Final Approver rejections.
- **REQ-025:** Manager dashboard displays requests assigned to them, grouped by status.
- **REQ-026:** Final Approver dashboard displays requests awaiting their approval.
- **REQ-027:** All users can view real-time status updates via WebSocket push notifications.
- **REQ-028:** Each request displays a timeline/history view showing all approval log entries and status transitions.

#### 3.4.6 Receipt File Management
- **REQ-029:** Applicant can upload receipt files (PDF, JPG, PNG, etc.) with file size limit (e.g., 10 MB per file).
- **REQ-029A:** Receipt file submission is **basically required** when applying for payment. System should enforce attachment validation before allowing submission to Manager.
- **REQ-030:** Receipt files are stored in `wwwroot/uploads/` with a directory structure organized by request ID (e.g., `/uploads/{PaymentRequestID}/{UUID}_{filename}`).
- **REQ-030A:** Receipt file names must follow the Payment Breakdown (支払内訳) content format. Recommended format: `{PaymentBreakdownDescription}_{Date}_{SequenceNumber}.{ext}` (e.g., "OfficeSupplies_20260609_01.pdf").
- **REQ-031:** File storage is abstracted behind an interface to support future migration to cloud storage (AWS S3, Azure Blob).
- **REQ-032:** Only authorized users (applicant, manager, approver, accounting) can download/view receipt files for requests they have access to.
- **REQ-032A:** Paper receipts (紙の領収書) can be submitted to Accounting after payment is processed or after the request is submitted. System tracks both digital and physical receipt receipts.

#### 3.4.7 Form Validation & Data Constraints
- **REQ-036:** Application Date (申請日) must be today or earlier; cannot be future date.
- **REQ-037:** Desired Payment Date (支払希望日) must be today or later.
- **REQ-038:** Total Payment Amount must be > 0 and calculated from breakdown items (should match sum of line items).
- **REQ-039:** Payment Breakdown must contain at least 1 line item and at most 15 line items.
- **REQ-040:** Each breakdown line item must have: Date, Description, and Amount (all required).
- **REQ-041:** Currency Type and Payment Method are required dropdowns; system must prevent submission without selection.
- **REQ-042:** If Payment Method is "Bank Transfer" or "Cash", Bank Account/Phone Info field is mandatory.
- **REQ-043:** Currency selection must be restricted to organization-approved currencies (e.g., MMK, USD, JPY).
- **REQ-044:** Amount fields support up to 2 decimal places (e.g., 1,234,567.89).
- **REQ-045:** System must validate file attachment before allowing submission to Manager (Receipt Present = Yes requires at least 1 file).

#### 3.4.8 Search & Filtering
- **REQ-033:** Users can search payment requests by request number, applicant name, or amount range.
- **REQ-034:** Users can filter requests by status, date range, and branch.
- **REQ-035:** Results are paginated and sorted by creation date or status priority.

### 3.5 Payment Request Form Field Specifications

This section defines the actual form fields based on the standard payment request form template (支払申請書).

#### 3.5.1 Form Header Section

| Field Name (Japanese) | Field Name (English) | Data Type | Required | Auto-populated | Notes |
|---|---|---|---|---|---|
| 申請日 | Application Date | Date | Yes | No | Today's date or earlier |
| 社員番号 | Employee Number | String (10 chars) | Yes | Yes | From User profile |
| 氏名 | Employee Name | String (100 chars) | Yes | Yes | From User profile |

#### 3.5.2 Payment Details Section

| Field Name (Japanese) | Field Name (English) | Data Type | Required | Auto-populated | Notes |
|---|---|---|---|---|---|
| 支払金額 | Total Payment Amount | Decimal (12,2) | Yes | Yes | Auto-calculated from breakdown items |
| 支払希望日 | Desired Payment Date | Date | Yes | No | Must be today or later |
| 通貨選択 | Currency Type | Dropdown String | Yes | No | Options: MMK, USD, JPY, etc. |
| 支払タイプ | Payment Type | Dropdown String | Yes | No | Defined by organization |
| 支払方法 | Payment Method | Dropdown String | Yes | No | Options: Bank Transfer, Cash, Check |
| 用途 | Purpose/Usage | String (500 chars) | Yes | No | Description of payment purpose |
| 銀行口座・口座名/電話番号 | Bank Account / Account Name / Phone | String (200 chars) | Conditional | No | Required if Payment Method = Bank Transfer or Cash |

#### 3.5.3 Request Content Section

| Field Name (Japanese) | Field Name (English) | Data Type | Required | Auto-populated | Notes |
|---|---|---|---|---|---|
| 支払申請内容 | Payment Request Content | Text Area (1000 chars) | Yes | No | Detailed description of the payment request |
| 領収書の有無 | Receipt Present | Boolean/Radio | Yes | No | Yes/No indication; Yes requires file attachment |

#### 3.5.4 Payment Breakdown Table (支払内訳)

The breakdown table contains 1-15 line items with the following columns:

| Field Name (Japanese) | Field Name (English) | Data Type | Required | Notes |
|---|---|---|---|---|
| No | Line Number | Integer (1-15) | Yes | Auto-numbered sequentially |
| 日付 | Date | Date | Yes | Date of the expense |
| 内容 | Description | String (200 chars) | Yes | What was purchased/expense description |
| 金額 | Amount | Decimal (10,2) | Yes | Amount for this line item |

**Calculated Field:**
- 合計 (Total) = Sum of all Amount values in the breakdown table

#### 3.5.5 Receipt File Attachment Section

| Field Name (Japanese) | Field Name (English) | Data Type | Required | Notes |
|---|---|---|---|---|
| N/A | Receipt Files | File Upload | Conditional | Required if 領収書の有無 = Yes; Support multiple files; Max 10 MB per file, 50 MB total |

---

## 4. Special Business Rules

### 4.1 Workflow Rules

#### Rule 4.1.1: Manager is a Verifier, Not a Submitter
- The Manager reviews and verifies requests but does **NOT** submit them forward.
- When Manager verifies (approves) a request, the status becomes "Manager Verified (OK)" and the request returns to the Applicant.
- The Applicant must then manually click "Submit to Final Approver" to continue the workflow.
- This ensures Applicant responsibility and provides a secondary decision point.

#### Rule 4.1.2: Automatic Status Transition on User Access
- When a Manager opens a request in "Submitted to Manager" state, the system **automatically** changes the status to "Manager Reviewing".
- When a Final Approver opens a request in "Submitted to Approver" state, the system **automatically** changes the status to "Approver Reviewing".
- This provides real-time indication of who is actively reviewing the request.

#### Rule 4.1.3: Rejection Requires Mandatory Comment
- When Manager rejects a request, a comment field is **mandatory** and must contain at least 10 characters.
- When Final Approver rejects a request, a comment field is **mandatory** and must contain at least 10 characters.
- Comments are recorded in ApprovalLog for audit and communication purposes.

#### Rule 4.1.4: Rejected Request Workflow Restart
- If a Final Approver rejects a request (status = "Rejected by Approver"), the workflow **must** restart from the Manager.
- Applicant edits the request and resubmits to Manager with new status "Submitted to Manager".
- The entire approval chain must run again.

#### Rule 4.1.5: Applicant Edit Restrictions
- Applicant can only edit requests in the following states:
  - **Draft** (no approval yet)
  - **Rejected by Manager** (can edit and resubmit to Manager)
  - **Rejected by Approver** (can edit and must resubmit to Manager)
- Requests **cannot** be edited once they reach "Manager Reviewing" or "Approver Reviewing" states.
- Once a request is "Approved", it is locked and cannot be edited (audit trail integrity).

#### Rule 4.1.6: Receipt File is Mandatory Before Submission
- Applicant **must** attach at least one receipt file before submitting a request from "Draft" to "Submitted to Manager".
- System validates file attachment on submission.

#### Rule 4.1.7: Receipt Submission Requirements
- **Digital Receipt (Digital Receipt File):** Receipt files submitted as digital attachments during payment request application. These files follow the naming convention based on Payment Breakdown content (支払内訳).
- **Paper Receipt (紙の領収書):** Physical paper receipts can be submitted to Accounting after payment is processed or immediately after request submission. Accounting stores these separately and links them to the payment request record.
- **Exception for Manual Receipts:** In cases where receipts are not immediately available, Applicant can indicate receipt will be provided later, but Manager/Final Approver may request digital copy before approval if needed.

### 4.2 Payment Breakdown Business Rules

#### Rule 4.2.1: Payment Breakdown Calculation
- The Total Amount (支払金額) **must equal** the sum of all Payment Breakdown item amounts (支払内訳 合計).
- System automatically calculates the total from breakdown items; users cannot manually enter a total amount.
- Each line item in the breakdown contributes to the final amount.
- If a line item is deleted, the total recalculates automatically.

#### Rule 4.2.2: Payment Breakdown Line Items
- Breakdown items support up to 15 lines (No: 1-15).
- Each line must contain: Date (日付), Description (内容), and Amount (金額).
- Line items are displayed in order; users can insert, edit, or delete lines within the editing window (only in Draft state).
- Once a request moves beyond "Draft" status, breakdown items become read-only but visible to all reviewers.

#### Rule 4.2.3: Payment Breakdown and Receipt File Naming
- Receipt file names should follow the Payment Breakdown content (支払内訳の内容に従って設定).
- Recommended format: If breakdown line has description "Office Supplies", receipt should be named something like "OfficeSupplies_20260609.pdf".
- System can provide a filing guide to applicants showing the breakdown descriptions they've entered, helping them name receipt files appropriately.

### 4.3 Branch-Specific Business Rules

#### Rule 4.3.1: Mandalay Branch Cash Payment Alert
- If the Applicant's branch is **"Mandalay"**, Accounting team sees the following prominent alert:
  - **"IMPORTANT: Coordinate with Toe San for Cash Payment"**
- This alert appears on the Accounting dashboard for each approved Mandalay request.
- Alert is color-coded (e.g., red/warning color) to draw attention.

#### Rule 4.3.2: Non-Mandalay Standard Processing
- For all branches **other than Mandalay**, Accounting sees:
  - **"Standard Bank Transfer Processing"**
- This indicates normal bank transfer processing applies.

### 4.4 Data Integrity & Audit Rules

#### Rule 4.4.1: Immutable Approval Log
- Every state transition, action, and comment is recorded in ApprovalLog and **cannot be deleted or modified**.
- ApprovalLog serves as the source of truth for compliance and dispute resolution.

#### Rule 4.4.2: Soft Delete for Requests
- Payment requests are **never physically deleted** from the database.
- Instead, an "IsDeleted" flag is set to true for archived or cancelled requests.
- Deleted requests are hidden from normal dashboards but retained for audit purposes.
- **Draft Deletion Privilege**: Applicants are permitted to soft-delete their own payment requests ONLY while they are in DRAFT status. For any other status, the delete action is strictly unauthorized and hidden, and the requests remain read-only.

#### Rule 4.4.3: Timestamp Tracking
- All state transitions, actions, and access events are timestamped.
- Timestamps are recorded in UTC format for consistency across time zones.

---

## 5. Non-Functional Requirements

### 5.1 Performance

- **NFR-001:** Page load time for dashboards should be **≤ 2 seconds** (measured from initial request to full page render).
- **NFR-002:** Search and filter operations should return results **≤ 3 seconds** for datasets up to 10,000 records.
- **NFR-003:** Real-time status updates via SignalR should be delivered **≤ 500 milliseconds** after state change.
- **NFR-004:** Database queries should use appropriate indexing on frequently queried fields (Status, ApplicantUserID, ManagerUserID, FinalApproverUserID, CreatedDate).

### 5.2 Security & Access Control

- **NFR-005:** All API endpoints and page handlers must implement role-based authorization checks.
- **NFR-006:** Authentication is required for all users; implement session-based authentication via ASP.NET Core Identity or equivalent.
- **NFR-007:** Sensitive actions (approve, reject, mark as paid) require user authentication verification.
- **NFR-008:** File downloads and access to payment request details must verify user authorization (role and request assignment).
- **NFR-009:** SQL injection prevention via parameterized queries (Entity Framework Core); input validation on all user inputs.
- **NFR-010:** CSRF (Cross-Site Request Forgery) protection on all state-modifying operations (use ASP.NET Core anti-forgery tokens).
- **NFR-011:** Audit log IP addresses and user IDs for all significant actions for compliance tracking.

### 5.3 Data Storage & File Management

- **NFR-012:** Receipt files are stored in `wwwroot/uploads/` directory with directory structure: `/uploads/{PaymentRequestID}/{UUID}_{filename}` to prevent conflicts.
- **NFR-013:** File storage logic is abstracted behind an `IFileStorageService` interface to allow future migration to AWS S3, Azure Blob, or other cloud storage without code changes to business logic.
- **NFR-014:** Maximum file size per receipt: **10 MB**. Total attachment size per request: **50 MB**.
- **NFR-015:** Supported file types: PDF, JPEG, JPG, PNG (with MIME type validation).
- **NFR-016:** Files are not deleted when requests are soft-deleted; consider archival strategy for long-term storage.

### 5.4 Real-Time Communication

- **NFR-017:** WebSocket (Socket.io) is implemented for real-time push notifications.
- **NFR-018:** Status change notifications are pushed to connected clients in real-time (≤ 500 ms).
- **NFR-019:** Each user is connected to a WebSocket room based on their role (e.g., "Managers", "Applicants", "Approvers", "Accounting").
- **NFR-020:** Applicants receive notifications when their request status changes (Manager Reviewing, Manager Verified, Approved, Rejected, Paid).
- **NFR-021:** Managers receive notifications when a new request is assigned to them.
- **NFR-022:** Connection handling includes graceful reconnection and message queueing for network interruptions.

### 5.5 Caching & Performance (Redis)

- **NFR-023:** Redis is used for session management and high-speed caching to improve performance.
- **NFR-024:** User sessions are stored in Redis with configurable TTL (Time-To-Live) for security.
- **NFR-025:** Frequently accessed lookup tables (UserRoles, PaymentStatuses, PaymentTypes, etc.) are cached in Redis.
- **NFR-026:** Cache invalidation strategy: Automatic expiration and manual invalidation on data updates.
- **NFR-027:** Redis connection pooling is configured for optimal performance under concurrent load.

### 5.5 Database & ORM

- **NFR-023:** Microsoft SQL Server is used as the primary database.
- **NFR-024:** Entity Framework Core (EF Core) with `Microsoft.EntityFrameworkCore.SqlServer` provider.
- **NFR-025:** Database schema is version-controlled via EF Core Migrations.
- **NFR-026:** Appropriate indexes on foreign keys and frequently filtered columns (Status, UserID, CreatedDate).
- **NFR-027:** Database backup strategy is defined; automated backups recommended daily.

### 5.6 Deployment & Environment

- **NFR-028:** Local development environment: Visual Studio Code (VSCode) with .NET CLI and Kestrel server.
- **NFR-029:** Supported deployment: Windows Server with IIS or containerized Docker deployment.
- **NFR-030:** Configuration management via `appsettings.json` and environment-specific config files (development, staging, production).
- **NFR-031:** Database connection strings stored securely (Azure Key Vault or environment variables).
- **NFR-032:** Application logging via Serilog or similar structured logging framework.

### 5.7 Scalability & Maintenance

- **NFR-033:** Code is organized with clear separation of concerns: Controllers, Services, Repositories, Models.
- **NFR-034:** Business logic is abstracted into service classes for maintainability and testability.
- **NFR-035:** File storage abstraction allows future transition to cloud storage without major refactoring.
- **NFR-036:** Database is designed to scale to 100,000+ payment requests without significant performance degradation.

### 5.8 Compliance & Audit

- **NFR-037:** All state transitions are logged with timestamp, user ID, action type, and optional comments.
- **NFR-038:** Audit logs are immutable and retained for minimum 5 years (regulatory requirement).
- **NFR-039:** System generates audit reports showing payment request lifecycle and all actions taken.
- **NFR-040:** Sensitive fields (e.g., exact payment amounts, applicant personal info) may be subject to data protection regulations; implement appropriate access controls.

### 5.9 Usability

- **NFR-041:** UI is responsive and works on desktop, tablet, and mobile browsers.
- **NFR-042:** Navigation is intuitive; each role has a clear path to their primary workflow.
- **NFR-043:** Error messages are clear and actionable (e.g., "Receipt file is required before submission").
- **NFR-044:** Real-time status updates on dashboards do not require page refresh.

---

## 6. System Architecture Context

### 6.1 Technology Decision Rationale

#### ASP.NET Core MVC/Razor Pages
- **Why:** Integrated model-view-controller pattern with C# provides strong typing, IntelliSense support, and security features (CSRF protection, input validation).
- **Razor Pages** for role-specific dashboards provide clean, focused pages without routing complexity.
- **MVC Controllers** for API endpoints and complex workflow logic.

#### Microsoft SQL Server
- **Why:** Enterprise-grade relational database with strong ACID compliance, suitable for workflow and audit log requirements.
- **Transactional integrity** ensures state transitions cannot be corrupted mid-operation.

#### Entity Framework Core
- **Why:** ORM simplifies data access and allows LINQ queries with compile-time safety.
- **Migrations** version control database schema alongside code.
- **Abstraction** supports future database changes if needed.

#### ASP.NET Core SignalR
- **Why:** Real-time bidirectional communication enables live status updates on dashboards.
- **Group-based messaging** allows efficient targeting of specific roles/users.
- **Automatic reconnection** handles transient network issues.

#### Local File Storage with Abstraction
- **Why:** `wwwroot/uploads/` provides simple initial storage for local development.
- **`IFileStorageService` abstraction** enables migration to AWS S3, Azure Blob Storage, or other cloud providers without business logic changes.
- **Future-proofing:** Minimizes refactoring when organizational requirements shift.

### 6.2 High-Level Component Interaction

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Frontend (Razor Pages)                         │
│  Applicant | Manager | Final Approver | Accounting | Admin Dashboard│
└──────────────────────────┬──────────────────────────────────────────┘
                           │ HTTP + SignalR (Real-time updates)
                           ▼
┌────────────────────────────────────────────────────────────────────┐
│                    ASP.NET Core Backend                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  Controllers │  │   Services   │  │ SignalR Hubs │              │
│  │  (Endpoints) │  │  (Business   │  │ (Real-time)  │              │
│  │              │  │   Logic)     │  │              │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│         │                 │                    │                   │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │        Repository Pattern / Entity Framework Core            │  │
│  │  (Data Access & ORM)                                         │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────┬──────────────────────────────────────┘
                                  │ SQL Queries
                                  ▼
┌────────────────────────────────────────────────────────────────────┐
│                    Microsoft SQL Server                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │     Users    │  │PaymentRequest│  │ApprovalLog   │              │
│  │     Table    │  │    Table     │  │    Table     │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└────────────────────────────────────────────────────────────────────┘

        (File Storage)
              │
              ▼
┌──────────────────────────┐
│  Local File System or    │
│  Future: AWS S3/Azure    │
│  (Abstract Interface)    │
└──────────────────────────┘
```

### 6.3 Development Constraints & Assumptions

- **Single-Tenant:** System designed for a single organization; multi-tenancy is out of scope.
- **English Language:** UI and business logic documented in English; no localization required at this stage.
- **Local Environment:** Development assumes Visual Studio Code (VSCode), .NET CLI, Kestrel server, and local SQL Server.
- **Reasonable User Load:** Designed for typical enterprise workflow (hundreds of requests per day, not thousands of concurrent users).
- **Existing Infrastructure:** Assumes organization has SQL Server and Windows Server infrastructure available.

### 6.4 Future Extensibility Points

1. **Cloud File Storage:** Replace local file storage with AWS S3 or Azure Blob by implementing alternative `IFileStorageService`.
2. **Email Notifications:** Extend ApprovalLog to trigger email notifications on status changes (not in current scope).
3. **Advanced Reporting:** Add report generation (PDF exports, analytics dashboards) using the ApprovalLog audit trail.
4. **Workflow Customization:** Implement workflow engine to allow configuration of approval chains by branch or department.
5. **Integration with Accounting Systems:** Future integration with ERP systems (SAP, NetSuite) for automated payment execution.
6. **Mobile Application:** Native mobile app consuming same APIs for on-the-go approvals.

---

## 7. Acceptance Criteria & Success Metrics

### 7.1 Functional Acceptance Criteria

- [ ] All four user roles can log in and access their respective dashboards.
- [ ] Payment request creation, submission, and storage work end-to-end for Applicant.
- [ ] Manager can verify/reject requests with automatic status transitions.
- [ ] Final Approver can approve/reject requests; rejected requests return to Applicant for workflow restart.
- [ ] Accounting can view approved queue, mark payments as complete, and see branch-specific alerts.
- [ ] All state transitions follow the State Transition Table (Section 3.3) exactly.
- [ ] Receipt files are uploaded, stored, and retrievable by authorized users.
- [ ] Real-time status updates appear on dashboards via SignalR without page refresh.
- [ ] Audit log captures all actions with timestamps, user IDs, and comments.

### 7.2 Non-Functional Acceptance Criteria

- [ ] Dashboard pages load in ≤ 2 seconds.
- [ ] SignalR status updates delivered in ≤ 500 milliseconds.
- [ ] All role-based access control enforced; unauthorized users cannot access other roles' dashboards.
- [ ] SQL injection and CSRF vulnerabilities mitigated.
- [ ] File storage abstraction implemented; can swap implementations without business logic changes.
- [ ] Database schema created and versioned via EF Core Migrations.

### 7.3 Success Metrics (Post-Implementation)

- **Time to First Approval:** Average time from request submission to first approval by Manager (target: < 24 hours).
- **End-to-End Cycle Time:** Average time from request creation to payment completion (target: < 5 business days).
- **System Uptime:** > 99% availability (excluding scheduled maintenance).
- **User Adoption:** > 90% of intended users actively using the system within 3 months.

---

## 8. Appendix: Reference Terminology

| Term | Definition |
|------|-----------|
| **State Transition** | A change in PaymentRequest status according to the defined state diagram |
| **ApprovalLog** | Immutable audit table tracking all actions, transitions, and comments |
| **Applicant** | Employee submitting payment requests |
| **Manager** | First-level reviewer; verifies request details |
| **Final Approver** | Second-level reviewer; makes final approval decision |
| **Accounting** | Finance team; processes payments and marks requests complete |
| **SignalR** | Real-time communication framework for live dashboard updates |
| **Soft Delete** | Logical deletion using IsDeleted flag; physical records retained |
| **Role-Based Access Control (RBAC)** | Authorization model based on user's assigned role |
| **Receipt File** | Attachment (PDF, JPG, PNG) supporting the payment request |

---

## 8A. Appendix: Payment Request Form Template Reference

### Form Template: 支払申請書 (Payment Request Form)

**File Name:** `支払申請書_YYYYMMDD_社員番号_社員名.xlsx`

This system requirements specification is based on the standard payment request form template (支払申請書) used by the organization. The form template structure has been converted into system entities and functional requirements as follows:

#### Template Structure Mapping

| Form Section | System Entity / Section | Mapped To |
|---|---|---|
| Form Header (申請日, 社員番号, 氏名) | User & Request Header | Section 3.1.2, 3.5.1 |
| Payment Details (支払金額, 支払希望日, 通貨選択, etc.) | PaymentRequest Entity | Section 3.1.2, 3.5.2 |
| Request Content (支払申請内容, 領収書の有無) | PaymentRequest Entity | Section 3.1.2, 3.5.3 |
| Payment Breakdown Table (支払内訳) | PaymentBreakdownItem Entity | Section 3.1.3, 3.5.4 |
| Receipt Attachment Area | Receipt File Storage | Section 3.4.6, 3.5.5 |

#### Form Fields Translation Reference

The following fields from the Excel template have been captured in the system requirements:

- **支払申請書** → Payment Request Form (system title)
- **申請日** → Application Date (required, REQ-002A)
- **社員番号** → Employee Number (auto-populated from user profile, REQ-002A)
- **氏名** → Employee Name (auto-populated from user profile, REQ-002A)
- **下記の通り支払い申請を致します** → Statement indicating payment request (form intro text)
- **支払金額** → Total Payment Amount (auto-calculated, REQ-002A)
- **支払希望日** → Desired Payment Date (required, REQ-002A)
- **支払申請内容** → Payment Request Content (required, REQ-002A)
- **支払タイプ** → Payment Type (required dropdown, REQ-002A)
- **支払方法** → Payment Method (required dropdown, REQ-002A)
- **領収書の有無** → Receipt Present (Yes/No, REQ-002A)
- **用途** → Purpose/Usage (required, REQ-002A)
- **通貨選択** → Currency Type (required dropdown, REQ-002A)
- **銀行口座・口座名/電話番号** → Bank Account / Account Name / Phone (conditional, REQ-002A)
- **支払内訳** → Payment Breakdown Table (required, REQ-002B)
  - **No** → Line Number (1-15, auto-numbered)
  - **日付** → Date of expense
  - **内容** → Description of breakdown item
  - **合計** → Total (calculated sum)

#### Important Form Notes (From Template)

The form includes the following important notes that have been incorporated as business rules:

1. **Receipt Requirement Note:**
   - Japanese: "※支払い申請時には、基本的に領収書の提出が必要です。"
   - English: "Receipt file submission is basically required when applying for payment."
   - Implementation: REQ-029A, Rule 4.1.6

2. **Receipt File Naming Convention Note:**
   - Japanese: "領収書のファイル名は「支払内訳」の内容に従って設定してください。"
   - English: "Receipt file names should follow the Payment Breakdown content format."
   - Implementation: REQ-030A, Rule 4.2.3

3. **Paper Receipt Submission Note:**
   - Japanese: "※紙の領収書は、支出後または申請後に経理へ提出してください。"
   - English: "Paper receipts should be submitted to Accounting after payment or after request submission."
   - Implementation: REQ-032A, Rule 4.1.7



---

## Sign-Off

This Requirements Definition document represents the agreed-upon specification for the Payment Request Workflow Management System. All stakeholders must review and approve before development begins.

**Approval Status:** Pending Review  
**Next Phase:** Technical Design (技術設計) & Database Schema Design

---

*End of REQUIREMENT_DEFINITION.md*