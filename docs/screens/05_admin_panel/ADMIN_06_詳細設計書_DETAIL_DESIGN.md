# 詳細設計書 (Detail Design Specification) - システム管理者パネル

**対象画面:** システム管理者パネル (Admin Panel)  
**バージョン:** 1.1  
**作成日:** 2026-06-12  
**ステータス:** 承認済み  

---

## 1. APIエンドポイント定義 (API Endpoints)

### 1.1 ユーザー新規登録
* **Method:** `POST`
* **Path:** `/api/admin/users`
* **Request Body (JSON):**
  ```json
  {
    "email": "developer@company.com",
    "password": "TemporaryPassword123!",
    "full_name": "Taro Yamada",
    "employee_number": "EMP00001",
    "department": "IT Development",
    "branch": "Yangon",
    "role_id": 1
  }
  ```
* **Response (JSON):** `{ "success": true, "user_id": 12 }`

### 1.2 ユーザー有効/無効化切り替え
* **Method:** `PATCH`
* **Path:** `/api/admin/users/:id/toggle-active`
* **Request Body (JSON):**
  ```json
  {
    "is_active": false
  }
  ```
* **Response (JSON):** `{ "success": true, "is_active": false }`

### 1.3 監査ログ（履歴ログ）の全件検索取得
* **Method:** `GET`
* **Path:** `/api/admin/audit-logs`
* **Query Parameters:**
  - `startDate`: 開始日 (YYYY-MM-DD)
  - `endDate`: 終了日 (YYYY-MM-DD)
  - `userId`: 特定アクターでの絞り込み (任意)
* **Response (JSON):** 該当する期間中の `approval_logs` と実行ユーザー名の配列リスト。

---

## 2. データベース操作・クエリ定義 (Database Operations)

### 2.1 ユーザー作成とパスワード暗号化保存
```sql
-- パスワードハッシュはNestJSサービス側でbcryptによって生成される
INSERT INTO users (
    email, password_hash, full_name, employee_number, department, branch, role_id, is_active
) VALUES (
    'developer@company.com', '$2b$10$abcdefghijklmnopqrstuv...', 'Taro Yamada', 'EMP00001', 'IT Development', 'Yangon', 1, TRUE
);
```

### 2.2 監査ログ検索取得クエリ
```sql
SELECT 
    l.approval_log_id,
    r.request_number,
    u.full_name AS actor_name,
    a.action_type,
    l.previous_status_id,
    l.new_status_id,
    l.comment,
    l.ip_address,
    l.user_agent,
    l.timestamp
FROM approval_logs l
JOIN payment_requests r ON l.payment_request_id = r.payment_request_id
JOIN users u ON l.action_taken_by_user_id = u.user_id
JOIN approval_action_types a ON l.action_type_id = a.action_type_id
WHERE l.timestamp BETWEEN '2026-06-01T00:00:00Z' AND '2026-06-30T23:59:59Z'
ORDER BY l.timestamp DESC;
```
