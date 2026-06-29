# Data Model: Admin Screen i18n Integration

**Date**: 2026-06-26
**Feature**: 010-admin-i18n-integration

## Overview

This feature does not introduce new data entities or modify the database schema. It changes the **presentation layer** of existing admin screens to use translation functions instead of hardcoded strings.

## Translation Key Structure

The locale files (`en.json`, `ja.json`, `my.json`) contain 609 keys each, organized as:

```
{
  "admin": {
    "sidebar": { ... },           # Admin sidebar menu labels
    "user_management": { ... },   # User Management screen
    "master_data": { ... },       # Master Data screen
    "audit_log": { ... },         # Audit Log screen
    "metadata_detail": { ... },   # Log detail panel
    "user_form": { ... }          # User form modal
  },
  "common": { ... }               # Shared labels (roles, statuses, actions, etc.)
}
```

## Files Requiring Modification

| File | Current State | Strings to Replace |
|------|--------------|-------------------|
| `UserManagementWorkspace.tsx` | 0 i18n, ~35 hardcoded | Filter labels, column headers, role/status labels, buttons, empty state |
| `MasterDataWorkspace.tsx` | 0 i18n, ~8 hardcoded | Category tabs, page title/description, empty state |
| `AuditLogWorkspace.tsx` | 0 i18n, ~30 hardcoded | Action labels, filter labels, column headers, buttons, validation error |
| `MetadataDetailPanel.tsx` | 0 i18n, ~15 hardcoded | Action labels (duplicate), panel title, field labels |
| `UserFormModal.tsx` | 0 i18n, ~30 hardcoded | Role options, form labels, modal titles, button labels, messages |
| `Sidebar.tsx` | Partial i18n (2 keys), ~8 hardcoded | Admin menu labels in `roleMenuConfig` |
| `AdminDashboardShell.tsx` | 0 i18n, 0 strings | No changes needed (layout shell only) |

## Translation Key Mapping

### User Management Screen (`admin.user_management.*`)

| Hardcoded String | Translation Key |
|-----------------|----------------|
| `ユーザーアカウント管理` | `admin.user_management.title` |
| `アプリケーションユーザーの管理...` | `admin.user_management.description` |
| `新規ユーザー登録` | `admin.user_management.create_button` |
| `社員番号` | `admin.user_management.columns.employee_number` |
| `氏名` | `admin.user_management.columns.full_name` |
| `メールアドレス` | `admin.user_management.columns.email` |
| `拠点` | `admin.user_management.columns.branch` |
| `役割` | `admin.user_management.columns.role` |
| `ステータス` | `admin.user_management.columns.status` |
| `操作` | `admin.user_management.columns.actions` |
| `申請者` | `admin.user_management.role.applicant` |
| `マネージャー` | `admin.user_management.role.manager` |
| `承認者` | `admin.user_management.role.approver` |
| `経理` | `admin.user_management.role.accounting` |
| `管理者` | `admin.user_management.role.admin` |
| `不明` | `admin.user_management.role.unknown` |
| `有効` | `admin.user_management.status.active` |
| `無効` | `admin.user_management.status.inactive` |
| `編集` | `admin.user_management.actions.edit` |
| `パスワードリセット` | `admin.user_management.actions.password_reset` |
| `ユーザーが見つかりません` | `admin.user_management.empty_message` |
| `登録ユーザー数` | `admin.user_management.registered_count` |

### Master Data Screen (`admin.master_data.*`)

| Hardcoded String | Translation Key |
|-----------------|----------------|
| `マスターデータ設定` | `admin.master_data.title` |
| `システムのルックアップテーブル...` | `admin.master_data.description` |
| `通貨` | `admin.master_data.categories.currencies` |
| `役割` | `admin.master_data.categories.roles` |
| `ステータス` | `admin.master_data.categories.statuses` |
| `支払タイプ` | `admin.master_data.categories.payment_types` |
| `支払方法` | `admin.master_data.categories.payment_methods` |
| `データがありません` | `admin.master_data.empty_message` |

### Audit Log Screen (`admin.audit_log.*`)

| Hardcoded String | Translation Key |
|-----------------|----------------|
| `監査ログ` | `admin.audit_log.title` |
| `グローバルトランザクション履歴...` | `admin.audit_log.description` |
| `リクエスト番号` | `admin.audit_log.filters.request_number` |
| `番号を入力` | `admin.audit_log.filters.request_number_placeholder` |
| `実行者名` | `admin.audit_log.filters.actor_name` |
| `名前で検索` | `admin.audit_log.filters.actor_name_placeholder` |
| `アクション種別` | `admin.audit_log.filters.action_type` |
| `開始日` | `admin.audit_log.filters.start_date` |
| `終了日` | `admin.audit_log.filters.end_date` |
| `開始日は終了日より後に設定できません` | `admin.audit_log.filters.date_error` |
| `該当するログが見つかりません` | `admin.audit_log.empty_message` |
| `Search` | `common.search` |
| `Clear Filters` | `common.clear_filters` |

### Sidebar Admin Labels (`admin.sidebar.*`)

| Hardcoded String | Translation Key |
|-----------------|----------------|
| `ユーザー管理` | `admin.sidebar.user_management` |
| `マスターデータ` | `admin.sidebar.master_data` |
| `監査ログ` | `admin.sidebar.audit_logs` |
