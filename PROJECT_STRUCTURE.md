# Project Architecture and Directory Structure (ပရောဂျက် တည်ဆောက်ပုံ လမ်းညွှန်)

## 1. Visual Directory Tree (ဖိုဒါ တည်ဆောက်ပုံ)

အောက်ဖော်ပြပါ ASCII tree သည် ပရောဂျက်၏ အဓိက ဖိုဒါ တည်ဆောက်ပုံ (high-level folder structure) ကို ပြသထားခြင်း ဖြစ်သည်။

```text
PaymentRequestWorkflowManagement/ (Root)
├── docs/                                                # Specification နှင့် system specifications များ
│   ├── core_ja/                                  # ဂျပန်ဘာသာဖြင့် ရေးသားထားသော functional spec နှင့် rules များ
│   │   ├── 01_要件定義書_REQUIREMENT_SPEC.md
│   │   ├── 02_開発ルール_DEVELOPMENT_RULES.md
│   │   ├── 03_データベース設計書_DATABASE_SPEC.md
│   │   └── payment_request_db_backup.sql
│   ├── guides/
│   │   ├── AUTOMATED_ENV_SETUP.md
│   │   └── ENVIRONMENT_SETUP_GUIDE.md
│   ├── screens/                                  # Screen design specs များ
│   │   ├── 01_applicant_dashboard/
│   │   │   ├── 04_機能設計書_FUNCTIONAL_SPEC.md
│   │   │   ├── 05_画面項目設計書_SCREEN_ITEMS.md
│   │   │   └── 06_詳細設計書_DETAIL_DESIGN.md
│   │   ├── 02_manager_dashboard/
│   │   │   ├── 04_機能設計書_FUNCTIONAL_SPEC.md
│   │   │   ├── 05_画面項目設計書_SCREEN_ITEMS.md
│   │   │   └── 06_詳細設計書_DETAIL_DESIGN.md
│   │   ├── 03_approver_dashboard/
│   │   │   ├── 04_機能設計書_FUNCTIONAL_SPEC.md
│   │   │   ├── 05_画面項目設計書_SCREEN_ITEMS.md
│   │   │   └── 06_詳細設計書_DETAIL_DESIGN.md
│   │   ├── 04_accounting_dashboard/
│   │   │   ├── 04_機能設計書_FUNCTIONAL_SPEC.md
│   │   │   ├── 05_画面項目設計書_SCREEN_ITEMS.md
│   │   │   └── 06_詳細設計書_DETAIL_DESIGN.md
│   │   └── 05_admin_panel/
│   │       ├── 04_機能設計書_FUNCTIONAL_SPEC.md
│   │       ├── 05_画面項目設計書_SCREEN_ITEMS.md
│   │       └── 06_詳細設計書_DETAIL_DESIGN.md
│   └── template/
│       └── FUNCTIONAL_SPECIFICATION_TEMPLATE.md
├── frontend/                                        # React + Vite Frontend Application
│   ├── public/                                    # Static assets (images, icons)
│   │   ├── favicon.svg
│   │   └── icons.svg
│   ├── src/
│   │   ├── assets/                            # CSS, logo နှင့် images များ
│   │   │   ├── hero.png
│   │   │   ├── react.svg
│   │   │   └── vite.svg
│   │   ├── pages/                              # Role-specific dashboard screen controllers များ
│   │   │   ├── accounting/
│   │   │   ├── admin/
│   │   │   ├── applicant/
│   │   │   ├── approver/
│   │   │   └── manager/
│   │   ├── App.tsx                            # Main application component
│   │   ├── index.css                        # Global styling file
│   │   └── main.tsx                          # React bootstrap element entry point
│   ├── .gitignore
│   ├── eslint.config.js
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.js
│   ├── README.md
│   ├── tailwind.config.js
│   ├── tsconfig.app.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
├── redis-local/                                  # Local Redis cache setup
│   └── Memurai/
│       ├── libcrypto-3-x64.dll
│       ├── libssl-3-x64.dll
│       ├── memurai-services.dll
│       └── memurai.exe
├── src/                                                  # NestJS Backend Application Source Code
│   ├── config/                                    # Environment variables configuration module
│   │   ├── config.module.ts
│   │   └── configuration.ts
│   ├── database/                                # TypeORM database credentials နှင့် providers
│   │   └── migrations/
│   │       └── README.md
│   ├── modules/                                  # Core business features နှင့် modules များ
│   │   ├── accounting/                    # Accounting payment logic
│   │   │   ├── accounting.controller.ts
│   │   │   ├── accounting.module.ts
│   │   │   └── accounting.service.ts
│   │   ├── admin/                              # Admin console and log configurations
│   │   │   ├── admin.controller.ts
│   │   │   ├── admin.module.ts
│   │   │   └── admin.service.ts
│   │   ├── applicant/                      # Applicant business logic
│   │   │   ├── applicant.controller.ts
│   │   │   ├── applicant.module.ts
│   │   │   └── applicant.service.ts
│   │   ├── approver/                        # Final approver validation logic
│   │   │   ├── approver.controller.ts
│   │   │   ├── approver.module.ts
│   │   │   └── approver.service.ts
│   │   ├── manager/                          # Manager verification process logic
│   │   │   ├── manager.controller.ts
│   │   │   ├── manager.module.ts
│   │   │   └── manager.service.ts
│   │   └── shared/                            # Shared features (Entities နှင့် Gateways)
│   │       ├── entities/                # TypeORM Entity classes (Database models)
│   │       ├── shared.module.ts
│   │       └── websocket.gateway.ts
│   ├── app.controller.spec.ts
│   ├── app.controller.ts                # Global routing entry point controller
│   ├── app.module.ts                        # Main configuration setup for dependencies injection
│   ├── app.service.ts                      # Server health configurations
│   └── main.ts                                    # Application bootstrap entry point
├── test/
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
├── .env                                                  # Environment configuration secrets
├── .gitignore
├── .prettierrc
├── AGENTS.md                                        # DevOps commit workflow automation agent rule
├── eslint.config.mjs
├── nest-cli.json
├── package-lock.json
├── package.json                                  # Package config scripts and dependencies definitions
├── PROJECT_STRUCTURE.md
├── README.md
├── tsconfig.build.json
├── tsconfig.json                                # TypeScript compilation rules compiler configuration
└── typeorm-cli.config.ts
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
