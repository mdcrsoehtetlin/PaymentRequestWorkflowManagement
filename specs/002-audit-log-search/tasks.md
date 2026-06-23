# Tasks: Audit Log Search Enhancement

**Input**: Design documents from `specs/002-audit-log-search/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/audit-log-api.md

**Tests**: Not requested in spec — test tasks excluded per template rules.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: No new project initialization needed — this feature extends existing code.

No setup tasks required. The project is already initialized with NestJS backend and React frontend.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend changes that all frontend user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T001 Create audit log query DTO at `src/modules/admin/dto/audit-log-query.dto.ts` with optional fields: actionTypeId (number), requestId (number), actorName (string, max 200), startDate (string, date), endDate (string, date), page (number, default 1), pageSize (number, default 50). Use `class-validator` decorators: `@IsOptional()`, `@IsInt()`, `@MaxLength(200)`, `@IsDateString()`, `@Min(1)`
- [x] T002 Update audit log endpoint in `src/modules/admin/admin.controller.ts` — replace `userId` query param with `actionTypeId`, `requestId`, `actorName`, and add Pipe-based validation using the new DTO
- [x] T003 Update audit log service in `src/modules/admin/admin.service.ts` — replace `userId` filter with `ILike` partial match on `user.fullName`, add `actionTypeId` equality filter, add `requestId` equality filter on `paymentRequestId`

**Checkpoint**: Backend supports new search filters — ready for frontend user stories

---

## Phase 3: User Story 1 - Filter by Action Type (Priority: P1) 🎯 MVP

**Goal**: Add action type dropdown filter to the audit log workspace with all 10 types shown in Japanese labels

**Independent Test**: Select an action type from the dropdown and verify only matching logs appear in the grid

### Implementation for User Story 1

- [x] T004 [P] [US1] Add action type dropdown filter UI in `frontend/src/pages/admin/AuditLogWorkspace.tsx` alongside existing date filters. Include all 10 action types with Japanese labels (作成, 編集, 提出, マネージャー確認開始, マネージャー確認, マネージャー差戻し, 承認者確認開始, 承認, 承認者差戻し, 支払完了) and an empty "すべて" default option
- [x] T005 [US1] Wire action type filter to API call in `frontend/src/pages/admin/AuditLogWorkspace.tsx` — pass `actionTypeId` to backend, reset page to 1 on change, add to `useEffect` dependency

**Checkpoint**: Action type filter functional — MVP deliverable

---

## Phase 4: User Story 2 - Search by Request ID (Priority: P1)

**Goal**: Add request ID text input to filter audit logs by payment request

**Independent Test**: Enter a valid request ID and verify only matching logs appear

### Implementation for User Story 2

- [x] T006 [P] [US2] Add request ID text input filter UI in `frontend/src/pages/admin/AuditLogWorkspace.tsx` — numeric HTML input, placeholder "リクエストID"
- [x] T007 [US2] Wire request ID filter to API call in `frontend/src/pages/admin/AuditLogWorkspace.tsx` — pass `requestId` to backend when non-empty, ignore zero/negative, reset page to 1

**Checkpoint**: Request ID filter functional

---

## Phase 5: User Story 3 - Search by Actor Name (Priority: P2)

**Goal**: Replace the existing numeric userId filter with actor name text search (partial, case-insensitive)

**Independent Test**: Type a partial actor name and verify matching results appear; confirm the old userId input is gone

### Implementation for User Story 3

- [x] T008 [P] [US3] Replace userId input with actor name text input in `frontend/src/pages/admin/AuditLogWorkspace.tsx` — remove the `userId` filter state, input field, and API param; add `actorName` filter state and text input field labeled "実行者名"
- [x] T009 [US3] Wire actor name filter to API call in `frontend/src/pages/admin/AuditLogWorkspace.tsx` — pass `actorName` to backend via query param

**Checkpoint**: Actor name search functional, userId filter fully removed

---

## Phase 6: User Story 4 - Auto-Debounced Search (Priority: P2)

**Goal**: Replace manual search with 300ms debounced auto-search on any filter change

**Independent Test**: Change a filter and verify the grid auto-refreshes after ~300ms without clicking a button; rapid changes coalesce into one request

### Implementation for User Story 4

- [x] T010 [P] [US4] Create a `useDebounce` hook at `frontend/src/hooks/useDebounce.ts` implementing 300ms debounce pattern with `setTimeout`/`clearTimeout`
- [x] T011 [US4] Apply debounce to audit log search in `frontend/src/pages/admin/AuditLogWorkspace.tsx` — wrap `fetchLogs` call with 300ms debounce, remove any remaining search button markup
- [x] T012 [US4] Add inline date validation in `frontend/src/pages/admin/AuditLogWorkspace.tsx` — if `startDate > endDate`, display error message "開始日は終了日より後に設定できません" below date fields and skip the API call

**Checkpoint**: All user stories complete — search is fully debounced with no search button

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T013 [P] Clean up unused imports in `frontend/src/pages/admin/AuditLogWorkspace.tsx` (remove any unused lucide-react icons, old filter-related code)
- [x] T014 [P] Update action type Japanese label constants in `frontend/src/pages/admin/AuditLogWorkspace.tsx` — ensure the ACTION_LABELS map (used in grid render) matches the dropdown labels for consistency
- [x] T015 Verify empty state message "該当するログが見つかりません" displays correctly when no results match combined filters
- [x] T016 Run `npm run build` (backend) and verify zero TypeScript errors
- [x] T017 Run `npm run build` (frontend/vite project) and verify zero TypeScript errors
- [x] T018 Run quickstart.md validation scenarios end-to-end

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — skipped (existing project)
- **Foundational (Phase 2)**: No dependencies — MUST complete before all user stories
- **User Stories (Phase 3-6)**: All depend on Phase 2 completion
  - US1 (T004, T005), US2 (T006, T007), US3 (T008, T009) are independent of each other
  - US4 (T010-T012) depends on US1-US3 being wired
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (Action Type Filter - P1)**: Can start after T003 — No dependencies on other stories
- **US2 (Request ID - P1)**: Can start after T003 — No dependencies on other stories
- **US3 (Actor Name - P2)**: Can start after T003 — No dependencies on other stories
- **US4 (Debounce - P2)**: Depends on US1, US2, US3 being wired to the API

### Parallel Opportunities

- T001, T002, T003 must be sequential (backend change)
- T004, T006, T008 (filter UI additions) can run in parallel
- T005, T007, T009 (API wiring) can run in parallel
- T010, T012 (debounce hook, date validation) can run in parallel
- T013-T017 (polish) can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch filter UI and API wiring for US1:
Task: "Add action type dropdown to AuditLogWorkspace.tsx"
Task: "Wire actionTypeId to API call in AuditLogWorkspace.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (T001-T003)
2. Complete Phase 3: User Story 1 (T004, T005)
3. **STOP and VALIDATE**: Test action type filter independently
4. Deploy/demo if ready

### Incremental Delivery

1. Complete Foundational → Backend supports all new params
2. Add US1 (Action Type filter) → Test → Deploy
3. Add US2 (Request ID) → Test → Deploy
4. Add US3 (Actor Name) → Test → Deploy
5. Add US4 (Debounce + Date validation) → Test → Deploy
6. Polish → Final validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
