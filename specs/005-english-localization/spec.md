# Feature Specification: English Localization

**Feature Branch**: `feature/005-english-localization`

**Created**: 2026-06-22

**Status**: Draft

**Input**: User description: "change application language to english. now is japanese. for all screen item."

## User Scenarios & Testing

### User Story 1 — All Screen Labels Display in English (Priority: P1)

An admin or regular user finds the current Japanese-only interface difficult to navigate. They log into the application and see all headings, labels, buttons, menu items, table headers, form labels, and page titles in English instead of Japanese.

**Why this priority**: Language accessibility is the core ask — every user on every page is affected.

**Independent Test**: Log into any role dashboard and visually verify that every visible text element uses English.

**Acceptance Scenarios**:

1. **Given** a user logs into the application, **When** the dashboard loads, **Then** all headings, labels, buttons, and menu items display in English
2. **Given** a user views the sidebar navigation, **When** looking at each item, **Then** the labels read in English (e.g., "User Management" not "ユーザー管理")
3. **Given** a user views a payment request form, **When** looking at field labels, **Then** all labels display in English (e.g., "Employee Number" not "社員番号")
4. **Given** a user opens a modal dialog, **When** looking at buttons, **Then** they read in English (e.g., "Confirm" not "確認")

---

### User Story 2 — Status and Action Labels Display in English (Priority: P1)

A user viewing a payment request status badge or approval timeline needs to understand workflow state at a glance. All status labels, action type labels, and role labels display in English.

**Why this priority**: Status labels appear on every page — Applicant, Manager, Approver, Accounting, and Admin dashboards all display status badges.

**Independent Test**: Navigate to any payment request detail page and verify status badge, role badge, and approval timeline all show English text.

**Acceptance Scenarios**:

1. **Given** a user views a payment request, **When** looking at the status badge, **Then** the label is English (e.g., "Draft" not "下書き")
2. **Given** a user views an approval timeline, **When** looking at action labels, **Then** they display in English (e.g., "Submitted" not "提出")
3. **Given** a user views the user management table, **When** looking at role column, **Then** roles display in English (e.g., "Manager" not "担当マネージャー")

---

### User Story 3 — Validation, Toast, and Error Messages in English (Priority: P2)

A user filling out a form or receiving a system notification sees all messages in English.

**Why this priority**: Error messages affect UX quality but are encountered less frequently than static labels.

**Independent Test**: Submit an invalid form and verify the validation error message is in English.

**Acceptance Scenarios**:

1. **Given** a user submits a form with invalid data, **When** the validation error appears, **Then** the message is in English
2. **Given** a user triggers a toast notification, **When** the toast appears, **Then** the message is in English
3. **Given** a user sees an error boundary or system error page, **When** the error text renders, **Then** it displays in English

---

### Edge Cases

- What about backend error messages returned from APIs? (All user-facing backend error messages must also be in English)
- What about pagination labels in DataTable? (Labels like "Previous", "Next", "Total" must be in English)
- What about the LanguageSwitcher component showing "日本語"? (The label for the Japanese language option in the switcher may remain as-is, since it represents the language name)
- What about date formats? (Keep ISO 8601 YYYY-MM-DD format — no Japanese characters in date display)
- What about existing i18n keys like `t('dashboard.title')`? (If the i18n locale files already contain English translations, those should be verified and updated as needed)

## Requirements

### Functional Requirements

- **FR-001**: ALL user-facing text labels across every page and component MUST display in English — no Japanese text should remain visible in the UI
- **FR-002**: Status badge labels (10 payment statuses) MUST display English names (e.g., "Draft", "Submitted to Manager", "Manager Verified", "Approved", "Paid")
- **FR-003**: Action type labels (10 approval actions) MUST display English names (e.g., "Created", "Submitted", "Manager Verified", "Payment Completed")
- **FR-004**: Role labels (5 user roles) MUST display English names (e.g., "Applicant", "Manager", "Approver", "Accounting", "Admin")
- **FR-005**: Validation error messages on forms MUST display in English
- **FR-006**: Toast notification messages and system error messages MUST display in English
- **FR-007**: Navigation sidebar, page titles, table headers, button labels, and filter labels MUST display in English
- **FR-008**: Payment type and payment method labels MUST display English equivalents (e.g., "Bank Transfer" not "銀行振込")
- **FR-009**: DataTable pagination controls MUST display English labels ("Previous", "Next", "Total X items")
- **FR-010**: Modal dialog buttons MUST display English labels ("Confirm", "Cancel", "Save")
- **FR-011**: Error boundary fallback UI MUST display English text

### Key Entities

- **Status Labels**: 10 payment statuses currently defined in `STATUS_LABELS_JP` / `STATUS_LABELS_EN`
- **Action Labels**: 10 approval action types currently defined in `ACTION_LABELS_JP` / `ACTION_LABELS_EN`
- **Role Labels**: 5 user roles currently defined in `ROLE_LABELS_JP` / `ROLE_LABELS_EN`
- **Payment Type Labels**: 4 payment types currently defined in `PAYMENT_TYPE_LABELS_JP` / `PAYMENT_TYPE_LABELS_EN`
- **Payment Method Labels**: 3 payment methods currently defined in `PAYMENT_METHOD_LABELS_JP` / `PAYMENT_METHOD_LABELS_EN`

## Success Criteria

### Measurable Outcomes

- **SC-001**: A full walkthrough of every page and workspace across all 5 roles shows zero Japanese text in the UI
- **SC-002**: Every status badge (10/10), action label (10/10), and role label (5/5) displays English
- **SC-003**: Every validation, toast, and error message encountered during normal use is in English
- **SC-004**: No user-facing Japanese strings remain in the hardcoded constants or JSX components

## Out of Scope

- Adding languages beyond English (no toggle — Japanese is fully replaced)
- Translating server-side logged data (audit log entries, approval log comments stored in the database)
- Translating static documentation files
- RTL layout support
- Date/time/number formatting changes beyond removing Japanese characters

## Assumptions

- Japanese text is currently hardcoded in React JSX, TypeScript constants, and validation messages
- English text will replace Japanese text directly inline — no i18n framework or language toggle will be added
- Backend error messages (service exceptions, guard messages, DTO validation decorators) will also be translated to English — full-stack change
- Date and time formats will remain ISO 8601 YYYY-MM-DD — only Japanese characters are removed
- The existing `*_LABELS_JP` constants will be renamed to `*_LABELS_EN` and their values translated
- Both the frontend (`frontend/src/types/index.ts`) and backend (`src/modules/shared/types/index.ts`) copies of label constants will be updated
