# Implementation Plan: Date Format Standardization

**Feature**: Date Format Standardization
**Spec**: [specs/006-date-format-standardization/spec.md](./spec.md)
**Constitution**: v2.2.0
**Created**: 2026-06-23

## Technical Context

| Item | Value |
|------|-------|
| Scope | Frontend only (`frontend/src/`) |
| Layer | Presentation (Constitution §6) |
| Existing utility | `frontend/src/utils/format.ts` — already has `formatDate()` and `formatDateTime()` using `ja-JP` locale with zero-padded months/days |
| Target format | `YYYY/M/D` (date) and `YYYY/M/D HH:mm:ss` (datetime) — no zero-padding |
| Backend impact | None — API responses remain ISO 8601 |
| Database impact | None |
| New dependencies | None |

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| §1.1 Naming Conventions | ✅ PASS | Utility file `kebab-case` (`format.ts`); functions `camelCase` |
| §1.2 Type Safety | ✅ PASS | Explicit return types; no `any` |
| §1.4 Pre-commit Checks | ✅ PASS | lint + build required |
| §1.5 Import Ordering | ✅ PASS | Existing imports in consuming files already follow standard |
| §2.4 Shared Layer Access | ✅ PASS | `format.ts` already exists in shared utils; modification allowed |
| §5 UI/UX Design System | ✅ PASS | Date format is a visual standard |
| §6 Architecture | ✅ PASS | Presentation layer only |
| §8 Git Standards | ✅ PASS | Branch naming and commit prefix defined |

**Gate Result**: ✅ All gates pass — proceed to implementation.

## Implementation Tasks

### Phase 1: Update Utility Functions

**File**: `frontend/src/utils/format.ts`

| Task | Change |
|------|--------|
| T001 | Update `formatDate()` — remove `month: '2-digit'`, `day: '2-digit'` (eliminates zero-padding); keep `year: 'numeric'`; use `'/'` separator |
| T002 | Update `formatDateTime()` — same date changes + add `second: '2-digit'`; keep hours and minutes |

### Phase 2: Replace Inline Date Formatting

| Task | File | Line | Current Code | New Code |
|------|------|------|-------------|----------|
| T003 | `AuditLogWorkspace.tsx` | 193 | `new Date(row.timestamp).toLocaleString('ja-JP')` | `formatDateTime(row.timestamp)` |
| T004 | `MetadataDetailPanel.tsx` | 75 | `new Date(log.timestamp).toLocaleString('ja-JP')` | `formatDateTime(log.timestamp)` |
| T005 | `MasterDataWorkspace.tsx` | 63-72 | Inline `getFullYear/getMonth/getDate` formatting | `formatDate(val as string)` or `formatDateTime(val as string)` |

### Phase 3: Verification

| Task | Command |
|------|---------|
| T006 | `npm run build` (frontend) — 0 TypeScript errors |
| T007 | `npm run lint` (frontend) — 0 errors |
| T008 | Visual walkthrough: Audit Logs, User Management, Master Data, MetadataDetailPanel |

## File Change Summary

| File | Action |
|------|--------|
| `frontend/src/utils/format.ts` | Modify — update `formatDate()` and `formatDateTime()` |
| `frontend/src/pages/admin/AuditLogWorkspace.tsx` | Modify — replace inline formatting with `formatDateTime()` |
| `frontend/src/pages/admin/components/MetadataDetailPanel.tsx` | Modify — replace inline formatting with `formatDateTime()` |
| `frontend/src/pages/admin/MasterDataWorkspace.tsx` | Modify — replace inline formatting with `formatDate()`/`formatDateTime()` |

## Estimated Impact

- **Files modified**: 4
- **Lines changed**: ~20
- **New code**: 0 (updating existing functions only)
- **Risk**: Low — isolated to display formatting, no business logic changes
