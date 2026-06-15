# Project Architecture and Directory Structure (ပရောဂျက် တည်ဆောက်ပုံ လမ်းညွှန်)

## 1. Visual Directory Tree (ဖိုဒါ တည်ဆောက်ပုံ)

အောက်ဖော်ပြပါ ASCII tree သည် ပရောဂျက်၏ အဓိက ဖိုဒါ တည်ဆောက်ပုံ (high-level folder structure) ကို ပြသထားခြင်း ဖြစ်သည်။

```text
PaymentRequestWorkflowManagement/ (Root)
├── .github/
│   └── workflows/
│       └── ci.yml             # Github Actions configuration for CI
├── docs/                      # Specification နှင့် system specifications များ
│   ├── core_ja/               # ဂျပန်ဘာသာဖြင့် ရေးသားထားသော functional spec နှင့် rules များ
│   └── screens/               # Screen design specs များ
├── frontend/                  # React + Vite Frontend Application
│   ├── public/                # Static assets (images, icons)
│   └── src/
│       ├── assets/            # CSS, logo နှင့် images များ
│       ├── components/        # Reusable shared UI components များ
│       ├── context/           # Global state management providers များ (e.g., AuthContext)
│       ├── hooks/             # Custom React Hooks (e.g., useFetch)
│       ├── pages/             # Role-specific dashboard screen controllers များ
│       │   ├── applicant/
│       │   ├── manager/
│       │   ├── approver/
│       │   ├── accounting/
│       │   └── admin/
│       ├── services/          # Backend API services (HTTP request modules)
│       ├── App.tsx            # Main application component
│       ├── main.tsx           # React bootstrap element entry point
│       └── index.css          # Global styling file
├── src/                       # NestJS Backend Application Source Code
│   ├── config/                # Environment variables configuration module
│   ├── database/              # TypeORM database credentials နှင့် providers
│   ├── modules/               # Core business features နှင့် modules များ
│   │   ├── applicant/         # Applicant business logic
│   │   ├── manager/           # Manager verification process logic
│   │   ├── approver/          # Final approver validation logic
│   │   ├── accounting/        # Accounting payment logic
│   │   ├── admin/             # Admin console and log configurations
│   │   └── shared/            # Shared features (Entities နှင့် Gateways)
│   │       ├── entities/      # TypeORM Entity classes (Database models)
│   │       └── websocket.gateway.ts # Real-time alerts synchronization module (Socket.io)
│   ├── app.controller.ts      # Global routing entry point controller
│   ├── app.module.ts          # Main configuration setup for dependencies injection
│   ├── app.service.ts         # Server health configurations
│   └── main.ts                # Application bootstrap entry point
├── .env                       # Environment configuration secrets
├── AGENTS.md                  # DevOps commit workflow automation agent rule
├── package.json               # Package config scripts and dependencies definitions
└── tsconfig.json              # TypeScript compilation rules compiler configuration
```

---

## 2. Frontend Architecture (React/Vite) - ရှင်းလင်းချက်

`frontend/` directory သည် client-side logic နှင့် user interfaces အားလုံး တည်ရှိရာ နေရာဖြစ်ပြီး React နှင့် Vite build-tool ကို အခြေခံထားပါသည်။

* **src/components**: Application တစ်ခုလုံးတွင် ပြန်လည်အသုံးပြုနိုင်သော (reusable) UI components များ ဖြစ်သည့် status badges, dropdown-selects, tables နှင့် file uploader components စသည်တို့ကို သိမ်းဆည်းရန် ဖြစ်ပါသည်။
* **src/context**: Application တစ်ခုလုံးရှိ components များအကြား တူညီသော data များကို dynamic စွာ မျှဝေအသုံးပြုနိုင်စေရန် (ဥပမာ - user-session login status သို့မဟုတ် websocket dynamic configuration များ) global contexts နှင့် providers များကို ဤနေရာတွင် ထားရှိပါသည်။
* **src/hooks**: Component logics များနှင့် helper functions များကို ပြန်လည်အသုံးပြုနိုင်ရန် ဖန်တီးထားသော custom React hooks (ဥပမာ - validation hooks, active parameters detection) များ ထားရှိရန် ဖြစ်ပါသည်။
* **src/services**: Backend REST APIs သို့မဟုတ် WebSocket gateway များသို့ data API request ပို့ဆောင်ရန်အတွက် standard logic client-side queries များကို စုစည်းထားသော နေရာဖြစ်ပါသည်။

---

## 3. Backend Architecture (NestJS) - ရှင်းလင်းချက်

Backend setup ကို Modular architecture နှင့် Domain-Driven Design စည်းမျဉ်းများအတိုင်း တည်ဆောက်ထားပြီး logic isolation ကို အပြည့်အဝ ဖော်ဆောင်ထားပါသည်။

* **src/modules/**: System ၏ core requirements များကို roles အလိုက် သီးခြားစီ သတ်မှတ်ထားသော directories ဖြစ်ပါသည်။
  * **applicant**: လျှောက်ထားသူ၏ request form creation, draft logic, submission, နှင့် updates များ လုပ်ဆောင်သည်။
  * **manager**: မန်နေဂျာ၏ verification checks, processing queues နှင့် approval status update workflow များ ပါဝင်သည်။
  * **approver**: Final approver ၏ review system နှင့် logs mapping များ လုပ်ဆောင်သည်။
  * **accounting**: ငွေထုတ်ပေးခြင်း (paid transition) နှင့် Mandalay branch tracking alerts logic များ ပါဝင်သည်။
  * **admin**: User configuration logic နှင့် system dashboard logs operations များကို စီမံသည်။
  * **shared**: အခြား modules အားလုံးမှ ခေါ်ယူအသုံးပြုနိုင်သော dynamic resource များကို စုစည်းထားသည်။
* **src/common/ (Guards/Decorators)**: Endpoint controller များသို့ role-based validation ဖြင့် ဝင်ရောက်ခြင်းကို ကာကွယ်ရန် authentication layer (JwtAuthGuard, RolesGuard) နှင့် data processing decorators များကို ထားရှိပါသည်။
* **src/gateways/ (WebSockets)**: Real-time update workflow များ (ဥပမာ - request status ပြောင်းလဲမှု alerts များ) ကို client များထံ ချက်ချင်း ပေးပို့နိုင်ရန် Socket.io server modules များကို `shared/websocket.gateway.ts` တွင် တည်ဆောက်ထားပါသည်။
* **src/entities/ (TypeORM)**: PostgreSQL database tables များကို TypeScript class database models အဖြစ် map လုပ်ပေးသော entity files များ (ဥပမာ - `User`, `PaymentRequest`, `ApprovalLog`, `ReceiptFile`) ဖြစ်ပြီး `src/modules/shared/entities` တွင် တည်ရှိသည်။

---

## 4. Configuration & Deployment Files - ရှင်းလင်းချက်

ပရောဂျက်တစ်ခုလုံးကို clean operation နှင့် automated tasks များဖြင့် စီမံခန့်ခွဲနိုင်ရန် root directory တွင် အောက်ပါ configuration ဖိုင်များ ထားရှိပါသည်။

* **.env**: Local database connection credentials, server configuration metrics (ports), authentication codes, နှင့် API access paths စသည့် sensitive settings များကို environment အလိုက် လုံခြုံစွာ ခွဲခြားသတ်မှတ်ရန် အသုံးပြုပါသည်။
* **package.json**: Development workflow တွင် အသုံးပြုမည့် commands များ (ဥပမာ - dev running, production build, formatting, testing) နှင့် codebase runtime dependency packages စာရင်းကို သတ်မှတ်ထိန်းသိမ်းပေးသော ဖိုင်ဖြစ်ပါသည်။
* **.github/workflows/ci.yml**: Code repository သို့ update လုပ်တိုင်း automated system က tests, compilation syntax check (build) နှင့် formatting compliance (lint checks) များကို automatically execute လုပ်ပေးရန် Github Actions tool အတွက် configuration သတ်မှတ်ချက် ဖြစ်ပါသည်။

---

## 5. Naming Conventions & Rules (ဖိုင်နာမည်ပေးခြင်း စည်းမျဉ်းများ)

Team တစ်ခုလုံး၏ codebase consistency ကို အပြည့်အဝ ထိန်းသိမ်းနိုင်ရန် ဤသတ်မှတ်ချက်များကို မဖြစ်မနေ လိုက်နာရမည်ဖြစ်ပြီး lint commands သုံး၍ format စစ်ဆေးနိုင်ပါသည်။

### Backend File Naming (Kebab-case)
* **Controllers**: `{name}.controller.ts` (e.g., `applicant.controller.ts`)
* **Services**: `{name}.service.ts` (e.g., `applicant.service.ts`)
* **Modules**: `{name}.module.ts` (e.g., `applicant.module.ts`)
* **Entities**: `{name}.entity.ts` (e.g., `payment-request.entity.ts`)
* **DTOs**: `{action}-{name}.dto.ts` (e.g., `create-payment-request.dto.ts`)
* **Test files**: `{name}.spec.ts` (e.g., `applicant.service.spec.ts`)

### Frontend File Naming
* **React Components & Pages (PascalCase)**: `{Name}.tsx` (e.g., `ApplicantDashboard.tsx`, `ReceiptUploader.tsx`)
* **Custom Hooks (Kebab-case)**: `use-{action}.ts` (e.g., `use-payment-form.ts`)
* **Utility functions (Kebab-case)**: `{action}.ts` (e.g., `calculate-total.ts`)
* **Test files**: `{name}.spec.tsx` သို့မဟုတ် `{name}.spec.ts`
