# Implementation Plan: Audit Log Search Enhancement

**Branch**: `002-audit-log-search` | **Date**: 2026-06-22 | **Spec**: [spec.md](file:///d:/AI/開発/PaymentRequestWorkflowManagement/specs/002-audit-log-search/spec.md)

**Input**: Feature specification from [spec.md](file:///d:/AI/開発/PaymentRequestWorkflowManagement/specs/002-audit-log-search/spec.md)

## Summary

The Audit Log Search Enhancement feature adds new filter capabilities to the existing Audit Log workspace: action type dropdown, payment request ID search, actor name text search (replacing the numeric userId field), and automatic debounced search (300ms) to replace the manual button trigger. The existing date range filters are retained with improved inline validation.

The technical approach includes:
- **Backend (NestJS)**: Extend the existing `GET /api/v1/admin/audit-logs` endpoint with new optional query parameters (`actionTypeId`, `requestId`, `actorName`). Remove `userId` parameter. Implement case-insensitive partial matching for actor name via `ILIKE` query.
- **Frontend (React)**: Add new filter UI controls to the existing `AuditLogWorkspace` component (action type dropdown, request ID input, actor name input). Remove the old numeric userId input. Implement 300ms debounce on filter changes. Add inline date validation.

## Technical Context

**Language/Version**: TypeScript 5.7+ / Node.js 20+

**Primary Dependencies**: NestJS 11.x, React 19, Vite 8.x, Tailwind CSS 3.x, TypeORM 0.3.20

**Storage**: PostgreSQL 16 (Primary) — no Redis changes needed

**Testing**: Jest (Unit/Integration) + Supertest (E2E)

**Target Platform**: Modern web browsers (Desktop-first)

**Project Type**: Web Application (NestJS backend REST API + React SPA frontend)

**Performance Goals**: Audit log search with any filter combination ≤ 1.5s for up to 10,000 records. Debounced search fires at most 1 request per filter change sequence.

**Constraints**: Immutable audit logs — the endpoint is read-only. No modifications to `approval_logs` table.

**Scale/Scope**: Corporate workflow system (up to 10,000+ audit log items)

## Needs Clarification

- None — all spec ambiguities resolved during `/speckit-clarify`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Validated against Strict Naming Conventions, Type Safety & Documentation Standards (I)
- [x] Confirmed Module-Based Directory Isolation — internal structure & shared layer access control (II)
- [x] Checked against Security, Auth, Error Handling & Audit Trail Standards (IV)
- [x] Ensured UI/UX Design System Compliance — colors, typography, accessibility (V)
- [x] Aligned with Detailed Design "Contract" & Architecture (VI) — tech stack, 4-layer model, path aliases
- [x] Verified Performance Targets, API Design & Environment Standards (VII)
- [x] Confirmed Git Branching, Commit & PR Standards compliance (VIII)
- [x] Audit trail immutability maintained — all changes are read-only queries, no data mutation

## Project Structure

### Documentation (this feature)

```text
specs/002-audit-log-search/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── audit-log-api.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
└── modules/
    └── admin/                    # Admin panel backend endpoints and service layer logic
        ├── admin.module.ts
        ├── admin.controller.ts   # Extend GET /audit-logs with new query params
        ├── admin.service.ts      # Add ILIKE actorName filter, remove userId filter
        ├── dto/
        │   └── audit-log-query.dto.ts  # New DTO for audit log query params
        └── tests/
            └── admin.service.spec.ts   # Add audit log search test cases

frontend/
└── src/
    └── pages/
        └── admin/                # Admin dashboard client components
            ├── AuditLogWorkspace.tsx  # Add new filter controls, debounce, remove userId

```

## Frontend Search Mechanism

The audit log workspace will implement **debounced auto-search** (300ms):

- All filter inputs (date range, action type dropdown, request ID, actor name) trigger an immediate pagination reset to page 1 on change.
- A 300ms debounce wraps the `fetchLogs` API call to coalesce rapid filter changes into a single request.
- The existing search button is removed.
- Inline date validation: if `startDate > endDate`, an error message is displayed below the date fields and the search is skipped.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

*(No constitution violations identified. Implementation details strictly adhere to repository guidelines.)*
