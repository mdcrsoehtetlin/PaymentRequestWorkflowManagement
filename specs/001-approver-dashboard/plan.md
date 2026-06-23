# Implementation Plan: Final Approver Dashboard

**Branch**: `001-approver-dashboard` | **Date**: 2026-06-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-approver-dashboard/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

- **Primary Requirement**: Implement the dashboard queue and review workspace for the Final Approver, allowing them to view pending requests, automatically start review upon inspection, approve requests (routing them to Accounting), and reject requests with a mandatory explanation (routing them back to the Applicant).
- **Technical Approach**: 
  - **Backend**: Update `approver.controller.ts` and `approver.service.ts` to implement full filtering, sorting, pagination, and transaction-wrapped state transitions. The state updates will write immutable audit records to `approval_logs`, evict Redis cache payloads (`payment_request:payload:<id>`), and broadcast real-time events via Socket.IO.
  - **Frontend**: Replace the placeholder `ApproverDashboard.tsx` with a fully featured dashboard workspace containing a persistent summary sidebar, an inline filter bar, a paginated data table, and a details panel. Action controls will invoke confirmation dialogs and standard API client operations.

## Technical Context

**Language/Version**: TypeScript 5.7+, Node.js 20+

**Primary Dependencies**: NestJS 11.x, React 19.x, TypeORM 0.3.20, Socket.IO 4.8+, class-validator / class-transformer 0.14+

**Storage**: PostgreSQL 16, Redis (Memurai) 4+

**Testing**: Jest + Supertest (backend), Jest + React Testing Library (frontend)

**Target Platform**: Web (Chrome, Edge, Firefox, Safari)

**Project Type**: Web Service & Single Page Application (React)

**Performance Goals**: Dashboard rendering / load ≤ 2s, API responses ≤ 200ms, WebSocket status propagation ≤ 500ms

**Constraints**: Strict role-based access isolation (role_id = 3 / 'APPROVER'), JSDoc/TSDoc comment standards, import ordering conventions, and WCAG 2.1 AA accessibility guidelines (contrast ratios, focus indicators, keyboard navigation, ARIA labels).

**Scale/Scope**: ~2 frontend screens (dashboard list, details pane), 4 REST endpoints.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Validated against Strict Naming Conventions, Type Safety & Documentation Standards (I)
- [x] Confirmed Module-Based Directory Isolation — internal structure & shared layer access control (II)
- [x] Checked against Security, Auth, Error Handling & Audit Trail Standards (IV)
- [x] Ensured UI/UX Design System Compliance — colors, typography, accessibility (V)
- [x] Aligned with Detailed Design "Contract" & Architecture (VI) — tech stack, 4-layer model, path aliases
- [x] Verified Performance Targets, API Design & Environment Standards (VII)
- [x] Confirmed Git Branching, Commit & PR Standards compliance (VIII)

## Project Structure

### Documentation (this feature)

```text
specs/001-approver-dashboard/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── checklists/
    └── requirements.md  # Specification quality checklist
```

### Source Code (repository root)

```text
src/                         # Backend Source
└── modules/
    ├── approver/
    │   ├── approver.module.ts
    │   ├── approver.controller.ts
    │   ├── approver.service.ts
    │   ├── dto/
    │   │   ├── query-approver-requests.dto.ts
    │   │   ├── approve-payment-request.dto.ts
    │   │   └── reject-payment-request.dto.ts
    │   └── tests/
    │       ├── approver.controller.spec.ts
    │       └── approver.service.spec.ts
    └── shared/              # Shared backend layers (entities, guards, dtos)

frontend/                    # Frontend Source
└── src/
    ├── pages/
    │   └── approver/
    │       ├── ApproverDashboard.tsx
    │       ├── ApproverRequestDetail.tsx
    │       ├── components/
    │       │   ├── SummarySidebar.tsx
    │       │   ├── FilterSearchBar.tsx
    │       │   ├── ApproverRequestTable.tsx
    │       │   └── ApproverActionPanel.tsx
    │       ├── hooks/
    │       │   ├── useApproverRequests.ts
    │       │   └── useApproverRequestDetail.ts
    │       └── services/
    │           └── approver.service.ts
    └── components/
        └── shared/          # Reusable design system components
```

**Structure Decision**: Option 2: Web application (frontend SPA and NestJS backend). Real directories correspond to the layout listed above.

## Complexity Tracking

*No violations identified. Complete compliance with Constitution version 2.2.0.*
