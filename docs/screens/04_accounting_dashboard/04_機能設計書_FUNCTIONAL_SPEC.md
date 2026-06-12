System Name           :  Payment Request Workflow Management System  
System Classification :  Accounting Processing  
Function Name         :  Accounting Dashboard  

# ***Accounting Dashboard Functional Design Specification***  

## Table of Contents  

- [***Accounting Dashboard Functional Design Specification***](#accounting-dashboard-functional-design-specification)
  - [Table of Contents](#table-of-contents)
  - [1. Overview](#1-overview)
    - [1.1. Purpose](#11-purpose)
    - [1.2. Relationships with Other Functions and Peripheral Systems](#12-relationships-with-other-functions-and-peripheral-systems)
    - [1.3. Inputs/Outputs](#13-inputsoutputs)
    - [1.4. Related Documents](#14-related-documents)
  - [2. Screen Transitions](#2-screen-transitions)
  - [3. Processing Details](#3-processing-details)
    - [3.1. Functional Prerequisites](#31-functional-prerequisites)
    - [3.2. Processing](#32-processing)
      - [3.2.1. Initial Display](#321-initial-display)
      - [3.2.2. Detail Modal Display](#322-detail-modal-display)
      - [3.2.3. Payment Completion Process](#323-payment-completion-process)
      - [3.2.4. WebSocket Synchronization](#324-websocket-synchronization)
    - [3.3. Display Order](#33-display-order)
  - [4. Configurable Items (External Definitions)](#4-configurable-items-external-definitions)

---

## 1. Overview  

### 1.1. Purpose

The purpose of the Accounting Dashboard is to provide the accounting team with a secure and centralized user interface to view, search, review, and process all payment requests that have received final approval (`APPROVED` status). This allows accounting personnel to verify receipts, handle branch-specific payment alerts, input payment notes, and mark requests as "Paid (Completed)", ending the request lifecycle.

### 1.2. Relationships with Other Functions and Peripheral Systems

The dashboard interacts with user roles, status triggers, the physical file server, and audit logs as described below:

```text
┌──────────────────────┐      ┌─────────────────────────────────┐
│    Final Approver    │      │      Payment Requests DB        │
│   (Approve Action)   ├─────►│  Sets status to APPROVED (8)    │
└──────────────────────┘      └──────────────┬──────────────────┘
                                             │ Query
                                             ▼
                                  ┌────────────────────┐
                                  │Accounting Dashboard│
                                  └──────────┬─────────┘
                                             │ Update status
                                             ▼
┌──────────────────────┐      ┌─────────────────────────────────┐
│    Applicant User    │      │      Payment Requests DB        │
│ Dashboard Notification│◄────┤  Sets status to PAID (10)       │
└──────────────────────┘      └─────────────────────────────────┘
```

* **Upstream Triggers**: The `APPROVED` status is set by the Final Approver action. Once approved, the request is automatically routed to this function's work queue.
* **Downstream Events**: Transitioning a request to `PAID` locks the request from future alterations, notifies the applicant via WebSockets, and writes a permanent log in the audit trail.
* **External Storage**: The function queries physical receipts stored on the server's local file abstraction layer to render links in the detail window.

---

### 1.3. Inputs/Outputs

| Input Information | Data Category | Source / Description |
| :--- | :--- | :--- |
| `payment_requests` | Database Table | Primary transaction record where status_id = 8 (`APPROVED`) and is_deleted = false. |
| `users` | Database Table | User profiles for applicant (checks branch name), manager, and approver. |
| `payment_breakdown_items` | Database Table | Detailed items contributing to the total payment amount. |
| `receipt_files` | Database Table | Storage metadata paths associated with the payment request. |
| `approval_logs` | Database Table | Prior verification log logs and comments. |
| Filters & Search Parameters | User Input UI | Dropdown selections and keyword text. |

| Output Information | Data Category | Destination / Description |
| :--- | :--- | :--- |
| Updated `payment_requests` | Database Table | Status updated to `PAID` (status_id = 10) and `payment_completed_date` set. |
| Created `approval_logs` | Database Table | New row inserted with Action Code `PAYMENT_COMPLETED` (10), transition details, and comment. |
| WebSocket Event | Network Message | Pushes payload to candidate users to synchronize queue lists and applicant dashboards. |
| Dashboard Toast / UI List | UI Display | Queue table row removed; success notification generated. |

---
  
### 1.4. Related Documents

| No. | Document ID | Document Name | File Path / Reference | Remarks |
| :-- | :--- | :--- | :--- | :--- |
| 1 | RD-01 | Requirements Definition | [REQUIREMENT_DEFINITION.md](file:///c:/work/AI/documents/Kinoskill/REQUIREMENT_DEFINITION.md) | Section 3.4.4, Section 4.3 |
| 2 | DS-01 | Database Design Specification | [DATABASE_DESIGN_SPECIFICATION.md](file:///c:/work/AI/documents/Kinoskill/DATABASE_DESIGN_SPECIFICATION.md) | Table structures, indexes, cache keys |

---

## 2. Screen Transitions

The flow from authentication to list inspection and transaction execution is designed as follows:

```text
┌──────────────────────────┐
│     Accounting Login     │
└────────────┬─────────────┘
             │ Successful Authentication (Role: ACCOUNTING)
             ▼
┌──────────────────────────┐
│   Accounting Dashboard   │◄───────────────────────────────────┐
│     (Queue Active)       │                                    │
└────────────┬─────────────┘                                    │
             │ Click Request No. or [Process] Button            │
             ▼                                                  │ Cancel
┌──────────────────────────┐                                    │ or Close
│   Payment Detail Modal   ├────────────────────────────────────┤
│ (ALR-01/ALR-02 Rendering)│                                    │
└────────────┬─────────────┘                                    │
             │ Click [Mark as Paid]                             │
             ▼                                                  │
┌──────────────────────────┐                                    │
│   Confirmation Dialog    │                                    │
└────────────┬─────────────┘                                    │
             │ Confirm (Commit DB Transaction)                  │
             └──────────────────────────────────────────────────┘
```

---

## 3. Processing Details

### 3.1. Functional Prerequisites

* **Role-Based Access Control (RBAC)**: Access is strictly controlled. Only users assigned the `ACCOUNTING` role (role_id referencing `user_roles.role_code` = 'ACCOUNTING') can initialize this function. Other roles attempting to access the page are blocked with a `403 Forbidden` response.
* **Filter Constraint**: The queue exclusively queries transactions with status code `APPROVED` (status_id = 8). Soft-deleted records (`is_deleted` = true) must be explicitly excluded.
* **Branch Logic Routing**: The system checks the applicant's corporate branch attribute dynamically. If the branch matches the key name "Mandalay", specific warning alerts must be activated to override default bank transfer handling.

### 3.2. Processing

#### 3.2.1. Initial Display

1. **Purpose**  
   * Load the active worklist of approved payment requests awaiting payment processing.
2. **Details**  
   1. **Authentication Check**
      * Verify the active user session. If the session has expired or the user is not authenticated, redirect to the login screen with the return URL query parameter.
      * Validate the user's role. If the role code is not `ACCOUNTING`, abort page loading and return a `403 Forbidden` error page.
   2. **Queue Data Retrieval**
      * Query active records from the `payment_requests` table.
        * **SQL Condition**: `WHERE status_id = 8 AND is_deleted = FALSE`
      * Join with relational tables to extract applicant, currency, and payment method details:
        * Left join `users` (applicant profile) using `applicant_user_id` to retrieve the applicant's name (`full_name`) and branch (`branch`).
        * Left join `currencies` using `currency_id` to get `currency_code`.
        * Left join `payment_methods` using `payment_method_id` to get `payment_method_name`.
      * Sort the results based on the display order logic specified in Section 3.3.
   3. **UI Population**
      * Set filter dropdowns to their default values ("All").
      * Load the table queue list. If zero rows are returned, display the empty state message: *"No approved payment requests found."*
      * Join the `"Accounting"` WebSocket room to listen for real-time upstream approvals.

#### 3.2.2. Detail Modal Display

1. **Purpose**  
   * Display detailed information of a selected payment request to allow accountants to audit values and files before completing payment.
2. **Details**  
   1. **Trigger**
      * Triggered when the user clicks a Request Number link (COL-01) or the "Process" button (COL-07) in the table list.
   2. **Data Acquisition**
      * Fetch the complete request details by querying the selected `payment_request_id`:
        * Get header data, bank account information (`bank_account_info`), detailed request content (`request_content`), and receipt flag (`has_receipt`).
        * Fetch breakdown items: Query `payment_breakdown_items` where `payment_request_id = :id`.
        * Fetch receipts: Query active `receipt_files` records where `payment_request_id = :id AND is_deleted = FALSE`.
        * Fetch timeline logs: Query `approval_logs` where `payment_request_id = :id` ordered by `timestamp` ascending.
   3. **Dynamic Alert Evaluation**
      * Evaluate the applicant's branch property to execute branch routing rules:
        * **Condition A (Mandalay)**: If `users.branch` == "Mandalay", display `ALR-01` in warning style (red background, bold font): *"⚠️ IMPORTANT: Coordinate with Toe San for Cash Payment"*.
        * **Condition B (Other Branches)**: If `users.branch` != "Mandalay", display `ALR-02` in neutral style (blue background): *"Standard Bank Transfer Processing"*.
   4. **UI Render Processing**
      * Display applicant information, bank info, and details.
      * Render the breakdown items table, displaying dates, descriptions, and line amounts.
      * Calculate the sum of all breakdown line amounts. If the sum does not match the header's `total_amount`, display a warning flag in the modal.
      * Render receipt attachments as hyperlinks. For each receipt, output the clickable file link: `[original_file_name]` pointing to `file_storage_path`.
      * Show the chronological history log of the request's lifecycle.
      * Initialize an empty comment textarea (TXT-01) for optional accounting notes.

#### 3.2.3. Payment Completion Process
1. **Purpose**  
   * Complete payment processing by updating workflow status, updating timestamps, and logging audit details.
2. **Details**  
   1. **Trigger**
      * Click the "Mark as Paid" button (BTN-03) in the detail modal.
   2. **Step 1: Modal Confirmation**
      * Show a modal confirmation box asking: *"Are you sure you want to mark payment request [Request Number] as Paid? This action cannot be undone."*
      * If the user clicks "Cancel", close the confirmation box and remain on the detail modal. If they click "Confirm", execute the database updates.
   3. **Step 2: Database Update (Atomic Transaction)**
      * Execute updates inside a single database transaction. If any query fails, rollback the transaction.
      * **Update Payment Request**:
        ```sql
        UPDATE payment_requests 
        SET status_id = 10,  -- Code for 'PAID'
            payment_completed_date = CURRENT_TIMESTAMP,
            accounting_user_id = :currentUserId,
            modified_date = CURRENT_TIMESTAMP
        WHERE payment_request_id = :targetRequestId 
          AND status_id = 8; -- Optimistic lock check (must be APPROVED)
        ```
      * **Create Log Record**:
        * Insert a record into the `approval_logs` table:
          * `payment_request_id` = :targetRequestId
          * `action_taken_by_user_id` = :currentUserId
          * `action_type_id` = 10 (Action Code for `PAYMENT_COMPLETED`)
          * `previous_status_id` = 8 (`APPROVED`)
          * `new_status_id` = 10 (`PAID`)
          * `comment` = Text entered in comment box (TXT-01). If empty, write NULL.
          * `ip_address` = User's request client IP address.
          * `user_agent` = User's browser User Agent string.
          * `timestamp` = CURRENT_TIMESTAMP
      * **Commit Transaction**: Commit changes to database.
   4. **Step 3: Cache Invalidation & Event Dispatching**
      * Delete the corresponding request view payload from the Redis cache:
        * **Command**: `DEL payment_request:payload:<targetRequestId>`
      * Broadcast WebSocket events to synchronize views:
        * Send update notification to the applicant (WebSocket room: `websocket:user:<applicantId>:sockets`) to refresh their dashboard state.
        * Broadcast a `row-removed` message to the `"Accounting"` WebSocket room to remove this row from all other active accounting dashboard instances.
   5. **Step 4: UI Cleanup**
      * Close the Detail Modal.
      * Remove the processed request row from the active table list.
      * Display a success Toast notification: *"Payment request [Request Number] successfully marked as Paid."*

#### 3.2.4. WebSocket Synchronization
1. **Purpose**  
   * Automatically update the queue list in real-time when new payment requests are approved by Final Approvers.
2. **Details**  
   1. When another user approves a request, the server emits a WebSocket event containing the request payload to the `"Accounting"` room.
   2. On receiving the event, the client dashboard:
      * Appends the new request row at the top of the table.
      * Increments the total queue count.
      * Re-evaluates active table sorting order dynamically.

---

### 3.3. Display Order

The active work queue table displays requests in accordance with the following sorting rules:

1. **Desired Payment Date (`desired_payment_date`)**: Ascending (earliest dates first, to prioritize imminent payments).
2. **Application Date (`application_date`)**: Ascending (oldest requests processed first in case of identical desired payment dates).
3. **Request Number (`request_number`)**: Ascending (alphabetical string sort for unique identity consistency).

---

## 4. Configurable Items (External Definitions)

The following system properties are defined externally in the application's configuration file (`appsettings.json` or environment variables) and can be modified without altering compilation code:

| Definition Key | Parameter Classification | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `MandalayBranchName` | System String | `"Mandalay"` | The branch identifier key used to activate custom payment warning logic. |
| `MandalayContactPerson`| System String | `"Toe San"` | The contact name displayed in the cash payment alert block. |
| `UploadDirectory` | Path String | `"wwwroot/uploads/"` | Root folder directory where physical receipts reside. |
| `ApprovedStatusCode` | System Integer | `8` | Status ID referencing the `APPROVED` database lookup code. |
| `PaidStatusCode` | System Integer | `10` | Status ID referencing the `PAID` database lookup code. |
