# Implementation Plan: Applicant Dashboard

**Branch**: `feature/applicant-dashboard` | **Date**: 2026-06-19 | **Spec**: [specs/001-applicant-dashboard/spec.md](file:///c:/Projects/PRWM/specs/001-applicant-dashboard/spec.md)

**Input**: Feature specification from `specs/001-applicant-dashboard/spec.md`

## Summary

Implement the Applicant Dashboard enabling users to view, create, edit, and submit payment requests with real-time status updates via WebSockets. The implementation adheres to the project's strict 4-layer architecture, module-based directory isolation, and premium UI design system.

## Technical Context

**Language/Version**: TypeScript 5.7+

**Primary Dependencies**: NestJS 11.x, React 19, Vite 8.x, Tailwind CSS 3.x, Socket.IO 4.8+, TypeORM 0.3.20

**Storage**: PostgreSQL 16, Redis (Memurai) 4+

**Testing**: Jest + Supertest

**Target Platform**: Web SPA (Vite) + Node.js REST API Server

**Project Type**: Dual-application architecture (Backend API + Frontend SPA)

**Performance Goals**: Dashboard load < 2s (Lighthouse), API P95 < 200ms, WebSocket latency < 500ms, Dashboard query < 500ms

**Constraints**: Strict 4-layer architecture, complete isolation in `applicant` module directories, immutable audit logging required for all state transitions, 10MB per-file upload limit.

**Scale/Scope**: Support for virtual scrolling on lists > 100 items, caching of master data and payload requests in Redis.

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
specs/001-applicant-dashboard/
├── plan.md              
├── research.md          
├── data-model.md        
├── quickstart.md        
├── contracts/           
└── tasks.md             
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── modules/
│   │   ├── applicant/
│   │   │   ├── applicant.module.ts
│   │   │   ├── applicant.controller.ts
│   │   │   ├── applicant.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-payment-request.dto.ts
│   │   │   │   ├── update-payment-request.dto.ts
│   │   │   │   ├── submit-payment-request.dto.ts
│   │   │   │   ├── upload-receipt.dto.ts
│   │   │   │   └── payment-request-response.dto.ts
│   │   │   ├── guards/
│   │   │   │   └── ownership.guard.ts
│   │   │   └── tests/
│   │   │       ├── applicant.controller.spec.ts
│   │   │       └── applicant.service.spec.ts
│   └── shared/ (existing)

frontend/
├── src/
│   ├── pages/
│   │   ├── applicant/
│   │   │   ├── dashboard.tsx
│   │   │   ├── form.tsx
│   │   │   ├── detail.tsx
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   └── utils/
│   └── shared/ (existing)
```

**Structure Decision**: Option 2 (Web application). Development is confined strictly to `backend/src/modules/applicant/` and `frontend/src/pages/applicant/` per Constitution Principle II.

## Complexity Tracking

*(No violations exist. Strictly adhering to constitution.)*
