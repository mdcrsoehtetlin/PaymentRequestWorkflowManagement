# 詳細設計書 (Detail Design Specification) - 経理ダッシュボード

**対象画面:** 経理ダッシュボード (Accounting Dashboard)  
**バージョン:** 1.0  
**作成日:** 2026-06-12  
**ステータス:** 承認済み  

---

## 1. APIエンドポイント定義 (API Endpoints)

### 1.1 承認済み支払待ち一覧取得
* **Method:** `GET`
* **Path:** `/api/payment-requests/pending-payment`
* **Headers:** `Authorization: Bearer <JWT>`
* **Response (JSON):**
  ```json
  {
    "data": [
      {
        "payment_request_id": 101,
        "request_number": "PRF-2026-0001",
        "applicant_name": "John Doe",
        "applicant_branch": "Mandalay",
        "application_date": "2026-06-12",
        "total_amount": "150000.00",
        "payment_method": "Cash",
        "status_code": "APPROVED"
      }
    ]
  }
  ```

### 1.2 支払完了（Paid）処理
* **Method:** `POST`
* **Path:** `/api/payment-requests/:id/complete-payment`
* **Request Body (JSON):**
  ```json
  {
    "comment": "Cash payment handed over via Toe San."
  }
  ```
* **Response (JSON):** `{ "success": true, "status": "PAID" }`

---

## 2. データベース操作・クエリ定義 (Database Operations)

### 2.1 支払完了処理トランザクション
```sql
BEGIN;
UPDATE payment_requests
SET status_id = 10, -- PAID
    accounting_user_id = 4, -- 処理を実行した経理ユーザーID
    payment_completed_date = CURRENT_TIMESTAMP,
    modified_date = CURRENT_TIMESTAMP
WHERE payment_request_id = 101 
  AND status_id = 8; -- APPROVED

INSERT INTO approval_logs (
    payment_request_id, action_taken_by_user_id, action_type_id, previous_status_id, new_status_id, comment, ip_address, user_agent
) VALUES (
    101, 4, 10, 8, 10, 'Cash payment handed over via Toe San.', '192.168.1.103', 'Mozilla/5.0...'
);
COMMIT;
```

---

## 3. フロントエンド表示ロジック（擬似コード）

```typescript
// 支店別警告バナーの動的制御
interface PaymentRequest {
  applicant_branch: string;
  payment_method: string;
}

function renderPaymentAlert(request: PaymentRequest): HTMLElement {
  const banner = document.createElement('div');
  banner.className = 'payment-alert-banner';

  if (request.applicant_branch === 'Mandalay') {
    banner.classList.add('banner-warning');
    banner.innerText = '【重要】Mandalay支店：現金支払のため、Toe San氏と調整してください';
  } else {
    banner.classList.add('banner-info');
    banner.innerText = '標準銀行振込処理';
  }

  return banner;
}
```
