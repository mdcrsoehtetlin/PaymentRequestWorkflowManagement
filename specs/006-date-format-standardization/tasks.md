---

description: "Task list for Date Format Standardization feature"
---

# Tasks: Date Format Standardization

**Input**: Design documents from `specs/006-date-format-standardization/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `frontend/src/` for React SPA changes

---

## Phase 1: Update Utility Functions (Foundational)

**Purpose**: Update the centralized date formatting functions to use the new format

**⚠️ CRITICAL**: All downstream tasks depend on this phase — the utility must be updated first

- [x] T001 Update `formatDate()` in `frontend/src/utils/format.ts` — change `month: '2-digit'` to `month: 'numeric'`, `day: '2-digit'` to `day: 'numeric'` (eliminates zero-padding); keep `year: 'numeric'`; keep `ja-JP` locale (produces `/` separator)
- [x] T002 Update `formatDateTime()` in `frontend/src/utils/format.ts` — same date changes as T001 + add `second: '2-digit'` to include seconds; keep `hour: '2-digit'` and `minute: '2-digit'`

**Checkpoint**: Utility functions produce `YYYY/M/D` and `YYYY/M/D HH:mm:ss` formats

---

## Phase 2: User Story 1 — Consistent Date and DateTime Display (Priority: P1) 🎯 MVP

**Goal**: All date/datetime values across the application display in the standardized `YYYY/M/D` and `YYYY/M/D HH:mm:ss` formats

**Independent Test**: Navigate to Audit Logs, User Management, Master Data, and MetadataDetailPanel — verify all dates use the new format

### Implementation for User Story 1

- [x] T003 [P] [US1] Replace inline date formatting in `frontend/src/pages/admin/AuditLogWorkspace.tsx` — change `new Date(row.timestamp).toLocaleString('ja-JP')` to `formatDateTime(row.timestamp)` at line 193; add `formatDateTime` to imports from `../../utils/format`
- [x] T004 [P] [US1] Replace inline date formatting in `frontend/src/pages/admin/components/MetadataDetailPanel.tsx` — change `new Date(log.timestamp).toLocaleString('ja-JP')` to `formatDateTime(log.timestamp)` at line 75; add `formatDateTime` to imports from `../../../utils/format`
- [x] T005 [P] [US1] Replace inline date formatting in `frontend/src/pages/admin/MasterDataWorkspace.tsx` — replace the inline `getFullYear/getMonth/getDate` block (lines 63-72) with `formatDate(val as string)` for date-only columns or `formatDateTime(val as string)` for datetime columns; add `formatDate, formatDateTime` to imports from `../../utils/format`

**Checkpoint**: All date rendering across Audit Logs, User Management, Master Data, and MetadataDetailPanel uses the centralized utility

---

## Phase 3: Polish & Verification

**Purpose**: Final validation and cleanup

- [x] T006 Run `npm run build` in `frontend/` — verify 0 TypeScript errors
- [x] T007 Run `npm run lint` in `frontend/` — verify 0 errors
- [x] T008 Visual walkthrough per `specs/006-date-format-standardization/quickstart.md` — verify all 6 scenarios pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Utility Update)**: No dependencies — can start immediately
- **Phase 2 (US1 Implementation)**: Depends on Phase 1 — utility must be updated first
- **Phase 3 (Polish)**: Depends on Phase 2 — all implementations must be complete

### Within Each Phase

- Tasks marked [P] can run in parallel (different files)
- T003, T004, T005 are independent of each other (different files) — can be done in parallel after T001+T002

### Parallel Opportunities

| Tasks | Can run in parallel with |
|-------|-------------------------|
| T003, T004, T005 | Each other (different files, no dependencies) |

---

## Parallel Example: User Story 1

```bash
# After T001+T002 complete, launch all three file updates together:
Task: "Replace inline date formatting in AuditLogWorkspace.tsx"
Task: "Replace inline date formatting in MetadataDetailPanel.tsx"
Task: "Replace inline date formatting in MasterDataWorkspace.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Update utility functions
2. Complete Phase 2: Replace inline formatting in all components
3. Complete Phase 3: Build + lint + visual walkthrough
4. **STOP and VALIDATE**: All dates display in standardized format

### Incremental Delivery

1. Phase 1 → Utility functions produce correct format
2. Phase 2 → All components use utility → MVP complete
3. Phase 3 → Verified and polished

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- No new files created — only modifications to existing files
- No new dependencies added
- Backend remains unchanged (ISO 8601)
- Commit after each task or logical group: `feat: dates-standardize date format display`
