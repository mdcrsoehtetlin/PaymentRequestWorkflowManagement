# Research: Accounting Dashboard

## Technical Context Clarifications
- **Language/Version**: TypeScript 5.7+ / Node.js 20+
- **Primary Dependencies**: NestJS 11.x, React 19, Vite 8.x, Tailwind CSS 3.x, TypeORM 0.3.20
- **Storage**: PostgreSQL 16, Redis (Memurai) 4+
- **Testing**: Jest + Supertest
- **Target Platform**: Web Browser (Chrome/Firefox/Safari)
- **Project Type**: Web Application (React SPA + NestJS REST API)
- **Performance Goals**: P95 < 200ms for CRUD, Dashboard query < 500ms, Bundle < 250KB
- **Constraints**: Strict 4-layer architecture, module-based directory isolation, exact design system token compliance, strict TypeScript mode, audit log immutability
- **Scale/Scope**: Accounting role module features, max 15 line items per payment request

## Best Practices
- **Decision**: NestJS Controllers + Services for API; React + Vite for Frontend.
- **Rationale**: Follows the existing dual-application architecture and the Constitution principle VI.
- **Alternatives considered**: None, mandated by Constitution.

## Integration Patterns
- **Decision**: WebSocket Gateway for real-time status notifications.
- **Rationale**: Real-time state updates are required for Accounting dashboard (Status changes from APPROVED to PAID).
- **Alternatives considered**: Polling, but rejected due to performance constraints and NFR-004 requirements.
