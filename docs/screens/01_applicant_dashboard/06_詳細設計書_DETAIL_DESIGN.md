# 詳細設計書 (Detail Design Specification) - 申請者ダッシュボード

**対象画面:** 申請者ダッシュボード (Applicant Dashboard)  
**バージョン:** 1.0  
**作成日:** 2026-06-12  
**ステータス:** 承認済み  

---

## 1. APIエンドポイント定義 (API Endpoints)

### 1.1 申請一覧取得
* **Method:** `GET`
* **Path:** `/api/payment-requests/my-requests`
* **Query Parameters:**
  - `page`: ページ番号 (Default: 1)
  - `limit`: 1ページあたりの件数 (Default: 10)
  - `status`: ステータスコードでのフィルタリング (任意)
* **Response (JSON):**
  ```json
  {
    "data": [
      {
        "payment_request_id": 101,
        "request_number": "PRF-2026-0001",
        "application_date": "2026-06-12",
        "total_amount": "150000.00",
        "currency_code": "MMK",
        "status_code": "DRAFT",
        "status_name": "Draft"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10
  }
  ```

### 1.2 支払申請の新規保存（下書き）
* **Method:** `POST`
* **Path:** `/api/payment-requests`
* **Headers:** `Content-Type: application/json`, `Authorization: Bearer <JWT>`
* **Request Body (JSON):**
  ```json
  {
    "application_date": "2026-06-12",
    "desired_payment_date": "2026-06-20",
    "currency_id": 1,
    "payment_type_id": 1,
    "payment_method_id": 1,
    "purpose": "Office supply replenishment",
    "bank_account_info": "KBZ Bank - A/C 123456789",
    "request_content": "Detailed request content description...",
    "has_receipt": true,
    "manager_user_id": 2,
    "items": [
      {
        "line_number": 1,
        "item_date": "2026-06-11",
        "description": "A4 Paper 5 packs",
        "amount": 50000.00,
        "quantity": 5.00,
        "unit_price": 10000.00
      }
    ]
  }
  ```
* **Response (JSON):** `201 Created`

### 1.3 領収書ファイルのアップロード
* **Method:** `POST`
* **Path:** `/api/payment-requests/:id/receipts`
* **Headers:** `Content-Type: multipart/form-data`
* **Request Body:** `file` (Binary multipart)
* **Response (JSON):**
  ```json
  {
    "receipt_file_id": 15,
    "original_file_name": "receipt_paper.png",
    "stored_file_name": "OfficeSupplies_20260611_01.png",
    "file_storage_path": "/uploads/101/uuid-string_OfficeSupplies_20260611_01.png"
  }
  ```

---

## 2. データベース操作・クエリ定義 (Database Operations)

### 2.1 新規申請作成
```sql
BEGIN;
INSERT INTO payment_requests (
    request_number, applicant_user_id, manager_user_id, application_date, 
    desired_payment_date, total_amount, currency_id, payment_type_id, 
    payment_method_id, purpose, bank_account_info, request_content, 
    has_receipt, status_id
) VALUES (
    'PRF-2026-0001', 1, 2, '2026-06-12', 
    '2026-06-20', 150000.00, 1, 1, 
    1, 'Office supply replenishment', 'KBZ Bank - A/C 123456789', '...', 
    TRUE, 1
) RETURNING payment_request_id;

INSERT INTO payment_breakdown_items (
    payment_request_id, line_number, item_date, description, amount, quantity, unit_price
) VALUES (
    101, 1, '2026-06-11', 'A4 Paper 5 packs', 50000.00, 5.00, 10000.00
);

INSERT INTO approval_logs (
    payment_request_id, action_taken_by_user_id, action_type_id, previous_status_id, new_status_id, comment, ip_address, user_agent
) VALUES (
    101, 1, 1, NULL, 1, 'Draft created', '192.168.1.100', 'Mozilla/5.0...'
);
COMMIT;
```

---

## 3. シーケンス・処理フロー (Sequence Flow)

```
[Applicant UI] ──── (1. 提出ボタン押下) ───► [NestJS Controller]
                                                  │
                                          (2. 入力項目検証)
                                                  ├─(不整合)─► [400 Bad Request] 返却
                                                  └─(整合)
                                                      │
                                           [TypeORM RequestService]
                                                  │
                                          (3. トランザクション開始)
                                          (4. 領収書ファイル数確認)
                                          (5. ステータス更新: SUBMITTED_MANAGER)
                                          (6. 承認ログ書き込み)
                                          (7. トランザクションコミット)
                                                  │
                                           [WebSocket Gateway]
                                                  │
                                          (8. リアルタイム通知送信)
                                                  ▼
                                           [Manager UI] (通知表示)
```
