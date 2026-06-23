# Quickstart Validation Guide: Applicant Dashboard

This guide outlines how to validate the end-to-end functionality of the Applicant Dashboard feature once implemented.

## Prerequisites
- Node.js v18+, PostgreSQL 16, Redis running locally.
- Project dependencies installed via `npm install`.
- Database migrated and seeded with master lookup data (Roles, Statuses, etc. defined in [data-model.md](file:///C:/Projects/PRWM/specs/001-applicant-dashboard/data-model.md)).

## Setup Commands
1. **Start Backend:**
   ```bash
   cd backend
   npm run start:dev
   ```
2. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```
3. **Login:**
   Authenticate as an `APPLICANT` role user (e.g., using test credentials).

## Validation Scenarios

### 1. View Dashboard & Draft Creation
**Command/Action:**
Navigate to the `/applicant` route in the frontend SPA. Click "Create New Request". Fill in required fields, add one breakdown item, and click "Save Draft".

**Expected Outcome:**
- The request is saved and appears in the dashboard list.
- Status is `DRAFT` (gray badge).
- Total amount matches the breakdown item.
- Request number follows `PRF-YYYY-NNNNNN` format.

### 2. Receipt Upload & Strict Validation Submission
**Command/Action:**
Open the saved draft. Check "Receipt Present = Yes". Attempt to "Submit to Manager" without uploading a receipt.

**Expected Outcome:**
- Submission is blocked by the UI and API with a 422 Unprocessable Entity error.
- After uploading a valid image/PDF receipt (max 10MB) and re-submitting, the request transitions to `SUBMITTED_MANAGER`.

### 3. Real-Time Status Update Notification
**Command/Action:**
While keeping the Applicant Dashboard open, use a REST client (like Postman or curl) to simulate a Manager rejecting the request:
```bash
curl -X POST http://localhost:3000/api/v1/manager/payment-requests/{id}/reject \
  -H "Authorization: Bearer <MANAGER_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"comment": "Missing details in breakdown."}'
```

**Expected Outcome:**
- A WebSocket notification (`request:rejected`) is received instantly on the Applicant Dashboard.
- A toast notification appears indicating the rejection.
- The request status in the grid updates to `REJECTED_MANAGER` (red badge) without a page reload.

## Testing Reference
For automated validation, run the test suites:
```bash
# Run backend applicant module unit tests
cd backend
npm run test -- --testPathPattern=applicant

# Run end-to-end API tests
npm run test:e2e
```
