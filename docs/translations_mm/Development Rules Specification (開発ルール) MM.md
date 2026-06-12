# Development Rules Specification (개발ルール) (ဖွံ့ဖြိုးတိုးတက်မှု စည်းမျဉ်း သတ်မှတ်ချက်များ)

**System (စနစ်):** Payment Request Workflow Management System (ငွေပေးချေမှု တောင်းဆိုလွှာ လုပ်ငန်းစဉ် စီမံခန့်ခွဲမှု စနစ်)  
**Document Classification (စာရွက်စာတမ်း အမျိုးအစားခွဲခြားခြင်း):** MANDATORY — Source of Truth for All Developers and AI Agents (မဖြစ်မနေ — Developer များနှင့် AI Agent များအားလုံးအတွက် အခြေခံ အမှန်တရား ရင်းမြစ်)  
**Version (ဗားရှင်း):** 2.0  
**Created (ဖန်တီးသည့်ရက်စွဲ):** 2026-06-12  
**Author (ရေးသားသူ):** Lead UI/UX Director & Enterprise Software Architect (ခေါင်းဆောင် UI/UX ဒါရိုက်တာ နှင့် လုပ်ငန်းသုံး ဆော့ဖ်ဝဲလ် ဗိသုကာ)  
**Status (အခြေအနေ):** Released (承認済み) (ထုတ်ပြန်ပြီး (အတည်ပြုပြီး))  
**Compliance Level (လိုက်နာရမည့် အဆင့်):** All rules in this document are BINDING. Non-compliance will result in automatic PR rejection. (ဤစာရွက်စာတမ်းရှိ စည်းမျဉ်းများအားလုံးသည် မဖြစ်မနေ လိုက်နာရမည်ဖြစ်သည်။ လိုက်နာရန် ပျက်ကွက်ပါက PR ကို အလိုအလျောက် ပယ်ချမည်ဖြစ်သည်။)

---

## Table of Contents (မာတိကာ)

1. [Naming Conventions & Coding Standards (အမည်ပေးခြင်းဆိုင်ရာ ထုံးစံများနှင့် ကုဒ်ရေးသားခြင်း စံနှုန်းများ)](#1-naming-conventions--coding-standards)
2. [Directory Isolation & Anti-Conflict Rules (ဖိုင်တွဲ သီးသန့်ခွဲခြားခြင်းနှင့် ပဋိပက္ခ ကာကွယ်ရေး စည်းမျဉ်းများ)](#2-directory-isolation--anti-conflict-rules)
3. [Git Branching & Commit Conventions (Git Branching နှင့် Commit ထုံးစံများ)](#3-git-branching--commit-conventions)
4. [AI Agent Guardrails (AI Agent ကန့်သတ်ချက်များ)](#4-ai-agent-guardrails)
5. [Security & Authentication Standards (လုံခြုံရေးနှင့် အထောက်အထား စိစစ်ခြင်း စံနှုန်းများ)](#5-security--authentication-standards)
6. [Error Handling & Logging Standards (အမှားဖြေရှင်းခြင်းနှင့် မှတ်တမ်းတင်ခြင်း စံနှုန်းများ)](#6-error-handling--logging-standards)
7. [Testing Strategy & Quality Gates (စမ်းသပ်ခြင်း မဟာဗျူဟာနှင့် အရည်အသွေး ထိန်းချုပ်မှုများ)](#7-testing-strategy--quality-gates)
8. [API Design & Communication Standards (API ဒီဇိုင်းနှင့် ဆက်သွယ်ရေး စံနှုန်းများ)](#8-api-design--communication-standards)
9. [Global UI/UX Design System Specification (ကမ္ဘာလုံးဆိုင်ရာ UI/UX ဒီဇိုင်း စနစ် သတ်မှတ်ချက်များ)](#9-global-uiux-design-system-specification)
10. [Performance & Optimization Standards (စွမ်းဆောင်ရည်နှင့် ပိုမိုကောင်းမွန်အောင် လုပ်ဆောင်ခြင်း စံနှုန်းများ)](#10-performance--optimization-standards)
11. [Environment Configuration & Deployment (ပတ်ဝန်းကျင် ဖွဲ့စည်းပုံနှင့် ဖြန့်ကြက်ခြင်း)](#11-environment-configuration--deployment)
12. [Document Revision History (စာရွက်စာတမ်း ပြင်ဆင်မှု ရာဇဝင်)](#12-document-revision-history)

---

## 1. Naming Conventions & Coding Standards (အမည်ပေးခြင်းဆိုင်ရာ ထုံးစံများနှင့် ကုဒ်ရေးသားခြင်း စံနှုန်းများ)

All developers and AI Agents must enforce the following naming and style rules without exception. These rules guarantee type safety, structural consistency, and automated tooling compatibility across the entire monorepo. (Developer များနှင့် AI Agent များအားလုံးသည် အောက်ပါ အမည်ပေးခြင်းနှင့် စတိုင် စည်းမျဉ်းများကို ချွင်းချက်မရှိ အတိအကျ လိုက်နာရမည်။ ဤစည်းမျဉ်းများသည် monorepo တစ်ခုလုံးရှိ အမျိုးအစား လုံခြုံမှု (type safety)၊ တည်ဆောက်ပုံ ညီညွတ်မှုနှင့် အလိုအလျောက် tool များ ကိုက်ညီမှုကို အာမခံပါသည်။)

### 1.1 Case Convention Matrix (အမည်ပေးခြင်းဆိုင်ရာ ပုံစံ ဇယား)

| Scope (နယ်ပယ်) | Convention (ထုံးစံ) | Examples (ဥပမာများ) | Enforced By (ထိန်းကျောင်းမည့်အရာ) |
| :--- | :--- | :--- | :--- |
| Variables & Functions (Backend & Frontend) (ပြောင်းလဲနိုင်သော ကိန်းများနှင့် လုပ်ဆောင်ချက်များ) | `camelCase` | `totalAmount`, `getRequestDetails`, `calculateBreakdownTotal` | ESLint |
| Classes, Components, Modules, Interfaces (ကလပ်စ်များ၊ အစိတ်အပိုင်းများ၊ မော်ဂျူးများ၊ အင်တာဖေ့စ်များ) | `PascalCase` | `PaymentRequestService`, `ApplicantDashboard`, `SharedModule` | ESLint + TSC |
| TypeScript Enums & Enum Members (TypeScript Enums နှင့် အဖွဲ့ဝင်များ) | `PascalCase` | `PaymentStatus.ManagerVerified`, `UserRole.Applicant` | ESLint |
| Database Tables & Columns (ဒေတာဘေ့စ် ဇယားများနှင့် ကော်လံများ) | `snake_case` | `payment_requests`, `request_number`, `payment_breakdown_item_id` | TypeORM Naming Strategy |
| Environment Variables (ပတ်ဝန်းကျင် ကိန်းရှင်များ) | `SCREAMING_SNAKE_CASE` | `DATABASE_HOST`, `JWT_SECRET`, `REDIS_URL` | .env validation (Joi) |
| TypeScript Files (Backend) (TypeScript ဖိုင်များ - နောက်ပိုင်း) | `kebab-case` | `payment-request.entity.ts`, `applicant.controller.ts`, `create-request.dto.ts` | PR Review |
| TypeScript Files (Frontend) (TypeScript ဖိုင်များ - ရှေ့ပိုင်း) | `PascalCase` for components, `kebab-case` for utilities | `ApplicantDashboard.tsx`, `use-payment-form.ts` | PR Review |
| CSS Class Overrides (custom) (CSS Class ပြင်ဆင်မှုများ) | `kebab-case` | `status-badge-draft`, `modal-overlay-backdrop` | Tailwind + custom CSS |
| Test Files (စမ်းသပ်ဖိုင်များ) | Mirror source with `.spec.ts` suffix | `payment-request.service.spec.ts`, `applicant.controller.spec.ts` | Jest config |
| DTO Files (DTO ဖိုင်များ) | `kebab-case` with descriptive action prefix | `create-payment-request.dto.ts`, `update-request-status.dto.ts` | PR Review |

### 1.2 TypeScript Strict Rules (TypeScript တင်းကျပ်သော စည်းမျဉ်းများ)

* `strict: true` must remain enabled in all `tsconfig.json` files. Disabling `strictNullChecks`, `noImplicitAny`, or `strictPropertyInitialization` is **FORBIDDEN**. (`strict: true` ကို `tsconfig.json` ဖိုင်များအားလုံးတွင် ဖွင့်ထားရမည်။ `strictNullChecks`, `noImplicitAny`, သို့မဟုတ် `strictPropertyInitialization` ကို ပိတ်ခြင်းသည် **တားမြစ်ထားသည်**)။
* All function parameters and return types must be explicitly annotated. Usage of the `any` type is prohibited in application code. The ESLint rule `@typescript-eslint/no-explicit-any` is set to `off` only for third-party integration wrappers; application-layer code must use precise types or generics. (လုပ်ဆောင်ချက် ဘောင်များ (parameters) နှင့် ပြန်ပေးမည့် အမျိုးအစားများကို ရှင်းလင်းစွာ ဖော်ပြရမည်။ application ကုဒ်တွင် `any` အမျိုးအစားကို အသုံးပြုခြင်းကို တားမြစ်ထားသည်။ third-party integration wrappers များအတွက်သာ ESLint rule `@typescript-eslint/no-explicit-any` ကို `off` ပြုလုပ်ထားသည်၊ application အဆင့် ကုဒ်သည် တိကျသော အမျိုးအစားများ သို့မဟုတ် generics များကို အသုံးပြုရမည်။)
* Prefer `interface` for object shape declarations and `type` for unions, intersections, and utility types. (Object ပုံစံ ကြေညာချက်များအတွက် `interface` ကို ဦးစားပေးပြီး၊ unions, intersections နှင့် utility အမျိုးအစားများအတွက် `type` ကို အသုံးပြုပါ။)

### 1.3 Comments & Documentation (မှတ်ချက်များနှင့် မှတ်တမ်းများ)

* All core services, controllers, gateways, guards, interceptors, and custom hooks must include descriptive JSDoc/TSDoc formatted comments. (အဓိက ဝန်ဆောင်မှုများ၊ ထိန်းချုပ်မှုများ၊ ဂိတ်ဝများ၊ guards များ၊ interceptors များနှင့် custom hooks များအားလုံးတွင် ရှင်းလင်းသော JSDoc/TSDoc ပုံစံ မှတ်ချက်များ ပါဝင်ရမည်။)
* Comments must explain the **business logic rationale**, not restate the obvious code behavior. (မှတ်ချက်များသည် ထင်ရှားသော ကုဒ်လုပ်ဆောင်ပုံကို ပြန်လည်ပြောဆိုခြင်းမဟုတ်ဘဲ **စီးပွားရေးဆိုင်ရာ ယုတ္တိဗေဒ အကြောင်းပြချက်** ကို ရှင်းပြရမည်။)
* Required JSDoc tags for public methods: (အများပြည်သူဆိုင်ရာ နည်းလမ်းများအတွက် လိုအပ်သော JSDoc tag များ)
  - `@description` — Business purpose of the method. (နည်းလမ်း၏ လုပ်ငန်းရည်ရွယ်ချက်။)
  - `@param` — Each parameter with type and purpose. (အမျိုးအစားနှင့် ရည်ရွယ်ချက်ပါရှိသော ဘောင်တစ်ခုစီ။)
  - `@returns` — Return value description. (ပြန်ပေးမည့် တန်ဖိုး ဖော်ပြချက်။)
  - `@throws` — Expected exception types and conditions. (မျှော်မှန်းထားသော ခြွင်းချက် အမျိုးအစားများနှင့် အခြေအနေများ။)

```typescript
/**
 * @description Transitions the payment request to MANAGER_REVIEWING status.
 * Triggered automatically when a manager opens a SUBMITTED_MANAGER request.
 * Records an immutable approval log entry with the action MGR_REVIEW_START.
 * (ငွေပေးချေမှု တောင်းဆိုချက်ကို MANAGER_REVIEWING အခြေအနေသို့ ပြောင်းလဲသည်။
 * မန်နေဂျာတစ်ဦးမှ SUBMITTED_MANAGER တောင်းဆိုချက်ကို ဖွင့်လိုက်သောအခါ အလိုအလျောက် အစပျိုးသည်။
 * MGR_REVIEW_START လုပ်ဆောင်ချက်ဖြင့် ပြင်ဆင်၍မရသော အတည်ပြုချက် မှတ်တမ်းကို မှတ်တမ်းတင်သည်။)
 *
 * @param requestId - The payment_request_id to transition. (ပြောင်းလဲမည့် payment_request_id)
 * @param managerId - The authenticated manager's user_id performing the review. (သုံးသပ်မှုပြုလုပ်နေသော စစ်ဆေးပြီး မန်နေဂျာ၏ user_id)
 * @param ipAddress - Client IP address for audit trail recording. (စစ်ဆေးမှု မှတ်တမ်းတင်ရန်အတွက် Client ၏ IP လိပ်စာ)
 * @returns The updated PaymentRequest entity with new status. (အခြေအနေသစ်ဖြင့် မွမ်းမံထားသော PaymentRequest entity)
 * @throws ForbiddenException if the request is not in SUBMITTED_MANAGER state. (တောင်းဆိုချက်သည် SUBMITTED_MANAGER အခြေအနေတွင် မရှိပါက ForbiddenException ပစ်လွှတ်သည်။)
 * @throws NotFoundException if the requestId does not exist or is soft-deleted. (requestId မရှိပါက သို့မဟုတ် soft-delete လုပ်ထားပါက NotFoundException ပစ်လွှတ်သည်။)
 */
async startManagerReview(
  requestId: number,
  managerId: number,
  ipAddress: string,
): Promise<PaymentRequest> { ... }
```

### 1.4 Linting & Formatting Enforcement (Linting နှင့် ပုံစံချခြင်းကို လိုက်နာစေခြင်း)

Code formatting is governed by the project-level ESLint and Prettier configurations. Compliance is mandatory and automatically enforced. (ကုဒ်ပုံစံချခြင်းကို ပရောဂျက်အဆင့် ESLint နှင့် Prettier ဖွဲ့စည်းပုံများဖြင့် အုပ်ချုပ်သည်။ လိုက်နာမှုသည် မဖြစ်မနေ လိုအပ်ပြီး အလိုအလျောက် သတ်မှတ်ထားသည်။)

**Prettier Configuration (`.prettierrc`):**

| Setting (ဆက်တင်) | Value (တန်ဖိုး) | Rationale (အကြောင်းပြချက်) |
| :--- | :--- | :--- |
| `singleQuote` | `true` | Consistency across NestJS backend and React frontend (NestJS backend နှင့် React frontend တစ်လျှောက် ညီညွတ်မှု) |
| `trailingComma` | `all` | Cleaner Git diffs on multi-line structures (လိုင်းများစွာရှိသော ဖွဲ့စည်းပုံများတွင် ပိုမိုရှင်းလင်းသော Git diffs) |

**ESLint Configuration (`eslint.config.mjs`):**

| Rule (စည်းမျဉ်း) | Setting (ဆက်တင်) | Rationale (အကြောင်းပြချက်) |
| :--- | :--- | :--- |
| `@typescript-eslint/no-explicit-any` | `off` | Allowed only in third-party wrappers; application code must avoid `any` (third-party wrappers များတွင်သာ ခွင့်ပြုထားသည်၊ application ကုဒ်သည် `any` ကို ရှောင်ရမည်) |
| `@typescript-eslint/no-floating-promises` | `warn` | Prevent unhandled async operations (မကိုင်တွယ်ထားသော async လုပ်ဆောင်ချက်များကို ကာကွယ်ရန်) |
| `@typescript-eslint/no-unsafe-argument` | `warn` | Guard against unsafe type coercions (မလုံခြုံသော အမျိုးအစား ပြောင်းလဲမှုများကို ကာကွယ်ရန်) |
| `prettier/prettier` | `error` with `endOfLine: auto` | Cross-platform line ending normalization (ပလက်ဖောင်းပေါင်းစုံ လိုင်းအဆုံး သတ်မှတ်ခြင်းကို ပုံမှန်ဖြစ်စေရန်) |

**Pre-Commit Checklist (မအပ်နှံမီ စစ်ဆေးရမည့်စာရင်း):**

1. Run `npm run lint` — Zero errors required. (`npm run lint` ကို ဖွင့်ပါ — အမှား လုံးဝမရှိရပါ။)
2. Run `npm run format` — All files must be auto-formatted. (`npm run format` ကို ဖွင့်ပါ — ဖိုင်များအားလုံးကို အလိုအလျောက် ပုံစံချရမည်။)
3. Run `npm run build` — Compilation must succeed with zero TypeScript errors. (`npm run build` ကို ဖွင့်ပါ — TypeScript အမှား လုံးဝမရှိဘဲ စုစည်းမှု အောင်မြင်ရမည်။)
4. Run `npm run test` — All unit tests must pass. (`npm run test` ကို ဖွင့်ပါ — unit စမ်းသပ်မှုများအားလုံး အောင်မြင်ရမည်။)

### 1.5 Import Ordering Convention (Import အစီအစဉ် ထုံးစံ)

All TypeScript files must organize imports in the following strict order, separated by blank lines: (TypeScript ဖိုင်များအားလုံးသည် သွင်းယူမှုများကို အောက်ပါ တင်းကျပ်သော အစီအစဉ်အတိုင်း စီစဉ်ရမည်၊ လိုင်းလွတ်များဖြင့် ခြားထားရမည်။)

```typescript
// 1. Node.js built-in modules (Node.js တွင်ပါဝင်သော မော်ဂျူးများ)
import { join } from 'path';

// 2. NestJS / React framework imports (NestJS / React framework မှ သွင်းယူမှုများ)
import { Injectable, ForbiddenException } from '@nestjs/common';

// 3. Third-party library imports (Third-party library မှ သွင်းယူမှုများ)
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// 4. Internal shared module imports (entities, DTOs, enums, guards) (အတွင်းပိုင်း မျှဝေထားသော မော်ဂျူး သွင်းယူမှုများ)
import { PaymentRequest } from '../shared/entities/payment-request.entity';
import { PaymentStatus } from '../shared/enums/payment-status.enum';

// 5. Local module imports (same feature module) (ဒေသဆိုင်ရာ မော်ဂျူး သွင်းယူမှုများ - တူညီသော feature မော်ဂျူး)
import { CreatePaymentRequestDto } from './dto/create-payment-request.dto';
```

---

## 2. Directory Isolation & Anti-Conflict Rules (ဖိုင်တွဲ သီးသန့်ခွဲခြားခြင်းနှင့် ပဋိပက္ခ ကာကွယ်ရေး စည်းမျဉ်းများ)

To prevent code regression, Git merge conflicts, and uncoordinated changes across overlapping features, the project enforces strict module-based directory isolation. (ကုဒ်ဆုတ်ယုတ်မှု၊ Git ပေါင်းစပ်မှု ပဋိပက္ခများနှင့် ထပ်တူကျနေသော လုပ်ဆောင်ချက်များတစ်လျှောက် ပေါင်းစပ်မထားသော အပြောင်းအလဲများကို ကာကွယ်ရန်၊ ပရောဂျက်သည် တင်းကျပ်သော မော်ဂျူးအခြေခံ ဖိုင်တွဲ သီးသန့်ခွဲခြားမှုကို ပြဋ္ဌာန်းထားသည်။)

### 2.1 Role-Based Module Ownership Matrix (အခန်းကဏ္ဍအခြေခံ မော်ဂျူး ပိုင်ဆိုင်မှု ဇယား)

Each developer and AI Agent is strictly locked to working inside their designated screen or role module. Cross-contamination of files between different role folders is a **blocking PR violation**. (Developer နှင့် AI Agent တစ်ခုစီသည် ၎င်းတို့သတ်မှတ်ထားသော မျက်နှာပြင် သို့မဟုတ် အခန်းကဏ္ဍ မော်ဂျူးအတွင်းတွင်သာ အလုပ်လုပ်ရန် တင်းကျပ်စွာ ကန့်သတ်ထားသည်။ မတူညီသော အခန်းကဏ္ဍ ဖိုင်တွဲများကြားတွင် ဖိုင်များကို ရောနှောခြင်းသည် **PR ကို ပိတ်ပင်မည့် ချိုးဖောက်မှု** ဖြစ်သည်။)

| Role Module (အခန်းကဏ္ဍ မော်ဂျူး) | Backend Path (နောက်ပိုင်း လမ်းကြောင်း) | Frontend Path (ရှေ့ပိုင်း လမ်းကြောင်း) | Scope (နယ်ပယ်) |
| :--- | :--- | :--- | :--- |
| **Applicant** (လျှောက်ထားသူ) | `src/modules/applicant/` | `frontend/src/pages/applicant/` | Draft CRUD, submission, re-submission, receipt upload (မူကြမ်း CRUD၊ တင်ပြခြင်း၊ ပြန်လည်တင်ပြခြင်း၊ ပြေစာ တင်ခြင်း) |
| **Manager** (မန်နေဂျာ) | `src/modules/manager/` | `frontend/src/pages/manager/` | Verification queue, verify/reject actions (အတည်ပြုရေး စာရင်း၊ အတည်ပြု/ပယ်ချ လုပ်ဆောင်ချက်များ) |
| **Approver** (ခွင့်ပြုသူ) | `src/modules/approver/` | `frontend/src/pages/approver/` | Final approval queue, approve/reject actions (အပြီးသတ် ခွင့်ပြုရေး စာရင်း၊ ခွင့်ပြု/ပယ်ချ လုပ်ဆောင်ချက်များ) |
| **Accounting** (စာရင်းကိုင်) | `src/modules/accounting/` | `frontend/src/pages/accounting/` | Payment processing queue, Mandalay branch alerts (ငွေပေးချေမှု လုပ်ဆောင်ရေး စာရင်း၊ မန္တလေး ဘဏ်ခွဲ သတိပေးချက်များ) |
| **Admin** (စီမံခန့်ခွဲသူ) | `src/modules/admin/` | `frontend/src/pages/admin/` | User CRUD, master data management, audit log viewer (အသုံးပြုသူ CRUD၊ မာစတာ ဒေတာ စီမံခန့်ခွဲမှု၊ စစ်ဆေးရေး မှတ်တမ်း ကြည့်ရှုသူ) |
| **Shared** (မျှဝေထားသော) | `src/modules/shared/` | `frontend/src/components/shared/` | Entities, DTOs, enums, guards, pipes, WebSocket gateway (Entities, DTOs, enums, guards, pipes, WebSocket gateway) |

### 2.2 Backend Module Internal Structure (နောက်ပိုင်း မော်ဂျူး အတွင်းပိုင်း တည်ဆောက်ပုံ)

Each role module (`src/modules/{role}/`) must follow this internal directory layout: (အခန်းကဏ္ဍ မော်ဂျူး တစ်ခုစီသည် အောက်ပါ အတွင်းပိုင်း ဖိုင်တွဲ ဖွဲ့စည်းပုံကို လိုက်နာရမည်)

```
src/modules/applicant/
├── applicant.module.ts          # NestJS module definition (NestJS မော်ဂျူး သတ်မှတ်ချက်)
├── applicant.controller.ts      # REST API route handlers (REST API လမ်းကြောင်း ထိန်းချုပ်သူများ)
├── applicant.service.ts         # Business logic layer (စီးပွားရေးဆိုင်ရာ ယုတ္တိဗေဒ အလွှာ)
├── dto/                         # Request/Response DTOs (တောင်းဆို/တုံ့ပြန် DTOs)
│   ├── create-payment-request.dto.ts
│   ├── update-payment-request.dto.ts
│   └── submit-to-manager.dto.ts
├── guards/                      # Role-specific route guards (if any) (အခန်းကဏ္ဍ အလိုက် လမ်းကြောင်း လုံခြုံရေးများ)
└── tests/                       # Unit and integration tests (Unit နှင့် ပေါင်းစပ် စမ်းသပ်မှုများ)
    ├── applicant.controller.spec.ts
    └── applicant.service.spec.ts
```

### 2.3 Frontend Module Internal Structure (ရှေ့ပိုင်း မော်ဂျူး အတွင်းပိုင်း တည်ဆောက်ပုံ)

Each role page directory (`frontend/src/pages/{role}/`) must follow this internal layout: (အခန်းကဏ္ဍ စာမျက်နှာ ဖိုင်တွဲ တစ်ခုစီသည် အောက်ပါ အတွင်းပိုင်း ဖွဲ့စည်းပုံကို လိုက်နာရမည်)

```
frontend/src/pages/applicant/
├── ApplicantDashboard.tsx       # Main dashboard page component (အဓိက ဒက်ရှ်ဘုတ် စာမျက်နှာ အစိတ်အပိုင်း)
├── CreateRequestForm.tsx        # Payment request creation form (ငွေပေးချေမှု တောင်းဆိုလွှာ ဖန်တီးရေး ဖောင်)
├── EditRequestForm.tsx          # Draft/rejected request editor (မူကြမ်း/ပယ်ချခံရသော တောင်းဆိုလွှာ တည်းဖြတ်သူ)
├── RequestDetailView.tsx        # Read-only request detail viewer (ဖတ်ရန်သာ တောင်းဆိုလွှာ အသေးစိတ် ကြည့်ရှုသူ)
├── components/                  # Role-specific reusable components (အခန်းကဏ္ဍ အလိုက် ပြန်လည်အသုံးပြုနိုင်သော အစိတ်အပိုင်းများ)
│   ├── BreakdownItemTable.tsx
│   ├── ReceiptUploader.tsx
│   └── StatusBadge.tsx
├── hooks/                       # Role-specific custom hooks (အခန်းကဏ္ဍ အလိုက် custom hooks)
│   ├── use-draft-requests.ts
│   └── use-submit-request.ts
└── utils/                       # Role-specific utility functions (အခန်းကဏ္ဍ အလိုက် အထောက်အကူပြု လုပ်ဆောင်ချက်များ)
    └── calculate-total.ts
```

### 2.4 Shared Layer Access Control (မျှဝေထားသော အလွှာ အသုံးပြုခွင့် ထိန်းချုပ်မှု)

The shared layer contains PostgreSQL/TypeORM entities, global Redis providers, WebSocket gateway hubs, common guards, pipes, and interceptors. (မျှဝေထားသော အလွှာတွင် PostgreSQL/TypeORM entities, ကမ္ဘာလုံးဆိုင်ရာ Redis ပံ့ပိုးသူများ, WebSocket gateway hubs, အများသုံး guards, pipes, နှင့် interceptors များ ပါဝင်သည်။)

**Access Rules (အသုံးပြုခွင့် စည်းမျဉ်းများ):**

| Action (လုပ်ဆောင်ချက်) | Permission Level (ခွင့်ပြုချက် အဆင့်) | Required Approval (လိုအပ်သော အတည်ပြုချက်) |
| :--- | :--- | :--- |
| Import and use shared entities/DTOs/enums (မျှဝေထားသော entities/DTOs/enums များကို သွင်းယူအသုံးပြုခြင်း) | ALLOWED for all modules (မော်ဂျူးအားလုံးအတွက် ခွင့်ပြုသည်) | None (မရှိပါ) |
| Add new files to shared layer (မျှဝေထားသော အလွှာသို့ ဖိုင်အသစ်များ ထည့်ခြင်း) | RESTRICTED (ကန့်သတ်ထားသည်) | Project Leader written approval (ပရောဂျက် ခေါင်းဆောင်၏ ရေးသားအတည်ပြုချက်) |
| Modify existing shared entities or interfaces (ရှိပြီးသား မျှဝေထားသော entities သို့မဟုတ် interfaces များကို ပြင်ဆင်ခြင်း) | RESTRICTED (ကန့်သတ်ထားသည်) | Project Leader written approval + full regression test (ပရောဂျက် ခေါင်းဆောင်၏ ရေးသားအတည်ပြုချက် + အပြည့်အစုံ regression စမ်းသပ်မှု) |
| Delete any shared file (မည်သည့် မျှဝေထားသော ဖိုင်ကိုမဆို ဖျက်ခြင်း) | FORBIDDEN (တားမြစ်ထားသည်) | Not permitted under any circumstances (မည်သည့် အခြေအနေတွင်မဆို ခွင့်မပြုပါ) |

### 2.5 Cross-Module Communication (မော်ဂျူးအချင်းချင်း ဆက်သွယ်ရေး)

* Role modules must **never** import directly from another role module. All inter-module data exchange must occur through: (အခန်းကဏ္ဍ မော်ဂျူးများသည် အခြား အခန်းကဏ္ဍ မော်ဂျူးမှ တိုက်ရိုက် သွင်းယူခြင်းကို **ဘယ်တော့မှ** မပြုလုပ်ရပါ။ မော်ဂျူးများအကြား ဒေတာ ဖလှယ်မှုအားလုံးသည် အောက်ပါတို့မှတဆင့် ဖြစ်ပေါ်ရမည်-)
  1. The shared entity layer (database-level joins via TypeORM relations). (မျှဝေထားသော entity အလွှာ - TypeORM ဆက်ဆံရေးများမှတဆင့် ဒေတာဘေ့စ် အဆင့် ချိတ်ဆက်မှုများ။)
  2. The WebSocket gateway hub (real-time event broadcast from `src/modules/shared/gateways/`). (WebSocket gateway hub - `src/modules/shared/gateways/` မှ ချက်ချင်း အဖြစ်အပျက် ထုတ်လွှင့်မှု။)
  3. Shared service abstractions exposed via the `SharedModule` exports. (`SharedModule` တင်ပို့မှုများမှတဆင့် ပြသထားသော မျှဝေထားသော ဝန်ဆောင်မှု အကျဉ်းချုပ်များ။)
* **Example of a FORBIDDEN import (တားမြစ်ထားသော သွင်းယူမှု ဥပမာ):**

```typescript
// FORBIDDEN — Direct cross-module import (တားမြစ်ထားသည် — တိုက်ရိုက် မော်ဂျူးအချင်းချင်း သွင်းယူမှု)
import { ManagerService } from '../manager/manager.service';
```

* **Correct pattern (မှန်ကန်သော ပုံစံ):**

```typescript
// CORRECT — Use shared entities and services (မှန်ကန်သည် — မျှဝေထားသော entities နှင့် ဝန်ဆောင်မှုများကို အသုံးပြုပါ)
import { PaymentRequest } from '../shared/entities/payment-request.entity';
import { NotificationGateway } from '../shared/gateways/notification.gateway';
```

---

## 3. Git Branching & Commit Conventions (Git Branching နှင့် Commit ထုံးစံများ)

### 3.1 Branch Strategy (Branch မဟာဗျူဟာ)

The project follows a trunk-based development model with short-lived feature branches. (ပရောဂျက်သည် ကာလတို လုပ်ဆောင်ချက် branch များပါရှိသော trunk အခြေပြု ဖွံ့ဖြိုးတိုးတက်မှု မော်ဒယ်ကို လိုက်နာသည်။)

```
main (protected) (ကာကွယ်ထားသည်)
 ├── develop (integration branch) (ပေါင်းစပ်မှု branch)
 │   ├── feature/screen-A-draft-save
 │   ├── feature/screen-B-manager-verify
 │   ├── feature/screen-C-approver-dashboard
 │   ├── feature/screen-D-accounting-payment
 │   ├── feature/screen-E-admin-user-mgmt
 │   ├── fix/totalAmount-precision-rounding
 │   └── chore/database-migration-v1.2
 └── release/v1.0.0 (tagged release) (အမှတ်အသားပြုထားသော ထုတ်ပြန်ချက်)
```

#### 3.1.1 Active Developer Feature Branches (လက်ရှိ Developer Feature Branch များ)

Each role module is assigned a dedicated feature branch for the current development sprint. Developers must only commit to their assigned branch. (အခန်းကဏ္ဍ မော်ဂျူးတစ်ခုစီကို လက်ရှိ ဖွံ့ဖြိုးတိုးတက်မှု sprint အတွက် သီးသန့် feature branch တစ်ခု သတ်မှတ်ပေးထားသည်။ Developer များသည် ၎င်းတို့၏ သတ်မှတ်ထားသော branch တွင်သာ commit လုပ်ရမည်။)

| Role Module (အခန်းကဏ္ဍ မော်ဂျူး) | Feature Branch | Scope (နယ်ပယ်) |
| :--- | :--- | :--- |
| Applicant (လျှောက်ထားသူ) | `feature/applicant-soehtetlin` | Applicant dashboard, draft CRUD, submission, receipt upload (လျှောက်ထားသူ ဒက်ရှ်ဘုတ်၊ မူကြမ်း CRUD၊ တင်ပြခြင်း၊ ပြေစာ တင်ခြင်း) |
| Manager (မန်နေဂျာ) | `feature/manager-ayethandarmoe` | Manager verification queue, verify/reject actions (မန်နေဂျာ အတည်ပြုရေး စာရင်း၊ အတည်ပြု/ပယ်ချ လုပ်ဆောင်ချက်များ) |
| Final Approver (ခွင့်ပြုသူ) | `feature/approver-khaingthinthinwin` | Approver dashboard, final approval/rejection actions (ခွင့်ပြုသူ ဒက်ရှ်ဘုတ်၊ အပြီးသတ် ခွင့်ပြု/ပယ်ချ လုပ်ဆောင်ချက်များ) |
| Accounting (စာရင်းကိုင်) | `feature/accounting-shinminthant` | Accounting payment processing queue, Mandalay branch alerts (ငွေပေးချေမှု လုပ်ဆောင်ရေး စာရင်း၊ မန္တလေး ဘဏ်ခွဲ သတိပေးချက်များ) |
| Admin (စီမံခန့်ခွဲသူ) | `feature/admin-yemaungmaung` | Admin panel, user CRUD, master data management, audit logs (စီမံခန့်ခွဲမှု ပန်နယ်၊ အသုံးပြုသူ CRUD၊ မာစတာ ဒေတာ စီမံခန့်ခွဲမှု၊ စစ်ဆေးရေး မှတ်တမ်းများ) |

**Branch Isolation Rules (Branch သီးသန့်ခွဲခြားရေး စည်းမျဉ်းများ):**
* Each developer works **exclusively** on their assigned feature branch. (Developer တစ်ဦးစီသည် ၎င်းတို့၏ သတ်မှတ်ထားသော feature branch တွင် **သီးသန့်** အလုပ်လုပ်ရမည်။)
* Cross-branch commits (e.g., an Applicant developer committing to the Manager branch) are a **blocking PR violation**. (Branch အချင်းချင်း commit များ (ဥပမာ- Applicant developer တစ်ဦးမှ Manager branch တွင် commit လုပ်ခြင်း) သည် **PR ကို ပိတ်ပင်မည့် ချိုးဖောက်မှု** ဖြစ်သည်။)
* All feature branches are created from `master` and will be merged back via Pull Request after review. (Feature branch များအားလုံးကို `master` မှ ဖန်တီးထားပြီး သုံးသပ်ပြီးနောက် Pull Request မှတဆင့် ပြန်လည် ပေါင်းစပ်မည်ဖြစ်သည်။)

**Branch Naming Rules (Branch အမည်ပေးခြင်း စည်းမျဉ်းများ):**

| Branch Type (Branch အမျိုးအစား) | Pattern (ပုံစံ) | Example (ဥပမာ) |
| :--- | :--- | :--- |
| Feature (role-based) (လုပ်ဆောင်ချက် - အခန်းကဏ္ဍ အခြေပြု) | `feature/{role}-{developer}` | `feature/applicant-soehtetlin` |
| Feature (screen-based) (လုပ်ဆောင်ချက် - မျက်နှာပြင် အခြေပြု) | `feature/screen-[A-E]-{description}` | `feature/screen-A-draft-save` |
| Feature (task-based) (လုပ်ဆောင်ချက် - တာဝန် အခြေပြု) | `feature/task-{id}-{description}` | `feature/task-102-migration` |
| Bug Fix (အမှား ပြင်ဆင်ချက်) | `fix/{description}` | `fix/totalAmount-precision-rounding` |
| Chore / Maintenance (ပုံမှန်လုပ်ငန်း / ပြုပြင်ထိန်းသိမ်းမှု) | `chore/{description}` | `chore/upgrade-nestjs-v11` |
| Hotfix (production) (အရေးပေါ် ပြင်ဆင်ချက်) | `hotfix/{description}` | `hotfix/jwt-token-expiry` |

**Protection Rules (ကာကွယ်ရေး စည်းမျဉ်းများ):**
* Direct pushes to `main` or `develop` are blocked at the repository level. (`main` သို့မဟုတ် `develop` သို့ တိုက်ရိုက် တွန်းပို့မှုများကို repository အဆင့်တွင် ပိတ်ဆို့ထားသည်။)
* All changes must flow through Pull Requests. (အပြောင်းအလဲများအားလုံးသည် Pull Requests မှတဆင့် စီးဆင်းရမည်။)
* Force-push is disabled on `main` and `develop`. (`main` နှင့် `develop` တွင် ဖိအားပေး တွန်းပို့ခြင်းကို ပိတ်ထားသည်။)

### 3.2 Commit Message Format (Commit မက်ဆေ့ဂျ် ပုံစံ)

All commits must enforce semantic prefixes to enable automatic changelog generation and audit compliance. The format follows Conventional Commits specification. (အလိုအလျောက် မှတ်တမ်း ဖန်တီးခြင်းနှင့် စစ်ဆေးမှု လိုက်နာရန်အတွက် commit များအားလုံးသည် အဓိပ္ပာယ်ရှိသော ရှေ့ဆက်များကို မဖြစ်မနေ အသုံးပြုရမည်။ ပုံစံသည် သမားရိုးကျ Commits သတ်မှတ်ချက်ကို လိုက်နာသည်။)

**Format (ပုံစံ):** `{prefix}: {concise description in imperative mood}` (`{ရှေ့ဆက်}: {အမိန့်ပေးဟန်ဖြင့် တိုတောင်းသော ဖော်ပြချက်}`)

| Prefix (ရှေ့ဆက်) | Usage (အသုံးပြုမှု) | Example (ဥပမာ) |
| :--- | :--- | :--- |
| `feat` | New feature implementations (လုပ်ဆောင်ချက်အသစ် အကောင်အထည်ဖော်မှုများ) | `feat: implement applicant draft creation API` |
| `fix` | Bug resolution (အမှား ဖြေရှင်းခြင်း) | `fix: resolve totalAmount NUMERIC precision rounding error` |
| `docs` | Documentation changes only (စာရွက်စာတမ်း အပြောင်းအလဲများသာ) | `docs: update database schema specification v1.1` |
| `refactor` | Code improvements without behavior change (အပြုအမူ မပြောင်းလဲဘဲ ကုဒ် ပိုမိုကောင်းမွန်အောင် ပြုလုပ်ခြင်း) | `refactor: extract breakdown calculation to shared utility` |
| `test` | Adding or updating tests (စမ်းသပ်မှုများ ထည့်ခြင်း သို့မဟုတ် အပ်ဒိတ်လုပ်ခြင်း) | `test: add unit tests for manager verification flow` |
| `chore` | Build, CI/CD, dependency updates (တည်ဆောက်မှု၊ CI/CD၊ မှီခိုမှု အပ်ဒိတ်များ) | `chore: upgrade TypeORM to v0.3.20` |
| `style` | Formatting-only changes (no logic) (ပုံစံချခြင်း အပြောင်းအလဲများသာ - ယုတ္တိမပါ) | `style: apply Prettier formatting to accounting module` |
| `perf` | Performance improvement (စွမ်းဆောင်ရည် တိုးတက်မှု) | `perf: add composite index for dashboard query optimization` |

**Commit Rules (Commit စည်းမျဉ်းများ):**
* Maximum subject line length: **72 characters**. (အကြောင်းအရာလိုင်း အများဆုံး အရှည်- **စာလုံး ၇၂ လုံး**)
* Use imperative mood: "add" not "added", "fix" not "fixed". (အမိန့်ပေးဟန်ကို အသုံးပြုပါ- "added" မဟုတ်ဘဲ "add", "fixed" မဟုတ်ဘဲ "fix")
* Do not end the subject line with a period. (အကြောင်းအရာလိုင်းကို အစက်ဖြင့် အဆုံးမသတ်ပါနှင့်။)
* Body (optional) must be separated by a blank line and wrap at 80 characters. (ခန္ဓာကိုယ် (ရွေးချယ်နိုင်သည်) ကို လိုင်းလွတ်တစ်ခုဖြင့် ခြားထားရမည်ဖြစ်ပြီး စာလုံး ၈၀ တွင် ခေါက်ရမည်။)

### 3.3 Pull Request (PR) Policy (Pull Request (PR) မူဝါဒ)

Merging to `develop` or `main` requires all of the following conditions: (`develop` သို့မဟုတ် `main` သို့ ပေါင်းစပ်ခြင်းသည် အောက်ပါ အခြေအနေများအားလုံးကို လိုအပ်သည်-)

| Gate (ဂိတ်) | Requirement (လိုအပ်ချက်) | Automated (အလိုအလျောက်) |
| :--- | :--- | :--- |
| Build Check (တည်ဆောက်မှု စစ်ဆေးခြင်း) | `npm run build` succeeds with zero errors (အမှား လုံးဝမရှိဘဲ အောင်မြင်သည်) | Yes (CI) |
| Lint Check (Lint စစ်ဆေးခြင်း) | `npm run lint` reports zero errors (အမှား လုံးဝမရှိကြောင်း အစီရင်ခံသည်) | Yes (CI) |
| Test Suite (စမ်းသပ်မှု အစုအဝေး) | `npm run test` — all unit tests pass (unit စမ်းသပ်မှုများအားလုံး အောင်မြင်သည်) | Yes (CI) |
| Peer Review (လုပ်ဖော်ကိုင်ဖက် သုံးသပ်ချက်) | Minimum 1 approval from a team member (အဖွဲ့ဝင်တစ်ဦးထံမှ အနည်းဆုံး အတည်ပြုချက် ၁ ခု) | Manual (ကိုယ်တိုင်) |
| Scope Validation (နယ်ပယ် စစ်ဆေးခြင်း) | Changes are confined to the developer's assigned module directory (အပြောင်းအလဲများသည် developer ၏ သတ်မှတ်ထားသော မော်ဂျူး ဖိုင်တွဲတွင်သာ ကန့်သတ်ထားသည်) | Manual (ကိုယ်တိုင်) |
| Shared Layer (မျှဝေထားသော အလွှာ) | If shared layer is modified, Project Leader must approve (မျှဝေထားသော အလွှာကို ပြင်ဆင်ပါက ပရောဂျက် ခေါင်းဆောင်က အတည်ပြုရမည်) | Manual (ကိုယ်တိုင်) |
| Commit Format (Commit ပုံစံ) | All commits follow semantic prefix convention (commit များအားလုံးသည် semantic prefix ထုံးစံကို လိုက်နာသည်) | Yes (commitlint) |

**PR Description Template (PR ဖော်ပြချက် ပုံစံ):**

```markdown
## Summary (အကျဉ်းချုပ်)
[Concise description of what this PR accomplishes] (ဤ PR မည်သို့ ပြီးမြောက်ကြောင်း တိုတောင်းသော ဖော်ပြချက်)

## Screen/Module (မျက်နှာပြင်/မော်ဂျူး)
[Screen-A / Screen-B / Screen-C / Screen-D / Screen-E / Shared]

## Changes (အပြောင်းအလဲများ)
- [List of specific changes] (တိကျသော အပြောင်းအလဲများ စာရင်း)

## Testing (စမ်းသပ်ခြင်း)
- [ ] Unit tests added/updated (Unit စမ်းသပ်မှုများ ထည့်သွင်း/အပ်ဒိတ်လုပ်ထားသည်)
- [ ] Manual testing completed (ကိုယ်တိုင် စမ်းသပ်မှု ပြီးစီးသည်)
- [ ] Build passes locally (စက်တွင်းတွင် တည်ဆောက်မှု အောင်မြင်သည်)

## Screenshots (if UI changes) (စခရင်ရှော့များ - UI ပြောင်းလဲပါက)
[Attach before/after screenshots] (အရင်/နောက် စခရင်ရှော့များကို ပူးတွဲပါ)
```

---

## 4. AI Agent Guardrails (AI Agent ကန့်သတ်ချက်များ)

When using agentic coding assistants (Cursor, Gemini, GitHub Copilot, or automated subagents), the following guardrails are mandatory to prevent architectural drift, style violations, and unauthorized modifications. (Agentic ကုဒ်ရေးသားခြင်း အထောက်အကူများ (Cursor, Gemini, GitHub Copilot သို့မဟုတ် အလိုအလျောက် subagents များ) ကို အသုံးပြုသောအခါ၊ ဗိသုကာဆိုင်ရာ လမ်းလွဲမှုများ၊ စတိုင် ချိုးဖောက်မှုများနှင့် ခွင့်ပြုချက်မရှိသော ပြုပြင်မွမ်းမံမှုများကို ကာကွယ်ရန် အောက်ပါ ကန့်သတ်ချက်များသည် မဖြစ်မနေ လိုအပ်ပါသည်။)

### 4.1 Mandatory Context Injection (မဖြစ်မနေ ဆက်စပ်အကြောင်းအရာ ထည့်သွင်းခြင်း)

Before triggering any code generation or code edit operation, the developer **must** feed the following documents as active system context boundaries: (မည်သည့် ကုဒ် ဖန်တီးမှု သို့မဟုတ် ကုဒ် တည်းဖြတ်မှု လုပ်ငန်းစဉ်ကိုမျှ မစတင်မီ၊ developer သည် အောက်ပါ စာရွက်စာတမ်းများကို တက်ကြွသော စနစ် ဆက်စပ်အကြောင်းအရာ နယ်နိမိတ်များအဖြစ် **မဖြစ်မနေ** ထည့်သွင်းရမည်-)

| Priority (ဦးစားပေး) | Document (စာရွက်စာတမ်း) | Purpose (ရည်ရွယ်ချက်) |
| :--- | :--- | :--- |
| P0 (Critical - အရေးကြီးသည်) | `docs/02_開発ルール_DEVELOPMENT_RULES.md` (this file - ဤဖိုင်) | Architecture rules, naming conventions, design system (ဗိသုကာ စည်းမျဉ်းများ၊ အမည်ပေးခြင်း ထုံးစံများ၊ ဒီဇိုင်း စနစ်) |
| P0 (Critical - အရေးကြီးသည်) | Target screen design document from `docs/screens/` (`docs/screens/` မှ ပစ်မှတ်ထားသော မျက်နှာပြင် ဒီဇိုင်း စာရွက်စာတမ်း) | Screen-specific field definitions, validation rules, layout (မျက်နှာပြင်အလိုက် အကွက် သတ်မှတ်ချက်များ၊ အတည်ပြုရေး စည်းမျဉ်းများ၊ အပြင်အဆင်) |
| P1 (Required - လိုအပ်သည်) | `docs/01_要件定義書_REQUIREMENT_SPEC.md` | Business rules, workflow transitions, special conditions (စီးပွားရေး စည်းမျဉ်းများ၊ လုပ်ငန်းစဉ် ပြောင်းလဲမှုများ၊ အထူး အခြေအနေများ) |
| P2 (Reference - ရည်ညွှန်းချက်) | `docs/03_データベース設計書_DATABASE_SPEC.md` | Entity schemas, column types, constraints (Entity schemas, ကော်လံ အမျိုးအစားများ၊ ကန့်သတ်ချက်များ) |

### 4.2 Generation Scope Restrictions (ဖန်တီးမှု နယ်ပယ် ကန့်သတ်ချက်များ)

| Rule (စည်းမျဉ်း) | Description (ဖော်ပြချက်) |
| :--- | :--- |
| **Module Boundary (မော်ဂျူး နယ်နိမိတ်)** | AI agents must NOT generate or modify code outside their assigned role module directory. (AI agent များသည် ၎င်းတို့၏ သတ်မှတ်ထားသော အခန်းကဏ္ဍ မော်ဂျူး ဖိုင်တွဲ ပြင်ပတွင် ကုဒ်များကို ဖန်တီးခြင်း သို့မဟုတ် ပြင်ဆင်ခြင်း မပြုလုပ်ရပါ။) |
| **Shared Layer Lock (မျှဝေထားသော အလွှာ သော့ခတ်ခြင်း)** | AI agents must NEVER modify files in `src/modules/shared/` without explicit human review and Project Leader approval. (လူသား သုံးသပ်ချက်နှင့် ပရောဂျက် ခေါင်းဆောင်၏ အတည်ပြုချက်မပါဘဲ `src/modules/shared/` ရှိ ဖိုင်များကို AI agent များသည် **ဘယ်တော့မှ** မပြင်ဆင်ရပါ။) |
| **No Auto-Install (အလိုအလျောက် တပ်ဆင်ခြင်း မရှိပါ)** | AI agents must NOT execute `npm install` or add new dependencies without developer confirmation. (AI agent များသည် developer ၏ အတည်ပြုချက်မပါဘဲ `npm install` ကို လုပ်ဆောင်ခြင်း သို့မဟုတ် မှီခိုမှုအသစ်များ ထည့်သွင်းခြင်း မပြုလုပ်ရပါ။) |
| **No Schema Mutations (Schema ပြောင်းလဲခြင်း မရှိပါ)** | AI agents must NOT generate or execute database migration scripts (`CREATE TABLE`, `ALTER TABLE`, `DROP`) without Project Leader review. (AI agent များသည် ပရောဂျက် ခေါင်းဆောင်၏ သုံးသပ်ချက်မပါဘဲ ဒေတာဘေ့စ် ပြောင်းရွှေ့ခြင်း script များကို ဖန်တီးခြင်း သို့မဟုတ် လုပ်ဆောင်ခြင်း မပြုလုပ်ရပါ။) |
| **No Environment Changes (ပတ်ဝန်းကျင် အပြောင်းအလဲ မရှိပါ)** | AI agents must NOT modify `.env`, `docker-compose.yml`, or CI/CD configuration files. (AI agent များသည် `.env`, `docker-compose.yml`, သို့မဟုတ် CI/CD ဖွဲ့စည်းပုံ ဖိုင်များကို မပြင်ဆင်ရပါ။) |

### 4.3 Output Verification Checklist (ရလဒ် အတည်ပြုချက် စစ်ဆေးရမည့်စာရင်း)

Developers must perform the following checks on ALL AI-generated code before staging: (Developer များသည် အဆင့်မတင်မီ AI-ဖန်တီးထားသော ကုဒ် **အားလုံး** အပေါ် အောက်ပါ စစ်ဆေးမှုများကို လုပ်ဆောင်ရမည်-)

1. **Type Safety (အမျိုးအစား လုံခြုံမှု):** Verify all types are explicit — no implicit `any`, no missing return types, no untyped parameters. (အမျိုးအစားအားလုံး ရှင်းလင်းမှုရှိမရှိ စစ်ဆေးပါ — မသိမသာ `any` မရှိရ၊ ပျောက်ဆုံးနေသော return အမျိုးအစားများ မရှိရ၊ အမျိုးအစားမသတ်မှတ်ထားသော parameters များ မရှိရ။)
2. **Naming Compliance (အမည်ပေးခြင်း လိုက်နာမှု):** Confirm all variables, functions, classes, and files follow Section 1.1 naming conventions. (ပြောင်းလဲနိုင်သော ကိန်းများ၊ လုပ်ဆောင်ချက်များ၊ ကလပ်စ်များနှင့် ဖိုင်များအားလုံးသည် အပိုင်း ၁.၁ အမည်ပေးခြင်း ထုံးစံများကို လိုက်နာကြောင်း အတည်ပြုပါ။)
3. **Import Correctness (Import မှန်ကန်မှု):** Verify no cross-module imports (Section 2.5) and proper import ordering (Section 1.5). (မော်ဂျူးအချင်းချင်း သွင်းယူမှုများ မရှိခြင်း (အပိုင်း ၂.၅) နှင့် သင့်လျော်သော import အစီအစဉ် (အပိုင်း ၁.၅) ကို စစ်ဆေးပါ။)
4. **Business Logic (စီးပွားရေးဆိုင်ရာ ယုတ္တိဗေဒ):** Cross-reference generated workflow transitions against the state machine defined in `01_要件定義書` Section 4. (ဖန်တီးထားသော လုပ်ငန်းစဉ် ပြောင်းလဲမှုများကို `01_要件定義書` အပိုင်း ၄ တွင် သတ်မှတ်ထားသော state machine နှင့် တိုက်ဆိုင်စစ်ဆေးပါ။)
5. **Design System (ဒီဇိုင်း စနစ်):** Confirm all UI components use the exact color tokens, spacing, and typography defined in Section 9 of this document. (UI အစိတ်အပိုင်းအားလုံးသည် ဤစာရွက်စာတမ်း အပိုင်း ၉ တွင် သတ်မှတ်ထားသော အရောင် သင်္ကေတများ၊ နေရာချထားမှုနှင့် စာလုံးပုံစံများကို တိကျစွာ အသုံးပြုကြောင်း အတည်ပြုပါ။)
6. **Security (လုံခြုံရေး):** Verify all endpoints include proper `@UseGuards(JwtAuthGuard, RolesGuard)` decorators and `@Roles()` annotations. (endpoint အားလုံးတွင် သင့်လျော်သော `@UseGuards(JwtAuthGuard, RolesGuard)` decorators နှင့် `@Roles()` မှတ်ချက်များ ပါဝင်ကြောင်း စစ်ဆေးပါ။)
7. **Compilation (စုစည်းမှု):** Run `npm run build` — zero errors required before staging. (`npm run build` ကို ဖွင့်ပါ — အဆင့်မတင်မီ အမှား လုံးဝမရှိရန် လိုအပ်သည်။)

### 4.4 Prohibited AI Actions (တားမြစ်ထားသော AI လုပ်ဆောင်ချက်များ)

The following actions are **strictly forbidden** for AI agents under all circumstances: (အောက်ပါ လုပ်ဆောင်ချက်များကို AI agent များအတွက် မည်သည့် အခြေအနေတွင်မဆို **တင်းကျပ်စွာ တားမြစ်ထားပါသည်**-)

* Deleting or renaming existing files without explicit human instruction. (လူသား၏ ရှင်းလင်းသော ညွှန်ကြားချက်မပါဘဲ ရှိပြီးသား ဖိုင်များကို ဖျက်ခြင်း သို့မဟုတ် အမည်ပြောင်းခြင်း။)
* Generating mock data that contains real personal information, financial data, or credentials. (အစစ်အမှန် ကိုယ်ရေးကိုယ်တာ အချက်အလက်များ၊ ဘဏ္ဍာရေး ဒေတာ သို့မဟုတ် အထောက်အထားများ ပါဝင်သော အတုအယောင် ဒေတာများကို ဖန်တီးခြင်း။)
* Bypassing TypeScript strict mode by adding `// @ts-ignore` or `// @ts-nocheck` comments. (`// @ts-ignore` သို့မဟုတ် `// @ts-nocheck` မှတ်ချက်များကို ပေါင်းထည့်ခြင်းဖြင့် TypeScript strict မုဒ်ကို ကျော်ဖြတ်ခြင်း။)
* Creating new NestJS modules or React route entries without human approval. (လူသား အတည်ပြုချက်မပါဘဲ NestJS မော်ဂျူးအသစ်များ သို့မဟုတ် React လမ်းကြောင်း အသစ်များကို ဖန်တီးခြင်း။)
* Modifying the `main.ts` bootstrap file, `AppModule`, or global middleware chain. (`main.ts` bootstrap ဖိုင်၊ `AppModule`, သို့မဟုတ် ကမ္ဘာလုံးဆိုင်ရာ middleware ကွင်းဆက်ကို ပြင်ဆင်ခြင်း။)

---

## 5. Security & Authentication Standards (လုံခြုံရေးနှင့် အထောက်အထား စိစစ်ခြင်း စံနှုန်းများ)

### 5.1 Authentication Architecture (အထောက်အထား စိစစ်ခြင်း ဗိသုကာ)

| Component (အစိတ်အပိုင်း) | Implementation (အကောင်အထည်ဖော်မှု) | Details (အသေးစိတ်) |
| :--- | :--- | :--- |
| Token Format (Token ပုံစံ) | JWT (JSON Web Token) | RS256 signing algorithm with asymmetric key pair (မညီမျှသော သော့တွဲပါရှိသည့် RS256 လက်မှတ်ရေးထိုးခြင်း အယ်လဂိုရီသမ်) |
| Access Token TTL (ဝင်ရောက်ခွင့် Token သက်တမ်း) | 15 minutes (၁၅ မိနစ်) | Short-lived to minimize exposure window (ထိတွေ့မှု အချိန်ကို လျှော့ချရန် ကာလတို) |
| Refresh Token TTL (ပြန်လည်ဆန်းသစ်သည့် Token သက်တမ်း) | 7 days (၇ ရက်) | Stored in HttpOnly cookie, rotated on use (HttpOnly ကွတ်ကီးတွင် သိမ်းဆည်းထားပြီး၊ အသုံးပြုသည့်အခါ အသစ်လဲလှယ်သည်) |
| Password Hashing (စကားဝှက် Hashing) | bcrypt | Minimum 12 salt rounds (အနည်းဆုံး ၁၂ salt အကျော့များ) |
| Session Store (Session သိမ်းဆည်းရာ) | Redis | Key pattern: `session:{session_token}` with 1-hour sliding TTL (သော့ပုံစံ- ၁-နာရီ ရွှေ့ပြောင်းနိုင်သော TTL ပါရှိသည့် `session:{session_token}`) |

### 5.2 JWT Payload Structure (JWT Payload ဖွဲ့စည်းပုံ)

```typescript
interface JwtPayload {
  sub: number;          // user_id (primary key) (အသုံးပြုသူ_id - အဓိက သော့)
  email: string;        // user email address (အသုံးပြုသူ အီးမေးလ် လိပ်စာ)
  role: string;         // role_code from user_roles table (e.g., 'APPLICANT') (user_roles ဇယားမှ အခန်းကဏ္ဍ_ကုဒ် (ဥပမာ- 'APPLICANT'))
  branch: string;       // user branch name (critical for Mandalay alert logic) (အသုံးပြုသူ ဘဏ်ခွဲ အမည် (မန္တလေး သတိပေးချက် ယုတ္တိဗေဒအတွက် အရေးကြီးသည်))
  employeeNumber: string; // ဝန်ထမ်း နံပါတ်
  iat: number;          // issued at timestamp (ထုတ်ပေးသည့် အချိန်)
  exp: number;          // expiration timestamp (သက်တမ်းကုန်ဆုံးမည့် အချိန်)
}
```

### 5.3 Role-Based Access Control (RBAC) Enforcement (အခန်းကဏ္ဍအခြေခံ ဝင်ရောက်ခွင့် ထိန်းချုပ်မှု (RBAC) ကို လိုက်နာစေခြင်း)

Every API endpoint must be protected with both authentication and authorization decorators: (API endpoint တိုင်းကို authentication နှင့် authorization decorators နှစ်ခုလုံးဖြင့် ကာကွယ်ထားရမည်-)

```typescript
@Controller('api/v1/applicant')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Applicant)
export class ApplicantController {
  // All routes in this controller are restricted to APPLICANT role only
  // ဤ controller ရှိ လမ်းကြောင်းအားလုံးကို APPLICANT အခန်းကဏ္ဍအတွက်သာ ကန့်သတ်ထားသည်
}
```

**RBAC Enforcement Matrix (RBAC လိုက်နာစေခြင်း ဇယား):**

| Endpoint Scope (Endpoint နယ်ပယ်) | Allowed Roles (ခွင့်ပြုထားသော အခန်းကဏ္ဍများ) | Guard Stack (Guard အစီအစဉ်) |
| :--- | :--- | :--- |
| `/api/v1/applicant/*` | `APPLICANT` | `JwtAuthGuard` + `RolesGuard` |
| `/api/v1/manager/*` | `MANAGER` | `JwtAuthGuard` + `RolesGuard` |
| `/api/v1/approver/*` | `APPROVER` | `JwtAuthGuard` + `RolesGuard` |
| `/api/v1/accounting/*` | `ACCOUNTING` | `JwtAuthGuard` + `RolesGuard` |
| `/api/v1/admin/*` | `ADMIN` | `JwtAuthGuard` + `RolesGuard` |
| `/api/v1/auth/login` | Public (အများပြည်သူ) | None (rate-limited) (မရှိပါ - နှုန်းထား ကန့်သတ်ထားသည်) |
| `/api/v1/auth/refresh` | Authenticated (စစ်ဆေးပြီးသား) | `JwtAuthGuard` |
| `/api/v1/shared/lookups` | All authenticated (စစ်ဆေးပြီးသား အားလုံး) | `JwtAuthGuard` |

### 5.4 Input Validation & Sanitization (ထည့်သွင်းမှု အတည်ပြုခြင်းနှင့် သန့်စင်ခြင်း)

* All incoming request bodies must be validated using `class-validator` decorators on DTO classes. (ဝင်လာသော တောင်းဆိုမှု ခန္ဓာကိုယ်များအားလုံးကို DTO ကလပ်စ်များပေါ်ရှိ `class-validator` decorators ကို အသုံးပြု၍ အတည်ပြုရမည်။)
* All string inputs must be sanitized using `class-transformer` with `@Transform()` to trim whitespace and strip HTML. (စာသား ထည့်သွင်းမှုများအားလုံးကို နေရာလွတ်များ ဖြတ်တောက်ရန်နှင့် HTML ကို ဖယ်ရှားရန် `@Transform()` ဖြင့် `class-transformer` ကို အသုံးပြု၍ သန့်စင်ရမည်။)
* SQL injection is prevented by TypeORM parameterized queries — raw SQL queries using string concatenation are **FORBIDDEN**. (SQL injection ကို TypeORM parameterized queries များဖြင့် ကာကွယ်ထားသည် — စာသား ပေါင်းစပ်မှုကို အသုံးပြုသော အကြမ်းထည် SQL မေးမြန်းမှုများကို **တားမြစ်ထားသည်**။)
* File uploads must validate MIME type against the whitelist: `application/pdf`, `image/jpeg`, `image/jpg`, `image/png`. (ဖိုင် အပ်လုဒ်များသည် MIME အမျိုးအစားကို အဖြူရောင်စာရင်းနှင့် တိုက်ဆိုင်စစ်ဆေးရမည်- `application/pdf`, `image/jpeg`, `image/jpg`, `image/png`။)
* Maximum file size validation: 10MB per file, 50MB aggregate per payment request. (အများဆုံး ဖိုင်အရွယ်အစား အတည်ပြုချက်- ဖိုင်တစ်ဖိုင်လျှင် 10MB၊ ငွေပေးချေမှု တောင်းဆိုချက်တစ်ခုလျှင် စုစုပေါင်း 50MB။)

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

### 5.5 CORS & Rate Limiting (CORS နှင့် နှုန်းထား ကန့်သတ်ခြင်း)

| Setting (ဆက်တင်) | Value (တန်ဖိုး) |
| :--- | :--- |
| CORS Origins (CORS ဇာစ်မြစ်များ) | Whitelist-only: configured via `CORS_ORIGINS` env variable (အဖြူရောင်စာရင်းသာ- `CORS_ORIGINS` env ကိန်းရှင်မှတဆင့် ဖွဲ့စည်းထားသည်) |
| Rate Limit (Global) (နှုန်းထား ကန့်သတ်ချက် (ကမ္ဘာလုံးဆိုင်ရာ)) | 100 requests per minute per IP (IP တစ်ခုလျှင် တစ်မိနစ်လျှင် တောင်းဆိုချက် ၁၀၀) |
| Rate Limit (Auth endpoints) (နှုန်းထား ကန့်သတ်ချက် (Auth endpoints)) | 10 requests per minute per IP (IP တစ်ခုလျှင် တစ်မိနစ်လျှင် တောင်းဆိုချက် ၁၀) |
| Rate Limit Storage (နှုန်းထား ကန့်သတ်ချက် သိမ်းဆည်းရာ) | Redis key: `ratelimit:{ip}:{endpoint}` with 60-second TTL (စက္ကန့် ၆၀ TTL ပါရှိသော Redis သော့- `ratelimit:{ip}:{endpoint}`) |

---

## 6. Error Handling & Logging Standards (အမှားဖြေရှင်းခြင်းနှင့် မှတ်တမ်းတင်ခြင်း စံနှုန်းများ)

### 6.1 HTTP Error Response Format (HTTP အမှား တုံ့ပြန်မှု ပုံစံ)

All API error responses must conform to the following standardized JSON structure: (API အမှား တုံ့ပြန်မှုများအားလုံးသည် အောက်ပါ စံသတ်မှတ်ထားသော JSON ဖွဲ့စည်းပုံနှင့် ကိုက်ညီရမည်-)

```json
{
  "statusCode": 403,
  "error": "Forbidden",
  "message": "You do not have permission to access this payment request.",
  "timestamp": "2026-06-12T05:30:00.000Z",
  "path": "/api/v1/manager/requests/142"
}
```

### 6.2 Exception Hierarchy (ခြွင်းချက် အဆင့်ဆင့်)

| HTTP Status | NestJS Exception | Usage Context (အသုံးပြုမှု အခြေအနေ) |
| :--- | :--- | :--- |
| 400 | `BadRequestException` | Validation failures, malformed input, business rule violations (အတည်ပြုချက် ကျရှုံးမှုများ၊ ပုံစံမမှန်သော ထည့်သွင်းမှု၊ စီးပွားရေး စည်းမျဉ်း ချိုးဖောက်မှုများ) |
| 401 | `UnauthorizedException` | Missing or expired JWT token (ပျောက်ဆုံးနေသော သို့မဟုတ် သက်တမ်းကုန်နေသော JWT token) |
| 403 | `ForbiddenException` | Valid token but insufficient role permissions (မှန်ကန်သော token ဖြစ်သော်လည်း လုံလောက်သော အခန်းကဏ္ဍ ခွင့်ပြုချက်မရှိခြင်း) |
| 404 | `NotFoundException` | Requested resource not found or soft-deleted (တောင်းဆိုထားသော အရင်းအမြစ်ကို ရှာမတွေ့ပါ သို့မဟုတ် ပျော့ပျောင်းစွာ ဖျက်ထားသည်) |
| 409 | `ConflictException` | Invalid state transition (e.g., approving a DRAFT) (မမှန်ကန်သော အခြေအနေ ပြောင်းလဲမှု (ဥပမာ- DRAFT ကို အတည်ပြုခြင်း)) |
| 422 | `UnprocessableEntityException` | Receipt file missing when `has_receipt` is true (`has_receipt` သည် မှန်ကန်သောအခါ ပြေစာဖိုင် ပျောက်ဆုံးနေခြင်း) |
| 429 | `ThrottlerException` | Rate limit exceeded (နှုန်းထား ကန့်သတ်ချက် ကျော်လွန်သွားသည်) |
| 500 | `InternalServerErrorException` | Unhandled server errors (must log full stack trace) (မကိုင်တွယ်ထားသော ဆာဗာ အမှားများ (အပြည့်အစုံ stack trace ကို မှတ်တမ်းတင်ရမည်)) |

### 6.3 Logging Architecture (မှတ်တမ်းတင်ခြင်း ဗိသုကာ)

| Log Level (မှတ်တမ်း အဆင့်) | Usage (အသုံးပြုမှု) | Output Target (ထွက်ပေါ်မည့် ပစ်မှတ်) |
| :--- | :--- | :--- |
| `ERROR` | Unhandled exceptions, database connection failures, critical failures (မကိုင်တွယ်ထားသော ခြွင်းချက်များ၊ ဒေတာဘေ့စ် ချိတ်ဆက်မှု ကျရှုံးမှုများ၊ အရေးကြီးသော ကျရှုံးမှုများ) | File + Console + Alert (ဖိုင် + ကွန်ဆိုးလ် + သတိပေးချက်) |
| `WARN` | Deprecated API usage, approaching rate limits, retry attempts (ခေတ်နောက်ကျနေသော API အသုံးပြုမှု၊ နှုန်းထား ကန့်သတ်ချက်များသို့ ချဉ်းကပ်လာခြင်း၊ ပြန်လည်ကြိုးစားမှုများ) | File + Console (ဖိုင် + ကွန်ဆိုးလ်) |
| `LOG` | Workflow state transitions, approval actions, payment completions (လုပ်ငန်းစဉ် အခြေအနေ ပြောင်းလဲမှုများ၊ အတည်ပြုရေး လုပ်ဆောင်ချက်များ၊ ငွေပေးချေမှု ပြီးစီးမှုများ) | File + Console (ဖိုင် + ကွန်ဆိုးလ်) |
| `DEBUG` | Detailed request/response payloads, query execution times (အသေးစိတ် တောင်းဆို/တုံ့ပြန်မှု ဒေတာများ၊ မေးမြန်းမှု လုပ်ဆောင်ချိန်များ) | File only (dev/staging) (ဖိုင်သာလျှင် - ဖွံ့ဖြိုး/အဆင့်တင်) |
| `VERBOSE` | Granular internal method tracing (အသေးစိတ် အတွင်းပိုင်း နည်းလမ်း ခြေရာခံခြင်း) | Disabled in production (ထုတ်လုပ်ရေးတွင် ပိတ်ထားသည်) |

**Mandatory Log Fields (မဖြစ်မနေ မှတ်တမ်းတင်ရမည့် အကွက်များ):**

```typescript
{
  timestamp: string;       // ISO 8601 UTC format (ISO 8601 UTC ပုံစံ)
  level: string;           // ERROR | WARN | LOG | DEBUG
  context: string;         // Service or controller class name (ဝန်ဆောင်မှု သို့မဟုတ် controller ကလပ်စ် အမည်)
  message: string;         // Human-readable description (လူသားဖတ်နိုင်သော ဖော်ပြချက်)
  userId?: number;         // Authenticated user ID (if available) (စစ်ဆေးပြီး အသုံးပြုသူ ID (ရရှိနိုင်ပါက))
  requestId?: string;      // Correlation ID for request tracing (တောင်းဆိုမှု ခြေရာခံရန်အတွက် ဆက်စပ် ID)
  ipAddress?: string;      // Client IP for audit trail (စစ်ဆေးမှု မှတ်တမ်းအတွက် Client IP)
  duration?: number;       // Operation duration in milliseconds (လုပ်ဆောင်မှု ကြာချိန် - မီလီစက္ကန့်)
}
```

### 6.4 Audit Trail Requirements (စစ်ဆေးမှု မှတ်တမ်း လိုအပ်ချက်များ)

All workflow state transitions must produce an immutable `approval_logs` record containing: (လုပ်ငန်းစဉ် အခြေအနေ ပြောင်းလဲမှုအားလုံးသည် အောက်ပါတို့ပါဝင်သော ပြင်ဆင်၍မရသော `approval_logs` မှတ်တမ်းကို ထုတ်လုပ်ရမည်-)

| Field (အကွက်) | Source (ရင်းမြစ်) | Required (လိုအပ်ချက်) |
| :--- | :--- | :--- |
| `payment_request_id` | Path parameter | Always (အမြဲတမ်း) |
| `action_taken_by_user_id` | JWT payload `sub` | Always (အမြဲတမ်း) |
| `action_type_id` | Mapped from `approval_action_types` master (`approval_action_types` မာစတာမှ ချိတ်ဆက်ထားသည်) | Always (အမြဲတမ်း) |
| `previous_status_id` | Current entity `status_id` before transition (မပြောင်းလဲမီ လက်ရှိ entity ၏ `status_id`) | Always (အမြဲတမ်း) |
| `new_status_id` | Target status after transition (ပြောင်းလဲပြီးနောက် ပစ်မှတ် အခြေအနေ) | Always (အမြဲတမ်း) |
| `comment` | Request body (mandatory for REJECT actions, min 10 chars) (တောင်းဆိုမှု ခန္ဓာကိုယ် (REJECT လုပ်ဆောင်ချက်များအတွက် မဖြစ်မနေ လိုအပ်သည်၊ အနည်းဆုံး စာလုံး ၁၀ လုံး)) | Conditional (အခြေအနေအရ) |
| `ip_address` | Request header `x-forwarded-for` or socket address (တောင်းဆိုမှု ခေါင်းစီး `x-forwarded-for` သို့မဟုတ် socket လိပ်စာ) | Always (အမြဲတမ်း) |
| `user_agent` | Request header `user-agent` (တောင်းဆိုမှု ခေါင်းစီး `user-agent`) | Always (အမြဲတမ်း) |
| `timestamp` | Server-side UTC timestamp (ဆာဗာဘက်မှ UTC အချိန်) | Always (auto) (အမြဲတမ်း - အလိုအလျောက်) |

---

## 7. Testing Strategy & Quality Gates (စမ်းသပ်ခြင်း မဟာဗျူဟာနှင့် အရည်အသွေး ထိန်းချုပ်မှုများ)

### 7.1 Test Coverage Requirements (စမ်းသပ်မှု လွှမ်းခြုံမှု လိုအပ်ချက်များ)

| Test Type (စမ်းသပ်မှု အမျိုးအစား) | Minimum Coverage (အနည်းဆုံး လွှမ်းခြုံမှု) | Scope (နယ်ပယ်) |
| :--- | :--- | :--- |
| Unit Tests | 80% line coverage per service (ဝန်ဆောင်မှုတစ်ခုလျှင် လိုင်းလွှမ်းခြုံမှု ၈၀%) | Service layer business logic (ဝန်ဆောင်မှု အလွှာ စီးပွားရေးဆိုင်ရာ ယုတ္တိဗေဒ) |
| Integration Tests | All critical workflow paths (အရေးကြီးသော လုပ်ငန်းစဉ် လမ်းကြောင်းများအားလုံး) | State transition sequences (အခြေအနေ ပြောင်းလဲမှု အစီအစဉ်များ) |
| E2E Tests | All happy paths + critical edge cases (အဆင်ပြေသော လမ်းကြောင်းများအားလုံး + အရေးကြီးသော ထူးခြားဖြစ်စဉ်များ) | Full API request lifecycle (အပြည့်အစုံ API တောင်းဆိုမှု ဘဝစက်ဝန်း) |

### 7.2 Unit Test Standards (Unit စမ်းသပ်မှု စံနှုန်းများ)

* Test framework: **Jest** (pre-configured in NestJS scaffold). (စမ်းသပ်မှု မူဘောင်- **Jest** (NestJS scaffold တွင် ကြိုတင်ပြင်ဆင်ထားသည်)။)
* File naming: `{source-file-name}.spec.ts` placed in `tests/` subdirectory within each module. (ဖိုင်အမည်ပေးခြင်း- `{source-file-name}.spec.ts` ကို မော်ဂျူးတစ်ခုစီအတွင်းရှိ `tests/` ဖိုင်တွဲခွဲတွင် ထားရှိသည်။)
* Each test file must include the following test categories: (စမ်းသပ်ဖိုင်တစ်ခုစီတွင် အောက်ပါ စမ်းသပ်မှု အမျိုးအစားများ ပါဝင်ရမည်-)

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

### 7.3 Workflow State Transition Test Matrix (လုပ်ငန်းစဉ် အခြေအနေ ပြောင်းလဲမှု စမ်းသပ်မှု ဇယား)

All workflow transitions defined in the Requirement Specification Section 4 must have dedicated test cases: (လိုအပ်ချက် သတ်မှတ်ချက် အပိုင်း ၄ တွင် သတ်မှတ်ထားသော လုပ်ငန်းစဉ် ပြောင်းလဲမှုများအားလုံးအတွက် သီးသန့် စမ်းသပ်မှု အခြေအနေများ ရှိရမည်-)

| From Status (မှ အခြေအနေ) | Action (လုပ်ဆောင်ချက်) | To Status (သို့ အခြေအနေ) | Test Required (စမ်းသပ်ရန် လိုအပ်သည်) |
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

### 7.4 Negative Test Requirements (အပျက်သဘောဆောင်သော စမ်းသပ်မှု လိုအပ်ချက်များ)

Every transition test must include complementary negative cases: (ပြောင်းလဲမှု စမ်းသပ်မှုတိုင်းတွင် ဖြည့်စွက် အပျက်သဘောဆောင်သော အခြေအနေများ ပါဝင်ရမည်-)

* Attempting a transition from an invalid source status must throw `ConflictException`. (မမှန်ကန်သော ရင်းမြစ် အခြေအနေမှ ပြောင်းလဲရန် ကြိုးပမ်းမှုသည် `ConflictException` ကို ပစ်လွှတ်ရမည်။)
* Attempting an action by an unauthorized role must throw `ForbiddenException`. (ခွင့်ပြုချက်မရှိသော အခန်းကဏ္ဍတစ်ခုမှ လုပ်ဆောင်ရန် ကြိုးပမ်းမှုသည် `ForbiddenException` ကို ပစ်လွှတ်ရမည်။)
* Rejection without a comment or with fewer than 10 characters must throw `BadRequestException`. (မှတ်ချက်မပါဘဲ သို့မဟုတ် စာလုံး ၁၀ လုံးအောက်နည်းသော ပယ်ချမှုသည် `BadRequestException` ကို ပစ်လွှတ်ရမည်။)
* Submission with `has_receipt = true` and zero uploaded files must throw `UnprocessableEntityException`. (`has_receipt = true` နှင့် အပ်လုဒ်လုပ်ထားသော ဖိုင် သုည ဖြင့် တင်ပြမှုသည် `UnprocessableEntityException` ကို ပစ်လွှတ်ရမည်။)
* Deletion of a non-DRAFT request must throw `ForbiddenException`. (DRAFT မဟုတ်သော တောင်းဆိုချက်ကို ဖျက်ခြင်းသည် `ForbiddenException` ကို ပစ်လွှတ်ရမည်။)

### 7.5 Test Execution Commands (စမ်းသပ်မှု လုပ်ဆောင်မည့် အမိန့်များ)

```bash
# Run all unit tests (unit စမ်းသပ်မှုများအားလုံးကို ဖွင့်ရန်)
npm run test

# Run tests with coverage report (လွှမ်းခြုံမှု အစီရင်ခံစာနှင့်အတူ စမ်းသပ်မှုများကို ဖွင့်ရန်)
npm run test:cov

# Run tests for a specific module (တိကျသော မော်ဂျူးတစ်ခုအတွက် စမ်းသပ်မှုများကို ဖွင့်ရန်)
npm run test -- --testPathPattern=applicant

# Run E2E tests (E2E စမ်းသပ်မှုများကို ဖွင့်ရန်)
npm run test:e2e
```

---

## 8. API Design & Communication Standards (API ဒီဇိုင်းနှင့် ဆက်သွယ်ရေး စံနှုန်းများ)

### 8.1 REST API URL Convention (REST API URL ထုံးစံ)

All API endpoints follow a versioned, resource-oriented URL structure: (API endpoint အားလုံးသည် ဗားရှင်းသတ်မှတ်ထားသော၊ အရင်းအမြစ်-အသားပေး URL ဖွဲ့စည်းပုံကို လိုက်နာသည်-)

```
/api/v1/{role}/{resource}/{id?}/{action?}
```

**URL Design Rules (URL ဒီဇိုင်း စည်းမျဉ်းများ):**

| Rule (စည်းမျဉ်း) | Convention (ထုံးစံ) | Example (ဥပမာ) |
| :--- | :--- | :--- |
| API Version Prefix (API ဗားရှင်း ရှေ့ဆက်) | `/api/v1/` | All endpoints (endpoint များအားလုံး) |
| Role Namespace (အခန်းကဏ္ဍ အမည်နေရာ) | Lowercase role name (အသေးစား အခန်းကဏ္ဍ အမည်) | `/api/v1/applicant/` |
| Resource Name (အရင်းအမြစ် အမည်) | Plural nouns in kebab-case (kebab-case ဖြင့် အများကိန်း နာမ်များ) | `/api/v1/applicant/payment-requests` |
| Resource ID (အရင်းအမြစ် ID) | Numeric path parameter (ဂဏန်း လမ်းကြောင်း ဘောင်) | `/api/v1/applicant/payment-requests/142` |
| Action Sub-resource (လုပ်ဆောင်ချက် အရင်းအမြစ်ခွဲ) | Verb in kebab-case (kebab-case ဖြင့် ကြိယာ) | `/api/v1/applicant/payment-requests/142/submit-to-manager` |
| Query Parameters (မေးမြန်းမှု ဘောင်များ) | camelCase | `?statusId=2&page=1&pageSize=20` |

### 8.2 Standard REST Methods (စံ REST နည်းလမ်းများ)

| HTTP Method | Purpose (ရည်ရွယ်ချက်) | Request Body (တောင်းဆိုမှု ခန္ဓာကိုယ်) | Example (ဥပမာ) |
| :--- | :--- | :--- | :--- |
| `GET` | Retrieve resource(s) (အရင်းအမြစ်(များ) ကို ရယူရန်) | None (မရှိပါ) | `GET /api/v1/applicant/payment-requests` |
| `POST` | Create new resource (အရင်းအမြစ်သစ် ဖန်တီးရန်) | JSON DTO | `POST /api/v1/applicant/payment-requests` |
| `PATCH` | Partial update (တစ်စိတ်တစ်ပိုင်း အပ်ဒိတ်လုပ်ရန်) | JSON DTO (partial) | `PATCH /api/v1/applicant/payment-requests/142` |
| `DELETE` | Logical delete (soft) (ယုတ္တိဗေဒအရ ဖျက်ရန် (ပျော့ပျောင်းစွာ)) | None (မရှိပါ) | `DELETE /api/v1/applicant/payment-requests/142` |
| `POST` | Workflow actions (လုပ်ငန်းစဉ် လုပ်ဆောင်ချက်များ) | JSON DTO (optional) | `POST /api/v1/manager/payment-requests/142/verify` |

### 8.3 Pagination Response Format (စာမျက်နှာခွဲခြင်း တုံ့ပြန်မှု ပုံစံ)

All list endpoints must return paginated responses using the following structure: (စာရင်း endpoint အားလုံးသည် အောက်ပါ ဖွဲ့စည်းပုံကို အသုံးပြု၍ စာမျက်နှာခွဲထားသော တုံ့ပြန်မှုများကို ပြန်ပေးရမည်-)

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

### 8.4 WebSocket Event Standards (WebSocket အဖြစ်အပျက် စံနှုန်းများ)

Real-time notifications are delivered via WebSocket using Socket.IO through the shared gateway hub. (အချိန်နှင့်တစ်ပြေးညီ သတိပေးချက်များကို မျှဝေထားသော gateway hub မှတဆင့် Socket.IO ကို အသုံးပြု၍ WebSocket မှ ပေးပို့သည်။)

**Event Naming Convention (အဖြစ်အပျက် အမည်ပေးခြင်း ထုံးစံ):** `{domain}:{action}` in lowercase kebab-case. (အသေးစား kebab-case ဖြင့် `{နယ်ပယ်}:{လုပ်ဆောင်ချက်}`)

| Event Name (အဖြစ်အပျက် အမည်) | Payload | Triggered When (မည်သည့်အခါတွင် အစပျိုးသနည်း) | Target Audience (ပစ်မှတ် ပရိသတ်) |
| :--- | :--- | :--- | :--- |
| `request:status-changed` | `{ requestId, oldStatus, newStatus, updatedBy }` | Any workflow state transition (မည်သည့် လုပ်ငန်းစဉ် အခြေအနေ ပြောင်းလဲမှုမဆို) | All users assigned to the request (တောင်းဆိုချက်တွင် သတ်မှတ်ထားသော အသုံးပြုသူအားလုံး) |
| `request:new-submission` | `{ requestId, requestNumber, applicantName }` | Applicant submits to Manager (လျှောက်ထားသူက မန်နေဂျာထံ တင်ပြသောအခါ) | Assigned Manager (သတ်မှတ်ထားသော မန်နေဂျာ) |
| `request:approved` | `{ requestId, requestNumber, approverName }` | Final Approver approves (အပြီးသတ် ခွင့်ပြုသူက ခွင့်ပြုသောအခါ) | Applicant + Accounting (လျှောက်ထားသူ + စာရင်းကိုင်) |
| `request:rejected` | `{ requestId, requestNumber, rejectedBy, comment }` | Manager or Approver rejects (မန်နေဂျာ သို့မဟုတ် ခွင့်ပြုသူက ပယ်ချသောအခါ) | Applicant (လျှောက်ထားသူ) |
| `request:payment-completed` | `{ requestId, requestNumber }` | Accounting marks as paid (စာရင်းကိုင်က ငွေပေးချေပြီးအဖြစ် သတ်မှတ်သောအခါ) | Applicant (လျှောက်ထားသူ) |

**WebSocket Connection Rules (WebSocket ချိတ်ဆက်မှု စည်းမျဉ်းများ):**
* All WebSocket connections must be authenticated via JWT token passed in the `auth.token` handshake parameter. (WebSocket ချိတ်ဆက်မှုအားလုံးကို `auth.token` handshake ဘောင်တွင် ပေးပို့ထားသော JWT token မှတဆင့် အထောက်အထား စိစစ်ရမည်။)
* Redis Set key `websocket:user:{id}:sockets` tracks active socket IDs per user with a 2-hour TTL. (Redis Set သော့ `websocket:user:{id}:sockets` သည် အသုံးပြုသူတစ်ဦးစီအတွက် တက်ကြွသော socket ID များကို ၂-နာရီ TTL ဖြင့် ခြေရာခံသည်။)
* Event propagation latency must not exceed 500ms from status update to client delivery (NFR requirement). (အဖြစ်အပျက် ပျံ့နှံ့မှု နှောင့်နှေးချိန်သည် အခြေအနေ အပ်ဒိတ်မှ client ထံ ပေးပို့မှုအထိ 500ms ထက် မကျော်လွန်ရပါ (NFR လိုအပ်ချက်)။)

---

## 9. Global UI/UX Design System Specification (ကမ္ဘာလုံးဆိုင်ရာ UI/UX ဒီဇိုင်း စနစ် သတ်မှတ်ချက်များ)

This section defines the absolute visual source of truth for all frontend components. Every developer and AI Agent generating React/Tailwind code must use these exact tokens. Deviation is a **blocking PR violation**. (ဤအပိုင်းသည် ရှေ့ပိုင်း အစိတ်အပိုင်းအားလုံးအတွက် လုံးဝ အမြင်ပိုင်းဆိုင်ရာ အခြေခံ အမှန်တရား ရင်းမြစ်ကို သတ်မှတ်သည်။ React/Tailwind ကုဒ်ကို ဖန်တီးသော developer နှင့် AI Agent တိုင်းသည် ဤသင်္ကေတများကို တိကျစွာ အသုံးပြုရမည်။ သွေဖည်ခြင်းသည် **PR ကို ပိတ်ပင်မည့် ချိုးဖောက်မှု** ဖြစ်သည်။)

### 9.1 Design Philosophy (ဒီဇိုင်း ဒဿန)

The system targets a **premium enterprise dashboard** aesthetic — clean, data-dense, and professional. The design language prioritizes: (စနစ်သည် **အဆင့်မြင့် လုပ်ငန်းသုံး ဒက်ရှ်ဘုတ်** အလှတရားကို ပစ်မှတ်ထားသည် — ရှင်းလင်းသော၊ ဒေတာသိပ်သည်းသော၊ နှင့် ပရော်ဖက်ရှင်နယ်ကျသော။ ဒီဇိုင်း ဘာသာစကားသည် အောက်ပါတို့ကို ဦးစားပေးသည်-)

* **Clarity over decoration:** Every visual element must serve an information purpose. (အလှဆင်ခြင်းထက် ရှင်းလင်းမှု- အမြင်အာရုံ အစိတ်အပိုင်းတိုင်းသည် အချက်အလက် ရည်ရွယ်ချက်အတွက် အသုံးဝင်ရမည်။)
* **Density with readability:** Dashboard layouts maximize data visibility without sacrificing scan-ability. (ဖတ်နိုင်စွမ်းရှိသော သိပ်သည်းမှု- ဒက်ရှ်ဘုတ် အပြင်အဆင်များသည် လွယ်ကူစွာ ဖတ်ရှုနိုင်မှုကို မထိခိုက်စေဘဲ ဒေတာ မြင်နိုင်စွမ်းကို အမြင့်ဆုံးဖြစ်စေသည်။)
* **Status at a glance:** Workflow states must be instantly recognizable through consistent color coding. (တစ်ချက်ကြည့်ရုံဖြင့် အခြေအနေသိနိုင်မှု- လုပ်ငန်းစဉ် အခြေအနေများကို တသမတ်တည်းဖြစ်သော အရောင်သတ်မှတ်ချက်များမှတဆင့် ချက်ချင်း သိမြင်နိုင်ရမည်။)
* **Accessibility baseline:** WCAG 2.1 AA contrast ratio compliance on all text/background combinations. (ဝင်ရောက်သုံးစွဲနိုင်မှု အခြေခံမျဉ်း- စာသား/နောက်ခံ ပေါင်းစပ်မှုအားလုံးတွင် WCAG 2.1 AA အလင်းအမှောင် ခြားနားမှု အချိုး လိုက်နာမှု။)

### 9.2 Color System (Theme Palette) (အရောင် စနစ် (အခင်းအကျင်း အရောင်အသွေး))

#### 9.2.1 Core Brand Colors (အဓိက အမှတ်တံဆိပ် အရောင်များ)

| Token Name (သင်္ကေတ အမည်) | Hex Value | Tailwind Class | Usage (အသုံးပြုမှု) |
| :--- | :--- | :--- | :--- |
| Primary Corporate | `#1E3A8A` | `bg-blue-900` / `text-blue-900` | Navigation bar, primary headers, CTA buttons (လမ်းကြောင်းပြဘား၊ အဓိက ခေါင်းစီးများ၊ CTA ခလုတ်များ) |
| Primary Hover | `#1E40AF` | `bg-blue-800` | Button hover states, active nav items (ခလုတ် hover အခြေအနေများ၊ တက်ကြွသော nav အရာများ) |
| Primary Light | `#DBEAFE` | `bg-blue-100` | Selected row highlights, active tab backgrounds (ရွေးချယ်ထားသော အတန်း ပေါ်လွင်ချက်များ၊ တက်ကြွသော တက်ဘ် နောက်ခံများ) |
| Background Canvas | `#F8FAFC` | `bg-slate-50` | Page body background (reduces eye strain) (စာမျက်နှာ ကိုယ်ထည် နောက်ခံ (မျက်စိညောင်းညာမှုကို လျှော့ချပေးသည်)) |
| Card Surface | `#FFFFFF` | `bg-white` | Card containers, modal surfaces, form panels (ကတ် ကွန်တိန်နာများ၊ မိုဒယ် မျက်နှာပြင်များ၊ ဖောင် အကန့်များ) |
| Border Default | `#E2E8F0` | `border-slate-200` | Card borders, input borders, dividers (ကတ် ဘောင်များ၊ ထည့်သွင်းမှု ဘောင်များ၊ ပိုင်းခြားသူများ) |
| Border Focus | `#6366F1` | `ring-indigo-500` | Input focus rings, active element outlines (ထည့်သွင်းမှု အာရုံစူးစိုက်မှု ကွင်းများ၊ တက်ကြွသော အရာ အကြမ်းဖျင်းများ) |
| Text Primary | `#0F172A` | `text-slate-900` | Headings, primary body text (ခေါင်းစီးများ၊ အဓိက ကိုယ်ထည် စာသား) |
| Text Secondary | `#64748B` | `text-slate-500` | Descriptions, timestamps, helper text (ဖော်ပြချက်များ၊ အချိန်မှတ်များ၊ အထောက်အကူ စာသား) |
| Text Muted | `#94A3B8` | `text-slate-400` | Placeholders, disabled states (နေရာလွတ်ပြစရာများ၊ ပိတ်ထားသော အခြေအနေများ) |

#### 9.2.2 Workflow State Colors (Strict Consistency) (လုပ်ငန်းစဉ် အခြေအနေ အရောင်များ (တင်းကျပ်သော ညီညွတ်မှု))

Workflow status labels and badges must apply these exact colors consistently across ALL dashboards, detail views, and notification indicators: (လုပ်ငန်းစဉ် အခြေအနေ အညွှန်းများနှင့် တံဆိပ်များသည် ဒက်ရှ်ဘုတ်များ၊ အသေးစိတ် ကြည့်ရှုမှုများနှင့် သတိပေးချက် ညွှန်ပြချက်များ အားလုံးတွင် ဤအရောင်များကို တသမတ်တည်း အတိအကျ အသုံးပြုရမည်-)

| State Category (အခြေအနေ အမျိုးအစား) | Status Codes | Hex Value | Tailwind BG | Tailwind Text | Badge Style (တံဆိပ် စတိုင်) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Draft** | `DRAFT` | `#6B7280` | `bg-gray-100` | `text-gray-700` | `bg-gray-100 text-gray-700 border border-gray-200` |
| **In Progress** | `SUBMITTED_MANAGER`, `MANAGER_REVIEWING`, `SUBMITTED_APPROVER`, `APPROVER_REVIEWING` | `#D97706` | `bg-amber-50` | `text-amber-700` | `bg-amber-50 text-amber-700 border border-amber-200` |
| **Verified** | `MANAGER_VERIFIED` | `#0284C7` | `bg-sky-50` | `text-sky-700` | `bg-sky-50 text-sky-700 border border-sky-200` |
| **Approved** | `APPROVED` | `#059669` | `bg-emerald-50` | `text-emerald-700` | `bg-emerald-50 text-emerald-700 border border-emerald-200` |
| **Rejected** | `REJECTED_MANAGER`, `REJECTED_APPROVER` | `#DC2626` | `bg-red-50` | `text-red-700` | `bg-red-50 text-red-700 border border-red-200` |
| **Completed** | `PAID` | `#059669` | `bg-emerald-100` | `text-emerald-800` | `bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold` |

**Status Badge Component Specification (အခြေအနေ တံဆိပ် အစိတ်အပိုင်း သတ်မှတ်ချက်):**

```tsx
// MANDATORY badge structure for ALL status displays (အခြေအနေ ပြသမှု အားလုံးအတွက် မဖြစ်မနေ တံဆိပ် ဖွဲ့စည်းပုံ)
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

#### 9.2.3 Semantic Action Colors (အဓိပ္ပာယ်ရှိသော လုပ်ဆောင်ချက် အရောင်များ)

| Action Type (လုပ်ဆောင်ချက် အမျိုးအစား) | Hex Value | Tailwind Class | Usage (အသုံးပြုမှု) |
| :--- | :--- | :--- | :--- |
| Primary Action (အဓိက လုပ်ဆောင်ချက်) | `#1E3A8A` | `bg-blue-900 hover:bg-blue-800` | Submit, Save, Create buttons (တင်သွင်း၊ သိမ်းဆည်း၊ ဖန်တီး ခလုတ်များ) |
| Positive Action (အပြုသဘောဆောင်သော လုပ်ဆောင်ချက်) | `#059669` | `bg-emerald-600 hover:bg-emerald-700` | Approve, Verify, Confirm buttons (ခွင့်ပြု၊ အတည်ပြု၊ အတည်ပြု ခလုတ်များ) |
| Destructive Action (ဖျက်ဆီးသော လုပ်ဆောင်ချက်) | `#DC2626` | `bg-red-600 hover:bg-red-700` | Reject, Delete buttons (ပယ်ချ၊ ဖျက် ခလုတ်များ) |
| Neutral Action (ကြားနေ လုပ်ဆောင်ချက်) | `#FFFFFF` | `bg-white border-slate-300 hover:bg-slate-50` | Cancel, Back, Secondary buttons (ပယ်ဖျက်၊ နောက်သို့၊ ဒုတိယ ခလုတ်များ) |
| Disabled State (ပိတ်ထားသော အခြေအနေ) | `#CBD5E1` | `bg-slate-300 cursor-not-allowed` | Inactive buttons, locked fields (မလှုပ်ရှားသော ခလုတ်များ၊ သော့ခတ်ထားသော အကွက်များ) |

### 9.3 Typography System (စာလုံးပုံစံ စနစ်)

#### 9.3.1 Font Stack (ဖောင့် အစုအဝေး)

```css
font-family: 'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif;
```

The `Inter` font must be loaded via Google Fonts CDN link in `index.html`: (`Inter` ဖောင့်ကို `index.html` ရှိ Google Fonts CDN လင့်ခ်မှတဆင့် တင်ရမည်-)

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

#### 9.3.2 Type Scale (စာလုံး အရွယ်အစား)

| Element (အစိတ်အပိုင်း) | Tailwind Class | Size (အရွယ်အစား) | Weight (အလေးချိန်) | Line Height (လိုင်း အမြင့်) | Usage (အသုံးပြုမှု) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Page Title | `text-2xl font-bold` | 24px | 700 | 32px | Main page heading (single `<h1>` per page) (အဓိက စာမျက်နှာ ခေါင်းစီး (စာမျက်နှာတစ်ခုလျှင် `<h1>` တစ်ခုတည်း)) |
| Section Header | `text-xl font-semibold` | 20px | 600 | 28px | Card titles, section containers (ကတ် ခေါင်းစဉ်များ၊ အပိုင်း ကွန်တိန်နာများ) |
| Sub-header | `text-lg font-medium` | 18px | 500 | 28px | Sub-section titles, modal headers (အပိုင်းခွဲ ခေါင်းစဉ်များ၊ မိုဒယ် ခေါင်းစီးများ) |
| Body / Form Labels | `text-sm font-medium` | 14px | 500 | 20px | Form field labels, table headers (ဖောင် အကွက် အညွှန်းများ၊ ဇယား ခေါင်းစီးများ) |
| Body Text / Inputs | `text-sm font-normal` | 14px | 400 | 20px | Body paragraphs, input values (ကိုယ်ထည် စာပိုဒ်များ၊ ထည့်သွင်းမှု တန်ဖိုးများ) |
| Table Cell Data | `text-sm font-normal` | 14px | 400 | 20px | Standard table cell content (စံ ဇယား ဆဲလ် အကြောင်းအရာ) |
| Breakdown Line Items | `text-xs font-normal` | 12px | 400 | 16px | Dense breakdown item tables (သိပ်သည်းသော ခွဲခြမ်းစိတ်ဖြာမှု အရာ ဇယားများ) |
| Helper / Caption | `text-xs font-normal` | 12px | 400 | 16px | Timestamps, helper text, validation messages (အချိန်မှတ်များ၊ အထောက်အကူ စာသား၊ အတည်ပြုရေး မက်ဆေ့ဂျ်များ) |
| Badge Text | `text-xs font-medium` | 12px | 500 | 16px | Status badges, count indicators (အခြေအနေ တံဆိပ်များ၊ အရေအတွက် ညွှန်ပြချက်များ) |

### 9.4 Spacing & Layout System (နေရာချထားမှုနှင့် အပြင်အဆင် စနစ်)

#### 9.4.1 Grid System (ဂရစ် စနစ်)

| Context (အခြေအနေ) | Layout (အပြင်အဆင်) | Specification (သတ်မှတ်ချက်) |
| :--- | :--- | :--- |
| Page Container | Max width centered (အများဆုံး အကျယ် ဗဟိုပြု) | `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` |
| Dashboard Grid | Responsive columns (တုံ့ပြန်မှုရှိသော ကော်လံများ) | `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6` |
| Content Area | Single column with sidebar (ဘေးဘားပါရှိသော ကော်လံတစ်ခု) | Sidebar: `w-64`, Content: `flex-1` |
| Form Layout | Two-column responsive (ကော်လံနှစ်ခု တုံ့ပြန်မှုရှိသော) | `grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4` |

#### 9.4.2 Spacing Scale (နေရာလွတ် အရွယ်အစား)

| Token (သင်္ကေတ) | Value (တန်ဖိုး) | Usage (အသုံးပြုမှု) |
| :--- | :--- | :--- |
| `p-4` (16px) | Standard card padding (စံ ကတ် ကူရှင်) | Card inner content padding (ကတ် အတွင်းပိုင်း အကြောင်းအရာ ကူရှင်) |
| `p-6` (24px) | Generous card padding (ရက်ရောသော ကတ် ကူရှင်) | Form containers, modal content (ဖောင် ကွန်တိန်နာများ၊ မိုဒယ် အကြောင်းအရာ) |
| `gap-4` (16px) | Standard grid gap (စံ ဂရစ် ကွာဟချက်) | Between form fields, between cards in a row (ဖောင် အကွက်များကြား၊ အတန်းတစ်ခုရှိ ကတ်များကြား) |
| `gap-6` (24px) | Section gap (အပိုင်း ကွာဟချက်) | Between major content sections (အဓိက အကြောင်းအရာ အပိုင်းများကြား) |
| `mb-1` (4px) | Tight spacing (ကျဉ်းမြောင်းသော နေရာလွတ်) | Label to input field (အညွှန်းမှ ထည့်သွင်းမှု အကွက်သို့) |
| `mb-4` (16px) | Standard vertical spacing (စံ ဒေါင်လိုက် နေရာလွတ်) | Between form groups (ဖောင် အုပ်စုများကြား) |
| `mb-8` (32px) | Section separation (အပိုင်း ခွဲခြားခြင်း) | Between major page sections (အဓိက စာမျက်နှာ အပိုင်းများကြား) |
| `space-y-4` (16px) | Vertical stack spacing (ဒေါင်လိုက် စုပုံ နေရာလွတ်) | Stacked card lists, form sections (စုပုံထားသော ကတ် စာရင်းများ၊ ဖောင် အပိုင်းများ) |

### 9.5 Component Specifications (အစိတ်အပိုင်း သတ်မှတ်ချက်များ)

#### 9.5.1 Card Container (ကတ် ကွန်တိန်နာ)

The primary content wrapper used across all dashboards and detail views: (ဒက်ရှ်ဘုတ်များနှင့် အသေးစိတ် ကြည့်ရှုမှုများအားလုံးတွင် အသုံးပြုသော အဓိက အကြောင်းအရာ ဖုံးအုပ်မှု-)

```tsx
<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
  <h2 className="text-xl font-semibold text-slate-900 mb-4">
    {sectionTitle}
  </h2>
  {children}
</div>
```

**Card Rules (ကတ် စည်းမျဉ်းများ):**
* Corner radius: `rounded-xl` (12px) — consistent on all cards. (ထောင့် အချင်းဝက်- `rounded-xl` (12px) — ကတ်အားလုံးတွင် တသမတ်တည်းဖြစ်သည်။)
* Shadow: `shadow-sm` — subtle depth without heavy elevation. (အရိပ်- `shadow-sm` — ကြီးမားသော မြင့်တက်မှုမရှိဘဲ သိမ်မွေ့သော အနက်။)
* Border: `border border-slate-200` — thin border for definition. (ဘောင်- `border border-slate-200` — အဓိပ္ပာယ်သတ်မှတ်ချက်အတွက် ပါးလွှာသော ဘောင်။)
* Padding: `p-6` for content cards, `p-4` for compact data cards. (ကူရှင်- အကြောင်းအရာ ကတ်များအတွက် `p-6`၊ ကျစ်လစ်သော ဒေတာ ကတ်များအတွက် `p-4`။)

#### 9.5.2 Data Table (ဒေတာ ဇယား)

All dashboard list views must use the following table structure: (ဒက်ရှ်ဘုတ် စာရင်း ကြည့်ရှုမှုများအားလုံးသည် အောက်ပါ ဇယား ဖွဲ့စည်းပုံကို အသုံးပြုရမည်-)

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

**Table Rules (ဇယား စည်းမျဉ်းများ):**
* Header row background: `bg-slate-50` with uppercase `text-xs font-semibold text-slate-500`. (ခေါင်းစီး အတန်း နောက်ခံ- `bg-slate-50` နှင့်အတူ အကြီးအက္ခရာ `text-xs font-semibold text-slate-500`။)
* Row hover: `hover:bg-slate-50 transition-colors duration-150`. (အတန်း hover- `hover:bg-slate-50 transition-colors duration-150`။)
* Cell padding: `px-4 py-3` — uniform across all table cells. (ဆဲလ် ကူရှင်- `px-4 py-3` — ဇယား ဆဲလ်အားလုံးတွင် တူညီသည်။)
* Dividers: `divide-y divide-slate-200` for header, `divide-y divide-slate-100` for body rows. (ပိုင်းခြားသူများ- ခေါင်းစီးအတွက် `divide-y divide-slate-200`၊ ကိုယ်ထည် အတန်းများအတွက် `divide-y divide-slate-100`။)
* Amounts and numeric values must be right-aligned: `text-right`. (ပမာဏများနှင့် ဂဏန်းတန်ဖိုးများသည် ညာဘက်ညှိရမည်- `text-right`။)
* Date columns use `whitespace-nowrap` to prevent wrapping. (ရက်စွဲ ကော်လံများသည် ခေါက်ခြင်းကို ကာကွယ်ရန် `whitespace-nowrap` ကို အသုံးပြုသည်။)

#### 9.5.3 Form Controls (ဖောင် ထိန်းချုပ်မှုများ)

**Text Input (စာသား ထည့်သွင်းမှု):**

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

**Select Dropdown (ရွေးချယ်မှု Dropdown):**

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

**Textarea (Rejection Comment) (စာသားဧရိယာ (ပယ်ချမှု မှတ်ချက်)):**

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

#### 9.5.4 Button System (ခလုတ် စနစ်)

| Variant (အမျိုးအစား) | Classes | Usage (အသုံးပြုမှု) |
| :--- | :--- | :--- |
| **Primary (အဓိက)** | `px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-sm font-medium rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900` | Submit, Save, Create (တင်သွင်း၊ သိမ်းဆည်း၊ ဖန်တီး) |
| **Success (အောင်မြင်မှု)** | `px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600` | Approve, Verify, Complete Payment (ခွင့်ပြု၊ အတည်ပြု၊ ငွေပေးချေမှု ပြီးစီး) |
| **Danger (အန္တရာယ်)** | `px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600` | Reject, Delete (ပယ်ချ၊ ဖျက်) |
| **Secondary (ဒုတိယ)** | `px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg border border-slate-300 shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400` | Cancel, Back, Close (ပယ်ဖျက်၊ နောက်သို့၊ ပိတ်) |
| **Disabled (ပိတ်ထားသော)** | Add `opacity-50 cursor-not-allowed` to any variant (မည်သည့် အမျိုးအစားကိုမဆို `opacity-50 cursor-not-allowed` ပေါင်းထည့်ပါ) | Inactive or loading state (မလှုပ်ရှားသော သို့မဟုတ် တင်နေသော အခြေအနေ) |

**Button Placement Rules (ခလုတ် နေရာချထားမှု စည်းမျဉ်းများ):**
* Primary/Success actions align to the **right** side of the form. (အဓိက/အောင်မြင်မှု လုပ်ဆောင်ချက်များသည် ဖောင်၏ **ညာဘက်** သို့ ညှိသည်။)
* Destructive actions (Reject, Delete) align to the **left** side, separated from positive actions. (ဖျက်ဆီးသော လုပ်ဆောင်ချက်များ (ပယ်ချ၊ ဖျက်) သည် အပြုသဘောဆောင်သော လုပ်ဆောင်ချက်များနှင့် ခွဲခြား၍ **ဘယ်ဘက်** သို့ ညှိသည်။)
* Cancel/Back buttons always appear to the left of the primary action button. (ပယ်ဖျက်/နောက်သို့ ခလုတ်များသည် အဓိက လုပ်ဆောင်ချက် ခလုတ်၏ ဘယ်ဘက်တွင် အမြဲပေါ်လာသည်။)
* Button group layout: `flex justify-end gap-3`. (ခလုတ် အုပ်စု အပြင်အဆင်- `flex justify-end gap-3`။)

#### 9.5.5 Modal Dialogs (မိုဒယ် ဒိုင်ယာလော့ခ်များ)

High-impact actions (deletions, approvals, rejections) must trigger floating modal dialogs — standard browser `alert()` and `confirm()` popups are **FORBIDDEN**. (ကြီးမားသော သက်ရောက်မှုရှိသည့် လုပ်ဆောင်ချက်များ (ဖျက်ခြင်း၊ ခွင့်ပြုခြင်း၊ ပယ်ချခြင်း) သည် မျောနေသော မိုဒယ် ဒိုင်ယာလော့ခ်များကို အစပျိုးရမည် — စံ ဘရောက်ဆာ `alert()` နှင့် `confirm()` ပေါ့အပ်များကို **တားမြစ်ထားသည်**။)

```tsx
{/* Modal Overlay (မိုဒယ် ဖုံးအုပ်မှု) */}
<div className="fixed inset-0 z-50 flex items-center justify-center">
  {/* Backdrop (နောက်ခံ) */}
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

  {/* Modal Content (မိုဒယ် အကြောင်းအရာ) */}
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

    {/* Modal Body (e.g., rejection comment textarea) (မိုဒယ် ကိုယ်ထည် (ဥပမာ- ပယ်ချမှု မှတ်ချက် စာသားဧရိယာ)) */}
    {children}

    {/* Modal Actions (မိုဒယ် လုပ်ဆောင်ချက်များ) */}
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

**Modal Rules (မိုဒယ် စည်းမျဉ်းများ):**
* Backdrop: `bg-black/50 backdrop-blur-sm` — semi-transparent with blur effect. (နောက်ခံ- `bg-black/50 backdrop-blur-sm` — မှုန်ဝါးသော သက်ရောက်မှုဖြင့် တစ်စိတ်တစ်ပိုင်း ပွင့်လင်းမြင်သာသည်။)
* Entry animation: Scale-in with fade (`animate-in fade-in zoom-in-95`). (ဝင်ရောက်မှု အန်နီမေးရှင်း- မှေးမှိန်ခြင်းဖြင့် စကေးချုံ့ခြင်း (`animate-in fade-in zoom-in-95`)။)
* Maximum width: `max-w-md` (448px) for confirmation modals, `max-w-lg` (512px) for form modals. (အများဆုံး အကျယ်- အတည်ပြုရေး မိုဒယ်များအတွက် `max-w-md` (448px)၊ ဖောင် မိုဒယ်များအတွက် `max-w-lg` (512px)။)
* **Rejection Modals (ပယ်ချမှု မိုဒယ်များ):** Must auto-focus the comment textarea on mount and display a live character counter. Submit button must remain disabled until minimum 10 characters are entered. (တပ်ဆင်စဉ်တွင် မှတ်ချက် စာသားဧရိယာကို အလိုအလျောက် အာရုံစူးစိုက်ရမည်ဖြစ်ပြီး တိုက်ရိုက် စာလုံး အရေအတွက် ရေတွက်စက်ကို ပြသရမည်။ အနည်းဆုံး စာလုံး ၁၀ လုံး မထည့်မချင်း Submit ခလုတ်ကို ပိတ်ထားရမည်။)

#### 9.5.6 Navigation Sidebar (လမ်းကြောင်းပြ ဘေးဘား)

```tsx
<aside className="
  fixed left-0 top-0
  w-64 h-screen
  bg-blue-900
  text-white
  flex flex-col
  shadow-lg
">
  {/* Logo / System Name (လိုဂို / စနစ် အမည်) */}
  <div className="px-6 py-5 border-b border-blue-800">
    <h1 className="text-lg font-bold tracking-tight">PRWM System</h1>
    <p className="text-xs text-blue-300 mt-0.5">Payment Request Workflow</p>
  </div>

  {/* Navigation Items (လမ်းကြောင်းပြ အရာများ) */}
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

    {/* Active state (တက်ကြွသော အခြေအနေ) */}
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

  {/* User Profile Footer (အသုံးပြုသူ ပရိုဖိုင် အောက်ခြေ) */}
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

#### 9.5.7 Dashboard Summary Cards (KPI Tiles) (ဒက်ရှ်ဘုတ် အကျဉ်းချုပ် ကတ်များ (KPI အကွက်များ))

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

### 9.6 Special Layout Components (အထူး အပြင်အဆင် အစိတ်အပိုင်းများ)

#### 9.6.1 Mandalay Branch Warning Banner (Accounting Dashboard) (မန္တလေး ဘဏ်ခွဲ သတိပေးချက် ဘန်နာ (စာရင်းကိုင် ဒက်ရှ်ဘုတ်))

Approved requests from applicants belonging to the **Mandalay** branch must display a warning banner in the Accounting payment processing view: (**မန္တလေး** ဘဏ်ခွဲမှ လျှောက်ထားသူများ၏ အတည်ပြုပြီးသော တောင်းဆိုချက်များသည် စာရင်းကိုင် ငွေပေးချေမှု လုပ်ဆောင်ရေး ကြည့်ရှုမှုတွင် သတိပေးချက် ဘန်နာကို ပြသရမည်-)

```tsx
{/* Mandalay Branch Cash Payment Alert (မန္တလေး ဘဏ်ခွဲ ငွေသား ပေးချေမှု သတိပေးချက်) */}
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

{/* Standard Bank Transfer Notice (စံ ဘဏ်ငွေလွှဲ အသိပေးချက်) */}
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

#### 9.6.2 Receipt Upload Zone (ပြေစာ အပ်လုဒ် ဇုန်)

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

#### 9.6.3 Empty State (ဗလာ အခြေအနေ)

When a dashboard or table has no data to display: (ဒက်ရှ်ဘုတ် သို့မဟုတ် ဇယားတွင် ပြသရန် ဒေတာ မရှိသောအခါ-)

```tsx
<div className="text-center py-12">
  <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" /* empty state icon */ />
  <h3 className="text-sm font-medium text-slate-900">No requests found</h3>
  <p className="text-xs text-slate-500 mt-1">
    {emptyStateDescription}
  </p>
</div>
```

### 9.7 Animation & Transition Standards (အန်နီမေးရှင်းနှင့် အသွင်ကူးပြောင်းမှု စံနှုန်းများ)

| Element (အစိတ်အပိုင်း) | Transition (အသွင်ကူးပြောင်းမှု) | Duration (ကြာချိန်) | Easing (ချောမွေ့မှု) |
| :--- | :--- | :--- | :--- |
| Button hover (ခလုတ် hover) | Background color change (နောက်ခံ အရောင် ပြောင်းလဲမှု) | `duration-200` | `ease-in-out` |
| Input focus (ထည့်သွင်းမှု အာရုံစိုက်မှု) | Ring appearance (ကွင်း ပေါ်လာမှု) | `duration-200` | `ease-in-out` |
| Table row hover (ဇယား အတန်း hover) | Background highlight (နောက်ခံ ပေါ်လွင်မှု) | `duration-150` | `ease-in-out` |
| Modal entry (မိုဒယ် ဝင်ရောက်မှု) | Scale + Fade (စကေး + မှေးမှိန်ခြင်း) | `duration-300` | `ease-out` |
| Modal exit (မိုဒယ် ထွက်ခွာမှု) | Scale + Fade (စကေး + မှေးမှိန်ခြင်း) | `duration-200` | `ease-in` |
| Sidebar nav hover (ဘေးဘား nav hover) | Background color change (နောက်ခံ အရောင် ပြောင်းလဲမှု) | `duration-200` | `ease-in-out` |
| Alert banner (သတိပေးချက် ဘန်နာ) | Pulse animation (ခုန်နေသော အန်နီမေးရှင်း) | `animate-pulse` | CSS default |
| Toast notification (Toast သတိပေးချက်) | Slide in from top-right (ညာဘက်အပေါ်မှ လျှောဝင်လာခြင်း) | `duration-300` | `ease-out` |
| Page transition (စာမျက်နှာ အသွင်ကူးပြောင်းမှု) | Fade in (မှေးမှိန်ပြီး ပေါ်လာခြင်း) | `duration-200` | `ease-in-out` |
| Dropdown menu (Dropdown မီနူး) | Scale-Y origin-top (Y-ဝင်ရိုး စကေး အပေါ်မူလ) | `duration-150` | `ease-out` |

### 9.8 Responsive Breakpoints (တုံ့ပြန်မှုရှိသော ခွဲထွက်မှတ်များ)

| Breakpoint | Tailwind Prefix | Min Width | Layout Behavior (အပြင်အဆင် အပြုအမူ) |
| :--- | :--- | :--- | :--- |
| Mobile | (default) | 0px | Single column, hidden sidebar, hamburger menu (ကော်လံတစ်ခု၊ ဖျောက်ထားသော ဘေးဘား၊ ဟမ်ဘာဂါ မီနူး) |
| Tablet | `md:` | 768px | Two columns, collapsible sidebar (ကော်လံနှစ်ခု၊ ခေါက်သိမ်းနိုင်သော ဘေးဘား) |
| Desktop | `lg:` | 1024px | Full layout, fixed sidebar, 4-column KPI grid (အပြည့်အစုံ အပြင်အဆင်၊ ပုံသေ ဘေးဘား၊ ၄-ကော်လံ KPI ဂရစ်) |
| Wide | `xl:` | 1280px | Extended table columns, wider content area (တိုးချဲ့ထားသော ဇယား ကော်လံများ၊ ပိုကျယ်သော အကြောင်းအရာ ဧရိယာ) |

### 9.9 Accessibility Requirements (ဝင်ရောက်သုံးစွဲနိုင်မှု လိုအပ်ချက်များ)

| Requirement (လိုအပ်ချက်) | Standard (စံနှုန်း) | Implementation (အကောင်အထည်ဖော်မှု) |
| :--- | :--- | :--- |
| Color Contrast (အရောင် ခြားနားမှု) | WCAG 2.1 AA | Minimum 4.5:1 for normal text, 3:1 for large text (ပုံမှန် စာသားအတွက် အနည်းဆုံး 4.5:1၊ စာလုံးကြီးအတွက် 3:1) |
| Focus Indicators (အာရုံစူးစိုက်မှု ညွှန်ပြချက်များ) | Visible on all interactive elements (အပြန်အလှန်တုံ့ပြန်နိုင်သော အစိတ်အပိုင်းများအားလုံးတွင် မြင်နိုင်သည်) | `focus:ring-2 focus:ring-offset-2` on all buttons and inputs (ခလုတ်များနှင့် ထည့်သွင်းမှုများအားလုံးတွင် `focus:ring-2 focus:ring-offset-2`) |
| Keyboard Navigation (ကီးဘုတ် လမ်းကြောင်းပြခြင်း) | Full tab-order support (အပြည့်အစုံ tab-အစီအစဉ် ပံ့ပိုးမှု) | Logical tab sequence, `tabIndex` management in modals (ယုတ္တိရှိသော tab အစီအစဉ်၊ မိုဒယ်များတွင် `tabIndex` စီမံခန့်ခွဲမှု) |
| Screen Reader (စခရင် ဖတ်စနစ်) | ARIA labels on icon-only buttons (အိုင်ကွန်သာရှိသော ခလုတ်များပေါ်ရှိ ARIA အညွှန်းများ) | `aria-label`, `role`, `aria-describedby` attributes |
| Form Errors (ဖောင် အမှားများ) | Programmatic association (ပရိုဂရမ်အလိုက် ပေါင်းစပ်မှု) | `aria-invalid`, `aria-describedby` linked to error messages (အမှား မက်ဆေ့ဂျ်များနှင့် ချိတ်ဆက်ထားသော `aria-invalid`, `aria-describedby`) |
| Alt Text | All informational images (အချက်အလက်ပြ ပုံများအားလုံး) | Descriptive `alt` attributes on all `<img>` elements (`<img>` အစိတ်အပိုင်းများအားလုံးပေါ်ရှိ ဖော်ပြချက် `alt` ဂုဏ်သတ္တိများ) |

---

## 10. Performance & Optimization Standards (စွမ်းဆောင်ရည်နှင့် ပိုမိုကောင်းမွန်အောင် လုပ်ဆောင်ခြင်း စံနှုန်းများ)

### 10.1 Frontend Performance Targets (ရှေ့ပိုင်း စွမ်းဆောင်ရည် ပစ်မှတ်များ)

| Metric (တိုင်းတာချက်) | Target (ပစ်မှတ်) | Measurement (တိုင်းတာမှု) |
| :--- | :--- | :--- |
| Dashboard Initial Load (ဒက်ရှ်ဘုတ် ကနဦး တင်မှု) | < 2 seconds | Lighthouse Performance score (Lighthouse စွမ်းဆောင်ရည် ရမှတ်) |
| Time to Interactive (TTI) (အပြန်အလှန်တုံ့ပြန်နိုင်ချိန် (TTI)) | < 3 seconds | Chrome DevTools |
| First Contentful Paint (FCP) (ပထမဆုံး အကြောင်းအရာ ပေါ်လာချိန် (FCP)) | < 1.5 seconds | Lighthouse |
| Bundle Size (gzipped) (အစုအဝေး အရွယ်အစား (gzipped)) | < 250KB initial chunk (ကနဦး အပိုင်း < 250KB) | Vite build output (Vite တည်ဆောက်မှု ရလဒ်) |
| WebSocket Event Delivery (WebSocket အဖြစ်အပျက် ပေးပို့မှု) | < 500ms from server event (ဆာဗာ အဖြစ်အပျက်မှ < 500ms) | Custom timing instrumentation (စိတ်ကြိုက် အချိန်တိုင်းတာမှု တပ်ဆင်ခြင်း) |

### 10.2 Backend Performance Targets (နောက်ပိုင်း စွမ်းဆောင်ရည် ပစ်မှတ်များ)

| Metric (တိုင်းတာချက်) | Target (ပစ်မှတ်) | Context (အခြေအနေ) |
| :--- | :--- | :--- |
| API Response Time (P95) (API တုံ့ပြန်ချိန် (P95)) | < 200ms | Standard CRUD operations (စံ CRUD လုပ်ဆောင်ချက်များ) |
| Dashboard Query Time (ဒက်ရှ်ဘုတ် မေးမြန်းချိန်) | < 500ms | Complex aggregation queries with joins (joins များပါဝင်သော ရှုပ်ထွေးသည့် ပေါင်းစပ် မေးမြန်းမှုများ) |
| File Upload Processing (ဖိုင် အပ်လုဒ် လုပ်ဆောင်ခြင်း) | < 3 seconds | 10MB file upload with validation (အတည်ပြုချက်ပါရှိသော 10MB ဖိုင် အပ်လုဒ်) |
| WebSocket Broadcast (WebSocket ထုတ်လွှင့်မှု) | < 100ms server-side (ဆာဗာဘက်မှ < 100ms) | From status update to event emit (အခြေအနေ အပ်ဒိတ်မှ အဖြစ်အပျက် ထုတ်လွှတ်မှုအထိ) |

### 10.3 Optimization Strategies (ပိုမိုကောင်းမွန်အောင် လုပ်ဆောင်ခြင်း မဟာဗျူဟာများ)

| Strategy (မဟာဗျူဟာ) | Implementation (အကောင်အထည်ဖော်မှု) |
| :--- | :--- |
| **Code Splitting (ကုဒ် ခွဲခြားခြင်း)** | React.lazy() with Suspense for role-based page modules (အခန်းကဏ္ဍအခြေခံ စာမျက်နှာ မော်ဂျူးများအတွက် Suspense နှင့်အတူ React.lazy()) |
| **API Response Caching (API တုံ့ပြန်မှု သိမ်းဆည်းခြင်း)** | Redis cache for master data (`lookup:{table_name}`, 24h TTL) (မာစတာ ဒေတာအတွက် Redis ကက်ရှ် (`lookup:{table_name}`, ၂၄ နာရီ TTL)) |
| **Request Detail Caching (တောင်းဆိုမှု အသေးစိတ် သိမ်းဆည်းခြင်း)** | Redis cache for payment request payload (`payment_request:payload:{id}`, 10min TTL) (ငွေပေးချေမှု တောင်းဆိုချက် payload အတွက် Redis ကက်ရှ် (`payment_request:payload:{id}`, ၁၀ မိနစ် TTL)) |
| **Database Indexing (ဒေတာဘေ့စ် အညွှန်းတပ်ခြင်း)** | Composite indexes on `(status_id, created_date DESC)` and `(current_assigned_to_user_id, status_id)` (`(status_id, created_date DESC)` နှင့် `(current_assigned_to_user_id, status_id)` ပေါ်ရှိ ပေါင်းစပ် အညွှန်းများ) |
| **Partial Index (တစ်စိတ်တစ်ပိုင်း အညွှန်း)** | `idx_payment_requests_active_created` filtered on `is_deleted = FALSE` (`is_deleted = FALSE` တွင် စစ်ထုတ်ထားသော `idx_payment_requests_active_created`) |
| **Image Optimization (ပုံရိပ် ပိုမိုကောင်းမွန်အောင် လုပ်ဆောင်ခြင်း)** | Receipt thumbnails generated server-side for preview; full-size on demand (အစမ်းကြည့်ရှုရန်အတွက် ဆာဗာဘက်မှ ဖန်တီးထားသော ပြေစာ ပုံသေးများ၊ တောင်းဆိုမှုအရ အရွယ်အစားအပြည့်) |
| **Debounced Search (နှောင့်နှေးထားသော ရှာဖွေမှု)** | 300ms debounce on all search/filter inputs (ရှာဖွေမှု/စစ်ထုတ်မှု ထည့်သွင်းမှုအားလုံးတွင် 300ms နှောင့်နှေးမှု) |
| **Virtual Scrolling (တုပထားသော ရွှေ့ပြောင်းခြင်း)** | Required for lists exceeding 100 items (အရာ ၁၀၀ ကျော်လွန်သော စာရင်းများအတွက် လိုအပ်သည်) |

---

## 11. Environment Configuration & Deployment (ပတ်ဝန်းကျင် ဖွဲ့စည်းပုံနှင့် ဖြန့်ကြက်ခြင်း)

### 11.1 Environment Variable Schema (ပတ်ဝန်းကျင် ကိန်းရှင် ပုံစံ)

All environment variables must be validated at application startup using Joi schema validation in `src/config/`. Missing or invalid variables must prevent application boot. (ပတ်ဝန်းကျင် ကိန်းရှင်များအားလုံးကို `src/config/` ရှိ Joi schema validation ကို အသုံးပြု၍ အက်ပ်လီကေးရှင်း စတင်ချိန်တွင် အတည်ပြုရမည်။ ပျောက်ဆုံးနေသော သို့မဟုတ် မမှန်ကန်သော ကိန်းရှင်များသည် အက်ပ်လီကေးရှင်း စတင်ခြင်းကို တားဆီးရမည်။)

| Variable (ကိန်းရှင်) | Type (အမျိုးအစား) | Required (လိုအပ်ချက်) | Default (မူလတန်ဖိုး) | Description (ဖော်ပြချက်) |
| :--- | :--- | :--- | :--- | :--- |
| `NODE_ENV` | string | Yes (ဟုတ်ကဲ့) | `development` | Runtime environment identifier (လုပ်ဆောင်ချိန် ပတ်ဝန်းကျင် အမှတ်အသား) |
| `PORT` | number | Yes (ဟုတ်ကဲ့) | `3000` | NestJS HTTP server port (NestJS HTTP ဆာဗာ ပို့တ်) |
| `DATABASE_HOST` | string | Yes (ဟုတ်ကဲ့) | — | PostgreSQL host address (PostgreSQL ဟို့စ် လိပ်စာ) |
| `DATABASE_PORT` | number | Yes (ဟုတ်ကဲ့) | `5432` | PostgreSQL port (PostgreSQL ပို့တ်) |
| `DATABASE_NAME` | string | Yes (ဟုတ်ကဲ့) | — | PostgreSQL database name (PostgreSQL ဒေတာဘေ့စ် အမည်) |
| `DATABASE_USER` | string | Yes (ဟုတ်ကဲ့) | — | PostgreSQL connection username (PostgreSQL ချိတ်ဆက်မှု အသုံးပြုသူအမည်) |
| `DATABASE_PASSWORD` | string | Yes (ဟုတ်ကဲ့) | — | PostgreSQL connection password (PostgreSQL ချိတ်ဆက်မှု စကားဝှက်) |
| `REDIS_HOST` | string | Yes (ဟုတ်ကဲ့) | — | Redis server host (Redis ဆာဗာ ဟို့စ်) |
| `REDIS_PORT` | number | Yes (ဟုတ်ကဲ့) | `6379` | Redis server port (Redis ဆာဗာ ပို့တ်) |
| `JWT_SECRET` | string | Yes (ဟုတ်ကဲ့) | — | JWT signing secret (RS256 private key path) (JWT လက်မှတ်ရေးထိုးသည့် လျှို့ဝှက်ချက် (RS256 သီးသန့်သော့ လမ်းကြောင်း)) |
| `JWT_EXPIRATION` | string | Yes (ဟုတ်ကဲ့) | `15m` | Access token TTL (ဝင်ရောက်ခွင့် token သက်တမ်း) |
| `JWT_REFRESH_EXPIRATION` | string | Yes (ဟုတ်ကဲ့) | `7d` | Refresh token TTL (ပြန်လည်ဆန်းသစ်သည့် token သက်တမ်း) |
| `CORS_ORIGINS` | string | Yes (ဟုတ်ကဲ့) | — | Comma-separated allowed origins (ကော်မာဖြင့် ခြားထားသော ခွင့်ပြုထားသည့် ဇာစ်မြစ်များ) |
| `UPLOAD_DIR` | string | Yes (ဟုတ်ကဲ့) | `./uploads` | Receipt file storage directory (ပြေစာဖိုင် သိမ်းဆည်းသည့် ဖိုင်တွဲ) |
| `MAX_FILE_SIZE` | number | Yes (ဟုတ်ကဲ့) | `10485760` | Max file size in bytes (10MB) (အများဆုံး ဖိုင်အရွယ်အစား (ဘိုက်များဖြင့်) (10MB)) |
| `MAX_TOTAL_FILE_SIZE` | number | Yes (ဟုတ်ကဲ့) | `52428800` | Max total files per request (50MB) (တောင်းဆိုမှုတစ်ခုလျှင် အများဆုံး စုစုပေါင်း ဖိုင်များ (50MB)) |

### 11.2 File Structure for Configuration (ဖွဲ့စည်းပုံအတွက် ဖိုင် တည်ဆောက်ပုံ)

```
src/config/
├── configuration.ts             # Central configuration factory (ဗဟို ဖွဲ့စည်းပုံ စက်ရုံ)
├── database.config.ts           # TypeORM connection options (TypeORM ချိတ်ဆက်မှု ရွေးချယ်စရာများ)
├── redis.config.ts              # Redis connection options (Redis ချိတ်ဆက်မှု ရွေးချယ်စရာများ)
├── jwt.config.ts                # JWT module options (JWT မော်ဂျူး ရွေးချယ်စရာများ)
└── validation.schema.ts         # Joi validation schema for env vars (env ကိန်းရှင်များအတွက် Joi validation schema)
```

### 11.3 Docker Compose Services (Docker Compose ဝန်ဆောင်မှုများ)

| Service (ဝန်ဆောင်မှု) | Image (ပုံရိပ်) | Port (ပို့တ်) | Purpose (ရည်ရွယ်ချက်) |
| :--- | :--- | :--- | :--- |
| `app` | Node.js 20 Alpine | 3000 | NestJS backend API (NestJS နောက်ပိုင်း API) |
| `frontend` | Node.js 20 Alpine | 5173 | Vite dev server (dev only) (Vite ဖွံ့ဖြိုးရေး ဆာဗာ (ဖွံ့ဖြိုးရေးအတွက်သာ)) |
| `postgres` | PostgreSQL 16 Alpine | 5432 | Primary database (အဓိက ဒေတာဘေ့စ်) |
| `redis` | Redis 7 Alpine | 6379 | Session, cache, rate limiting (Session၊ ကက်ရှ်၊ နှုန်းထား ကန့်သတ်ခြင်း) |

### 11.4 Sensitive Data Handling (အရေးကြီးသော ဒေတာ ကိုင်တွယ်ခြင်း)

* `.env` files must be listed in `.gitignore` and must NEVER be committed to the repository. (`.env` ဖိုင်များကို `.gitignore` တွင် စာရင်းသွင်းထားရမည်ဖြစ်ပြီး repository သို့ **ဘယ်တော့မှ** မအပ်နှံရပါ။)
* Production secrets must be managed through environment-specific secret managers (e.g., Docker secrets, cloud KMS). (ထုတ်လုပ်ရေး လျှို့ဝှက်ချက်များကို ပတ်ဝန်းကျင်အလိုက် လျှို့ဝှက်ချက် မန်နေဂျာများမှတဆင့် စီမံခန့်ခွဲရမည် (ဥပမာ- Docker လျှို့ဝှက်ချက်များ၊ cloud KMS)။)
* Database credentials, JWT secrets, and API keys must never appear in source code, documentation, or commit messages. (ဒေတာဘေ့စ် အထောက်အထားများ၊ JWT လျှို့ဝှက်ချက်များနှင့် API သော့များသည် အရင်းအမြစ် ကုဒ်၊ စာရွက်စာတမ်း သို့မဟုတ် commit မက်ဆေ့ဂျ်များတွင် ဘယ်တော့မှ မပေါ်လာရပါ။)
* Log output must never contain passwords, tokens, or full credit card numbers. (မှတ်တမ်း ရလဒ်တွင် စကားဝှက်များ၊ token များ သို့မဟုတ် အပြည့်အစုံ ခရက်ဒစ်ကတ် နံပါတ်များ ဘယ်တော့မှ မပါဝင်ရပါ။)

---

## 12. Document Revision History (စာရွက်စာတမ်း ပြင်ဆင်မှု ရာဇဝင်)

| Version (ဗားရှင်း) | Date (ရက်စွဲ) | Author (ရေးသားသူ) | Changes (အပြောင်းအလဲများ) |
| :--- | :--- | :--- | :--- |
| 1.0 | 2026-06-12 | Lead Architect | Initial release — naming conventions, directory isolation, Git rules, AI guardrails, basic UI/UX design system (ကနဦး ထုတ်ပြန်ချက် — အမည်ပေးခြင်း ထုံးစံများ၊ ဖိုင်တွဲ သီးသန့်ခွဲခြားခြင်း၊ Git စည်းမျဉ်းများ၊ AI ကန့်သတ်ချက်များ၊ အခြေခံ UI/UX ဒီဇိုင်း စနစ်) |
| 2.0 | 2026-06-12 | Lead Architect | Complete production rewrite — added security standards, error handling, testing strategy, API design, full component specifications, performance targets, environment configuration, accessibility requirements (အပြည့်အစုံ ထုတ်လုပ်ရေး ပြန်လည်ရေးသားချက် — လုံခြုံရေး စံနှုန်းများ၊ အမှားဖြေရှင်းခြင်း၊ စမ်းသပ်ခြင်း မဟာဗျူဟာ၊ API ဒီဇိုင်း၊ အပြည့်အစုံ အစိတ်အပိုင်း သတ်မှတ်ချက်များ၊ စွမ်းဆောင်ရည် ပစ်မှတ်များ၊ ပတ်ဝန်းကျင် ဖွဲ့စည်းပုံ၊ ဝင်ရောက်သုံးစွဲနိုင်မှု လိုအပ်ချက်များ ထည့်သွင်းထားသည်) |
