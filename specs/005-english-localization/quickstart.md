# Quickstart: English Localization Implementation

**Date**: 2026-06-22 | **Files affected**: ~29 source files (~209 string replacements)

## Prerequisites

- [ ] Backend passes: `npm run lint` (0 errors), `npm run build` (0 errors), `npm run test` (all pass)
- [ ] Frontend passes: `npm run build` (0 errors)
- [ ] Git branch: `feature/005-english-localization` (create if not exists)

## Implementation Order

### Phase A: Backend (7 files, independent)

| File | Changes |
|------|---------|
| `src/modules/admin/admin.service.ts` | 9 error messages |
| `src/modules/applicant/applicant.service.ts` | 1 error message |
| `src/modules/auth/strategies/local.strategy.ts` | 1 error message |
| `src/modules/auth/dto/login.dto.ts` | 4 validation messages |
| `src/modules/shared/guards/roles.guard.ts` | 1 message |
| `src/modules/shared/guards/ownership.guard.ts` | 2 messages |
| `src/modules/shared/exceptions/ownership.exception.ts` | 1 message |
| `src/modules/shared/pipes/parse-int-optional.pipe.ts` | 1 message |
| `src/modules/shared/filters/http-exception.filter.ts` | 1 message |
| `src/modules/shared/dto/breakdown-item.dto.ts` | 2 messages |
| `src/modules/shared/validators/file-validators.ts` | 3 messages |
| `src/modules/shared/validators/is-today-or-before.validator.ts` | 1 message |
| `src/modules/shared/validators/is-today-or-after.validator.ts` | 1 message |

**Verify**: `npm run lint && npm run build && npm run test` → all pass (0 errors)

### Phase B: Shared Constants (2 files, parallel)

| File | Changes |
|------|---------|
| `frontend/src/types/index.ts` | Rename `*_LABELS_JP`→`*_LABELS_EN`, translate ~44 values |
| `src/modules/shared/types/index.ts` | Same rename + translate |

### Phase C: Frontend Shared Components (7 files)

| File | Key changes |
|------|-------------|
| `StatusBadge.tsx` | Update import + `不明`→`Unknown` |
| `ApprovalTimeline.tsx` | Update import + empty state + fallback |
| `DataTable.tsx` | Pagination labels + empty message |
| `ConfirmDialog.tsx` | Button defaults |
| `ErrorBoundary.tsx` | All error UI text |
| `FileUploadDropzone.tsx` | Validation messages + help text |
| `LanguageSwitcher.tsx` | Keep `日本語` — native language name |

### Phase D: Admin Pages (6 files)

| File | Key areas |
|------|-----------|
| `AuditLogWorkspace.tsx` | Filters, headers, action types, titles, validation |
| `UserManagementWorkspace.tsx` | Columns, dropdowns, filters, titles |
| `MasterDataWorkspace.tsx` | Tabs, title |
| `AdminDashboardShell.tsx` | Nav labels, logout |
| `UserFormModal.tsx` | Form labels, buttons, titles |
| `MetadataDetailPanel.tsx` | Field labels, action labels |

**Verify**: `npm run build` → 0 errors

### Phase E: Other Frontend (2 files)

| File | Changes |
|------|---------|
| `frontend/src/pages/applicant/utils/validation.ts` | 12 validation messages |
| `frontend/src/services/api-client.ts` | 5 toast messages |

## Final Verification

```bash
cd src && npm run lint    # 0 errors, 0 warnings
cd src && npm run build   # 0 errors
cd src && npm run test    # all passing
cd frontend && npm run build # 0 errors
```

## English Label Reference

| Constant | Example Values |
|----------|---------------|
| STATUS_LABELS_EN | Draft, Submitted to Manager, Manager Reviewing, Manager Verified, Rejected by Manager, Submitted to Approver, Approver Reviewing, Approved, Rejected by Approver, Paid |
| ACTION_LABELS_EN | Created, Edited, Submitted, Manager Review Started, Manager Verified, Rejected by Manager, Approver Review Started, Approved, Rejected by Approver, Payment Completed |
| ROLE_LABELS_EN | Applicant, Manager, Approver, Accounting, Admin |
| PAYMENT_TYPE_LABELS_EN | Expense Reimbursement, Service Payment, Advance Payment, Other |
| PAYMENT_METHOD_LABELS_EN | Bank Transfer, Cash, Check |
