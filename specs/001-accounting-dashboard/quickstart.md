# Quickstart & Validation

## Prerequisites
- Node.js 20+ and npm
- PostgreSQL 16
- Redis 6+ (Memurai for Windows)
- Ensure DB is seeded from `docs/core_ja/payment_request_db_backup.sql`

## Start Application
1. **Backend**:
   ```bash
   cd backend
   npm run start:dev
   ```
2. **Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

## Validation Scenarios

### Scenario 1: Access Accounting Dashboard
1. Login as Accounting User (e.g., `shinminthant@prwm.local`, Password: `Password@123`).
2. Navigate to `/accounting/dashboard`.
3. Expected: You should see the dashboard with requests filtered to the `APPROVED` status by default.

### Scenario 2: View Payment Details
1. Click on a specific `APPROVED` request from the list (e.g., `PRF-2026-004`).
2. Expected: The detail modal opens showing the breakdown, applicant info, and audit trail. Since the applicant is from the Mandalay branch, a cash payment alert (`ALR-01`) should be visible.

### Scenario 3: Complete Payment
1. While in the detail view for `PRF-2026-004`, click the "Complete Payment" button.
2. Enter an optional comment in the modal.
3. Submit the completion action.
4. Expected: The request status transitions to `PAID`, a success toast is shown, the detail modal closes, and the list is refreshed. The real-time WebSocket connection ensures the dashboard updates immediately.
