# Tasks: 010-admin-i18n-integration

**Input**: Design documents from `/specs/010-admin-i18n-integration/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: No test tasks — the feature spec uses manual validation via quickstart.md scenarios. `npm run lint` and `npm run build` serve as automated verification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: User Story 1 — Switch Admin Screen Language (Priority: P1) 🎯 MVP

**Goal**: All admin screen components (UserManagementWorkspace, MasterDataWorkspace, AuditLogWorkspace, MetadataDetailPanel, UserFormModal) use `useTranslation()` and display translated text when language is switched.

**Independent Test**: Navigate to any admin screen, click LanguageSwitcher, select a different language. All visible text (titles, column headers, filter labels, buttons, empty states, dropdown options) updates immediately without page reload.

### Implementation for User Story 1

- [X] T001 [P] [US1] Add `useTranslation` import and `const { t } = useTranslation();` to `frontend/src/pages/admin/components/MetadataDetailPanel.tsx`, replace ~15 hardcoded strings with `t()` calls using `admin.metadata_detail.*` and `admin.audit_log.action_label.*` keys, remove duplicate `ACTION_LABELS` map per research R7
- [X] T002 [P] [US1] Add `useTranslation` import and `const { t } = useTranslation();` to `frontend/src/pages/admin/components/UserFormModal.tsx`, replace ~30 hardcoded strings with `t()` calls using `admin.user_form.*` and `common.role.*` keys, move role option arrays inside component body per research R4
- [X] T003 [P] [US1] Add `useTranslation` import and `const { t } = useTranslation();` to `frontend/src/pages/admin/MasterDataWorkspace.tsx`, replace ~8 hardcoded strings with `t()` calls using `admin.master_data.*` keys, move category tab labels inside component body
- [X] T004 [US1] Add `useTranslation` import and `const { t } = useTranslation();` to `frontend/src/pages/admin/UserManagementWorkspace.tsx`, replace ~35 hardcoded strings with `t()` calls using `admin.user_management.*` and `common.*` keys, move role/status option arrays and filter field definitions inside component body per research R4
- [X] T005 [US1] Add `useTranslation` import and `const { t } = useTranslation();` to `frontend/src/pages/admin/AuditLogWorkspace.tsx`, replace ~30 hardcoded strings with `t()` calls using `admin.audit_log.*` and `common.*` keys, move filter field definitions and action type option arrays inside component body, remove duplicate `ACTION_LABELS` map per research R7
**Checkpoint**: At this point, User Story 1 should be fully functional — all admin screen content translates on language switch. Test via quickstart.md Scenarios 1, 2, 3, 5, 7. Run `npm run lint` + `npm run build` to verify.

---

## Phase 2: User Story 2 — Admin Sidebar Language Updates (Priority: P2)

**Goal**: Admin sidebar navigation labels (User Management, Master Data, Audit Logs) update when language is switched.

**Independent Test**: Navigate to any admin screen, click LanguageSwitcher, select a different language. Sidebar menu labels update to the selected language.

### Implementation for User Story 2

- [X] T007 [US2] Refactor `roleMenuConfig` in `frontend/src/components/layout/Sidebar.tsx` from static module-level const to a function (`useRoleMenuConfig`) that calls `useTranslation()` and returns config with `t()` labels per research R2 — ensure all non-admin role configs also use `t()` with `common.role.*` keys
- [X] T008 [US2] Update the `Sidebar` component body in `frontend/src/components/layout/Sidebar.tsx` to call `useRoleMenuConfig()` and use the returned config, verify admin menu labels use `admin.sidebar.*` keys
**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Sidebar labels and screen content both translate. Test via quickstart.md Scenario 4. Run `npm run lint` + `npm run build` to verify.

---

## Phase 3: User Story 3 — Admin Dashboard Shell Language (Priority: P3)

**Goal**: Admin dashboard shell header area displays text in the selected language.

**Independent Test**: Navigate to any admin screen, verify the header area (if any text exists) updates on language switch.

### Implementation for User Story 3

- [X] T010 [US3] Verify `frontend/src/pages/admin/AdminDashboardShell.tsx` — confirm no hardcoded user-facing strings exist (layout shell only). If any text is found, add `useTranslation` and replace with `t()` calls
- [X] T011 [US3] Run `npm run lint` and `npm run build` in `frontend/` directory — verify 0 errors

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and regression testing across all stories

- [X] T012 Run full lint and build verification: `npm run lint` (0 errors) and `npm run build` (0 errors) in `frontend/` directory — this is the single automated quality gate for all phases
- [X] T013 Run quickstart.md validation — test all 7 scenarios (User Management, Master Data, Audit Logs, Sidebar, User Form Modal, Language Persistence, Metadata Detail Panel). Additionally verify: (a) English fallback works by temporarily switching to an unsupported locale, (b) no text overflow or layout breaking in any of the 3 languages
- [X] T014 Verify non-admin screens are NOT affected — navigate to applicant dashboard, manager dashboard, confirm no regressions
- [X] T015 Verify no console errors in browser developer tools across all admin screens

---

## Dependencies & Execution Order

### Phase Dependencies

- **User Story 1 (Phase 1)**: No dependencies — can start immediately
- **User Story 2 (Phase 2)**: No dependencies on US1 — can start in parallel with US1
- **User Story 3 (Phase 3)**: No dependencies on US1 or US2 — can start in parallel
- **Polish (Phase 4)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Independent — modifies only admin screen files
- **User Story 2 (P2)**: Independent — modifies only Sidebar.tsx (shared, but approved via clarification)
- **User Story 3 (P3)**: Independent — verifies AdminDashboardShell (may need minor changes)

### Within Each User Story

- Component tasks within US1 (T001-T005) can run in parallel since they modify different files
- Sidebar refactor tasks (T007-T008) must run sequentially (same file)
- Lint/build check comes last in each phase

### Parallel Opportunities

- **US1 and US2 can run in parallel** — they modify completely different files
- **US1 component tasks (T001-T003)** can run in parallel — different files
- **US1 page tasks (T004-T005)** can run in parallel — different files
- **All phases can be parallelized** if team capacity allows

---

## Parallel Example: User Story 1

```bash
# Launch all component i18n tasks together (different files):
Task: "T001 [P] [US1] i18n MetadataDetailPanel.tsx"
Task: "T002 [P] [US1] i18n UserFormModal.tsx"
Task: "T003 [P] [US1] i18n MasterDataWorkspace.tsx"

# Launch page-level tasks together (after components, different files):
Task: "T004 [US1] i18n UserManagementWorkspace.tsx"
Task: "T005 [US1] i18n AuditLogWorkspace.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: User Story 1 (all admin screen translations)
2. **STOP and VALIDATE**: Test via quickstart.md Scenarios 1, 2, 3, 5, 7
3. Deploy/demo if ready

### Incremental Delivery

1. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
2. Add User Story 2 → Test sidebar labels → Deploy/Demo
3. Add User Story 3 → Verify shell → Deploy/Demo
4. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Developer A: User Story 1 (admin screens)
2. Developer B: User Story 2 (sidebar)
3. Developer C: User Story 3 (shell)
4. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- No test-writing tasks — feature spec uses manual validation (quickstart.md)
- `npm run lint` + `npm run build` after each phase serves as automated verification
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
