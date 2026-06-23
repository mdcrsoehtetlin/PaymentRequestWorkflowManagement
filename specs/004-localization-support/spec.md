# Feature Specification: I18n Expansion — Full Application Localization

**Feature Branch**: `004-localization-support`

**Created**: 2026-06-22

**Status**: Draft

**Input**: User description: "change application language to english. also include status and role and message."

## User Scenarios & Testing

### User Story 1 — Switch Application Language via Dropdown (Priority: P1)

An admin or staff user wants to view the application in English instead of Japanese. They open the language switcher dropdown in the header, select "English", and the entire UI — including sidebar labels, dashboard text, table headers, pagination, status badges, role labels, approval timelines, form labels, validation messages, error toasts, and modal dialogs — immediately updates to English without a page reload.

**Why this priority**: The core ask — "change application language to English" — must be fully functional before adding specific content types.

**Independent Test**: Navigate to any page, switch language from Japanese to English via the header dropdown, and verify all visible strings display in English.

**Acceptance Scenarios**:

1. **Given** the application is displaying in Japanese, **When** the user selects "English" from the language switcher, **Then** all UI text re-renders in English within the same session
2. **Given** a user has switched to English, **When** they refresh the page or navigate to a new route, **Then** the English language preference persists for the session
3. **Given** the user selects "日本語" from the language switcher, **Then** all UI text returns to Japanese
4. **Given** the user switches language, **When** a toast notification or confirm dialog appears, **Then** its text uses the currently selected language

---

### User Story 2 — Status Labels Display in Selected Language (Priority: P1)

A manager viewing a payment request needs to understand its current status. The status badge (e.g., "Manager Reviewing", "Approved", "Paid") must display in the user's selected language, not just Japanese.

**Why this priority**: Status is the most critical data field across all pages — every workspace displays status badges.

**Independent Test**: Switch language to English, navigate to any payment request list, and verify that all status badges show English labels.

**Acceptance Scenarios**:

1. **Given** the language is set to English, **When** a payment request status badge renders, **Then** its label is the English translation (e.g., "Submitted (Manager)" not "申請済（管理者）")
2. **Given** the language is set to Japanese, **When** the same badge renders, **Then** its label is the Japanese translation
3. **Given** a new payment request status is added in the future, **When** a translation key is missing, **Then** the system falls back to the English key name gracefully

---

### User Story 3 — Role Labels Display in Selected Language (Priority: P2)

An admin viewing the user management table needs to see role names (e.g., "Applicant", "Manager", "Approver", "Accounting", "Admin") in the selected language.

**Why this priority**: Role labels appear in user management and audit logs — visible to admins who frequently switch language.

**Independent Test**: Switch to English, open User Management workspace, and verify all role badges show English labels.

**Acceptance Scenarios**:

1. **Given** the language is set to English, **When** a user's role badge renders in the user table, **Then** the label displays in English
2. **Given** the language is Japanese, **When** the same row renders, **Then** the role label displays in Japanese

---

### User Story 4 — Action and Message Labels Display in Selected Language (Priority: P2)

A user viewing an approval timeline or receiving a toast notification needs to see action descriptions (e.g., "Submitted", "Approved", "Rejected") and messages (e.g., "Payment request approved successfully") in the selected language.

**Why this priority**: Action labels and messages are critical for understanding workflow progression and system feedback.

**Independent Test**: Switch to English, open a payment request detail page, and verify the approval timeline and any toast/error messages display in English.

**Acceptance Scenarios**:

1. **Given** the language is English, **When** the approval timeline renders, **Then** each action label ("Submitted to Manager", "Manager Verified", etc.) displays in English
2. **Given** the language is English, **When** a success or error toast appears, **Then** the message text is in English
3. **Given** the language is English, **When** a confirmation dialog appears (e.g., "Are you sure you want to reject?"), **Then** its button labels and body text are in English
4. **Given** any validation error occurs, **When** the form displays a validation message, **Then** the message uses the selected language

---

### Edge Cases

- What happens when the user switches language while a modal/dialog is open? (Dialog re-renders with new language text immediately)
- What happens when a translation key is missing for the selected language? (Fall back to English key, log a warning)
- What happens to dynamically generated server-side error messages? (Only client-side strings are translated; server errors shown in their original language unless the backend also supports localization)
- How are enums with numeric IDs (statusId, roleId) mapped to translated labels? (Use a mapping function that reads from locale files based on the enum ID)
- What happens to dates, times, and currency formatting? (Use locale-aware formatting via browser's Intl API)

## Requirements

### Functional Requirements

- **FR-001**: The language switcher component MUST immediately update all visible UI text when a new language is selected, without requiring a page reload
- **FR-002**: All hardcoded Japanese strings in the `DataTable` component (pagination: "表示中", "件", "全", "前へ", "次へ"; empty: "データがありません") MUST be replaced with `t()` calls referencing locale keys
- **FR-003**: All hardcoded Japanese strings in the `StatusBadge` component MUST be replaced with `t()` calls; status labels MUST be loaded from locale files keyed by `statusId`
- **FR-004**: All hardcoded Japanese strings in the `ApprovalTimeline` component MUST be replaced with `t()` calls; action labels MUST be loaded from locale files keyed by `actionTypeId`
- **FR-005**: All hardcoded Japanese strings in `RoleBadge` or any role label display MUST be replaced with `t()` calls keyed by `roleId` or `roleCode`
- **FR-006**: The locale files (`en.json`, `ja.json`, `my.json`) MUST be expanded to include translation keys for: status labels (10 statuses), role labels (5 roles), action labels (10 actions), payment type labels (4 types), payment method labels (3 methods), DataTable text, confirm dialog text, toast/notification text, form field labels, validation messages, page titles, and error messages
- **FR-007**: The application MUST persist the selected language preference across page navigations within the same session (via i18next's default features)
- **FR-008**: All enum-based display labels (status, role, action, payment type, payment method) MUST use a consistent pattern — a helper function or React component that accepts the enum ID and returns the localized label from the current locale
- **FR-009**: Toast notification messages, success/error action responses, and confirm dialog body text MUST use localized strings via `t()`

### Key Entities

- **Locale Files**: `frontend/src/locales/{en,ja,my}.json` — translation JSON files for each supported language
- **i18n Configuration**: `frontend/src/i18n.ts` — i18next initialization (already exists, minor updates may be needed)
- **LanguageSwitcher Component**: `frontend/src/components/shared/LanguageSwitcher.tsx` — existing component for switching languages
- **Enum-to-Label Mapping**: New shared utility to replace existing `STATUS_LABELS_JP`, `ROLE_LABELS_JP`, `ACTION_LABELS_JP`, etc. with locale-driven lookups
- **PaymentStatus Enum**: 10 status values used across the app — keyed by ID in locale files
- **UserRole Enum**: 5 role values — keyed by ID or code in locale files
- **ApprovalActionType Enum**: 10 action types — keyed by ID in locale files
- **PaymentType Enum**: 4 payment types — keyed by ID in locale files
- **PaymentMethod Enum**: 3 payment methods — keyed by ID in locale files

## Success Criteria

### Measurable Outcomes

- **SC-001**: User can switch the entire application UI language with a single click from the header dropdown; all visible strings update within the same render cycle
- **SC-002**: At least 90% of user-visible strings in the application are driven by locale files (not hardcoded) after the feature is complete
- **SC-003**: Three languages (English, Japanese, Myanmar) are fully supported for all translated strings; missing keys gracefully fall back to English
- **SC-004**: Status labels for all 10 payment statuses display correctly in the selected language
- **SC-005**: Role labels for all 5 user roles display correctly in the selected language
- **SC-006**: All 10 approval action labels display correctly in the selected language in the approval timeline component
- **SC-007**: No existing locale keys (sidebar, dashboard) are broken or removed

## Out of Scope

- Server-side localization (backend error messages returned in their original language only)
- Dynamic language detection based on browser preferences
- Adding new languages beyond the existing three (English, Japanese, Myanmar)
- Translation of user-generated content (comments, payment request descriptions)
- Date/time/number formatting changes (may use Intl API but not a focus of this spec)
- RTL layout support

## Assumptions

- The existing i18next + react-i18next setup can handle the additional translation keys without performance degradation
- Enum IDs (statusId, roleId, actionTypeId, etc.) are stable and will not change during this feature's development
- Translation keys follow a consistent naming convention (e.g., `status.1`, `status.2`, or `status.draft`, `status.submitted_manager`)
- The existing three locale files will be extended with new keys; no new locale files need to be created
- Missing translation keys will fall back to English as configured in i18next's fallback language
