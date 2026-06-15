# 詳細設計書 (Detail Design Specification) - 担当マネージャーダッシュボード

**対象画面:** 担当マネージャーダッシュボード (Manager Dashboard)  
**バージョン:** 1.0  
**作成日:** 2026-06-12  
**ステータス:** 承認済み  

---

## 1. APIエンドポイント定義 (API Endpoints)

### 1.1 担当確認待ち一覧取得
* **Method:** `GET`
* **Path:** `/api/payment-requests/pending-manager`
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
        "status_code": "SUBMITTED_MANAGER"
      }
    ]
  }
  ```

### 1.2 申請詳細の取得（アクセス時ステータス自動更新含む）
* **Method:** `GET`
* **Path:** `/api/payment-requests/:id`
* **Processing:**
  - ログインユーザーが対象申請の `manager_user_id` と一致し、かつ現在のステータスが `SUBMITTED_MANAGER` である場合、トランザクション内でステータスを `MANAGER_REVIEWING` に自動更新し、承認ログを書き込む。
* **Response (JSON):** 申請詳細および内訳明細、添付ファイル、承認履歴の一覧。

### 1.3 確認完了（Verify）処理
* **Method:** `POST`
* **Path:** `/api/payment-requests/:id/verify`
* **Request Body (JSON):**
  ```json
  {
    "comment": "Verified all breakdown items and receipt images."
  }
  ```
* **Response (JSON):** `{ "success": true, "status": "MANAGER_VERIFIED" }`

### 1.4 却下（Reject）処理
* **Method:** `POST`
* **Path:** `/api/payment-requests/:id/reject-manager`
* **Request Body (JSON):**
  ```json
  {
    "comment": "Receipt file does not match the total amount. Please fix it."
  }
  ```
* **Response (JSON):** `{ "success": true, "status": "REJECTED_MANAGER" }`

---

## 2. データベース操作・クエリ定義 (Database Operations)

### 2.1 閲覧時のステータス自動変更クエリ
```sql
UPDATE payment_requests
SET status_id = 3, -- MANAGER_REVIEWING
    modified_date = CURRENT_TIMESTAMP
WHERE payment_request_id = 101 
  AND status_id = 2; -- SUBMITTED_MANAGER

INSERT INTO approval_logs (
    payment_request_id, action_taken_by_user_id, action_type_id, previous_status_id, new_status_id, comment, ip_address, user_agent
) VALUES (
    101, 2, 4, 2, 3, 'Manager opened request and started reviewing', '192.168.1.101', 'Mozilla/5.0...'
);
```

### 2.2 却下処理トランザクション
```sql
BEGIN;
UPDATE payment_requests
SET status_id = 5, -- REJECTED_MANAGER
    current_assigned_to_user_id = applicant_user_id,
    modified_date = CURRENT_TIMESTAMP
WHERE payment_request_id = 101;

INSERT INTO approval_logs (
    payment_request_id, action_taken_by_user_id, action_type_id, previous_status_id, new_status_id, comment, ip_address, user_agent
) VALUES (
    101, 2, 6, 3, 5, 'Receipt file does not match...', '192.168.1.101', 'Mozilla/5.0...'
);
COMMIT;
```
