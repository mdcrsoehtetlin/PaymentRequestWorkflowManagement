# Screen Items Specification - Accounting Dashboard

**Target Screen:** Accounting Dashboard  
**Version:** 1.1  
**Created Date:** 2026-06-15  
**Status:** Approved  
**Related Requirements:** PRWM-SIS-SCR-004, PRWM-REQ-017~020

---

## 1. Purpose
This document defines the UI elements and interaction specifications for the Accounting Dashboard screen. It is intended to provide a common understanding for screen designers and implementers regarding item names, input formats, display rules, and validation requirements.

---

## 2. Screen Layout Overview
The Accounting Dashboard uses a three-pane layout with the following structure:

- Left pane: Pending payment queue with search and filter controls
- Center pane: Selected payment request details
- Right pane: Alert banner, approval history, and action buttons

---

## 3. Screen Items
This section defines the main screen items by section. All fields are read-only for the accounting role, except where explicitly noted.

| Section | Field Name | Display Label | Input Type | Required | Read Only | Description / Validation |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- |
| **Request Header** | `request_number` | Request Number | Label | - | Y | Unique identifier for the payment request. |
| **Request Header** | `applicant_name` | Applicant Name | Label | - | Y | Name of the request submitter. |
| **Request Header** | `branch` | Branch | Label | - | Y | Branch of the applicant. |
| **Request Header** | `application_date` | Application Date | Label | - | Y | Date the request was submitted. |
| **Approval Status** | `status_name` | Current Status | Label | - | Y | Display the current workflow status. |
| **Payment Details** | `total_amount` | Total Amount | Label | - | Y | Sum of breakdown amounts, displayed with currency symbol. |
| **Payment Details** | `currency_code` | Currency | Label | - | Y | Currency selected at submission. |
| **Payment Details** | `desired_payment_date` | Desired Payment Date | Label | - | Y | Requested payment date. |
| **Payment Details** | `payment_method` | Payment Method | Label | - | Y | Bank transfer, cash, or check. |
| **Payment Details** | `bank_account_info` | Bank Account / Phone Number | Label | - | Y | Bank account or phone number for cash collection. |
| **Payment Details** | `payment_type` | Payment Type | Label | - | Y | Type such as expense reimbursement or service payment. |
| **Payment Details** | `purpose` | Purpose | Label | - | Y | Purpose of the payment. |
| **Request Content** | `request_content` | Payment Request Details | Label | - | Y | Detailed description of the payment request. |
| **Request Content** | `has_receipt` | Receipt Attached | Label | - | Y | Indicates whether receipts are attached. |
| **Detail Display** | `items_grid` | Payment Breakdown Items | Grid | - | Y | Displays 1 to 15 line items with date, description, quantity, unit price, and amount. |
| **Attachments** | `receipt_preview` | Receipt Preview | File Preview | - | Y | Preview and download attachments. |
| **Approval History** | `approval_timeline` | Approval History Timeline | Timeline | - | Y | Shows action history in reverse chronological order with date, user, action, and comment. |
| **Payment Instruction** | `payment_alert_banner` | Payment Instruction Banner | Banner | - | Y | Displays business alerts based on branch rules. |
| **Payment Actions** | `accounting_comment` | Accounting Comment | Textarea | N | N | Optional note entered at payment completion. |

---

## 4. Dynamic Display Rules
The banner text changes based on the applicant branch. The display content follows the shared specification.

- If the applicant branch is `Mandalay`
  - Banner type: Warning (red)
  - Message: `IMPORTANT: Mandalay branch - please coordinate with Toe San for cash payment.`
- Otherwise
  - Banner type: Information (blue)
  - Message: `Standard bank transfer process.`

---

## 5. Button and Event Definitions
### 5.1 Confirm Payment Button
- Label: `Confirm Payment`
- Visibility: Displayed only for accounting users
- Event: Show a confirmation dialog, then update the request status to `PAID` and set `payment_completed_date`.
- Validation: Requires a selected `request_number` and current status of `APPROVED`.

### 5.2 Download All Receipts Button
- Label: `Download All Receipts`
- Event: Download all attached receipt files to the client.
- Validation: Disable the button if no attachments exist.

### 5.3 Close / Back to List
- Label: `Back to List`
- Event: Close the detail view and return focus to the pending payment queue.

---

## 6. Error Messages and Notes
- If a network error occurs during `Confirm Payment`, display: `Unable to complete payment. Please try again.`
- If no attachments exist during `Download All Receipts`, display: `No attached receipts found.`
- The `Payment Instruction Banner` must remain fixed at the top of the right pane and stay visible during scrolling.

---

## 7. Integration Requirements
- The pending payment list must query `payment_requests` records with status `APPROVED`.
- The `approval_timeline` must retrieve all related history from `approval_logs` and display entries in descending `timestamp` order.
- The banner evaluation must be recalculated on screen load and whenever the selected request changes.
