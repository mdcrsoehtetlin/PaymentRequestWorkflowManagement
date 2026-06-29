# Feature Specification: Admin Screen i18n Integration

**Feature Branch**: `010-admin-i18n-integration`

**Created**: 2026-06-26

**Status**: Draft

**Input**: User description: "in admin screens, i want to change display language when i switch language. use locale file for language display. only update admin code files, no shared component changes."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Switch Admin Screen Language (Priority: P1)

As an admin user, I want to switch the display language of all admin screens (User Management, Master Data, Audit Logs) using the LanguageSwitcher in the global header, so that I can read and interact with the system in my preferred language (English, Japanese, or Myanmar).

**Why this priority**: This is the core functionality — without it, the locale files we created are unused and the LanguageSwitcher has no effect on admin screens.

**Independent Test**: Can be fully tested by navigating to any admin screen, clicking the LanguageSwitcher, and selecting a different language. All text on the page should update immediately without page reload.

**Acceptance Scenarios**:

1. **Given** I am on the Admin User Management screen with language set to English, **When** I switch language to Japanese via the LanguageSwitcher, **Then** all visible text (page title, column headers, button labels, filter labels, status badges, empty states) updates to Japanese immediately.
2. **Given** I am on the Admin Master Data screen with language set to Japanese, **When** I switch language to Myanmar, **Then** all visible text (page title, category tabs, empty state message) updates to Myanmar immediately.
3. **Given** I am on the Admin Audit Logs screen with language set to Myanmar, **When** I switch language to English, **Then** all visible text (page title, filter labels, column headers, action badges, buttons) updates to English immediately.
4. **Given** I switch language on any admin screen, **When** I navigate to a different admin screen, **Then** the new screen also displays in the selected language.

---

### User Story 2 - Admin Sidebar Language Updates (Priority: P2)

As an admin user, I want the admin sidebar navigation labels (User Management, Master Data, Audit Logs) to update when I switch language, so that the entire admin panel is consistent in my chosen language.

**Why this priority**: The sidebar is part of the admin shell and must stay in sync with the screen content.

**Independent Test**: Can be tested by switching language and verifying the sidebar menu labels update.

**Acceptance Scenarios**:

1. **Given** I am on any admin screen, **When** I switch language to Japanese, **Then** the sidebar labels change to "ユーザー管理", "マスターデータ", "監査ログ".
2. **Given** I am on any admin screen, **When** I switch language to English, **Then** the sidebar labels change to "User Management", "Master Data", "Audit Logs".

---

### User Story 3 - Admin Dashboard Shell Language (Priority: P3)

As an admin user, I want the admin dashboard shell (header area) to display any text elements in the selected language.

**Why this priority**: The shell is the container for all admin screens and should be consistent.

**Independent Test**: Can be tested by verifying the header and any shell-level text update on language switch.

**Acceptance Scenarios**:

1. **Given** I am on any admin screen, **When** I switch language, **Then** any text rendered by the AdminDashboardShell updates to the selected language.

---

### Edge Cases

- What happens when a translation key is missing for the selected language? The system should fall back to English (the default locale).
- What happens when the user refreshes the page after switching language? The selected language should persist (handled by i18next's language detection/storage).
- What happens when a new admin screen is added in the future? It should follow the same i18n pattern using the existing locale file structure.

## Clarifications

### Session 2026-06-26

- Q: Should admin sidebar translation be included or excluded from scope? → A: Include sidebar translation — modify Sidebar.tsx shared component to add `useTranslation()` for admin menu labels.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: All admin screen components (UserManagementWorkspace, MasterDataWorkspace, AuditLogWorkspace, MetadataDetailPanel, UserFormModal) MUST use `useTranslation()` hook from `react-i18next` to display text.
- **FR-002**: All hardcoded user-facing strings in admin screen components MUST be replaced with translation function calls using keys from the locale files (`en.json`, `ja.json`, `my.json`).
- **FR-003**: The AdminDashboardShell sidebar labels MUST use translation keys from `admin.sidebar.*` in the locale files.
- **FR-004**: Translation keys MUST follow the existing namespace structure: `admin.user_management.*`, `admin.master_data.*`, `admin.audit_log.*`, `admin.metadata_detail.*`, `admin.user_form.*`.
- **FR-005**: When a translation key is missing for the current language, the system MUST fall back to the English translation.
- **FR-006**: The LanguageSwitcher component (already existing in shared layer) MUST continue to work without modification — admin screens should react to language changes via i18next's built-in reactivity.
- **FR-007**: No shared component files (`frontend/src/components/shared/*`) or locale files (`frontend/src/locales/*`) MUST be modified, EXCEPT `frontend/src/components/layout/Sidebar.tsx` for admin menu label translation only (approved via Clarification Q1, Session 2026-06-26).
- **FR-008**: All admin screens MUST display correctly in all three supported languages: English, Japanese, and Myanmar.
- **FR-009**: Dynamic values (e.g., counts, dates, user input) MUST NOT be hardcoded in locale files — they should be passed as interpolation parameters to translation functions.
- **FR-010**: Filter dropdown options (e.g., role options, status options, action type options) MUST use translation keys for their labels.

### Key Entities

- **Locale Files** (`en.json`, `ja.json`, `my.json`): Contain all translation strings organized by namespace. Already created with 609 keys each covering all admin screens.
- **react-i18next**: The i18n framework already configured in the project. Provides `useTranslation()` hook and `t()` function for component-level translation.
- **LanguageSwitcher**: Shared component that allows users to switch between English, Japanese, and Myanmar. Already functional.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of user-facing text in admin screens is rendered via translation functions (zero hardcoded strings remaining).
- **SC-002**: Language switching on any admin screen updates all visible text within 100ms (instant re-render).
- **SC-003**: All three languages (English, Japanese, Myanmar) display correctly across all admin screens without layout breaking or text overflow.
- **SC-004**: Page refresh after language switch preserves the selected language.
- **SC-005**: Navigation between admin screens maintains the selected language consistency.

## Assumptions

- The `react-i18next` library is already configured and functional in the project (the LanguageSwitcher already works for non-admin screens).
- The locale files (`en.json`, `ja.json`, `my.json`) already contain all necessary translation keys for admin screens (609 keys each, verified matching).
- The LanguageSwitcher shared component will NOT be modified — it already handles language switching correctly.
- The scope includes admin screen code files (`frontend/src/pages/admin/`) AND the shared Sidebar component (`frontend/src/components/layout/Sidebar.tsx`) for admin menu label translation only.
- i18next's language detection and persistence (localStorage) is already configured.
