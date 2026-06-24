# Development Rules Specification (開発ルール)

---

## Document Control (ドキュメント管理)

| Attribute | Value |
| :--- | :--- |
| **Document ID** | PRWM-DEV-001 |
| **System** | Payment Request Workflow Management System (支払申請ワークフロー管理システム) |
| **Document Classification** | MANDATORY — Source of Truth for All Developers and AI Agents |
| **Version** | 2.0 |
| **Created** | 2026-06-12 |
| **Last Updated** | 2026-06-12 |
| **Author** | Lead UI/UX Director & Enterprise Software Architect |
| **Status** | Released (承認済み) |
| **Compliance Level** | All rules in this document are BINDING. Non-compliance will result in automatic PR rejection. |

### Document Revision History

| Version | Date | Author | Description of Changes |
| :--- | :--- | :--- | :--- |
| 1.0 | 2026-06-12 | Lead Architect | Initial release — naming conventions, directory isolation, Git rules, AI guardrails, basic UI/UX design system |
| 2.0 | 2026-06-12 | Lead Architect | Complete production rewrite — added security standards, error handling, testing strategy, API design, full component specifications, performance targets, environment configuration, accessibility requirements |

---

## Table of Contents

1. [Naming Conventions & Coding Standards](#1-naming-conventions--coding-standards)
2. [Directory Isolation & Anti-Conflict Rules](#2-directory-isolation--anti-conflict-rules)
3. [Git Branching & Commit Conventions](#3-git-branching--commit-conventions)
4. [AI Agent Guardrails](#4-ai-agent-guardrails)
5. [Security & Authentication Standards](#5-security--authentication-standards)
6. [Error Handling & Logging Standards](#6-error-handling--logging-standards)
7. [Testing Strategy & Quality Gates](#7-testing-strategy--quality-gates)
8. [API Design & Communication Standards](#8-api-design--communication-standards)
9. [Global UI/UX Design System Specification](#9-global-uiux-design-system-specification)
10. [Performance & Optimization Standards](#10-performance--optimization-standards)
11. [Environment Configuration & Deployment](#11-environment-configuration--deployment)
12. [Document Revision History](#12-document-revision-history)

---

## 1. Naming Conventions & Coding Standards

All developers and AI Agents must enforce the following naming and style rules without exception. These rules guarantee type safety, structural consistency, and automated tooling compatibility across the entire monorepo.

### 1.1 Case Convention Matrix

| Scope | Convention | Examples | Enforced By |
| :--- | :--- | :--- | :--- |
| Variables & Functions (Backend & Frontend) | `camelCase` | `totalAmount`, `getRequestDetails`, `calculateBreakdownTotal` | ESLint |
| Classes, Components, Modules, Interfaces | `PascalCase` | `PaymentRequestService`, `ApplicantDashboard`, `SharedModule` | ESLint + TSC |
| TypeScript Enums & Enum Members | `PascalCase` | `PaymentStatus.ManagerVerified`, `UserRole.Applicant` | ESLint |
| Database Tables & Columns | `snake_case` | `payment_requests`, `request_number`, `payment_breakdown_item_id` | TypeORM Naming Strategy |
| Environment Variables | `SCREAMING_SNAKE_CASE` | `DATABASE_HOST`, `JWT_SECRET`, `REDIS_URL` | .env validation (Joi) |
| TypeScript Files (Backend) | `kebab-case` | `payment-request.entity.ts`, `applicant.controller.ts`, `create-request.dto.ts` | PR Review |
| TypeScript Files (Frontend) | `PascalCase` for components, `kebab-case` for utilities | `ApplicantDashboard.tsx`, `use-payment-form.ts` | PR Review |
| CSS Class Overrides (custom) | `kebab-case` | `status-badge-draft`, `modal-overlay-backdrop` | Tailwind + custom CSS |
| Test Files | Mirror source with `.spec.ts` suffix | `payment-request.service.spec.ts`, `applicant.controller.spec.ts` | Jest config |
| DTO Files | `kebab-case` with descriptive action prefix | `create-payment-request.dto.ts`, `update-request-status.dto.ts` | PR Review |

### 1.2 TypeScript Strict Rules

* `strict: true` must remain enabled in all `tsconfig.json` files. Disabling `strictNullChecks`, `noImplicitAny`, or `strictPropertyInitialization` is **FORBIDDEN**.
* All function parameters and return types must be explicitly annotated. Usage of the `any` type is prohibited in application code. The ESLint rule `@typescript-eslint/no-explicit-any` is set to `off` only for third-party integration wrappers; application-layer code must use precise types or generics.
* Prefer `interface` for object shape declarations and `type` for unions, intersections, and utility types.

### 1.3 Comments & Documentation

* All core services, controllers, gateways, guards, interceptors, and custom hooks must include descriptive JSDoc/TSDoc formatted comments.
* Comments must explain the **business logic rationale**, not restate the obvious code behavior.
* Required JSDoc tags for public methods:
  - `@description` — Business purpose of the method.
  - `@param` — Each parameter with type and purpose.
  - `@returns` — Return value description.
  - `@throws` — Expected exception types and conditions.

```typescript
/**
 * @description Transitions the payment request to MANAGER_REVIEWING status.
 * Triggered automatically when a manager opens a SUBMITTED_MANAGER request.
 * Records an immutable approval log entry with the action MGR_REVIEW_START.
 *
 * @param requestId - The payment_request_id to transition.
 * @param managerId - The authenticated manager's user_id performing the review.
 * @param ipAddress - Client IP address for audit trail recording.
 * @returns The updated PaymentRequest entity with new status.
 * @throws ForbiddenException if the request is not in SUBMITTED_MANAGER state.
 * @throws NotFoundException if the requestId does not exist or is soft-deleted.
 */
async startManagerReview(
  requestId: number,
  managerId: number,
  ipAddress: string,
): Promise<PaymentRequest> { ... }
```

### 1.4 Linting & Formatting Enforcement

Code formatting is governed by the project-level ESLint and Prettier configurations. Compliance is mandatory and automatically enforced.

**Prettier Configuration (`.prettierrc`):**

| Setting | Value | Rationale |
| :--- | :--- | :--- |
| `singleQuote` | `true` | Consistency across NestJS backend and React frontend |
| `trailingComma` | `all` | Cleaner Git diffs on multi-line structures |

**ESLint Configuration (`eslint.config.mjs`):**

| Rule | Setting | Rationale |
| :--- | :--- | :--- |
| `@typescript-eslint/no-explicit-any` | `off` | Allowed only in third-party wrappers; application code must avoid `any` |
| `@typescript-eslint/no-floating-promises` | `warn` | Prevent unhandled async operations |
| `@typescript-eslint/no-unsafe-argument` | `warn` | Guard against unsafe type coercions |
| `prettier/prettier` | `error` with `endOfLine: auto` | Cross-platform line ending normalization |

**Pre-Commit Checklist:**

1. Run `npm run lint` — 0 errors, 0 warnings allowed.
2. Run `npm run build` — Backend must compile without TS errors.
3. Run `npm run test` — All tests must pass.

### 1.5 Import Ordering Convention

All TypeScript files must organize imports in the following strict order, separated by blank lines:

```typescript
// 1. Node.js built-in modules
import { join } from 'path';

// 2. NestJS / React framework imports
import { Injectable, ForbiddenException } from '@nestjs/common';

// 3. Third-party library imports
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// 4. Internal shared module imports (entities, DTOs, enums, guards)
import { PaymentRequest } from '../shared/entities/payment-request.entity';
import { PaymentStatus } from '../shared/enums/payment-status.enum';

// 5. Local module imports (same feature module)
import { CreatePaymentRequestDto } from './dto/create-payment-request.dto';
```

---

## 2. Directory Isolation & Anti-Conflict Rules

To prevent code regression, Git merge conflicts, and uncoordinated changes across overlapping features, the project enforces strict module-based directory isolation.

### 2.1 Role-Based Module Ownership Matrix

Each developer and AI Agent is strictly locked to working inside their designated screen or role module. Cross-contamination of files between different role folders is a **blocking PR violation**.

| Role Module | Backend Path | Frontend Path | Scope |
| :--- | :--- | :--- | :--- |
| **Applicant** | `src/modules/applicant/` | `frontend/src/pages/applicant/` | Draft CRUD, submission, re-submission, receipt upload |
| **Manager** | `src/modules/manager/` | `frontend/src/pages/manager/` | Verification queue, verify/reject actions |
| **Approver** | `src/modules/approver/` | `frontend/src/pages/approver/` | Final approval queue, approve/reject actions |
| **Accounting** | `src/modules/accounting/` | `frontend/src/pages/accounting/` | Payment processing queue, Mandalay branch alerts |
| **Admin** | `src/modules/admin/` | `frontend/src/pages/admin/` | User CRUD, master data management, audit log viewer |
| **Shared** | `src/modules/shared/` | `frontend/src/components/shared/` | Entities, DTOs, enums, guards, pipes, WebSocket gateway |

### 2.2 Backend Module Internal Structure

Each role module (`src/modules/{role}/`) must follow this internal directory layout:

```
src/modules/applicant/
├── applicant.module.ts          # NestJS module definition
├── applicant.controller.ts      # REST API route handlers
├── applicant.service.ts         # Business logic layer
├── dto/                         # Request/Response DTOs
│   ├── create-payment-request.dto.ts
│   ├── update-payment-request.dto.ts
│   └── submit-to-manager.dto.ts
├── guards/                      # Role-specific route guards (if any)
└── tests/                       # Unit and integration tests
    ├── applicant.controller.spec.ts
    └── applicant.service.spec.ts
```

### 2.3 Frontend Module Internal Structure

Each role page directory (`frontend/src/pages/{role}/`) must follow this internal layout:

```
frontend/src/pages/applicant/
├── ApplicantDashboard.tsx       # Main dashboard page component
├── CreateRequestForm.tsx        # Payment request creation form
├── EditRequestForm.tsx          # Draft/rejected request editor
├── RequestDetailView.tsx        # Read-only request detail viewer
├── components/                  # Role-specific reusable components
│   ├── BreakdownItemTable.tsx
│   ├── ReceiptUploader.tsx
│   └── StatusBadge.tsx
├── hooks/                       # Role-specific custom hooks
│   ├── use-draft-requests.ts
│   └── use-submit-request.ts
└── utils/                       # Role-specific utility functions
    └── calculate-total.ts
```

### 2.4 Shared Layer Access Control

The shared layer contains PostgreSQL/TypeORM entities, global Redis providers, WebSocket gateway hubs, common guards, pipes, and interceptors.

**Access Rules:**

| Action | Permission Level | Required Approval |
| :--- | :--- | :--- |
| Import and use shared entities/DTOs/enums | ALLOWED for all modules | None |
| Add new files to shared layer | RESTRICTED | Project Leader written approval |
| Modify existing shared entities or interfaces | RESTRICTED | Project Leader written approval + full regression test |
| Delete any shared file | FORBIDDEN | Not permitted under any circumstances |

### 2.5 Cross-Module Communication

* Role modules must **never** import directly from another role module. All inter-module data exchange must occur through:
  1. The shared entity layer (database-level joins via TypeORM relations).
  2. The WebSocket gateway hub (real-time event broadcast from `src/modules/shared/gateways/`).
  3. Shared service abstractions exposed via the `SharedModule` exports.
* **Example of a FORBIDDEN import:**

```typescript
// FORBIDDEN — Direct cross-module import
import { ManagerService } from '../manager/manager.service';
```

* **Correct pattern:**

```typescript
// CORRECT — Use shared entities and services
import { PaymentRequest } from '../shared/entities/payment-request.entity';
import { NotificationGateway } from '../shared/gateways/notification.gateway';
```

---

## 3. Git Branching & Commit Conventions

### 3.1 Branch Strategy

The project follows a trunk-based development model with short-lived feature branches.

```
main (protected)
 ├── develop (integration branch)
 │   ├── feature/screen-A-draft-save
 │   ├── feature/screen-B-manager-verify
 │   ├── feature/screen-C-approver-dashboard
 │   ├── feature/screen-D-accounting-payment
 │   ├── feature/screen-E-admin-user-mgmt
 │   ├── fix/totalAmount-precision-rounding
 │   └── chore/database-migration-v1.2
 └── release/v1.0.0 (tagged release)
```

#### 3.1.1 Active Developer Feature Branches

Each role module is assigned a dedicated feature branch for the current development sprint. Developers must only commit to their assigned branch.

| Role Module | Feature Branch | Scope |
| :--- | :--- | :--- |
| Applicant | `feature/applicant-soehtetlin` | Applicant dashboard, draft CRUD, submission, receipt upload |
| Manager | `feature/manager-ayethandarmoe` | Manager verification queue, verify/reject actions |
| Final Approver | `feature/approver-khaingthinthinwin` | Approver dashboard, final approval/rejection actions |
| Accounting | `feature/accounting-shinminthant` | Accounting payment processing queue, Mandalay branch alerts |
| Admin | `feature/admin-yemaungmaung` | Admin panel, user CRUD, master data management, audit logs |

**Branch Isolation Rules:**
* Each developer works **exclusively** on their assigned feature branch.
* Cross-branch commits (e.g., an Applicant developer committing to the Manager branch) are a **blocking PR violation**.
* All feature branches are created from `master` and will be merged back via Pull Request after review.

**Branch Naming Rules:**

| Branch Type | Pattern | Example |
| :--- | :--- | :--- |
| Feature (role-based) | `feature/{role}-{developer}` | `feature/applicant-soehtetlin` |
| Feature (screen-based) | `feature/screen-[A-E]-{description}` | `feature/screen-A-draft-save` |
| Feature (task-based) | `feature/task-{id}-{description}` | `feature/task-102-migration` |
| Bug Fix | `fix/{description}` | `fix/totalAmount-precision-rounding` |
| Chore / Maintenance | `chore/{description}` | `chore/upgrade-nestjs-v11` |
| Hotfix (production) | `hotfix/{description}` | `hotfix/jwt-token-expiry` |

**Protection Rules:**
* Direct pushes to `main` or `develop` are blocked at the repository level.
* All changes must flow through Pull Requests.
* Force-push is disabled on `main` and `develop`.

### 3.2 Commit Message Format

All commits must enforce semantic prefixes to enable automatic changelog generation and audit compliance. The format follows Conventional Commits specification.

**Format:** `{prefix}: {concise description in imperative mood}`

| Prefix | Usage | Example |
| :--- | :--- | :--- |
| `feat` | New feature implementations | `feat: implement applicant draft creation API` |
| `fix` | Bug resolution | `fix: resolve totalAmount NUMERIC precision rounding error` |
| `docs` | Documentation changes only | `docs: update database schema specification v1.1` |
| `refactor` | Code improvements without behavior change | `refactor: extract breakdown calculation to shared utility` |
| `test` | Adding or updating tests | `test: add unit tests for manager verification flow` |
| `chore` | Build, CI/CD, dependency updates | `chore: upgrade TypeORM to v0.3.20` |
| `style` | Formatting-only changes (no logic) | `style: apply Prettier formatting to accounting module` |
| `perf` | Performance improvement | `perf: add composite index for dashboard query optimization` |

**Commit Rules:**
* Maximum subject line length: **72 characters**.
* Use imperative mood: "add" not "added", "fix" not "fixed".
* Do not end the subject line with a period.
* Body (optional) must be separated by a blank line and wrap at 80 characters.

### 3.3 Pull Request (PR) Policy

Merging to `develop` or `main` requires all of the following conditions:

| Gate | Requirement | Automated |
| :--- | :--- | :--- |
| Build Check | `npm run build` succeeds with zero errors | Yes (CI) |
| Lint Check | `npm run lint` reports zero errors | Yes (CI) |
| Test Suite | `npm run test` — all unit tests pass | Yes (CI) |
| Peer Review | Minimum 1 approval from a team member | Manual |
| Scope Validation | Changes are confined to the developer's assigned module directory | Manual |
| Shared Layer | If shared layer is modified, Project Leader must approve | Manual |
| Commit Format | All commits follow semantic prefix convention | Yes (commitlint) |

**PR Description Template:**

```markdown
## Summary
[Concise description of what this PR accomplishes]

## Screen/Module
[Screen-A / Screen-B / Screen-C / Screen-D / Screen-E / Shared]

## Changes
- [List of specific changes]

## Testing
- [ ] Unit tests added/updated
- [ ] Manual testing completed
- [ ] Build passes locally

## Screenshots (if UI changes)
[Attach before/after screenshots]
```

---

## 4. AI Agent Guardrails

When using agentic coding assistants (Cursor, Gemini, GitHub Copilot, or automated subagents), the following guardrails are mandatory to prevent architectural drift, style violations, and unauthorized modifications.

### 4.1 Mandatory Context Injection

Before triggering any code generation or code edit operation, the developer **must** feed the following documents as active system context boundaries:

| Priority | Document | Purpose |
| :--- | :--- | :--- |
| P0 (Critical) | `docs/02_開発ルール_DEVELOPMENT_RULES.md` (this file) | Architecture rules, naming conventions, design system |
| P0 (Critical) | Target screen design document from `docs/screens/` | Screen-specific field definitions, validation rules, layout |
| P1 (Required) | `docs/01_要件定義書_REQUIREMENT_SPEC.md` | Business rules, workflow transitions, special conditions |
| P2 (Reference) | `docs/03_データベース設計書_DATABASE_SPEC.md` | Entity schemas, column types, constraints |

### 4.2 Generation Scope Restrictions

| Rule | Description |
| :--- | :--- |
| **Module Boundary** | AI agents must NOT generate or modify code outside their assigned role module directory. |
| **Shared Layer Lock** | AI agents must NEVER modify files in `src/modules/shared/` without explicit human review and Project Leader approval. |
| **No Auto-Install** | AI agents must NOT execute `npm install` or add new dependencies without developer confirmation. |
| **No Schema Mutations** | AI agents must NOT generate or execute database migration scripts (`CREATE TABLE`, `ALTER TABLE`, `DROP`) without Project Leader review. |
| **No Environment Changes** | AI agents must NOT modify `.env`, `docker-compose.yml`, or CI/CD configuration files. |

### 4.3 Output Verification Checklist

Developers must perform the following checks on ALL AI-generated code before staging:

1. **Type Safety:** Verify all types are explicit — no implicit `any`, no missing return types, no untyped parameters.
2. **Naming Compliance:** Confirm all variables, functions, classes, and files follow Section 1.1 naming conventions.
3. **Import Correctness:** Verify no cross-module imports (Section 2.5) and proper import ordering (Section 1.5).
4. **Business Logic:** Cross-reference generated workflow transitions against the state machine defined in `01_要件定義書` Section 4.
5. **Design System:** Confirm all UI components use the exact color tokens, spacing, and typography defined in Section 9 of this document.
6. **Security:** Verify all endpoints include proper `@UseGuards(JwtAuthGuard, RolesGuard)` decorators and `@Roles()` annotations.
7. **Compilation:** Run `npm run build` — zero errors required before staging.

### 4.4 Prohibited AI Actions

The following actions are **strictly forbidden** for AI agents under all circumstances:

* Deleting or renaming existing files without explicit human instruction.
* Generating mock data that contains real personal information, financial data, or credentials.
* Bypassing TypeScript strict mode by adding `// @ts-ignore` or `// @ts-nocheck` comments.
* Creating new NestJS modules or React route entries without human approval.
* Modifying the `main.ts` bootstrap file, `AppModule`, or global middleware chain.

---

## 5. Security & Authentication Standards

### 5.1 Authentication Architecture

| Component | Implementation | Details |
| :--- | :--- | :--- |
| Token Format | JWT (JSON Web Token) | RS256 signing algorithm with asymmetric key pair |
| Access Token TTL | 15 minutes | Short-lived to minimize exposure window |
| Refresh Token TTL | 7 days | Stored in HttpOnly cookie, rotated on use |
| Password Hashing | bcrypt | Minimum 12 salt rounds |
| Session Store | Redis | Key pattern: `session:{session_token}` with 1-hour sliding TTL |

### 5.2 JWT Payload Structure

```typescript
interface JwtPayload {
  sub: number;          // user_id (primary key)
  email: string;        // user email address
  role: string;         // role_code from user_roles table (e.g., 'APPLICANT')
  branch: string;       // user branch name (critical for Mandalay alert logic)
  employeeNumber: string;
  iat: number;          // issued at timestamp
  exp: number;          // expiration timestamp
}
```

### 5.3 Role-Based Access Control (RBAC) Enforcement

Every API endpoint must be protected with both authentication and authorization decorators:

```typescript
@Controller('api/v1/applicant')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Applicant)
export class ApplicantController {
  // All routes in this controller are restricted to APPLICANT role only
}
```

**RBAC Enforcement Matrix:**

| Endpoint Scope | Allowed Roles | Guard Stack |
| :--- | :--- | :--- |
| `/api/v1/applicant/*` | `APPLICANT` | `JwtAuthGuard` + `RolesGuard` |
| `/api/v1/manager/*` | `MANAGER` | `JwtAuthGuard` + `RolesGuard` |
| `/api/v1/approver/*` | `APPROVER` | `JwtAuthGuard` + `RolesGuard` |
| `/api/v1/accounting/*` | `ACCOUNTING` | `JwtAuthGuard` + `RolesGuard` |
| `/api/v1/admin/*` | `ADMIN` | `JwtAuthGuard` + `RolesGuard` |
| `/api/v1/auth/login` | Public | None (rate-limited) |
| `/api/v1/auth/refresh` | Authenticated | `JwtAuthGuard` |
| `/api/v1/shared/lookups` | All authenticated | `JwtAuthGuard` |

### 5.4 Input Validation & Sanitization

* All incoming request bodies must be validated using `class-validator` decorators on DTO classes.
* All string inputs must be sanitized using `class-transformer` with `@Transform()` to trim whitespace and strip HTML.
* SQL injection is prevented by TypeORM parameterized queries — raw SQL queries using string concatenation are **FORBIDDEN**.
* File uploads must validate MIME type against the whitelist: `application/pdf`, `image/jpeg`, `image/jpg`, `image/png`.
* Maximum file size validation: 10MB per file, 50MB aggregate per payment request.

```typescript
export class CreatePaymentRequestDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => value?.trim())
  purpose: string;

  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(999999999999.99)
  totalAmount: number;

  @IsNotEmpty()
  @IsDateString()
  desiredPaymentDate: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(15)
  @ValidateNested({ each: true })
  @Type(() => BreakdownItemDto)
  breakdownItems: BreakdownItemDto[];
}
```

### 5.5 CORS & Rate Limiting

| Setting | Value |
| :--- | :--- |
| CORS Origins | Whitelist-only: configured via `CORS_ORIGINS` env variable |
| Rate Limit (Global) | 100 requests per minute per IP |
| Rate Limit (Auth endpoints) | 10 requests per minute per IP |
| Rate Limit Storage | Redis key: `ratelimit:{ip}:{endpoint}` with 60-second TTL |

---

## 6. Error Handling & Logging Standards

### 6.1 HTTP Error Response Format

All API error responses must conform to the following standardized JSON structure:

```json
{
  "statusCode": 403,
  "error": "Forbidden",
  "message": "You do not have permission to access this payment request.",
  "timestamp": "2026-06-12T05:30:00.000Z",
  "path": "/api/v1/manager/requests/142"
}
```

### 6.2 Exception Hierarchy

| HTTP Status | NestJS Exception | Usage Context |
| :--- | :--- | :--- |
| 400 | `BadRequestException` | Validation failures, malformed input, business rule violations |
| 401 | `UnauthorizedException` | Missing or expired JWT token |
| 403 | `ForbiddenException` | Valid token but insufficient role permissions |
| 404 | `NotFoundException` | Requested resource not found or soft-deleted |
| 409 | `ConflictException` | Invalid state transition (e.g., approving a DRAFT) |
| 422 | `UnprocessableEntityException` | Receipt file missing when `has_receipt` is true |
| 429 | `ThrottlerException` | Rate limit exceeded |
| 500 | `InternalServerErrorException` | Unhandled server errors (must log full stack trace) |

### 6.3 Logging Architecture

| Log Level | Usage | Output Target |
| :--- | :--- | :--- |
| `ERROR` | Unhandled exceptions, database connection failures, critical failures | File + Console + Alert |
| `WARN` | Deprecated API usage, approaching rate limits, retry attempts | File + Console |
| `LOG` | Workflow state transitions, approval actions, payment completions | File + Console |
| `DEBUG` | Detailed request/response payloads, query execution times | File only (dev/staging) |
| `VERBOSE` | Granular internal method tracing | Disabled in production |

**Mandatory Log Fields:**

```typescript
{
  timestamp: string;       // ISO 8601 UTC format
  level: string;           // ERROR | WARN | LOG | DEBUG
  context: string;         // Service or controller class name
  message: string;         // Human-readable description
  userId?: number;         // Authenticated user ID (if available)
  requestId?: string;      // Correlation ID for request tracing
  ipAddress?: string;      // Client IP for audit trail
  duration?: number;       // Operation duration in milliseconds
}
```

### 6.4 Audit Trail Requirements

All workflow state transitions must produce an immutable `approval_logs` record containing:

| Field | Source | Required |
| :--- | :--- | :--- |
| `payment_request_id` | Path parameter | Always |
| `action_taken_by_user_id` | JWT payload `sub` | Always |
| `action_type_id` | Mapped from `approval_action_types` master | Always |
| `previous_status_id` | Current entity `status_id` before transition | Always |
| `new_status_id` | Target status after transition | Always |
| `comment` | Request body (mandatory for REJECT actions, min 10 chars) | Conditional |
| `ip_address` | Request header `x-forwarded-for` or socket address | Always |
| `user_agent` | Request header `user-agent` | Always |
| `timestamp` | Server-side UTC timestamp | Always (auto) |

---

## 7. Testing Strategy & Quality Gates

### 7.1 Test Coverage Requirements

| Test Type | Minimum Coverage | Scope |
| :--- | :--- | :--- |
| Unit Tests | 80% line coverage per service | Service layer business logic |
| Integration Tests | All critical workflow paths | State transition sequences |
| E2E Tests | All happy paths + critical edge cases | Full API request lifecycle |

### 7.2 Unit Test Standards

* Test framework: **Jest** (pre-configured in NestJS scaffold).
* File naming: `{source-file-name}.spec.ts` placed in `tests/` subdirectory within each module.
* Each test file must include the following test categories:

```typescript
describe('ApplicantService', () => {
  describe('createDraftRequest', () => {
    it('should create a new payment request in DRAFT status', async () => { ... });
    it('should generate request number in PRF-YYYY-XXXXXX format', async () => { ... });
    it('should throw BadRequestException when totalAmount is zero', async () => { ... });
    it('should throw BadRequestException when breakdownItems exceed 15', async () => { ... });
  });

  describe('submitToManager', () => {
    it('should transition status from DRAFT to SUBMITTED_MANAGER', async () => { ... });
    it('should throw ConflictException when request is not in DRAFT status', async () => { ... });
    it('should throw UnprocessableEntityException when has_receipt is true but no files uploaded', async () => { ... });
    it('should create an immutable approval log entry', async () => { ... });
  });
});
```

### 7.3 Workflow State Transition Test Matrix

All workflow transitions defined in the Requirement Specification Section 4 must have dedicated test cases:

| From Status | Action | To Status | Test Required |
| :--- | :--- | :--- | :--- |
| `DRAFT` | Submit to Manager | `SUBMITTED_MANAGER` | YES |
| `SUBMITTED_MANAGER` | Manager opens detail view | `MANAGER_REVIEWING` | YES (auto-transition) |
| `MANAGER_REVIEWING` | Manager verifies | `MANAGER_VERIFIED` | YES |
| `MANAGER_REVIEWING` | Manager rejects | `REJECTED_MANAGER` | YES (comment >= 10 chars) |
| `REJECTED_MANAGER` | Applicant resubmits | `SUBMITTED_MANAGER` | YES |
| `MANAGER_VERIFIED` | Applicant submits to Approver | `SUBMITTED_APPROVER` | YES |
| `SUBMITTED_APPROVER` | Approver opens detail view | `APPROVER_REVIEWING` | YES (auto-transition) |
| `APPROVER_REVIEWING` | Approver approves | `APPROVED` | YES |
| `APPROVER_REVIEWING` | Approver rejects | `REJECTED_APPROVER` | YES (comment >= 10 chars) |
| `REJECTED_APPROVER` | Applicant resubmits | `SUBMITTED_MANAGER` | YES (full restart) |
| `APPROVED` | Accounting marks paid | `PAID` | YES (terminal state) |

### 7.4 Negative Test Requirements

Every transition test must include complementary negative cases:

* Attempting a transition from an invalid source status must throw `ConflictException`.
* Attempting an action by an unauthorized role must throw `ForbiddenException`.
* Rejection without a comment or with fewer than 10 characters must throw `BadRequestException`.
* Submission with `has_receipt = true` and zero uploaded files must throw `UnprocessableEntityException`.
* Deletion of a non-DRAFT request must throw `ForbiddenException`.

### 7.5 Test Execution Commands

```bash
# Run all unit tests
npm run test

# Run tests with coverage report
npm run test:cov

# Run tests for a specific module
npm run test -- --testPathPattern=applicant

# Run E2E tests
npm run test:e2e
```

---

## 8. API Design & Communication Standards

### 8.1 REST API URL Convention

All API endpoints follow a versioned, resource-oriented URL structure:

```
/api/v1/{role}/{resource}/{id?}/{action?}
```

**URL Design Rules:**

| Rule | Convention | Example |
| :--- | :--- | :--- |
| API Version Prefix | `/api/v1/` | All endpoints |
| Role Namespace | Lowercase role name | `/api/v1/applicant/` |
| Resource Name | Plural nouns in kebab-case | `/api/v1/applicant/payment-requests` |
| Resource ID | Numeric path parameter | `/api/v1/applicant/payment-requests/142` |
| Action Sub-resource | Verb in kebab-case | `/api/v1/applicant/payment-requests/142/submit-to-manager` |
| Query Parameters | camelCase | `?statusId=2&page=1&pageSize=20` |

### 8.2 Standard REST Methods

| HTTP Method | Purpose | Request Body | Example |
| :--- | :--- | :--- | :--- |
| `GET` | Retrieve resource(s) | None | `GET /api/v1/applicant/payment-requests` |
| `POST` | Create new resource | JSON DTO | `POST /api/v1/applicant/payment-requests` |
| `PATCH` | Partial update | JSON DTO (partial) | `PATCH /api/v1/applicant/payment-requests/142` |
| `DELETE` | Logical delete (soft) | None | `DELETE /api/v1/applicant/payment-requests/142` |
| `POST` | Workflow actions | JSON DTO (optional) | `POST /api/v1/manager/payment-requests/142/verify` |

### 8.3 Pagination Response Format

All list endpoints must return paginated responses using the following structure:

```json
{
  "data": [ ... ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 142,
    "totalPages": 8
  }
}
```

### 8.4 WebSocket Event Standards

Real-time notifications are delivered via WebSocket using Socket.IO through the shared gateway hub.

**Event Naming Convention:** `{domain}:{action}` in lowercase kebab-case.

| Event Name | Payload | Triggered When | Target Audience |
| :--- | :--- | :--- | :--- |
| `request:status-changed` | `{ requestId, oldStatus, newStatus, updatedBy }` | Any workflow state transition | All users assigned to the request |
| `request:new-submission` | `{ requestId, requestNumber, applicantName }` | Applicant submits to Manager | Assigned Manager |
| `request:approved` | `{ requestId, requestNumber, approverName }` | Final Approver approves | Applicant + Accounting |
| `request:rejected` | `{ requestId, requestNumber, rejectedBy, comment }` | Manager or Approver rejects | Applicant |
| `request:payment-completed` | `{ requestId, requestNumber }` | Accounting marks as paid | Applicant |

**WebSocket Connection Rules:**
* All WebSocket connections must be authenticated via JWT token passed in the `auth.token` handshake parameter.
* Redis Set key `websocket:user:{id}:sockets` tracks active socket IDs per user with a 2-hour TTL.
* Event propagation latency must not exceed 500ms from status update to client delivery (NFR requirement).

---

## 9. Global UI/UX Design System Specification

This section defines the absolute visual source of truth for all frontend components. Every developer and AI Agent generating React/Tailwind code must use these exact tokens. Deviation is a **blocking PR violation**.

### 9.1 Design Philosophy

The system targets a **premium enterprise dashboard** aesthetic — clean, data-dense, and professional. The design language prioritizes:

* **Clarity over decoration:** Every visual element must serve an information purpose.
* **Density with readability:** Dashboard layouts maximize data visibility without sacrificing scan-ability.
* **Status at a glance:** Workflow states must be instantly recognizable through consistent color coding.
* **Accessibility baseline:** WCAG 2.1 AA contrast ratio compliance on all text/background combinations.

### 9.2 Color System (Theme Palette)

#### 9.2.1 Core Brand Colors

| Token Name | Hex Value | Tailwind Class | Usage |
| :--- | :--- | :--- | :--- |
| Primary Corporate | `#1E3A8A` | `bg-blue-900` / `text-blue-900` | Navigation bar, primary headers, CTA buttons |
| Primary Hover | `#1E40AF` | `bg-blue-800` | Button hover states, active nav items |
| Primary Light | `#DBEAFE` | `bg-blue-100` | Selected row highlights, active tab backgrounds |
| Background Canvas | `#F8FAFC` | `bg-slate-50` | Page body background (reduces eye strain) |
| Card Surface | `#FFFFFF` | `bg-white` | Card containers, modal surfaces, form panels |
| Border Default | `#E2E8F0` | `border-slate-200` | Card borders, input borders, dividers |
| Border Focus | `#6366F1` | `ring-indigo-500` | Input focus rings, active element outlines |
| Text Primary | `#0F172A` | `text-slate-900` | Headings, primary body text |
| Text Secondary | `#64748B` | `text-slate-500` | Descriptions, timestamps, helper text |
| Text Muted | `#94A3B8` | `text-slate-400` | Placeholders, disabled states |

#### 9.2.2 Workflow State Colors (Strict Consistency)

Workflow status labels and badges must apply these exact colors consistently across ALL dashboards, detail views, and notification indicators:

| State Category | Status Codes | Hex Value | Tailwind BG | Tailwind Text | Badge Style |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Draft** | `DRAFT` | `#6B7280` | `bg-gray-100` | `text-gray-700` | `bg-gray-100 text-gray-700 border border-gray-200` |
| **In Progress** | `SUBMITTED_MANAGER`, `MANAGER_REVIEWING`, `SUBMITTED_APPROVER`, `APPROVER_REVIEWING` | `#D97706` | `bg-amber-50` | `text-amber-700` | `bg-amber-50 text-amber-700 border border-amber-200` |
| **Verified** | `MANAGER_VERIFIED` | `#0284C7` | `bg-sky-50` | `text-sky-700` | `bg-sky-50 text-sky-700 border border-sky-200` |
| **Approved** | `APPROVED` | `#059669` | `bg-emerald-50` | `text-emerald-700` | `bg-emerald-50 text-emerald-700 border border-emerald-200` |
| **Rejected** | `REJECTED_MANAGER`, `REJECTED_APPROVER` | `#DC2626` | `bg-red-50` | `text-red-700` | `bg-red-50 text-red-700 border border-red-200` |
| **Completed** | `PAID` | `#059669` | `bg-emerald-100` | `text-emerald-800` | `bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold` |

**Status Badge Component Specification:**

```tsx
// MANDATORY badge structure for ALL status displays
<span className={`
  inline-flex items-center
  px-2.5 py-0.5
  rounded-full
  text-xs font-medium
  border
  ${statusColorClasses[status]}
`}>
  {statusDisplayName}
</span>
```

#### 9.2.3 Semantic Action Colors

| Action Type | Hex Value | Tailwind Class | Usage |
| :--- | :--- | :--- | :--- |
| Primary Action | `#1E3A8A` | `bg-blue-900 hover:bg-blue-800` | Submit, Save, Create buttons |
| Positive Action | `#059669` | `bg-emerald-600 hover:bg-emerald-700` | Approve, Verify, Confirm buttons |
| Destructive Action | `#DC2626` | `bg-red-600 hover:bg-red-700` | Reject, Delete buttons |
| Neutral Action | `#FFFFFF` | `bg-white border-slate-300 hover:bg-slate-50` | Cancel, Back, Secondary buttons |
| Disabled State | `#CBD5E1` | `bg-slate-300 cursor-not-allowed` | Inactive buttons, locked fields |

### 9.3 Typography System

#### 9.3.1 Font Stack

```css
font-family: 'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif;
```

The `Inter` font must be loaded via Google Fonts CDN link in `index.html`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

#### 9.3.2 Type Scale

| Element | Tailwind Class | Size | Weight | Line Height | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Page Title | `text-2xl font-bold` | 24px | 700 | 32px | Main page heading (single `<h1>` per page) |
| Section Header | `text-xl font-semibold` | 20px | 600 | 28px | Card titles, section containers |
| Sub-header | `text-lg font-medium` | 18px | 500 | 28px | Sub-section titles, modal headers |
| Body / Form Labels | `text-sm font-medium` | 14px | 500 | 20px | Form field labels, table headers |
| Body Text / Inputs | `text-sm font-normal` | 14px | 400 | 20px | Body paragraphs, input values |
| Table Cell Data | `text-sm font-normal` | 14px | 400 | 20px | Standard table cell content |
| Breakdown Line Items | `text-xs font-normal` | 12px | 400 | 16px | Dense breakdown item tables |
| Helper / Caption | `text-xs font-normal` | 12px | 400 | 16px | Timestamps, helper text, validation messages |
| Badge Text | `text-xs font-medium` | 12px | 500 | 16px | Status badges, count indicators |

### 9.4 Spacing & Layout System

#### 9.4.1 Grid System

| Context | Layout | Specification |
| :--- | :--- | :--- |
| Page Container | Max width centered | `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` |
| Dashboard Grid | Responsive columns | `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6` |
| Content Area | Single column with sidebar | Sidebar: `w-64`, Content: `flex-1` |
| Form Layout | Two-column responsive | `grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4` |

#### 9.4.2 Spacing Scale

| Token | Value | Usage |
| :--- | :--- | :--- |
| `p-4` (16px) | Standard card padding | Card inner content padding |
| `p-6` (24px) | Generous card padding | Form containers, modal content |
| `gap-4` (16px) | Standard grid gap | Between form fields, between cards in a row |
| `gap-6` (24px) | Section gap | Between major content sections |
| `mb-1` (4px) | Tight spacing | Label to input field |
| `mb-4` (16px) | Standard vertical spacing | Between form groups |
| `mb-8` (32px) | Section separation | Between major page sections |
| `space-y-4` (16px) | Vertical stack spacing | Stacked card lists, form sections |

### 9.5 Component Specifications

#### 9.5.1 Card Container

The primary content wrapper used across all dashboards and detail views:

```tsx
<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
  <h2 className="text-xl font-semibold text-slate-900 mb-4">
    {sectionTitle}
  </h2>
  {children}
</div>
```

**Card Rules:**
* Corner radius: `rounded-xl` (12px) — consistent on all cards.
* Shadow: `shadow-sm` — subtle depth without heavy elevation.
* Border: `border border-slate-200` — thin border for definition.
* Padding: `p-6` for content cards, `p-4` for compact data cards.

#### 9.5.2 Data Table

All dashboard list views must use the following table structure:

```tsx
<div className="overflow-x-auto">
  <table className="min-w-full divide-y divide-slate-200">
    <thead>
      <tr className="bg-slate-50">
        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {columnHeader}
        </th>
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-slate-100">
      <tr className="hover:bg-slate-50 transition-colors duration-150 cursor-pointer">
        <td className="px-4 py-3 text-sm text-slate-900 whitespace-nowrap">
          {cellValue}
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

**Table Rules:**
* Header row background: `bg-slate-50` with uppercase `text-xs font-semibold text-slate-500`.
* Row hover: `hover:bg-slate-50 transition-colors duration-150`.
* Cell padding: `px-4 py-3` — uniform across all table cells.
* Dividers: `divide-y divide-slate-200` for header, `divide-y divide-slate-100` for body rows.
* Amounts and numeric values must be right-aligned: `text-right`.
* Date columns use `whitespace-nowrap` to prevent wrapping.

#### 9.5.3 Form Controls

**Text Input:**

```tsx
<div className="mb-4">
  <label className="block text-sm font-medium text-slate-700 mb-1">
    {fieldLabel} {isRequired && <span className="text-red-500">*</span>}
  </label>
  <input
    type="text"
    className="
      w-full px-3 py-2
      border border-slate-200 rounded-lg
      text-sm text-slate-900
      placeholder:text-slate-400
      focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
      transition-all duration-200
      disabled:bg-slate-100 disabled:cursor-not-allowed
    "
    placeholder={placeholder}
  />
  {validationError && (
    <p className="mt-1 text-xs text-red-500">{validationError}</p>
  )}
</div>
```

**Select Dropdown:**

```tsx
<select className="
  w-full px-3 py-2
  border border-slate-200 rounded-lg
  text-sm text-slate-900
  bg-white
  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
  transition-all duration-200
">
  <option value="">-- Select --</option>
</select>
```

**Textarea (Rejection Comment):**

```tsx
<textarea
  className="
    w-full px-3 py-2
    border border-slate-200 rounded-lg
    text-sm text-slate-900
    placeholder:text-slate-400
    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
    transition-all duration-200
    resize-none
  "
  rows={4}
  minLength={10}
  placeholder="Enter rejection reason (minimum 10 characters)..."
/>
<p className="mt-1 text-xs text-slate-400 text-right">
  {charCount}/10 minimum characters
</p>
```

#### 9.5.4 Button System

| Variant | Classes | Usage |
| :--- | :--- | :--- |
| **Primary** | `px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-sm font-medium rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900` | Submit, Save, Create |
| **Success** | `px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600` | Approve, Verify, Complete Payment |
| **Danger** | `px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600` | Reject, Delete |
| **Secondary** | `px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg border border-slate-300 shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400` | Cancel, Back, Close |
| **Disabled** | Add `opacity-50 cursor-not-allowed` to any variant | Inactive or loading state |

**Button Placement Rules:**
* Primary/Success actions align to the **right** side of the form.
* Destructive actions (Reject, Delete) align to the **left** side, separated from positive actions.
* Cancel/Back buttons always appear to the left of the primary action button.
* Button group layout: `flex justify-end gap-3`.

#### 9.5.5 Modal Dialogs

High-impact actions (deletions, approvals, rejections) must trigger floating modal dialogs — standard browser `alert()` and `confirm()` popups are **FORBIDDEN**.

```tsx
{/* Modal Overlay */}
<div className="fixed inset-0 z-50 flex items-center justify-center">
  {/* Backdrop */}
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

  {/* Modal Content */}
  <div className="
    relative z-10
    bg-white rounded-xl shadow-2xl
    w-full max-w-md
    p-6
    transform transition-all duration-300
    animate-in fade-in zoom-in-95
  ">
    <h3 className="text-lg font-semibold text-slate-900 mb-2">
      {modalTitle}
    </h3>
    <p className="text-sm text-slate-500 mb-4">
      {modalDescription}
    </p>

    {/* Modal Body (e.g., rejection comment textarea) */}
    {children}

    {/* Modal Actions */}
    <div className="flex justify-end gap-3 mt-6">
      <button className="/* Secondary button classes */" onClick={onClose}>
        Cancel
      </button>
      <button className="/* Primary/Danger button classes */" onClick={onConfirm}>
        {confirmLabel}
      </button>
    </div>
  </div>
</div>
```

**Modal Rules:**
* Backdrop: `bg-black/50 backdrop-blur-sm` — semi-transparent with blur effect.
* Entry animation: Scale-in with fade (`animate-in fade-in zoom-in-95`).
* Maximum width: `max-w-md` (448px) for confirmation modals, `max-w-lg` (512px) for form modals.
* **Rejection Modals:** Must auto-focus the comment textarea on mount and display a live character counter. Submit button must remain disabled until minimum 10 characters are entered.

#### 9.5.6 Navigation Sidebar

```tsx
<aside className="
  fixed left-0 top-0
  w-64 h-screen
  bg-blue-900
  text-white
  flex flex-col
  shadow-lg
">
  {/* Logo / System Name */}
  <div className="px-6 py-5 border-b border-blue-800">
    <h1 className="text-lg font-bold tracking-tight">PRWM System</h1>
    <p className="text-xs text-blue-300 mt-0.5">Payment Request Workflow</p>
  </div>

  {/* Navigation Items */}
  <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
    <a className="
      flex items-center gap-3
      px-3 py-2.5
      rounded-lg
      text-sm font-medium
      text-blue-100 hover:text-white hover:bg-blue-800
      transition-colors duration-200
    ">
      {icon}
      {label}
    </a>

    {/* Active state */}
    <a className="
      flex items-center gap-3
      px-3 py-2.5
      rounded-lg
      text-sm font-medium
      text-white bg-blue-800
    ">
      {icon}
      {label}
    </a>
  </nav>

  {/* User Profile Footer */}
  <div className="px-4 py-3 border-t border-blue-800">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-sm font-semibold">
        {userInitials}
      </div>
      <div>
        <p className="text-sm font-medium text-white">{userName}</p>
        <p className="text-xs text-blue-300">{roleName}</p>
      </div>
    </div>
  </div>
</aside>
```

#### 9.5.7 Dashboard Summary Cards (KPI Tiles)

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          {metricLabel}
        </p>
        <p className="text-2xl font-bold text-slate-900 mt-1">
          {metricValue}
        </p>
      </div>
      <div className={`w-10 h-10 rounded-lg ${iconBgColor} flex items-center justify-center`}>
        {icon}
      </div>
    </div>
    <div className="mt-3 flex items-center gap-1">
      <span className={`text-xs font-medium ${trendColor}`}>
        {trendPercentage}
      </span>
      <span className="text-xs text-slate-400">vs last month</span>
    </div>
  </div>
</div>
```

### 9.6 Special Layout Components

#### 9.6.1 Mandalay Branch Warning Banner (Accounting Dashboard)

Approved requests from applicants belonging to the **Mandalay** branch must display a warning banner in the Accounting payment processing view:

```tsx
{/* Mandalay Branch Cash Payment Alert */}
{applicantBranch === 'Mandalay' && (
  <div className="
    bg-red-50 text-red-700
    border border-red-200 rounded-lg
    p-4
    font-medium
    animate-pulse
    flex items-center gap-3
    mb-4
  ">
    <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
    <span>【重要】Mandalay支店：現金支払のため、Toe San氏と調整してください</span>
  </div>
)}

{/* Standard Bank Transfer Notice */}
{applicantBranch !== 'Mandalay' && (
  <div className="
    bg-blue-50 text-blue-700
    border border-blue-200 rounded-lg
    p-4
    font-medium
    flex items-center gap-3
    mb-4
  ">
    <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
    <span>標準銀行振込処理</span>
  </div>
)}
```

#### 9.6.2 Receipt Upload Zone

```tsx
<div className="
  border-2 border-dashed border-slate-300 rounded-xl
  p-8
  text-center
  hover:border-indigo-400 hover:bg-indigo-50/50
  transition-all duration-200
  cursor-pointer
">
  <svg className="w-10 h-10 text-slate-400 mx-auto mb-3" /* upload icon */ />
  <p className="text-sm font-medium text-slate-700">
    Drop receipt files here or click to browse
  </p>
  <p className="text-xs text-slate-400 mt-1">
    PDF, JPEG, PNG — Max 10MB per file, 50MB total
  </p>
</div>
```

#### 9.6.3 Empty State

When a dashboard or table has no data to display:

```tsx
<div className="text-center py-12">
  <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" /* empty state icon */ />
  <h3 className="text-sm font-medium text-slate-900">No requests found</h3>
  <p className="text-xs text-slate-500 mt-1">
    {emptyStateDescription}
  </p>
</div>
```

### 9.7 Animation & Transition Standards

| Element | Transition | Duration | Easing |
| :--- | :--- | :--- | :--- |
| Button hover | Background color change | `duration-200` | `ease-in-out` |
| Input focus | Ring appearance | `duration-200` | `ease-in-out` |
| Table row hover | Background highlight | `duration-150` | `ease-in-out` |
| Modal entry | Scale + Fade | `duration-300` | `ease-out` |
| Modal exit | Scale + Fade | `duration-200` | `ease-in` |
| Sidebar nav hover | Background color change | `duration-200` | `ease-in-out` |
| Alert banner | Pulse animation | `animate-pulse` | CSS default |
| Toast notification | Slide in from top-right | `duration-300` | `ease-out` |
| Page transition | Fade in | `duration-200` | `ease-in-out` |
| Dropdown menu | Scale-Y origin-top | `duration-150` | `ease-out` |

### 9.8 Responsive Breakpoints

| Breakpoint | Tailwind Prefix | Min Width | Layout Behavior |
| :--- | :--- | :--- | :--- |
| Mobile | (default) | 0px | Single column, hidden sidebar, hamburger menu |
| Tablet | `md:` | 768px | Two columns, collapsible sidebar |
| Desktop | `lg:` | 1024px | Full layout, fixed sidebar, 4-column KPI grid |
| Wide | `xl:` | 1280px | Extended table columns, wider content area |

### 9.9 Accessibility Requirements

| Requirement | Standard | Implementation |
| :--- | :--- | :--- |
| Color Contrast | WCAG 2.1 AA | Minimum 4.5:1 for normal text, 3:1 for large text |
| Focus Indicators | Visible on all interactive elements | `focus:ring-2 focus:ring-offset-2` on all buttons and inputs |
| Keyboard Navigation | Full tab-order support | Logical tab sequence, `tabIndex` management in modals |
| Screen Reader | ARIA labels on icon-only buttons | `aria-label`, `role`, `aria-describedby` attributes |
| Form Errors | Programmatic association | `aria-invalid`, `aria-describedby` linked to error messages |
| Alt Text | All informational images | Descriptive `alt` attributes on all `<img>` elements |

---

## 10. Performance & Optimization Standards

### 10.1 Frontend Performance Targets

| Metric | Target | Measurement |
| :--- | :--- | :--- |
| Dashboard Initial Load | < 2 seconds | Lighthouse Performance score |
| Time to Interactive (TTI) | < 3 seconds | Chrome DevTools |
| First Contentful Paint (FCP) | < 1.5 seconds | Lighthouse |
| Bundle Size (gzipped) | < 250KB initial chunk | Vite build output |
| WebSocket Event Delivery | < 500ms from server event | Custom timing instrumentation |

### 10.2 Backend Performance Targets

| Metric | Target | Context |
| :--- | :--- | :--- |
| API Response Time (P95) | < 200ms | Standard CRUD operations |
| Dashboard Query Time | < 500ms | Complex aggregation queries with joins |
| File Upload Processing | < 3 seconds | 10MB file upload with validation |
| WebSocket Broadcast | < 100ms server-side | From status update to event emit |

### 10.3 Optimization Strategies

| Strategy | Implementation |
| :--- | :--- |
| **Code Splitting** | React.lazy() with Suspense for role-based page modules |
| **API Response Caching** | Redis cache for master data (`lookup:{table_name}`, 24h TTL) |
| **Request Detail Caching** | Redis cache for payment request payload (`payment_request:payload:{id}`, 10min TTL) |
| **Database Indexing** | Composite indexes on `(status_id, created_date DESC)` and `(current_assigned_to_user_id, status_id)` |
| **Partial Index** | `idx_payment_requests_active_created` filtered on `is_deleted = FALSE` |
| **Image Optimization** | Receipt thumbnails generated server-side for preview; full-size on demand |
| **Debounced Search** | 300ms debounce on all search/filter inputs |
| **Virtual Scrolling** | Required for lists exceeding 100 items |

---

## 11. Environment Configuration & Deployment

### 11.1 Environment Variable Schema

All environment variables must be validated at application startup using Joi schema validation in `src/config/`. Missing or invalid variables must prevent application boot.

| Variable | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `NODE_ENV` | string | Yes | `development` | Runtime environment identifier |
| `PORT` | number | Yes | `3000` | NestJS HTTP server port |
| `DATABASE_HOST` | string | Yes | — | PostgreSQL host address |
| `DATABASE_PORT` | number | Yes | `5432` | PostgreSQL port |
| `DATABASE_NAME` | string | Yes | — | PostgreSQL database name |
| `DATABASE_USER` | string | Yes | — | PostgreSQL connection username |
| `DATABASE_PASSWORD` | string | Yes | — | PostgreSQL connection password |
| `REDIS_HOST` | string | Yes | — | Redis server host |
| `REDIS_PORT` | number | Yes | `6379` | Redis server port |
| `JWT_SECRET` | string | Yes | — | JWT signing secret (RS256 private key path) |
| `JWT_EXPIRATION` | string | Yes | `15m` | Access token TTL |
| `JWT_REFRESH_EXPIRATION` | string | Yes | `7d` | Refresh token TTL |
| `CORS_ORIGINS` | string | Yes | — | Comma-separated allowed origins |
| `UPLOAD_DIR` | string | Yes | `./uploads` | Receipt file storage directory |
| `MAX_FILE_SIZE` | number | Yes | `10485760` | Max file size in bytes (10MB) |
| `MAX_TOTAL_FILE_SIZE` | number | Yes | `52428800` | Max total files per request (50MB) |

### 11.2 File Structure for Configuration

```
src/config/
├── configuration.ts             # Central configuration factory
├── database.config.ts           # TypeORM connection options
├── redis.config.ts              # Redis connection options
├── jwt.config.ts                # JWT module options
└── validation.schema.ts         # Joi validation schema for env vars
```

### 11.3 Docker Compose Services

| Service | Image | Port | Purpose |
| :--- | :--- | :--- | :--- |
| `app` | Node.js 20 Alpine | 3000 | NestJS backend API |
| `frontend` | Node.js 20 Alpine | 5173 | Vite dev server (dev only) |
| `postgres` | PostgreSQL 16 Alpine | 5432 | Primary database |
| `redis` | Redis 7 Alpine | 6379 | Session, cache, rate limiting |

### 11.4 Sensitive Data Handling

* `.env` files must be listed in `.gitignore` and must NEVER be committed to the repository.
* Production secrets must be managed through environment-specific secret managers (e.g., Docker secrets, cloud KMS).
* Database credentials, JWT secrets, and API keys must never appear in source code, documentation, or commit messages.
* Log output must never contain passwords, tokens, or full credit card numbers.


