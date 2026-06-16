# DD_COMMON_02 — Project Structure

> **Doc ID:** PRWM-DD-COM-002 | **Version:** 1.0 | **Status:** Released  
> **Last Updated:** 2026-06-16

---

## 1. Overview

This document defines the **complete target project structure** — both the existing files and the new files that must be created. Files marked with `[EXISTS]` are already in the codebase; files marked with `[NEW]` must be created during implementation.

---

## 2. Root Directory

```
c:\Projects\PRWM\
├── .env                              [EXISTS] Environment variables
├── .gitignore                        [EXISTS] Git ignore rules
├── .prettierrc                       [EXISTS] Prettier config (singleQuote, trailingComma)
├── AGENTS.md                         [EXISTS] AI agent rules
├── PROJECT_STRUCTURE.md              [EXISTS] Legacy structure doc
├── README.md                         [EXISTS] Project readme
├── eslint.config.mjs                 [EXISTS] Backend ESLint (flat config)
├── nest-cli.json                     [EXISTS] NestJS CLI config
├── package.json                      [EXISTS] Backend dependencies
├── package-lock.json                 [EXISTS] Backend lock file
├── tsconfig.json                     [EXISTS] Backend TS config
├── tsconfig.build.json               [EXISTS] NestJS build config
├── typeorm-cli.config.ts             [EXISTS] TypeORM CLI datasource
│
├── docs/                             [EXISTS] All documentation
│   ├── core_ja/                      [EXISTS] Core specs (Japanese)
│   ├── guides/                       [EXISTS] Setup guides
│   ├── screens/                      [EXISTS] Screen-level specs
│   ├── template/                     [EXISTS] Spec templates
│   └── detailed_design/              [NEW]   Detailed design (this deliverable)
│       ├── 00_common/
│       ├── 01_applicant/
│       └── ARCHITECTURE_EXPLANATION.md
│
├── src/                              Backend source (NestJS)
├── frontend/                         Frontend source (React + Vite)
├── test/                             E2E test directory
├── uploads/                          [NEW] File upload storage
└── redis-local/                      [EXISTS] Memurai local Redis
```

---

## 3. Backend Structure (`src/`)

```
src/
├── main.ts                                      [EXISTS] App bootstrap (port 3000)
├── app.module.ts                                 [EXISTS] Root module
├── app.controller.ts                             [EXISTS] Health check
├── app.service.ts                                [EXISTS] Health service
├── app.controller.spec.ts                        [EXISTS] Health test
│
├── config/
│   ├── config.module.ts                          [EXISTS] NestJS ConfigModule setup
│   ├── configuration.ts                          [EXISTS] Typed config factory
│   ├── database.config.ts                        [NEW]   Database-specific config
│   ├── redis.config.ts                           [NEW]   Redis-specific config
│   ├── jwt.config.ts                             [NEW]   JWT-specific config
│   └── validation.schema.ts                      [NEW]   Joi env validation schema
│
├── database/
│   └── migrations/
│       ├── README.md                             [EXISTS] Migration placeholder
│       └── XXXXXX-initial-schema.ts              [NEW]   Initial migration
│
├── modules/
│   ├── auth/                                     [NEW]   Authentication module
│   │   ├── auth.module.ts                        [NEW]   Auth NestJS module
│   │   ├── auth.controller.ts                    [NEW]   Login/refresh/logout endpoints
│   │   ├── auth.service.ts                       [NEW]   Auth business logic
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts                   [NEW]   Passport JWT strategy
│   │   │   └── local.strategy.ts                 [NEW]   Passport local strategy
│   │   └── dto/
│   │       ├── login.dto.ts                      [NEW]   Login request DTO
│   │       └── auth-response.dto.ts              [NEW]   Token response DTO
│   │
│   ├── applicant/                                [EXISTS] Applicant module
│   │   ├── applicant.module.ts                   [EXISTS] → Needs update (add guards, DTOs)
│   │   ├── applicant.controller.ts               [EXISTS] → Needs full rewrite (add decorators, routes)
│   │   ├── applicant.service.ts                  [EXISTS] → Needs full rewrite (add business logic)
│   │   ├── dto/                                  [NEW]   Request/Response DTOs
│   │   │   ├── create-payment-request.dto.ts     [NEW]   Create draft DTO
│   │   │   ├── update-payment-request.dto.ts     [NEW]   Update request DTO
│   │   │   ├── submit-to-manager.dto.ts          [NEW]   Submit action DTO
│   │   │   ├── submit-to-approver.dto.ts         [NEW]   Submit action DTO
│   │   │   └── query-payment-requests.dto.ts     [NEW]   List query params DTO
│   │   ├── guards/                               [NEW]   Module-specific guards (if any)
│   │   │   └── applicant-ownership.guard.ts      [NEW]   Ownership check
│   │   └── tests/                                [NEW]   Unit tests
│   │       ├── applicant.controller.spec.ts      [NEW]   Controller tests
│   │       └── applicant.service.spec.ts         [NEW]   Service tests
│   │
│   ├── manager/                                  [EXISTS] Manager module (placeholder)
│   │   ├── manager.module.ts                     [EXISTS]
│   │   ├── manager.controller.ts                 [EXISTS]
│   │   └── manager.service.ts                    [EXISTS]
│   │
│   ├── approver/                                 [EXISTS] Approver module (placeholder)
│   │   ├── approver.module.ts                    [EXISTS]
│   │   ├── approver.controller.ts                [EXISTS]
│   │   └── approver.service.ts                   [EXISTS]
│   │
│   ├── accounting/                               [EXISTS] Accounting module (placeholder)
│   │   ├── accounting.module.ts                  [EXISTS]
│   │   ├── accounting.controller.ts              [EXISTS]
│   │   └── accounting.service.ts                 [EXISTS]
│   │
│   ├── admin/                                    [EXISTS] Admin module (placeholder)
│   │   ├── admin.module.ts                       [EXISTS]
│   │   ├── admin.controller.ts                   [EXISTS]
│   │   └── admin.service.ts                      [EXISTS]
│   │
│   └── shared/                                   [EXISTS] Shared module
│       ├── shared.module.ts                      [EXISTS] Exports entities + WS gateway
│       ├── websocket.gateway.ts                  [EXISTS] Socket.IO gateway (:3001)
│       ├── entities/                             [EXISTS] TypeORM entities
│       │   ├── user.entity.ts                    [EXISTS] User entity (12 cols)
│       │   ├── payment-request.entity.ts         [EXISTS] Payment request (26 cols)
│       │   ├── payment-breakdown-item.entity.ts  [EXISTS] Line items (10 cols)
│       │   ├── approval-log.entity.ts            [EXISTS] Audit trail (10 cols, immutable)
│       │   └── receipt-file.entity.ts            [EXISTS] Uploaded files (10 cols)
│       ├── guards/                               [NEW]   Shared auth guards
│       │   ├── jwt-auth.guard.ts                 [NEW]   JWT validation guard
│       │   ├── roles.guard.ts                    [NEW]   RBAC guard
│       │   └── ownership.guard.ts                [NEW]   Base ownership guard
│       ├── decorators/                           [NEW]   Custom decorators
│       │   ├── roles.decorator.ts                [NEW]   @Roles() decorator
│       │   ├── current-user.decorator.ts         [NEW]   @CurrentUser() decorator
│       │   └── public.decorator.ts               [NEW]   @Public() decorator
│       ├── filters/                              [NEW]   Exception filters
│       │   └── http-exception.filter.ts          [NEW]   Global exception filter
│       ├── interceptors/                         [NEW]   Response interceptors
│       │   └── response-transform.interceptor.ts [NEW]   Standard response wrapper
│       ├── pipes/                                [NEW]   Custom pipes
│       │   └── parse-int-optional.pipe.ts        [NEW]   Optional int parser
│       ├── exceptions/                           [NEW]   Custom exception classes
│       │   ├── business-rule.exception.ts        [NEW]   422 business rule violations
│       │   └── ownership.exception.ts            [NEW]   403 not owner
│       ├── services/                             [NEW]   Shared services
│       │   ├── request-number.service.ts         [NEW]   PRF-YYYY-NNNNNN generator
│       │   └── file-upload.service.ts            [NEW]   Multer + file validation
│       └── types/                                [NEW]   Shared backend types
│           └── index.ts                          [NEW]   Enums, interfaces
│
└── test/
    ├── app.e2e-spec.ts                           [EXISTS] E2E test boilerplate
    └── jest-e2e.json                             [EXISTS] E2E Jest config
```

---

## 4. Frontend Structure (`frontend/src/`)

```
frontend/src/
├── App.tsx                                       [EXISTS] → Needs rewrite (add routing, layout)
├── main.tsx                                      [EXISTS] React entry point
├── index.css                                     [EXISTS] Tailwind imports
│
├── components/                                   [NEW]   Shared UI components
│   ├── shared/                                   [NEW]   Cross-module components
│   │   ├── StatusBadge.tsx                        [NEW]   Status → colored badge
│   │   ├── ConfirmDialog.tsx                      [NEW]   Modal confirmation dialog
│   │   ├── LoadingSpinner.tsx                     [NEW]   Full-page & inline spinner
│   │   ├── EmptyState.tsx                         [NEW]   No-data display
│   │   ├── CurrencyDisplay.tsx                    [NEW]   Amount formatting
│   │   ├── ApprovalTimeline.tsx                   [NEW]   Approval history timeline
│   │   ├── FileUploadDropzone.tsx                 [NEW]   Drag-drop file upload
│   │   ├── KpiCard.tsx                            [NEW]   Dashboard KPI card
│   │   ├── DataTable.tsx                          [NEW]   Sortable/paginated table
│   │   ├── PageHeader.tsx                         [NEW]   Page title + actions
│   │   └── Toast.tsx                              [NEW]   Toast notifications
│   └── layout/                                   [NEW]   Layout components
│       ├── DashboardLayout.tsx                    [NEW]   Sidebar + header + main
│       ├── Sidebar.tsx                            [NEW]   Navigation sidebar
│       ├── Header.tsx                             [NEW]   Top header bar
│       └── Footer.tsx                             [NEW]   Footer bar
│
├── hooks/                                        [NEW]   Shared React hooks
│   ├── useAuth.ts                                [NEW]   Auth state management
│   ├── useWebSocket.ts                           [NEW]   Socket.IO connection
│   ├── useConfirmDialog.ts                       [NEW]   Dialog state
│   ├── usePagination.ts                          [NEW]   Pagination state
│   └── useToast.ts                               [NEW]   Toast notifications
│
├── services/                                     [NEW]   API service layer
│   ├── api-client.ts                             [NEW]   Axios instance + interceptors
│   ├── auth.service.ts                           [NEW]   Login/logout/refresh
│   └── websocket.service.ts                      [NEW]   Socket.IO client
│
├── types/                                        [NEW]   Shared TypeScript types
│   └── index.ts                                  [NEW]   All enums, interfaces
│
├── utils/                                        [NEW]   Utility functions
│   ├── format.ts                                 [NEW]   Currency, date formatters
│   └── constants.ts                              [NEW]   Status labels, colors, configs
│
├── pages/                                        [EXISTS] Role-based pages
│   ├── applicant/                                [EXISTS]
│   │   ├── ApplicantDashboard.tsx                [EXISTS] → Full rewrite (list view)
│   │   ├── CreateRequest.tsx                     [NEW]   New request form page
│   │   ├── EditRequest.tsx                       [NEW]   Edit request form page
│   │   ├── RequestDetail.tsx                     [NEW]   Request detail page
│   │   ├── components/                           [NEW]   Applicant-specific components
│   │   │   ├── RequestTable.tsx                  [NEW]   Request data table
│   │   │   ├── PaymentRequestForm.tsx            [NEW]   Create/edit form
│   │   │   ├── BreakdownItemsGrid.tsx            [NEW]   Editable breakdown table
│   │   │   ├── ReceiptUploadSection.tsx          [NEW]   Receipt file management
│   │   │   ├── FilterSearchBar.tsx               [NEW]   Filter + search controls
│   │   │   ├── KpiCardRow.tsx                    [NEW]   KPI cards row
│   │   │   ├── RequestInfoSection.tsx            [NEW]   Read-only request info
│   │   │   └── ActionButtonBar.tsx               [NEW]   Conditional action buttons
│   │   ├── hooks/                                [NEW]   Applicant-specific hooks
│   │   │   ├── usePaymentRequests.ts             [NEW]   List data fetching
│   │   │   ├── usePaymentRequestDetail.ts        [NEW]   Detail data fetching
│   │   │   ├── usePaymentRequestForm.ts          [NEW]   Form state management
│   │   │   └── useLookupData.ts                  [NEW]   Dropdown data fetching
│   │   ├── services/                             [NEW]   Applicant API calls
│   │   │   └── applicant.service.ts              [NEW]   CRUD operations
│   │   └── utils/                                [NEW]   Applicant utilities
│   │       └── validation.ts                     [NEW]   Frontend validation
│   │
│   ├── manager/                                  [EXISTS] (placeholder)
│   ├── approver/                                 [EXISTS] (placeholder)
│   ├── accounting/                               [EXISTS] (placeholder)
│   └── admin/                                    [EXISTS] (placeholder)
│
└── assets/                                       [EXISTS] Static assets
    ├── hero.png                                  [EXISTS]
    ├── react.svg                                 [EXISTS]
    └── vite.svg                                  [EXISTS]
```

---

## 5. Layer Dependency Rules

### 5.1 Backend Import Rules

| Source Module | Can Import From | Cannot Import From |
|--------------|----------------|-------------------|
| `src/modules/applicant/` | `src/modules/shared/entities/`, `src/modules/shared/guards/`, `src/modules/shared/services/`, `src/modules/shared/types/` | `src/modules/manager/`, `src/modules/approver/`, `src/modules/accounting/`, `src/modules/admin/` |
| `src/modules/shared/` | `src/config/`, TypeORM, NestJS core | Any feature module |
| `src/modules/auth/` | `src/modules/shared/entities/`, `src/config/` | Any feature module |
| `src/config/` | NestJS ConfigModule, environment | Nothing else |

### 5.2 Frontend Import Rules

| Source Path | Can Import From | Cannot Import From |
|-------------|----------------|-------------------|
| `pages/applicant/` | `components/shared/`, `components/layout/`, `hooks/`, `services/`, `types/`, `utils/`, own `components/`, own `hooks/`, own `services/` | `pages/manager/`, `pages/approver/`, etc. |
| `components/shared/` | `types/`, `utils/` | Any page-specific code |
| `hooks/` | `services/`, `types/` | Page-specific code |
| `services/` | `types/` | Components, hooks, pages |

### 5.3 Import Ordering Convention

```typescript
// 1. Node.js built-ins
import { resolve } from 'path';

// 2. NestJS / React framework imports
import { Injectable, Logger } from '@nestjs/common';

// 3. Third-party libraries
import { Repository } from 'typeorm';

// 4. Shared / internal imports (path aliases)
import { PaymentRequest } from '@shared/entities/payment-request.entity';

// 5. Local module imports (relative paths)
import { CreatePaymentRequestDto } from './dto/create-payment-request.dto';
```

---

## 6. Path Aliases

### Backend (`tsconfig.json`)

| Alias | Maps To | Usage |
|-------|---------|-------|
| `@modules/*` | `src/modules/*` | `import { User } from '@modules/shared/entities/user.entity'` |
| `@config/*` | `src/config/*` | `import configuration from '@config/configuration'` |
| `@shared/*` | `src/modules/shared/*` | `import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard'` |

### Frontend (`tsconfig.app.json`)

| Alias | Maps To | Usage |
|-------|---------|-------|
| `@/*` | `src/*` | `import { StatusBadge } from '@/components/shared/StatusBadge'` |

---

## 7. Cross-References

| Related Document | Purpose |
|-----------------|---------|
| [DD_COMMON_01](./DD_COMMON_01_ARCHITECTURE_OVERVIEW.md) | System architecture context |
| [DD_COMMON_03](./DD_COMMON_03_SHARED_TYPES.md) | Types placed in `types/` directories |
| [Development Rules §2](../../core_ja/02_開発ルール_DEVELOPMENT_RULES.md) | Module isolation rules |
