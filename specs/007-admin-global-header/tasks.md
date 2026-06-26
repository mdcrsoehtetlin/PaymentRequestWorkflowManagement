# Tasks: Global Header with Language Switcher for Admin Panel

**Input**: Design documents from `/specs/007-admin-global-header/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: Not requested in feature specification.

**Organization**: Single user story — all tasks grouped under US1.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: No setup needed — feature is a single-file modification to existing admin shell

(Skipped — no initialization required)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: No foundational tasks — feature modifies existing component in-place

(Skipped — no blocking prerequisites)

---

## Phase 3: User Story 1 - Language Switcher in Admin Panel Header (Priority: P1) 🎯 MVP

**Goal**: Add a global header bar with shared LanguageSwitcher to the admin panel

**Independent Test**: Navigate to any admin screen, verify header visible with language switcher, switch language, verify persistence across admin screens

### Implementation for User Story 1

- [x] T001 [US1] Add LanguageSwitcher import and header bar to AdminDashboardShell.tsx — import `LanguageSwitcher` from `../../components/shared/LanguageSwitcher`, add `<header>` element with matching non-admin Header styling (`h-16 bg-white border-b border-slate-200 sticky top-0 z-30`) inside `<main>` above `<Outlet />`, right-align LanguageSwitcher in the header

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Verification and quality assurance

- [x] T002 [P] Run lint check (`npm run lint` in frontend/) — verify 0 errors
- [x] T003 [P] Run build check (`npm run build` in frontend/) — verify 0 errors
- [x] T004 Manual verification per quickstart.md scenarios (header visible, language switch, persistence, mobile responsive, sidebar unaffected)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 3 (User Story 1)**: Can start immediately — no setup or foundational tasks needed
- **Phase 4 (Polish)**: Depends on Phase 3 completion

### Within User Story 1

- T001 is the only implementation task — no internal dependencies

### Parallel Opportunities

- T002 and T003 can run in parallel (different commands, no dependencies)
- T004 depends on T001 completion

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete T001: Add header with LanguageSwitcher to AdminDashboardShell.tsx
2. **STOP and VALIDATE**: Run T002 + T003 (lint + build), then T004 (manual verification)
3. Deploy if ready

### Incremental Delivery

This is a single-story feature. Complete T001 → verify → done.

---

## Notes

- Single-file modification: `frontend/src/pages/admin/AdminDashboardShell.tsx`
- ~10 lines added (import + header element)
- LanguageSwitcher is self-contained (uses react-i18next, no props needed)
- No new state, no API changes, no backend impact
- Constitution §II respected: using shared LanguageSwitcher, no cross-module imports
