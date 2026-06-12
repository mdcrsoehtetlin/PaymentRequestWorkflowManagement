# Functional Design Specification (機能設計書)
**Document ID:** FDS-3.4.3  
**System Name:** Payment Request Workflow Management System (支払申請ワークフロー管理システム)  
**Function Name:** Final Approver Workflow (最終承認者ワークフロー)  
**Function ID:** FN-3.4.3  
**Version:** 1.0.1  
**Date:** 2026-06-12  

---

## 1. Overview (概要)
This function defines the final approval phase within the payment request lifecycle. The system allows the "Final Approver" to review the details of submitted payment requests, inspect the digital receipts and historical approval log, and make a decision to either approve or reject the request. Real-time status updates and audit trail logging are executed during this workflow.

## 2. Target Users (対象ユーザー)
- **Final Approver (最終承認者):** Users assigned the system role of "Final Approver".

## 3. Preconditions (前提条件)
1. Request record exists with Status = "Submitted to Approver".
2. The user accessing the function must be authenticated and authorized with the role of `Final Approver`.

## 4. Postconditions (事後条件)
- **On View:** The Payment Request status transitions to `Approver Reviewing`.
- **On Approval:**
  - The Payment Request status transitions to `Approved`.
  - The request is routed to the Accounting Pending queue (Assigned To: Accounting).
  - An `ApprovalLog` record is generated.
- **On Rejection:**
  - The Payment Request status transitions to `Rejected by Approver`.
  - The request is returned to the Applicant (Assigned To: Applicant) for revision.
  - A mandatory comment is stored.
  - An `ApprovalLog` record is generated.

## 5. Functional Requirements (機能要件)

| Requirement ID | Requirement Name | Trigger Source | Processing Detail | Output / Outcome |
| :--- | :--- | :--- | :--- | :--- |
| **REQ-012** | Automatic Status Transition to Reviewing | Final Approver viewing request detail page. | When the Final Approver opens a payment request with status `Submitted to Approver`, the system automatically updates the status to `Approver Reviewing`. | - Payment Request status set to `Approver Reviewing`. <br> - ApprovalLog record created (`ActionType: ApproverReview`). |
| **REQ-013** | Detail and History View Access | System Database. | The Final Approver is granted read-only access to view all payment request fields, breakdown table items, receipt attachments, and the complete audit timeline (`ApprovalLog` records). | Rendered details and approval log history on the Approver Dashboard. |
| **REQ-014** | Payment Request Approval | Final Approver clicking "Approve" button. | The system updates the status of the request to `Approved`, routes it to the Accounting pending queue, and sets the assignee to `Accounting`. | - Payment Request status set to `Approved`. <br> - Request routed to Accounting dashboard. <br> - ApprovalLog record created (`ActionType: Approved`). |
| **REQ-015** | Payment Request Rejection | Final Approver entering comment and clicking "Reject" button. | The system validates that the mandatory comment has a minimum of 10 characters. Upon validation, the status is updated to `Rejected by Approver`, and the assignee is set to `Applicant`. | - Payment Request status set to `Rejected by Approver`. <br> - Request returned to the Applicant for revision. <br> - ApprovalLog record created (`ActionType: ApproverRejected`). |
| **REQ-016** | Generation of Audit Log (ApprovalLog) | Action Execution (Approve / Reject). | Upon performing either an "Approve" or "Reject" action, the system must write a record to the `ApprovalLog` table detailing the action, comment, operator ID, transition status, timestamp, and IP address. | - Inserted record in `ApprovalLog` table. |

## 6. Process Flow (プロセスフロー)

### 6.1 Textual Steps
1. Final approver navigates to pending requests list.
2. Final approver opens a request with status "Submitted to Approver".
3. System updates `Request.Status` → "Approver Reviewing".
4. UI displays full request details and `ApprovalLog`.
5. Final approver chooses action:
   - **Approve** → System creates `ApprovalLog`(Action="Approve"), sets `Request.Status`="Approved", enqueue to Accounting Pending queue, send accounting notification.
   - **Reject** → UI requires non-empty comment; on submit, system: create `ApprovalLog`(Action="Reject", Comment), set `Request.Status`="Rejected by Approver", notify applicant, return to applicant workflow queue.
6. System confirms action and displays success message to final approver.

### 6.2 Process Flow Diagram (Linear)
```
Submitted to Approver --(final approver opens)--> Approver Reviewing --(approve)--> Approved --> Accounting Pending
                                                     └──(reject + comment)--> Rejected by Approver --> Applicant
```

## 7. Input / Output Specification (入出力定義)

### 7.1 Input Specification (入力定義)
| Field Name (English) | Field Name (Japanese) | Control Type | Format / Constraints | Required / Optional | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Approval Comment** | コメント | Text Area | Min 10 characters, Max 1000 characters. Supports Myanmar Unicode character inputs. | Mandatory only if the Reject action is selected. Optional for Approve action. | Input field for rejection feedback, approval notes, or query responses. |

### 7.2 Output Specification (出力定義)
The Final Approver view displays the following read-only fields:

#### 7.2.1 Request Header Section
- **Request Number (申請番号):** Auto-generated unique format (e.g., "PRF-2026-001")
- **Application Date (申請日):** YYYY-MM-DD format
- **Employee Number (社員番号):** String (10 characters)
- **Employee Name (氏名):** String (100 characters) - Supports Myanmar Unicode characters.
- **Branch (ブランチ):** Applicant's branch name (e.g., Yangon, Mandalay, Naypyidaw)

#### 7.2.2 Payment Information Section
- **Total Payment Amount (支払金額):** Decimal format (12,2) with currency prefix (e.g. MMK, USD, JPY)
- **Desired Payment Date (支払希望日):** YYYY-MM-DD format
- **Currency Type (通貨選択):** Dropdown select (e.g., MMK, USD, JPY)
- **Payment Type (支払タイプ):** Category identifier (e.g., Expense Reimbursement, Service Payment)
- **Payment Method (支払方法):** Bank Transfer / Cash / Check
- **Purpose/Usage (用途):** Detail description text - Supports Myanmar Unicode characters.
- **Bank Account / Phone Info (銀行口座・口座名/電話番号):** Conditional account details

#### 7.2.3 Request Content & Attachments
- **Payment Request Content (支払申請内容):** Descriptive text block - Supports Myanmar Unicode characters.
- **Receipt Present (領収書の有無):** Yes/No indication
- **Receipt Files (添付ファイル):** Hyperlinks to download stored digital attachments

#### 7.2.4 Payment Breakdown Table (支払内訳)
A grid containing the following columns:
- **No (行番号):** Line number 1-15
- **Date (日付):** Expense date
- **Description (内容):** Specific expense description - Supports Myanmar Unicode characters.
- **Amount (金額):** Item amount

#### 7.2.5 Approval History (承認履歴)
Timeline component rendering all previous audit logs:
- **Date/Time (日時):** Timestamp (UTC)
- **User (担当者):** Verifier/Approver full name
- **Action (アクション):** Action code (e.g. Created, Submitted, ManagerReview, ManagerVerified, ManagerRejected, ApproverReview, Approved, ApproverRejected, PaymentCompleted, Edited)
- **Comment (コメント):** Rejection reasons or remarks - Supports Myanmar Unicode characters.

## 8. Business Rules (業務ルール)
- BR-01: Status transitions must follow allowed transitions only. From "Submitted to Approver" opening → "Approver Reviewing". Approve can transition from "Approver Reviewing" or "Submitted to Approver" to "Approved". Reject transitions to "Rejected by Approver".
- BR-02: Only users with `Role` = `FinalApprover` may perform approve/reject actions at this stage.
- BR-03: Reject action requires a non-empty `Comment` (minimum 10 characters); system must enforce validation.
- BR-04: `ApprovalLog` entries are immutable once written; each final approver action must generate one `ApprovalLog` entry.
- BR-05: Routing: On approve, request must be placed in "Accounting Pending" queue and visible to Accounting processors.
- BR-06: Notifications must be sent reliably; notification failures must be logged and retried per system retry policy.
- BR-07: Timestamps are recorded in UTC with millisecond precision for auditability.
- BR-08: All writes related to an action (`Status` change, `ApprovalLog` creation, queue message) must be performed within a transactional boundary to ensure consistency; if any write fails, rollback all changes and display error.

## 9. Error Handling (エラー処理)
| Error Code | Trigger Condition | System Behavior | User Notification Message |
| :--- | :--- | :--- | :--- |
| **ERR-APP-001** | The Final Approver attempts to perform a workflow action (Approve/Reject) on a request that has already transitioned to another status (e.g., another approver approved it). | The system aborts the operation, rolls back database transactions, and refreshes the dashboard. | "This request has already been processed by another user. Dashboard has been updated." |
| **ERR-APP-002** | The Final Approver attempts to execute a Reject action but leaves the Comment input blank, or inputs less than 10 characters. | The system cancels the rejection command, highlights the comment field in red, and prompts the user. | "Rejection comment is mandatory and must be at least 10 characters long." |
| **ERR-APP-003** | An unauthorized user attempts to access the Final Approver workflow endpoint or submit approval actions. | The system blocks execution, logs an authentication security audit trail entry, and redirects to the landing page. | "Access denied. You do not have the required permissions for this action." |
| **ERR-APP-004** | Database failure or connection loss during approval execution. | The system rolls back the transaction, retains the original request status, and prints a generic system error log. | "A system error occurred while saving approval details. Please try again or contact your administrator." |

## 10. Notes (特記事項)
- **Real-Time Notification Event:** Use consistent status naming as defined in field-level definitions; update central status enumeration if new statuses added.
- `ApprovalLog` must be queryable by `RequestID` and ordered by `Timestamp` for display.
- UI should fetch `ApprovalLog` on request open; display entries with Actor `DisplayName`, `Action` label, `Timestamp`, and `Comment`.
- Retention and archive policy for `ApprovalLog` follows organizational audit policy (not specified here).
- Timezone: display times in user's local timezone, store as UTC.
- Security: actions must be authorized and auditable; ensure transport encryption and access control.
