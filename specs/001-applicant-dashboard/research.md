# Research Notes: Applicant Dashboard

## Technical Context Unknowns
No explicit "NEEDS CLARIFICATION" items were present in the implementation plan's technical context.

## Technology Best Practices & Patterns

### Design System and Tailwind CSS
- **Decision**: Strict adherence to the documented Global UI/UX Design System Specification (Section 9 of DEVELOPMENT_RULES.md).
- **Rationale**: Project constraints enforce premium enterprise dashboard aesthetics. Status badges must strictly follow the defined colors (e.g., Draft gray `#6B7280`, Verified sky blue `#0284C7`).
- **Alternatives considered**: Ad-hoc component styling (rejected due to design system strictness).

### State Management & Communication
- **Decision**: WebSocket for real-time notifications with Socket.IO 4.8+, JWT for authentication.
- **Rationale**: To satisfy NFR-003 (WebSocket status update delivery ≤ 500ms). WebSockets authenticated via JWT.
- **Alternatives considered**: HTTP polling (rejected due to latency constraints and performance NFRs).

### Database Storage
- **Decision**: PostgreSQL 16 with TypeORM.
- **Rationale**: Project enforces PostgreSQL and TypeORM. 
- **Alternatives considered**: None, mandated by tech stack.

### Caching
- **Decision**: Redis (Memurai) caching for lookups and request payloads.
- **Rationale**: NFR-007 mandates Redis cache for master tables (24h TTL) and request payloads (10m TTL).
- **Alternatives considered**: In-memory caching without Redis (rejected due to horizontal scaling limitations).
