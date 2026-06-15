# 詳細設計書 (Detail Design Specification) - 最終承認者ダッシュボード

**対象画面:** 最終承認者ダッシュボード (Approver Dashboard)  
**バージョン:** 1.0  
**作成日:** 2026-06-12  
**ステータス:** 承認済み  

---

## 1. APIエンドポイント定義 (API Endpoints)

### 1.1 最終承認待ち一覧取得
* **Method:** `GET`
* **Path:** `/api/payment-requests/pending-approver`
* **Headers:** `Authorization: Bearer <JWT>`
* **Response (JSON):**
  ```json
  {
    "data": [
      {
        "payment_request_id": 101,
        "request_number": "PRF-2026-0001",
        "applicant_name": "John Doe",
        "application_date": "2026-06-12",
        "total_amount": "150000.00",
        "status_code": "SUBMITTED_APPROVER"
      }
    ]
  }
  ```

### 1.2 申請詳細取得および閲覧ステータス自動変更
* **Method:** `GET`
* **Path:** `/api/payment-requests/:id`
* **Processing:**
  - ログインユーザーが `APPROVER` ロールであり、かつ対象申請のステータスが `SUBMITTED_APPROVER` である場合、トランザクション内でステータスを `APPROVER_REVIEWING` に自動更新し、承認ログを書き込む。

### 1.3 最終承認（Approve）処理
* **Method:** `POST`
* **Path:** `/api/payment-requests/:id/approve`
* **Request Body (JSON):**
  ```json
  {
    "comment": "Final approval granted. Ready for payout."
  }
  ```
* **Response (JSON):** `{ "success": true, "status": "APPROVED" }`

### 1.4 最終承認却下（Reject）処理
* **Method:** `POST`
* **Path:** `/api/payment-requests/:id/reject-approver`
* **Request Body (JSON):**
  ```json
  {
    "comment": "Breakdown description is too vague. Please re-enter with details."
  }
  ```
* **Response (JSON):** `{ "success": true, "status": "REJECTED_APPROVER" }`

---

## 2. データベース操作・クエリ定義 (Database Operations)

### 2.1 最終承認処理トランザクション
```sql
BEGIN;
UPDATE payment_requests
SET status_id = 8, -- APPROVED
    current_assigned_to_user_id = NULL, -- 経理全員が担当するため割り当てクリア
    approval_date = CURRENT_TIMESTAMP,
    modified_date = CURRENT_TIMESTAMP
WHERE payment_request_id = 101;

INSERT INTO approval_logs (
    payment_request_id, action_taken_by_user_id, action_type_id, previous_status_id, new_status_id, comment, ip_address, user_agent
) VALUES (
    101, 3, 8, 7, 8, 'Final approval granted. Ready for payout.', '192.168.1.102', 'Mozilla/5.0...'
);
COMMIT;
```

### 2.2 最終承認却下処理トランザクション
```sql
BEGIN;
UPDATE payment_requests
SET status_id = 9, -- REJECTED_APPROVER
    current_assigned_to_user_id = applicant_user_id,
    modified_date = CURRENT_TIMESTAMP
WHERE payment_request_id = 101;

INSERT INTO approval_logs (
    payment_request_id, action_taken_by_user_id, action_type_id, previous_status_id, new_status_id, comment, ip_address, user_agent
) VALUES (
    101, 3, 9, 7, 9, 'Breakdown description is too vague...', '192.168.1.102', 'Mozilla/5.0...'
);
COMMIT;
```
