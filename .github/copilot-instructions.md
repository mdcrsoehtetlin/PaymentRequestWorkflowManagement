# AI Coding Assistant — Mandatory Instructions

> **AUTHORITY**: This file is BINDING on all AI coding assistants (GitHub Copilot, Cursor, Gemini, Cline, SpecKit, and any agentic subagents) operating within this repository. Violations trigger automatic PR rejection.

---

## 0. PREREQUISITE — Read Before Writing ANY Code

**Before generating, modifying, or suggesting ANY code**, you MUST read and internalize:

| Priority | Document | Path |
| :--- | :--- | :--- |
| **P0 (CRITICAL)** | Development Rules Specification | `docs/core_ja/02_開発ルール_DEVELOPMENT_RULES.md` |
| **P0 (CRITICAL)** | Target screen design document | `docs/screens/{screen}/` |
| **P1 (Required)** | Requirement Specification | `docs/01_要件定義書_REQUIREMENT_SPEC.md` |
| **P2 (Reference)** | Database Specification | `docs/03_データベース設計書_DATABASE_SPEC.md` |

If you have not read `02_開発ルール_DEVELOPMENT_RULES.md` in this session, **STOP and read it NOW** before proceeding.

---

## 1. ABSOLUTE PROHIBITIONS

### 1.1 Shared Layer Lock — DO NOT MODIFY

The following directories are **LOCKED**. You must **NEVER** create, modify, rename, or delete files in these paths without **explicit written permission** from the Project Leader:

```
src/modules/shared/          ← Backend shared layer
frontend/src/components/shared/  ← Frontend shared layer
```

**Allowed**: Importing and using entities, DTOs, enums, guards, and pipes FROM these directories.
**Forbidden**: Adding new files, modifying existing files, or deleting any file in these directories.

If your task requires a shared layer change, you MUST:
1. Stop code generation immediately.
2. Explicitly state: "This task requires modifying the shared layer. Project Leader approval is needed."
3. Wait for explicit human approval before proceeding.

### 1.2 Cross-Module Import Ban

Role modules (`applicant`, `manager`, `approver`, `accounting`, `admin`) must **NEVER** import from each other. This applies to both backend and frontend.

```typescript
// ❌ FORBIDDEN — Direct cross-module import
import { ManagerService } from '../manager/manager.service';
import { ApproverDashboard } from '../../pages/approver/ApproverDashboard';

// ✅ CORRECT — Use shared layer only
import { PaymentRequest } from '../shared/entities/payment-request.entity';
import { NotificationGateway } from '../shared/gateways/notification.gateway';
```

### 1.3 Other Prohibited Actions

- **No `npm install`**: Do NOT execute `npm install` or add new dependencies without developer confirmation.
- **No schema mutations**: Do NOT generate or execute database migrations (`CREATE TABLE`, `ALTER TABLE`, `DROP`) without Project Leader review.
- **No environment changes**: Do NOT modify `.env`, `docker-compose.yml`, or CI/CD configuration files.
- **No `@ts-ignore` / `@ts-nocheck`**: Do NOT bypass TypeScript strict mode under any circumstances.
- **No file deletion**: Do NOT delete or rename existing files without explicit human instruction.
- **No bootstrap modification**: Do NOT modify `main.ts`, `AppModule`, or global middleware chain.
- **No new modules/routes**: Do NOT create new NestJS modules or React route entries without human approval.
- **No mock PII**: Do NOT generate mock data containing real personal information, financial data, or credentials.

---

## 2. MODULE BOUNDARY ENFORCEMENT

You are confined to your assigned role module directory. Do NOT generate or modify code outside it.

| Role Module | Backend Path | Frontend Path |
| :--- | :--- | :--- |
| Applicant | `src/modules/applicant/` | `frontend/src/pages/applicant/` |
| Manager | `src/modules/manager/` | `frontend/src/pages/manager/` |
| Approver | `src/modules/approver/` | `frontend/src/pages/approver/` |
| Accounting | `src/modules/accounting/` | `frontend/src/pages/accounting/` |
| Admin | `src/modules/admin/` | `frontend/src/pages/admin/` |
| Shared | `src/modules/shared/` | `frontend/src/components/shared/` |

---

## 3. CODING STANDARDS (Summary)

Refer to `02_開発ルール_DEVELOPMENT_RULES.md` for full details. Key rules:

### 3.1 Naming Conventions
- Variables & Functions: `camelCase`
- Classes, Components, Modules, Interfaces: `PascalCase`
- Database Tables & Columns: `snake_case`
- Environment Variables: `SCREAMING_SNAKE_CASE`
- Backend TypeScript files: `kebab-case` (e.g., `payment-request.entity.ts`)
- Frontend component files: `PascalCase` (e.g., `ApplicantDashboard.tsx`)

### 3.2 TypeScript
- `strict: true` — non-negotiable.
- Explicit return types on ALL functions.
- No `any` in application code.
- `interface` for object shapes, `type` for unions/intersections.

### 3.3 JSDoc
- All public methods require `@description`, `@param`, `@returns`, `@throws`.
- Comments explain business rationale, not obvious behavior.

### 3.4 Import Order
1. Node.js built-in modules
2. NestJS / React framework imports
3. Third-party library imports
4. Internal shared module imports
5. Local module imports

### 3.5 Security
- ALL endpoints: `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles()`.
- ALL DTOs: `class-validator` decorators.
- ALL string inputs: `@Transform()` trim + sanitize.
- No raw SQL string concatenation.

### 3.6 UI/UX
- Use ONLY Tailwind token classes defined in §9 of the dev rules (no arbitrary hex values).
- Focus ring: `focus:ring-indigo-500`
- Primary: `bg-blue-900`, `text-slate-900/500/400`
- Status badge colors per §9.2.2 — strictly enforced.
- 300ms debounce on ALL search/filter inputs.

---

## 4. MANDATORY SHARED COMPONENT USAGE

When building dashboard pages, you **MUST** import and use these shared components from `frontend/src/components/shared/`.
**CREATING local copies is FORBIDDEN.** The CI pipeline (`verify-all.sh` STEP 4) will detect and block duplicates.

| Need | MUST Use | Import |
| :--- | :--- | :--- |
| Dashboard summary cards | `KpiCard` | `import { KpiCard } from '../../components/shared/KpiCard';` |
| KPI card grid layout | `DashboardKpiGrid` | `import { DashboardKpiGrid } from '../../components/shared/DashboardKpiGrid';` |
| Status pills/badges | `StatusBadge` | `import { StatusBadge } from '../../components/shared/StatusBadge';` |
| Data tables (sortable, paginated) | `DataTable` | `import { DataTable } from '../../components/shared/DataTable';` |
| Page title + subtitle + actions | `PageHeader` | `import { PageHeader } from '../../components/shared/PageHeader';` |
| Search & filter bar | `SearchFilterBar` | `import { SearchFilterBar } from '../../components/shared/SearchFilterBar';` |
| Refresh button | `RefreshButton` | `import { RefreshButton } from '../../components/shared/RefreshButton';` |
| Empty states (no data) | `EmptyState` | `import { EmptyState } from '../../components/shared/EmptyState';` |
| Confirmation modals | `ConfirmDialog` | `import { ConfirmDialog } from '../../components/shared/ConfirmDialog';` |
| Date picker fields | `DatePicker` | `import { DatePicker } from '../../components/shared/DatePicker';` |
| Loading indicators | `LoadingSpinner` | `import { LoadingSpinner } from '../../components/shared/LoadingSpinner';` |
| File upload zones | `FileUploadDropzone` | `import { FileUploadDropzone } from '../../components/shared/FileUploadDropzone';` |

You can also use the barrel export: `import { KpiCard, StatusBadge, DataTable } from '../../components/shared';`

**Examples of FORBIDDEN patterns:**

```typescript
// ❌ FORBIDDEN — Local duplicate of StatusBadge
const StatusBadge: React.FC<{ statusId: number }> = ({ statusId }) => { ... };

// ❌ FORBIDDEN — Local copy like ApproverStatusBadge, ApproverDataTable
export function ApproverStatusBadge({ statusId }: Props) { ... }
export function ApproverDataTable<T>({ columns, data }: Props) { ... }

// ❌ FORBIDDEN — Inline status rendering instead of using StatusBadge
<span className={`... ${STATUS_COLORS[req.statusId]}`}>{STATUS_LABELS_EN[req.statusId]}</span>

// ✅ CORRECT — Use shared component
import { StatusBadge } from '../../components/shared/StatusBadge';
<StatusBadge statusId={req.statusId} />
```

---

## 5. PRE-COMMIT CHECKLIST

Before staging any code, verify:

1. `npm run lint` → Zero errors
2. `npm run format` → All files formatted
3. `npm run build` → Zero TypeScript errors
4. `npm run test` → All unit tests pass
5. No cross-module imports introduced
6. No shared layer files modified without approval
7. No local duplicates of shared components

---

## 6. VERIFICATION

Run `scripts/verify-all.sh` to validate full project health before committing.

