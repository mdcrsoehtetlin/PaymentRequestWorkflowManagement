# Quickstart Validation Guide: Applicant Dashboard

## Prerequisites
- Node.js 22.x installed
- PostgreSQL 16 running on `localhost:5432`
- Redis (Memurai) 4+ running on `localhost:6379`
- Environment variables configured in `backend/.env` and `frontend/.env`

## Setup Commands

**Backend:**
```bash
cd backend
npm install
npm run build
npm run start:dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Validation Scenarios

### Scenario 1: Applicant Dashboard Load
1. Login with an Applicant role account.
2. Navigate to `http://localhost:5173/applicant`.
3. **Expected Outcome**: The dashboard renders within 2 seconds. The KPI summary cards correctly reflect the total counts of the test data. The paginated data grid shows the applicant's requests.

### Scenario 2: Create Draft
1. Click "+ Create New Request".
2. Fill out the "Payment Breakdown" with at least one item.
3. Click "Save Draft".
4. **Expected Outcome**: A success toast appears. The new request appears in the data grid with a status badge of "Draft" and a generated `PRF-YYYY-NNNNNN` request number.

### Scenario 3: Real-Time WebSocket Notification
1. Open the Applicant Dashboard in Browser A.
2. Using Postman or Browser B, simulate a Manager updating the status of one of the Applicant's requests to `REJECTED_MANAGER`.
3. **Expected Outcome**: Within 500ms, Browser A displays a toast notification ("Request Rejected") and the status badge for that request automatically updates to "Rejected" without a page refresh.
