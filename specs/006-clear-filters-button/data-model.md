# Data Model: Clear Filters Button for Admin Search Panels

**Date**: 2026-06-26
**Feature**: 006-clear-filters-button

## Overview

This feature is a frontend-only UI refactoring. No database schema changes or new API endpoints are required. The data model below describes the filter state structures and their mapping to the shared SearchFilterBar component.

## Filter State Shapes

### UserManagementWorkspace Filters

| Field Key | Type | Default | Options | Label |
|-----------|------|---------|---------|-------|
| `keyword` | `string` | `''` | — | キーワード |
| `roleId` | `string` | `''` | `''` (すべて), `'1'` (申請者), `'2'` (マネージャー), `'3'` (承認者), `'4'` (経理), `'5'` (管理者) | 役割 |
| `isActive` | `string` | `''` | `''` (すべて), `'true'` (有効), `'false'` (無効) | ステータス |

### AuditLogWorkspace Filters

| Field Key | Type | Default | Options | Label |
|-----------|------|---------|---------|-------|
| `requestNumber` | `string` | `''` | — | リクエスト番号 |
| `actorName` | `string` | `''` | — | 実行者名 |
| `actionTypeId` | `string` | `''` | `''` (すべて), `'1'` (作成), `'2'` (編集), `'3'` (提出), `'4'` (マネージャー確認開始), `'5'` (マネージャー確認), `'6'` (マネージャー差戻し), `'7'` (承認者確認開始), `'8'` (承認), `'9'` (承認者差戻し), `'10'` (支払完了) | アクション種別 |
| `startDate` | `string` | `''` | — | 開始日 |
| `endDate` | `string` | `''` | — | 終了日 |

## SearchFilterBar Integration

### FilterField Mapping

Both screens define a `FilterField[]` array passed to SearchFilterBar:

```typescript
// UserManagementWorkspace
const filterFields: FilterField[] = [
  { key: 'keyword', label: 'キーワード', type: 'text', placeholder: '社員番号または氏名で検索' },
  { key: 'roleId', label: '役割', type: 'select', options: ROLE_OPTIONS },
  { key: 'isActive', label: 'ステータス', type: 'select', options: STATUS_OPTIONS },
];

// AuditLogWorkspace
const filterFields: FilterField[] = [
  { key: 'requestNumber', label: 'リクエスト番号', type: 'text', placeholder: 'PRF-...' },
  { key: 'actorName', label: '実行者名', type: 'text', placeholder: '実行者名で検索' },
  { key: 'actionTypeId', label: 'アクション種別', type: 'select', options: ACTION_OPTIONS },
  { key: 'startDate', label: '開始日', type: 'date' },
  { key: 'endDate', label: '終了日', type: 'date' },
];
```

### Data Flow

```
User types in SearchFilterBar → localValues (internal state)
User clicks Search → onApply(localValues) → parent sets filters state → API fetch
User clicks Clear → onClear() → parent resets filters state → API fetch (all records)
```

### State Transitions

| Action | Filters State | API Call | Page Reset |
|--------|--------------|----------|------------|
| User types in field | Unchanged (localValues updated internally) | None | No |
| Click Search | Updated to match localValues | Yes (with filter params) | Yes → page 1 |
| Click Clear | All values reset to `''` | Yes (no filter params) | Yes → page 1 |
| Page load | All values `''` | Yes (no filter params) | — |

## Audit Log Special Handling

### PRF- Prefix

The current inline panel renders a visual `PRF-` prefix before the request number input. SearchFilterBar does not support a `prefix` prop. The migration uses a placeholder hint (`PRF-...`) instead. The API call strips any leading "PRF-" if the user types it.

### Date Validation

Cross-field validation (`startDate > endDate`) is managed by the parent component, not SearchFilterBar. The validation error state (`dateError`) is cleared in the `onClear` handler alongside filter values.
