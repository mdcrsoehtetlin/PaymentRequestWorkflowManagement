# Research & Technical Decisions: Applicant Dashboard

**Feature**: Applicant Dashboard
**Date**: 2026-06-19

## Overview

No `NEEDS CLARIFICATION` items were identified during the planning phase. The system architecture, technology stack, and module isolation rules are strictly predefined by the project's Constitution (`.specify/memory/constitution.md`) and the Development Rules (`02_開発ルール_DEVELOPMENT_RULES.md`).

## Decisions & Rationale

**Decision**: Strict Module-Based Directory Isolation
- **Rationale**: Principle II dictates that the Applicant module must reside entirely within `backend/src/modules/applicant/` and `frontend/src/pages/applicant/`. No cross-module imports are allowed.

**Decision**: Dual-Application Architecture (NestJS + React)
- **Rationale**: Enforced by Principle VI. NestJS provides the REST API (port 3000) and Vite/React serves the SPA (port 5173), connected via Socket.IO for real-time updates.

**Decision**: Immutable Audit Trail for Transitions
- **Rationale**: Enforced by Principle IV. All workflow state changes must insert a record into the `approval_logs` table.

**Decision**: Performance and Caching Strategies
- **Rationale**: Enforced by Principle VII. Redis is used for caching lookup data (24h TTL) and request payloads (10m TTL). P95 API response must be < 200ms. WebSocket latency < 500ms.
