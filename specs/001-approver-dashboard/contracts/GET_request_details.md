# API Contract: Get Request Details

Retrieves details of a single request for final approver review. 

> [!NOTE]
> If the current request status is `6 (SUBMITTED_APPROVER)`, hitting this endpoint will automatically start the review: updates status to `7 (APPROVER_REVIEWING)`, assigns the request assignee to the current Approver user, writes `APPR_REVIEW_START` to `approval_logs`, commits the transaction, invalidates cached payload, and broadcasts WebSocket event.

- **Endpoint**: `GET /api/v1/approver/payment-requests/:id`
- **Headers**:
  - `Authorization: Bearer <JWT_TOKEN>`

---

## Response Body (200 OK)

```json
{
  "paymentRequestId": 101,
  "requestNumber": "PRF-2026-001",
  "applicant": {
    "userId": 10,
    "fullName": "Hanako Tanaka",
    "employeeNumber": "EMP-00010",
    "branch": "Tokyo Head Office",
    "department": "Sales"
  },
  "manager": {
    "userId": 5,
    "fullName": "Ichiro Sato",
    "employeeNumber": "EMP-00005"
  },
  "applicationDate": "2026-06-15",
  "desiredPaymentDate": "2026-06-25",
  "totalAmount": "1500.00",
  "currencyCode": "USD",
  "paymentTypeName": "Expense Reimbursement",
  "paymentMethodName": "Bank Transfer",
  "bankAccountInfo": "Sumitomo Mitsui Bank, Tokyo Branch, Acct #1234567",
  "purpose": "Office Stationery Supplies",
  "requestContent": "Reimbursement for paper, notebooks, and binders purchased for Sales Department on June 9, 2026.",
  "hasReceipt": true,
  "statusId": 7,
  "canApprove": true,
  "canReject": true,
  "latestManagerComment": "Receipts match the details exactly. Recommended for final approval.",
  "latestApplicantSubmissionComment": null,
  "breakdownItems": [
    {
      "paymentBreakdownItemId": 501,
      "lineNumber": 1,
      "itemDate": "2026-06-09",
      "description": "Premium Copier Paper A4 x10",
      "amount": "500.00",
      "quantity": 10.00,
      "unitPrice": 50.00
    },
    {
      "paymentBreakdownItemId": 502,
      "lineNumber": 2,
      "itemDate": "2026-06-09",
      "description": "Executive Binders and Notebooks",
      "amount": "1000.00",
      "quantity": 1.00,
      "unitPrice": 1000.00
    }
  ],
  "receiptFiles": [
    {
      "receiptFileId": 201,
      "originalFileName": "OfficeSupplies_20260609_01.pdf",
      "fileSize": "1245000",
      "fileStoragePath": "http://localhost:3000/uploads/OfficeSupplies_20260609_01.pdf"
    }
  ],
  "approvalLogs": [
    {
      "approvalLogId": "98765432101",
      "actionTakenBy": {
        "fullName": "Hanako Tanaka",
        "roleName": "Applicant"
      },
      "actionType": "Submitted",
      "timestamp": "2026-06-15T02:00:00.000Z",
      "comment": null
    },
    {
      "approvalLogId": "98765432102",
      "actionTakenBy": {
        "fullName": "Ichiro Sato",
        "roleName": "Manager"
      },
      "actionType": "Manager Verified",
      "timestamp": "2026-06-17T08:30:00.000Z",
      "comment": "Receipts match the details exactly. Recommended for final approval."
    },
    {
      "approvalLogId": "98765432103",
      "actionTakenBy": {
        "fullName": "Ken Watanabe",
        "roleName": "Final Approver"
      },
      "actionType": "Approver Review Started",
      "timestamp": "2026-06-19T09:30:00.000Z",
      "comment": null
    }
  ]
}
```
