# Tasks: Audit Log Request Number Display

**Input**: Design documents from `/specs/004-audit-log-request-number/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are included as optional verification tasks.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `src/modules/admin/`
- **Frontend**: `frontend/src/pages/admin/`
- **Tests**: `src/modules/admin/tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: No new infrastructure needed - existing admin module structure is sufficient

No setup tasks required for this bug fix.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T001 Create feature branch `fix/audit-log-request-number` per git conventions

**Checkpoint**: Branch ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Search Audit Logs by Request Number (Priority: P1) 🎯 MVP

**Goal**: Enable administrators to search audit logs by human-readable request number instead of internal ID

**Independent Test**: Enter request number in search field and verify filtered results appear

### Implementation for User Story 1

- [x] T002 [US1] Update AuditLogQueryDto in src/modules/admin/dto/audit-log-query.dto.ts - change `requestId` (number) to `requestNumber` (string) with @IsString(), @IsOptional(), @MaxLength(50) decorators
- [x] T003 [US1] Update AdminService.getAuditLogs() in src/modules/admin/admin.service.ts - add leftJoinAndSelect for payment_request, filter by request_number ILIKE for partial matching; ensure JSDoc includes @description, @param, @returns tags
- [x] T004 [US1] Update frontend AuditLogWorkspace.tsx search field - change label from "リクエストID" to "リクエスト番号", remove "PRF-" prefix, update filter state and API param from requestId to requestNumber

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Display Request Number in Audit Log Results (Priority: P1)

**Goal**: Show human-readable request number in audit log table and detail panel

**Independent Test**: View audit log table and verify request numbers are displayed correctly

### Implementation for User Story 2

- [x] T005 [US2] Update AdminService.getAuditLogs() response mapping in src/modules/admin/admin.service.ts - add requestNumber field from joined payment_request entity
- [x] T006 [US2] Update frontend AuditLogWorkspace.tsx table column in src/pages/admin/AuditLogWorkspace.tsx - change column header from "リクエストID" to "リクエスト番号", display requestNumber instead of PRF-{paymentRequestId}
- [x] T007a [US2] Check MetadataDetailPanel.tsx in src/pages/admin/components/MetadataDetailPanel.tsx for requestNumber display
- [x] T007b [US2] If requestNumber field missing, add it to MetadataDetailPanel.tsx in src/pages/admin/components/MetadataDetailPanel.tsx

**Checkpoint**: All user stories should now be independently functional

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Verification and quality assurance

- [x] T008 Update admin.service.spec.ts in src/modules/admin/tests/admin.service.spec.ts - update test cases to use requestNumber parameter and verify ILIKE query behavior
- [x] T009 Run `npm run lint` and verify 0 errors
- [x] T010 Run `npm run build` and verify 0 TypeScript errors
- [x] T011 Run `npm run test` and verify all tests pass
- [ ] T012 Manual testing per quickstart.md - search by full request number, partial match, no results, detail panel display

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately (skipped for this fix)
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational phase completion
- **User Story 2 (Phase 4)**: Depends on Foundational phase completion - can run in parallel with US1
- **Polish (Phase 5)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Can run in parallel with US1

### Within Each User Story

- DTO changes before service changes
- Service changes before frontend changes
- Backend before frontend for API contract alignment

### Parallel Opportunities

- T002 and T005 can run in parallel (different backend files)
- T004 and T006 can run in parallel (different frontend sections)
- T009, T010, T011 can run in parallel (different verification commands)

---

## Parallel Example: User Story 1 & 2

```bash
# Backend tasks can run in parallel:
Task T002: Update AuditLogQueryDto in src/modules/admin/dto/audit-log-query.dto.ts
Task T005: Update response mapping in src/modules/admin/admin.service.ts

# Frontend tasks can run in parallel:
Task T004: Update search field in frontend/src/pages/admin/AuditLogWorkspace.tsx
Task T006: Update table column in frontend/src/pages/admin/AuditLogWorkspace.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2 Combined)

1. Complete Phase 2: Foundational (create branch)
2. Complete Phase 3: User Story 1 (search functionality)
3. Complete Phase 4: User Story 2 (display functionality)
4. **STOP and VALIDATE**: Test both stories together
5. Complete Phase 5: Polish & verification
6. Deploy if ready

### Incremental Delivery

1. Complete Foundational → Branch ready
2. Add Backend DTO + Service → API accepts requestNumber
3. Add Frontend Search → Users can search by request number
4. Add Frontend Display → Users see request numbers in results
5. Run verification → Lint, build, test pass
6. Deploy

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Both user stories are P1 priority and closely related
- This is a bug fix, not a new feature - minimal infrastructure changes
- Verify search works with partial matches (ILIKE pattern)
- Handle edge case: deleted payment request shows null requestNumber
