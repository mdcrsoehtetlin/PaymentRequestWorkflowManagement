# Implementation Plan: Audit Log Request Number Display

**Branch**: `fix/audit-log-request-number` | **Date**: 2026-06-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-audit-log-request-number/spec.md`

## Summary

Fix audit log screen to display and search by `request_number` (e.g., PR-2026-001) from the payment_requests table instead of internal `payment_request_id`. Changes span backend API (DTO, service, controller) and frontend UI (search field, table column, detail panel).

## Technical Context

**Language/Version**: TypeScript 5.7+, React 19

**Primary Dependencies**: NestJS 11.x, TypeORM 0.3.20, class-validator, class-transformer

**Storage**: PostgreSQL 16

**Testing**: Jest + Supertest

**Target Platform**: Web (desktop admin dashboard)

**Project Type**: Web application (NestJS backend + React frontend)

**Performance Goals**: Search response < 5s, API P95 < 200ms

**Constraints**: No shared layer modifications (admin module only), 300ms debounce on search

**Scale/Scope**: Admin-only feature, single screen modification

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Validated against Strict Naming Conventions, Type Safety & Documentation Standards (I)
  - camelCase for variables/functions, PascalCase for classes/components
  - DTO: `audit-log-query.dto.ts` (kebab-case)
  - Explicit return types, JSDoc on public methods
- [x] Confirmed Module-Based Directory Isolation — internal structure & shared layer access control (II)
  - Changes confined to `src/modules/admin/` and `frontend/src/pages/admin/`
  - No cross-module imports
  - ApprovalLog entity join already exists (shared layer, no modification needed)
- [x] Checked against Security, Auth, Error Handling & Audit Trail Standards (IV)
  - Endpoint already protected with JwtAuthGuard + RolesGuard
  - No new sensitive data exposure
- [x] Ensured UI/UX Design System Compliance — colors, typography, accessibility (V)
  - Using existing DataTable component
  - Focus indicators, ARIA labels maintained
  - No custom alert/confirm dialogs
- [x] Aligned with Detailed Design "Contract" & Architecture (VI)
  - 4-layer model: Presentation → API → Business Logic → Data Access
  - Path aliases: `@modules/*`, `@shared/*`
- [x] Verified Performance Targets, API Design & Environment Standards (VII)
  - API URL: `/admin/audit-logs` (existing)
  - Paginated response with `data` and `meta`
  - 300ms debounce already implemented on frontend
- [x] Confirmed Git Branching, Commit & PR Standards compliance (VIII)
  - Branch: `fix/audit-log-request-number`
  - Commit prefix: `fix:`

## Project Structure

### Documentation (this feature)

```text
specs/004-audit-log-request-number/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
src/modules/admin/
├── dto/
│   └── audit-log-query.dto.ts      # MODIFY: requestId → requestNumber
├── admin.service.ts                # MODIFY: getAuditLogs() - join + filter by request_number
├── admin.controller.ts             # No changes (query param passthrough)
└── tests/
    └── admin.service.spec.ts       # MODIFY: update test cases

frontend/src/pages/admin/
├── AuditLogWorkspace.tsx           # MODIFY: search field, table column, API params
└── components/
    └── MetadataDetailPanel.tsx     # VERIFY: display request_number
```

**Structure Decision**: Single feature modification within admin module. Backend changes in DTO and service. Frontend changes in AuditLogWorkspace component.

## Complexity Tracking

No constitution violations requiring justification. Changes are confined to admin module with no shared layer modifications.

---

## Phase 0: Research

### Research Tasks

1. **Audit Log Query DTO Analysis**: Current `requestId` parameter is typed as `@IsInt()` - need to change to `@IsString()` for request number search.

2. **TypeORM Query Builder**: Current query uses `log.payment_request_id = :requestId` - need to join with payment_requests table and filter by `request_number ILIKE :requestNumber`.

3. **Frontend Search Field**: Current "PRF-" prefix UI needs to be replaced with free-text search for request number format (PR-YYYY-NNN).

4. **Response Data Shape**: Current response returns `paymentRequestId: number` - need to also return `requestNumber: string` from the joined payment_request.

### Research Findings

**Decision**: Use TypeORM QueryBuilder with `leftJoinAndSelect` to include payment_request data, then filter by `request_number ILIKE` for partial matching.

**Rationale**: 
- ILIKE provides case-insensitive search matching user expectation
- Left join handles deleted payment requests gracefully (returns null)
- Existing pattern in `approver.service.ts` line 170 uses similar approach

**Alternatives Considered**:
- Separate API call to lookup request_number → Rejected: extra network hop, complexity
- Database view → Rejected: over-engineering for simple display change
- Store request_number in approval_logs → Rejected: data duplication, sync issues

---

## Phase 1: Design & Contracts

### Data Model

**Approval Log Entity** (existing - no changes):
- `approvalLogId`: string (PK)
- `paymentRequestId`: number (FK to payment_requests)
- `actionTakenByUserId`: number
- `actionTypeId`: number
- `previousStatusId`: number | null
- `newStatusId`: number | null
- `comment`: string | null
- `ipAddress`: string
- `userAgent`: string
- `timestamp`: Date

**Payment Request Entity** (existing - read-only join):
- `paymentRequestId`: number (PK)
- `requestNumber`: string (unique, e.g., PR-2026-001)

**API Response Shape** (modified):
```typescript
{
  data: Array<{
    approvalLogId: string;
    paymentRequestId: number;
    requestNumber: string | null;  // NEW: from joined payment_request
    actorName: string;
    actionTypeId: number;
    previousStatusId: number | null;
    newStatusId: number | null;
    comment: string | null;
    ipAddress: string;
    userAgent: string;
    timestamp: Date;
  }>;
  meta: { page, pageSize, totalItems, totalPages };
}
```

### API Contract

**Endpoint**: `GET /admin/audit-logs`

**Query Parameters** (modified):
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| startDate | string (ISO date) | No | Filter from date |
| endDate | string (ISO date) | No | Filter to date |
| actionTypeId | number | No | Filter by action type |
| requestNumber | string | No | Search by request number (partial match) |
| actorName | string | No | Search by actor name |
| page | number | No | Page number (default: 1) |
| pageSize | number | No | Items per page (default: 50) |

**Response**: Paginated audit log list with `requestNumber` field included.

### Quickstart Validation

1. Start dev server: `npm run start:dev`
2. Login as admin user
3. Navigate to `/admin/audit-logs`
4. Verify "リクエスト番号" search field exists (no "PRF-" prefix)
5. Enter partial request number (e.g., "PR-2026")
6. Verify filtered results show matching request numbers
7. Verify table column shows request numbers (not PRF-{id})
8. Click row, verify detail panel shows request number

---

## Phase 2: Tasks (to be generated by /speckit-tasks)

Tasks will cover:
1. Backend: Update AuditLogQueryDto (requestId → requestNumber string)
2. Backend: Update AdminService.getAuditLogs() query
3. Backend: Update response mapping to include requestNumber
4. Frontend: Update AuditLogWorkspace search field UI
5. Frontend: Update table column to display requestNumber
6. Frontend: Update API params from requestId to requestNumber
7. Tests: Update admin.service.spec.ts
8. Verification: Run lint, build, test
