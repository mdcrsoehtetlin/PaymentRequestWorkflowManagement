# Quickstart Validation Guide: Final Approver Dashboard

This guide provides step-by-step instructions to validate that the Final Approver Dashboard features work correctly from end to end.

---

## 1. Prerequisites & Environment Setup

1. **Start Database and Services**:
   Ensure PostgreSQL and Redis are running (see [ENVIRONMENT_SETUP_GUIDE.md](../../docs/guides/ENVIRONMENT_SETUP_GUIDE.md) if needed).
2. **Launch Applications**:
   - Backend API: `npm run start:dev` (runs on `http://localhost:3000`)
   - Frontend SPA: `npm run dev` (runs on `http://localhost:5173`)
3. **Seed Database**:
   Ensure lookup tables are seeded (see [DATABASE_SPEC.md](../../docs/core_ja/03_データベース設計書_DATABASE_SPEC.md#22-dml-master-seeding-scripts)).
4. **Log in as an Approver**:
   Obtain a JWT token for a user with the `APPROVER` role (`role_id = 3`).

---

## 2. Automated Test Execution

Run backend and frontend unit tests to verify contract structure and business logic:

```bash
# Run backend tests for the Approver module
npm run test -- src/modules/approver

# Run frontend tests for the Approver page
cd frontend
npm run test -- src/pages/approver
```

---

## 3. Manual Verification Scenarios (API & Database)

### Scenario 1: Fetch Dashboard Pending Queue
- **Action**: Perform a `GET` request to `/api/v1/approver/payment-requests` (with optional status/search filters).
- **Verification**:
  - Response must return `200 OK` matching the [GET Pending Queue Contract](./contracts/GET_pending_queue.md).
  - Confirm only requests with `status_id` in `(6, 7)` are returned.

### Scenario 2: Open Detail & Auto-Start Review
- **Action**: Perform a `GET` request to `/api/v1/approver/payment-requests/:id` for a request in `SUBMITTED_APPROVER (6)` status.
- **Verification**:
  - Response matches the [Get Request Details Contract](./contracts/GET_request_details.md).
  - Query PostgreSQL to check the request's status:
    ```sql
    SELECT status_id, current_assigned_to_user_id FROM payment_requests WHERE payment_request_id = :id;
    ```
    Expected: `status_id = 7` and `current_assigned_to_user_id` is set to the Approver's user ID.
  - Verify that an entry is added to `approval_logs` with `action_type_id = 208` (Approver Review Started).

### Scenario 3: Process Approval
- **Action**: Perform a `POST` to `/api/v1/approver/payment-requests/:id/approve` for a request in status `7`.
- **Verification**:
  - Response matches the [Approve Request Contract](./contracts/POST_approve.md).
  - Verify the database row updates to `status_id = 8` (Approved) and individual assignee is cleared (`current_assigned_to_user_id = NULL`).
  - Verify that a log entry is written to `approval_logs` with `action_type_id = 209` (Approved).

### Scenario 4: Process Rejection (Minimum Comment Length Validation)
- **Action**: Perform a `POST` to `/api/v1/approver/payment-requests/:id/reject` with a comment shorter than 10 characters.
- **Verification**:
  - Server must block transition and return `400 Bad Request`.
- **Action**: Perform a `POST` to the same endpoint with a comment of 15 characters (e.g. `{"comment": "Incorrect receipt amount"}`).
- **Verification**:
  - Response matches the [Reject Request Contract](./contracts/POST_reject.md).
  - Verify the database row updates to `status_id = 9` (Rejected by Approver) and `current_assigned_to_user_id` is set to the Applicant's user ID.
  - Verify that `approval_logs` contains an entry with `action_type_id = 210` (Approver Rejected) and the rejection comment.

---

## 4. UI/UX Verification Flow

1. Open `http://localhost:5173/approver/dashboard` in a desktop browser.
2. Verify that **Summary Cards** display count totals matching the database state.
3. Search and filter by applicant name or request number and confirm matching grid list updates.
4. Click on a row in `Submitted to Approver` status:
   - Confirm that it opens the **Details Panel** below the list.
   - Confirm that the status badge updates to `Approver Reviewing` in real-time.
5. Click **Approve** -> Confirm in modal -> verify that the modal closes, a success toast displays, and the row is evicted from the active queue.
6. Click **Reject** -> Input a rejection reason -> verify that typing fewer than 10 characters disables the submit button. On valid input, submit and verify that the request is evicted.
