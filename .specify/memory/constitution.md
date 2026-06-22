<!--
Sync Impact Report:
Version: 2.1.0 → 2.2.0
Bump Type: MINOR — materially expanded guidance; new sub-principles and sections added; no backward-incompatible removals.

Modified Principles:
- Principle I (Naming Conventions & Type Safety): Expanded with JSDoc/TSDoc comment standards (§1.3) and import ordering convention (§1.5).
- Principle II (Module-Based Directory Isolation): Expanded with backend (§2.2) and frontend (§2.3) internal directory structure, shared layer access control matrix (§2.4).
- Principle III (AI Agent Guardrails): No change.
- Principle IV (Security, Auth & Error Handling): Expanded with audit trail requirements (§6.4).
- Principle V (Global UI/UX Design System): Expanded with accessibility requirements (§9.9) and component specification rules.
- Principle VI (Detailed Design "Contract"): Expanded with tech stack, 4-layer architecture dependency rules, and path alias conventions from DD_COMMON_01 and DD_COMMON_02.
- Principle VII (Performance, API Design & Environment): Expanded with performance optimization strategies (§10.3).

Added Sections:
- Principle VIII: Git Branching, Commit & PR Standards (from DEVELOPMENT_RULES §3)

Removed Sections: None

Templates Requiring Updates:
- .specify/templates/plan-template.md (✅ updated — Principle VIII added to Constitution Check)
- .specify/templates/spec-template.md (✅ updated — FR for audit trail and accessibility added)
- .specify/templates/tasks-template.md (✅ updated — Polish phase references updated to cover JSDoc, import ordering, audit trail)

Follow-up TODOs: None — all placeholders resolved.
-->
# Payment Request Workflow Management System (PRWM) Constitution

## Core Principles

### I. Strict Naming Conventions, Type Safety & Documentation Standards

All developers and AI Agents MUST enforce strict naming, style, and documentation rules. Variables and functions
MUST use `camelCase`. Classes, components, modules, and interfaces MUST use `PascalCase`. TypeScript Enums and
Enum Members MUST use `PascalCase`. Database tables and columns MUST use `snake_case`. Environment variables
MUST use `SCREAMING_SNAKE_CASE`. Backend TypeScript files MUST use `kebab-case`. Frontend components MUST use
`PascalCase`; utility files MUST use `kebab-case`. Test files MUST mirror the source file name with a `.spec.ts`
suffix. DTO files MUST use `kebab-case` with a descriptive action prefix.

TypeScript `strict: true` is NON-NEGOTIABLE. Disabling `strictNullChecks`, `noImplicitAny`, or
`strictPropertyInitialization` is FORBIDDEN. The use of `any` type is strictly forbidden in application code;
`@typescript-eslint/no-explicit-any` is `off` only in third-party integration wrappers. All function parameters
and return types MUST be explicitly annotated. `interface` MUST be preferred for object shapes; `type` for
unions, intersections, and utility types.

All core services, controllers, gateways, guards, interceptors, and custom hooks MUST include JSDoc/TSDoc
formatted comments explaining business logic rationale (not code behavior). Required JSDoc tags for public
methods are `@description`, `@param`, `@returns`, and `@throws`.

All TypeScript files MUST organize imports in the following strict order (separated by blank lines):
(1) Node.js built-in modules, (2) NestJS / React framework imports, (3) third-party library imports,
(4) internal shared module imports (entities, DTOs, enums, guards), (5) local module imports.

Code formatting is governed by project-level ESLint and Prettier configurations. Prettier enforces `singleQuote:
true` and `trailingComma: all`. The pre-commit checklist MUST pass: `npm run lint` (zero errors), `npm run
format`, `npm run build` (zero TypeScript errors), `npm run test` (all unit tests pass).

### II. Module-Based Directory Isolation (Anti-Conflict Rules)

Each developer and AI Agent is locked to working inside their designated screen or role module (Applicant,
Manager, Approver, Accounting, Admin, Shared). Cross-contamination of files between role folders is a blocking
PR violation. Role modules MUST NEVER import directly from another role module. All inter-module communication
MUST occur through the shared entity layer, WebSocket gateway, or shared service abstractions. Modifying the
`shared` layer requires Project Leader written approval; deleting any shared file is FORBIDDEN under any
circumstances.

Each backend role module (`src/modules/{role}/`) MUST follow this internal layout: `{role}.module.ts`,
`{role}.controller.ts`, `{role}.service.ts`, `dto/` (request/response DTOs), `guards/` (role-specific guards if
any), and `tests/` (unit and integration tests). Each frontend role page directory
(`frontend/src/pages/{role}/`) MUST follow this layout: main dashboard component, form components, detail view,
`components/` (role-specific reusable), `hooks/` (role-specific custom hooks), `services/` (API calls), and
`utils/` (utility functions).

Shared layer access control: importing and using shared entities/DTOs/enums is ALLOWED for all modules without
approval; adding new files requires Project Leader written approval; modifying existing shared entities or
interfaces requires Project Leader written approval plus full regression testing.

### III. AI Agent Guardrails

AI agents MUST be fed context from `DEVELOPMENT_RULES` and target architecture documents before generating code.
Agents MUST NOT generate code outside their assigned role module. Agents MUST NOT modify `shared/` without
explicit human review and Project Leader approval, execute `npm install` or add dependencies without developer
confirmation, mutate database schemas (CREATE TABLE, ALTER TABLE, DROP) without Project Leader review, or modify
`.env`, `docker-compose.yml`, or CI/CD configuration files. Agents MUST NOT bypass TypeScript strict mode (no
`@ts-ignore` or `@ts-nocheck`). Agents MUST NOT delete or rename existing files without explicit human
instruction, generate mock data with real personal information or credentials, create new NestJS modules or
React route entries without human approval, or modify `main.ts`, `AppModule`, or global middleware chain.

Before staging any AI-generated code, developers MUST verify: type safety (no implicit `any`, no missing return
types), naming compliance, import correctness (no cross-module imports, proper ordering), business logic against
the state machine in the Requirements Specification, design system color tokens, security decorators on all
endpoints, and successful compilation (`npm run build`).

### IV. Security, Authentication, and Error Handling Standards

All endpoints MUST be protected with both `JwtAuthGuard` and `RolesGuard`. JWT uses RS256 signing; access
tokens TTL is 15 minutes; refresh tokens TTL is 7 days stored in HttpOnly cookies. Passwords MUST be hashed
with bcrypt using a minimum of 12 salt rounds. Sessions are stored in Redis with a 1-hour sliding TTL. CORS
origins MUST be whitelist-only via the `CORS_ORIGINS` environment variable. Rate limiting is 100 requests per
minute per IP globally, and 10 requests per minute per IP on auth endpoints, backed by Redis.

Input validation using `class-validator` and sanitization via `class-transformer` are mandatory on all DTO
classes. SQL injection is prevented by TypeORM parameterized queries; raw SQL using string concatenation is
FORBIDDEN. File uploads MUST validate MIME type against the whitelist (PDF, JPEG, JPG, PNG) and enforce a 10MB
per-file and 50MB aggregate per-request size limit.

All API error responses MUST conform to the standardized JSON structure with `statusCode`, `error`, `message`,
`timestamp`, and `path`. The exception hierarchy maps HTTP status codes to NestJS exceptions (400
`BadRequestException`, 401 `UnauthorizedException`, 403 `ForbiddenException`, 404 `NotFoundException`, 409
`ConflictException`, 422 `UnprocessableEntityException`, 429 `ThrottlerException`, 500
`InternalServerErrorException`).

All workflow state transitions MUST produce an immutable `approval_logs` record containing:
`payment_request_id`, `action_taken_by_user_id`, `action_type_id`, `previous_status_id`, `new_status_id`,
`comment` (mandatory for REJECT actions, minimum 10 characters), `ip_address`, `user_agent`, and server-side
UTC `timestamp`. Log output MUST NEVER contain passwords, tokens, or sensitive credentials.

### V. Global UI/UX Design System Compliance

The frontend MUST target a premium enterprise dashboard aesthetic. Developers and AI Agents MUST use the exact
Core Brand Colors and Workflow State Colors defined in the Development Rules. Primary Corporate: `#1E3A8A`
(navigation, headers, CTA). Background Canvas: `#F8FAFC`. Workflow State Colors: Draft gray (`#6B7280`),
In-Progress amber (`#D97706`), Verified sky blue (`#0284C7`), Approved/Paid emerald (`#059669`), Rejected red
(`#DC2626`). The mandatory Status Badge component structure (`inline-flex items-center px-2.5 py-0.5
rounded-full text-xs font-medium border`) MUST be used for all status displays.

Typography MUST use the `Inter` font (loaded via Google Fonts CDN) with the prescribed type scale: page titles
`text-2xl font-bold`, section headers `text-xl font-semibold`, body/form labels `text-sm font-medium`, badge
text `text-xs font-medium`. High-impact actions (deletions, approvals, rejections) MUST trigger custom modal
dialogs — standard browser `alert()` and `confirm()` popups are FORBIDDEN. Button placement MUST align primary
actions to the right and destructive actions to the left.

Contrast ratios MUST comply with WCAG 2.1 AA (minimum 4.5:1 for normal text, 3:1 for large text). All
interactive elements MUST have visible focus indicators (`focus:ring-2 focus:ring-offset-2`). Full keyboard
tab-order support is required with logical `tabIndex` management in modals. ARIA labels are mandatory on
icon-only buttons. Form errors MUST be programmatically associated via `aria-invalid` and `aria-describedby`.

### VI. Detailed Design "Contract" Enforcement & Architecture Compliance

The Detailed Design (詳細設計) is the final blueprint. The shared/common layer (`00_common`) MUST be understood
first before any module-specific development. If the code deviates from the design, one of them MUST be
updated. Developers MUST NOT touch files outside their assigned module path.

The system is a dual-application architecture: NestJS REST API backend (port 3000) and React SPA frontend
(Vite, port 5173), connected via HTTP and WebSocket (Socket.IO, port 3001). The mandated tech stack is: NestJS
11.x, TypeScript 5.7+, TypeORM 0.3.20, PostgreSQL 16, Redis (Memurai) 4+, Passport + JWT RS256, class-validator
/ class-transformer 0.14+, Socket.IO 4.8+, React 19, Vite 8.x, Tailwind CSS 3.x, react-router-dom 7.x, Axios
1.7+, lucide-react, Jest + Supertest.

The four-layer dependency model is NON-NEGOTIABLE: (1) Presentation → (2) API → (3) Business Logic → (4) Data
Access. Forbidden directions: Layer 2 → Layer 1, Layer 4 → Layer 3, Layer 1 → Layer 4 (direct DB access), and
cross-module imports. Path aliases MUST be used as configured: backend `@shared/*` → `src/modules/shared/*`,
`@modules/*` → `src/modules/*`, `@config/*` → `src/config/*`; frontend `@/*` → `src/*`.

### VII. Performance, API Design, and Environment Standards

API REST URLs MUST follow the `/api/v1/{role}/{resource}/{id?}/{action?}` convention with plural noun
kebab-case resource names and camelCase query parameters. All list endpoints MUST return paginated responses
with `data` and `meta` fields. Real-time WebSocket notifications MUST be delivered within 500ms latency from
status update to client delivery. All WebSocket connections MUST be authenticated via JWT token in the
`auth.token` handshake parameter.

Frontend dashboards MUST load in < 2 seconds (Lighthouse). API response times (P95) MUST be < 200ms for
standard CRUD. Dashboard query time MUST be < 500ms for complex aggregations. Bundle size MUST be < 250KB
gzipped initial chunk.

Performance optimization strategies MUST be applied: React.lazy() with Suspense for code splitting, Redis cache
for master data (`lookup:{table_name}`, 24h TTL) and payment request payloads (`payment_request:payload:{id}`,
10min TTL), composite database indexes on `(status_id, created_date DESC)` and `(current_assigned_to_user_id,
status_id)`, 300ms debounce on search/filter inputs, and virtual scrolling for lists exceeding 100 items.

Environment configuration MUST be validated via Joi schema on startup; missing or invalid variables MUST prevent
application boot. Committing `.env` files, hardcoding credentials, or exposing secrets in logs or commit
messages is FORBIDDEN. Production secrets MUST be managed through environment-specific secret managers.

### VIII. Git Branching, Commit & PR Standards

The project follows trunk-based development with short-lived feature branches. Branch naming conventions:
role-based features use `feature/{role}-{developer}`, screen-based features use
`feature/screen-[A-E]-{description}`, task-based features use `feature/task-{id}-{description}`, bug fixes use
`fix/{description}`, maintenance uses `chore/{description}`, and production hotfixes use
`hotfix/{description}`. Direct pushes to `main` or `develop` are blocked at the repository level; force-push is
disabled on protected branches.

All commits MUST enforce Conventional Commits semantic prefixes: `feat`, `fix`, `docs`, `refactor`, `test`,
`chore`, `style`, `perf`. Subject line maximum length is 72 characters in imperative mood without a trailing
period. Commit body, if provided, MUST be separated by a blank line and wrap at 80 characters.

Pull Requests MUST pass all automated gates before merging: build check (`npm run build` zero errors), lint
check (`npm run lint` zero errors), test suite (all unit tests pass), minimum 1 peer review approval, scope
validation (changes confined to assigned module), and commitlint enforcement. If the shared layer is modified,
Project Leader approval is additionally required. Each developer works exclusively on their assigned feature
branch; cross-branch commits are a blocking PR violation.

## Requirements and Testing Standards

Testing strategy includes Unit Tests (80% line coverage per service), Integration Tests (all critical workflow
paths), and E2E tests (all happy paths and critical edge cases). Test framework is Jest. Test files MUST be
named `{source-file-name}.spec.ts` placed in the `tests/` subdirectory within each module.

All workflow state transitions require dedicated test cases covering the full transition matrix (DRAFT →
SUBMITTED_MANAGER → MANAGER_REVIEWING → MANAGER_VERIFIED / REJECTED_MANAGER → SUBMITTED_APPROVER →
APPROVER_REVIEWING → APPROVED / REJECTED_APPROVER → PAID). Every transition test MUST include complementary
negative cases: invalid source status MUST throw `ConflictException`, unauthorized role MUST throw
`ForbiddenException`, rejection without minimum 10-character comment MUST throw `BadRequestException`,
submission with `has_receipt = true` and zero uploaded files MUST throw `UnprocessableEntityException`.

## Code Structure and Architecture

REST API URLs MUST follow the `/api/v1/{role}/{resource}/{id?}/{action?}` convention. The system relies on a
trunk-based development strategy with short-lived feature branches (`feature/{role}-{developer}`). The four-
layer architecture (Presentation → API → Business Logic → Data Access) governs all code organization. Modules
communicate only through the shared entity layer, WebSocket gateway, or shared service abstractions — never
through direct cross-module imports.

## Governance

The constitution supersedes all other practices. Any modifications or deviations require Project Leader approval
and documentation.

Pull Requests MUST pass automated build, lint, and test checks, plus peer review and Scope Validation (changes
confined to assigned module). All commits MUST enforce semantic prefixes (e.g., `feat:`, `fix:`, `docs:`).

**Version**: 2.2.0 | **Ratified**: 2026-06-12 | **Last Amended**: 2026-06-19
