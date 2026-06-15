# Screen Items Specification — Final Approver Dashboard

**Target Screen:** Final Approver Dashboard  
**Version:** 1.0  
**Created:** 2026-06-15  
**Status:** Draft  

---

## 1. Screen Layout Overview
The Final Approver Dashboard uses a two-column layout with request details and breakdown information on the left, and approval history plus metadata on the right. A fixed action footer contains the primary decision controls for Approve and Reject.

---

## 2. Screen Items & Fields

| Section | Field Name | Display Name | Input Type | Required | Read Only | Description / Validation |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- |
| **Request Summary** | `request_number` | Request Number | Label | - | Y | Unique request identifier. |
| **Request Summary** | `applicant_name` | Applicant Name | Label | - | Y | Name of the request originator. |
| **Request Summary** | `application_date` | Application Date | Label | - | Y | Date the request was first submitted. |
| **Request Summary** | `branch` | Branch | Label | - | Y | Applicant branch location. |
| **Request Summary** | `department` | Department | Label | - | Y | Applicant department. |
| **Request Summary** | `current_status` | Current Status | Label | - | Y | Current workflow status badge. |
| **Request Summary** | `assigned_to` | Current Assigned To | Label | - | Y | Current assigned user or role. |
| **Payment Details** | `desired_payment_date` | Desired Payment Date | Label | - | Y | Requested payment execution date. |
| **Payment Details** | `total_amount` | Total Amount | Label | - | Y | Total payment amount. |
| **Payment Details** | `currency_code` | Currency | Label | - | Y | Payment currency code (e.g. MMK, USD, JPY). |
| **Payment Details** | `payment_method` | Payment Method | Label | - | Y | Payment method (Bank Transfer, Cash, Check). |
| **Payment Details** | `payment_type` | Payment Type | Label | - | Y | Payment category selected by the applicant. |
| **Payment Details** | `purpose` | Purpose | Label | - | Y | Business purpose of the payment. |
| **Request Description** | `request_content` | Request Description | Label | - | Y | Detailed narrative of the request. |
| **Attachment Summary** | `has_receipt` | Receipt Attached | Label | - | Y | Indicates whether receipts are attached. |
| **Attachment Summary** | `receipt_files` | Receipt Files | File Preview | - | Y | Downloadable list of attached receipt files. |
| **Breakdown Details** | `items_grid` | Breakdown Details Table | Grid | - | Y | Read-only line item table with expense details. |
| **Breakdown Details** | `line_number` | Line No. | Label | - | Y | Sequential line identifier. |
| **Breakdown Details** | `item_date` | Item Date | Label | - | Y | Date associated with the line item. |
| **Breakdown Details** | `description` | Description | Label | - | Y | Description of the expense item. |
| **Breakdown Details** | `amount` | Amount | Label | - | Y | Amount for the line item. |
| **Breakdown Details** | `quantity` | Quantity | Label | - | Y | Optional quantity value. |
| **Breakdown Details** | `unit_price` | Unit Price | Label | - | Y | Optional unit price value. |
| **Approval History** | `approval_timeline` | Approval History Timeline | Timeline | - | Y | Chronological audit trail of status changes, actors, and comments. |
| **Action Input** | `approver_comment` | Approver Comment | Textarea | C | N | Mandatory when rejecting; minimum 10 characters. Optional for approval. |

*Note: “C” indicates Conditional Required.*

---

## 3. Buttons & Actions

1. **Approve Button**
   - Action: Opens a confirmation prompt and, on confirmation, sends the request to the backend to set status to `APPROVED`.
   - Result: The request is routed to Accounting and removed from the Approver pending queue.
   - Approver comment is optional for approval.

2. **Reject Button**
   - Action: Opens a rejection modal requiring `approver_comment`.
   - Validation: Comment must be at least 10 characters.
   - Result: The backend sets status to `REJECTED_APPROVER`, returns the request to the applicant, and records the rejection comment.

3. **Refresh Button**
   - Action: Refreshes the pending request list and any open request details.
   - Result: Ensures the dashboard reflects the latest status changes.

4. **Download Receipt Link**
   - Action: Downloads the selected receipt attachment via an authenticated request.
   - Result: Provides secure access to receipt files for review.

5. **History Expand Toggle**
   - Action: Expands or collapses the approval history timeline details.
   - Result: Shows or hides extended comments, timestamps, and actor details.

---

## 4. Screen Navigation & Status Updates

- Opening a request from the pending queue automatically updates a request with status `SUBMITTED_APPROVER` to `APPROVER_REVIEWING`.
- After approval, the request exits the Approver queue and becomes available to Accounting.
- After rejection, the request returns to the Applicant in status `REJECTED_APPROVER` and includes the approver comment.
- If the request is already processed by another actor, a conflict notification is shown and the user is returned to the queue.

---

## 5. Validation Rules

- `approver_comment` is required only when rejecting and must contain at least 10 characters.
- All displayed request fields are read-only; the final approver cannot change request header data, breakdown items, or attachments.
- Receipt downloads are permitted only for authenticated approver users with valid access.
- A request cannot be approved or rejected unless it is currently in `APPROVER_REVIEWING` status.
