# Tasks: Admin Global Header with Language Switch

**Input**: Design documents from `/specs/008-admin-global-header/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: Not explicitly requested in the feature specification. Tests are omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: User Story 1 - Language Switch in Admin Panel (Priority: P1) 🎯 MVP

**Goal**: Add a minimal header bar with the shared LanguageSwitcher component to the admin panel.

**Independent Test**: Navigate to any admin screen, verify header with language switcher is visible, click it, switch language, verify labels update.

### Implementation for User Story 1

- [x] T001 [US1] Import `LanguageSwitcher` in `frontend/src/pages/admin/AdminDashboardShell.tsx` — add `import { LanguageSwitcher } from '../../components/shared/LanguageSwitcher'`
- [x] T002 [US1] Add minimal header bar JSX in `frontend/src/pages/admin/AdminDashboardShell.tsx` — place a `<header>` element above the main content area (inside the flex container, after the sidebar `<aside>`), styled with `sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex justify-end`, containing only `<LanguageSwitcher />`
- [x] T003 [US1] Verify the header is visible on all admin sub-pages (User Management, Master Data, Audit Logs) and the language switcher functions correctly

**Checkpoint**: User Story 1 fully functional — Language switcher works in admin panel

---

## Phase 2: User Story 2 - Consistent Header Across All Panels (Priority: P2)

**Goal**: Verify that the admin panel header matches the non-admin panels' header experience.

**Independent Test**: Navigate between admin and non-admin panels, verify language switcher is present in all sections and language persists.

### Implementation for User Story 2

- [ ] T004 [US2] Verify cross-panel consistency — navigate from admin to a non-admin panel (e.g., Applicant Dashboard) and confirm language switcher is present in both, and language selection persists across panels

**Checkpoint**: User Story 2 verified — consistent header experience across all panels

---

## Phase 3: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and quality checks

- [x] T005 Run `npm run lint` from `frontend/` — verify zero errors
- [x] T006 Run `npm run build` from `frontend/` — verify zero TypeScript errors
- [ ] T007 Run quickstart.md validation scenarios in browser — verify all 5 scenarios pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **User Story 1 (Phase 1)**: No dependencies — can start immediately
- **User Story 2 (Phase 2)**: Depends on US1 completion (verification only)
- **Polish (Phase 3)**: Depends on both US1 and US2 being complete

### User Story Dependencies

- **User Story 1 (P1)**: Independent — works on `AdminDashboardShell.tsx` only
- **User Story 2 (P2)**: Verification only — no code changes, just cross-panel validation

### Parallel Opportunities

- No parallel opportunities — single file modification, sequential tasks

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete T001-T003: Add header with LanguageSwitcher to admin panel
2. **STOP and VALIDATE**: Test admin panel language switching independently
3. Deploy/demo if ready

### Incremental Delivery

1. Add LanguageSwitcher to admin panel → Test independently → Deploy/Demo (MVP!)
2. Verify cross-panel consistency → Final validation

---

## Notes

- [Story] label maps task to specific user story for traceability
- This is a minimal feature — single file modification, reusing existing shared component
- Commit after each task or logical group
