# Research: English Localization — Japanese String Inventory

**Date**: 2026-06-22 | **Feature**: `005-english-localization`

## Scope

29 files, ~209 user-facing Japanese strings identified across the entire application.

## Detailed Inventory

### Frontend Shared Components (7 files, 19 strings)

| File | Strings | Notes |
|------|---------|-------|
| `ConfirmDialog.tsx` | `確認`, `キャンセル` | Default button props |
| `DataTable.tsx` | `データがありません`, `件`, `表示中`, `全`, `前へ`, `次へ` | Pagination + empty state |
| `ErrorBoundary.tsx` | `エラーが発生しました`, `予期せぬエラー...`, `再読み込み` | Error fallback UI |
| `FileUploadDropzone.tsx` | `許可されていないファイル形式`, `上限(10MB)`, upload instructions, `削除` | Validation + UI text |
| `StatusBadge.tsx` | `不明` | Fallback label |
| `ApprovalTimeline.tsx` | `承認履歴はありません`, `不明` | Empty state + fallback |
| `LanguageSwitcher.tsx` | `日本語` | Native language name — keep as-is |

### Frontend Admin Pages (6 files, ~115 strings)

| File | Key areas |
|------|-----------|
| `AdminDashboardShell.tsx` | Sidebar nav labels, logout button |
| `AuditLogWorkspace.tsx` | Page title, filters, table headers, action type options, date validation, indicators |
| `UserManagementWorkspace.tsx` | Page title, table columns, dropdown options, filter labels, empty state |
| `MasterDataWorkspace.tsx` | Tab labels, page title, subtitle, empty state |
| `UserFormModal.tsx` | Role options, modal titles, form labels, button text, password messages |
| `MetadataDetailPanel.tsx` | Panel labels, action labels, field labels |

### Frontend Other (3 files, ~45 strings)

| File | Strings | Notes |
|------|---------|-------|
| `frontend/src/types/index.ts` | `STATUS_LABELS_JP`, `ACTION_LABELS_JP`, `PAYMENT_TYPE_LABELS_JP`, `PAYMENT_METHOD_LABELS_JP`, `ROLE_LABELS_JP` | ~44 values — rename to `_EN` |
| `frontend/src/pages/applicant/utils/validation.ts` | 12 validation error messages | Applicant form validation |
| `frontend/src/services/api-client.ts` | 5 toast error messages | API error interceptor |

### Backend Services (2 files, 10 strings)

| File | Strings |
|------|---------|
| `src/modules/admin/admin.service.ts` | 9 messages (duplicate email, duplicate emp#, user not found, optimistic lock, self-disable) |
| `src/modules/applicant/applicant.service.ts` | 1 message (optimistic lock) |

### Backend Guards/Pipes/Filters/Exceptions (5 files, 6 strings)

| File | Strings |
|------|---------|
| `src/modules/shared/guards/roles.guard.ts` | Forbidden message |
| `src/modules/shared/guards/ownership.guard.ts` | Not found + Forbidden |
| `src/modules/shared/exceptions/ownership.exception.ts` | Forbidden message |
| `src/modules/shared/pipes/parse-int-optional.pipe.ts` | Invalid integer |
| `src/modules/shared/filters/http-exception.filter.ts` | Generic 500 error |

### Backend DTOs & Validators (6 files, 14 strings)

| File | Strings |
|------|---------|
| `src/modules/auth/dto/login.dto.ts` | 4 validation messages |
| `src/modules/auth/strategies/local.strategy.ts` | Invalid credentials |
| `src/modules/shared/dto/breakdown-item.dto.ts` | 2 validation messages |
| `src/modules/shared/validators/file-validators.ts` | 3 validation messages |
| `src/modules/shared/validators/is-today-or-before.validator.ts` | 1 validation message |
| `src/modules/shared/validators/is-today-or-after.validator.ts` | 1 validation message |
| `src/modules/shared/types/index.ts` | Same 5 label maps as frontend |

## Decision

| Decision | Rationale |
|----------|-----------|
| Inline replacement: no i18n framework or toggle | User confirmed in previous clarify session |
| Full-stack change (backend + frontend) | User confirmed backend errors must also be English |
| YYYY-MM-DD date format unchanged | User confirmed — keep ISO 8601, just remove Japanese characters |
| `日本語` in LanguageSwitcher kept as-is | Native language name is not user-facing UI text |
| Shared layer files need Project Leader approval | Constitution §II requires PL approval for shared layer modifications |

## Alternatives Considered

| Alternative | Rejected Because |
|-------------|-----------------|
| i18n/locale file approach | Over-engineered for a single-language replacement; existing i18next infrastructure may have incomplete locale files |
| Frontend-only change | Contradicts user requirement — backend error messages must also be in English |
| Backend intercept + translate | Adds unnecessary complexity; direct replacement is simpler and more maintainable |
