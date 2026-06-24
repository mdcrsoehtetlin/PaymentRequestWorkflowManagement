# Tasks: Fix Admin User Creation Password Validation Error

**Input**: Design documents from `/specs/001-fix-admin-user-creation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in feature specification

**Organization**: Single user story (bug fix) - all tasks grouped together

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (No new infrastructure needed)

**Purpose**: No setup required - this is a bug fix within existing module

*No tasks required*

---

## Phase 2: Foundational (No blocking prerequisites)

**Purpose**: No foundational work needed - fix is isolated to DTO validation

*No tasks required*

---

## Phase 3: User Story 1 - Fix Password Validation (Priority: P1) 🎯 MVP

**Goal**: Allow admin to create users without password validation errors

**Independent Test**: Admin can create user via API/UI without password field and receive auto-generated temporary password

### Implementation for User Story 1

- [x] T001 [US1] Modify `CreateUserDto.password` field in `src/modules/admin/dto/create-user.dto.ts`:
  - Add `@IsOptional()` decorator before `@IsString()`
  - Remove `@IsNotEmpty()` decorator
  - Remove `@MinLength(8)` decorator
  - Remove `@MaxLength(50)` decorator
  - Make field optional: `password?: string`

- [x] T002 [US1] Verify frontend user registration form in `frontend/src/pages/admin/` does not include password input field (if present, remove it)

- [ ] T003 [US1] Test user creation without password field:
  - Send POST request to `/api/v1/admin/users` without password field
  - Verify HTTP 201 response with `temporary_password` field
  - Verify no validation errors

- [ ] T004 [US1] Test user creation with password field (should be ignored):
  - Send POST request to `/api/v1/admin/users` with password field
  - Verify HTTP 201 response with auto-generated `temporary_password`
  - Verify submitted password value is ignored

- [ ] T005 [US1] Test new user login with temporary password:
  - Use `temporary_password` from previous test
  - Login with new user's email and temporary password
  - Verify successful login

**Checkpoint**: Admin can create users without password validation errors

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Verification and cleanup

- [x] T006 Run existing unit tests: `npm run test -- --testPathPattern=admin`
- [x] T007 Run linting: `npm run lint`
- [x] T008 Run build: `npm run build`
- [x] T009 Verify no regression in existing user creation flow

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - no tasks required
- **Foundational (Phase 2)**: No dependencies - no tasks required
- **User Story 1 (Phase 3)**: No dependencies - can start immediately
- **Polish (Phase 4)**: Depends on Phase 3 completion

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies on other stories (single story)

### Within User Story 1

- T001 (DTO modification) must complete before T003/T004 (testing)
- T002 (frontend verification) can run in parallel with T001
- T003, T004, T005 are sequential tests

### Parallel Opportunities

- T001 and T002 can run in parallel (different files)
- T006, T007, T008 can run in parallel (different checks)

---

## Parallel Example: User Story 1

```bash
# Launch DTO modification and frontend verification together:
Task: "Modify CreateUserDto in src/modules/admin/dto/create-user.dto.ts"
Task: "Verify frontend form in frontend/src/pages/admin/"

# After both complete, run tests sequentially:
Task: "Test user creation without password field"
Task: "Test user creation with password field"
Task: "Test new user login"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete T001: Modify CreateUserDto (core fix)
2. Complete T002: Verify frontend (ensure no password field)
3. Complete T003-T005: Test the fix
4. **STOP and VALIDATE**: Admin can create users
5. Complete T006-T009: Polish and verification

### Incremental Delivery

1. T001 (DTO fix) → Core bug fixed
2. T002 (frontend) → Complete user experience
3. T003-T005 (tests) → Verified fix
4. T006-T009 (polish) → Production ready

---

## Notes

- Core fix: 1 file needs modification (CreateUserDto)
- Frontend: Verify and potentially modify user registration form (T002)
- No database schema changes required
- No new dependencies required
- Commit will use `fix:` prefix per constitution

---

*End of Tasks*
