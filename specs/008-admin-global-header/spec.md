# Feature Specification: Admin Global Header with Language Switch

**Feature Branch**: `008-admin-global-header`

**Created**: 2026-06-25

**Status**: Draft

**Input**: User description: "i want to add global header with language switch. you can use share component. admin panel need only language switch."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Language Switch in Admin Panel (Priority: P1)

As an admin user, I want to switch the interface language from the admin panel so that I can view the application in my preferred language (English, Japanese, or Myanmar) without leaving the admin section.

**Why this priority**: The admin panel currently has no language switching capability — all labels are hardcoded in Japanese. This is the core deliverable.

**Independent Test**: Navigate to any admin screen, click the language switcher in the header, select a different language, and verify all visible labels update immediately.

**Acceptance Scenarios**:

1. **Given** the admin panel is displayed, **When** the user views the top of the page, **Then** a header bar is visible containing a language switcher component.
2. **Given** the admin panel header is visible, **When** the user clicks the language switcher, **Then** a dropdown appears with English, Japanese, and Myanmar options.
3. **Given** the language dropdown is open, **When** the user selects a different language, **Then** the interface language updates immediately and the dropdown closes.
4. **Given** the user has switched language in the admin panel, **When** the user navigates between admin sub-pages (Users, Master Data, Audit Logs), **Then** the selected language persists across all admin screens.

---

### User Story 2 - Consistent Header Across All Panels (Priority: P2)

As a user, I want a consistent header experience across all application panels (applicant, manager, approver, accounting, admin) so that the language switcher is always accessible regardless of which section I am in.

**Why this priority**: The non-admin panels already have a header with language switcher via DashboardLayout. This story ensures the admin panel matches that pattern, providing a unified experience.

**Independent Test**: Navigate between different role panels and verify the header with language switcher appears consistently in all sections.

**Acceptance Scenarios**:

1. **Given** the user is on any application panel, **When** they look at the top of the page, **Then** a header bar with language switcher is visible.
2. **Given** the user switches language in one panel, **When** they navigate to a different panel, **Then** the language selection persists (shared i18n state).

---

### Edge Cases

- What happens when the admin sidebar is collapsed on mobile? The header with language switcher should remain visible at the top.
- What happens when the language is switched while data is loading? The loaded data labels (table headers, buttons, badges) should update immediately; loading spinners are language-agnostic.
- What happens if the i18n translation key is missing for the admin section? The system should fall back to English (the configured default language).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a minimal header bar at the top of the admin panel containing only the language switcher — no title, branding, notification bell, or other elements.
- **FR-002**: The language switcher MUST use the existing shared `LanguageSwitcher` component (supports en, ja, my).
- **FR-003**: The header MUST be visible on all admin sub-pages (User Management, Master Data, Audit Logs).
- **FR-004**: The header MUST persist the selected language across admin sub-page navigation.
- **FR-005**: The header MUST be responsive — visible on both desktop and mobile viewports.
- **FR-006**: The header MUST follow the existing design system styling (consistent with the header used in non-admin panels).

### Key Entities

- **Language Preference**: The currently selected language code (en, ja, my). Managed by i18n shared state — no new persistence mechanism needed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admin users can switch language in under 2 seconds (click to interface update).
- **SC-002**: Language switcher is accessible from every admin screen without navigation.
- **SC-003**: All three supported languages (en, ja, my) are selectable and functional in the admin panel.

## Assumptions

- The existing shared `LanguageSwitcher` component will be reused — no new language switcher component needed.
- The existing `Header` component from `components/layout/Header.tsx` includes the `LanguageSwitcher` and can be reused or its pattern followed.
- The admin panel header does not need notification bell or hamburger menu — only the language switcher is required per user request.
- The i18n infrastructure (i18next + react-i18next) is already configured and functional.
- Admin sidebar labels (currently hardcoded in Japanese) are out of scope for this feature — only the header language switch is requested.

## Clarifications

### Session 2026-06-25

- Q: Should the admin header include an app title/branding alongside the language switcher? → A: Minimal bar — only language switcher, no title or branding. Matches user's explicit request and keeps admin layout clean.
