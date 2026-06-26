# Feature Specification: Global Header with Language Switcher for Admin Panel

**Created**: 2026-06-26

**Status**: Draft

**Input**: User description: "add global header with language switch in admin panel. you can use share components."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Language Switcher in Admin Panel Header (Priority: P1)

As an administrator, I want to switch the application language from the admin panel header, so that I can change the UI language without leaving the admin section — consistent with how other panels (applicant, manager, approver, accounting) work.

**Why this priority**: This is the core request — the admin panel currently lacks a header with language switcher, which is inconsistent with all other panels in the application.

**Independent Test**: Can be fully tested by navigating to any admin screen, clicking the language switcher in the header, selecting a different language, and verifying the UI text updates across all admin screens.

**Acceptance Scenarios**:

1. **Given** I am on any admin screen, **When** I look at the top of the page, **Then** I can see a global header bar with a language switcher
2. **Given** I am on the admin panel, **When** I click the language switcher and select a different language, **Then** all admin screen text updates to the selected language
3. **Given** I am on the admin panel and switch language, **When** I navigate to a different admin screen, **Then** the language selection persists
4. **Given** I am on the admin panel and switch language, **When** I navigate to a non-admin panel, **Then** the language selection persists across the entire application

---

### Edge Cases

- What happens if the language switcher is clicked while the page is loading? The switcher should be interactive immediately.
- What happens on mobile viewports? The header should be responsive and the language switcher should remain accessible.
- What happens if the admin sidebar is collapsed/expanded? The header should remain visible and properly positioned.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Admin panel MUST display a global header bar at the top of the main content area
- **FR-002**: The header MUST include a language switcher component
- **FR-003**: The language switcher MUST use the shared LanguageSwitcher component (no custom implementation)
- **FR-004**: The header MUST use the same visual styling as the non-admin panel header (same height, background, border, sticky positioning) but contain only the LanguageSwitcher (no notification bell or hamburger menu)
- **FR-005**: Language selection MUST persist across all admin and non-admin screens (shared application state)
- **FR-006**: The header MUST be responsive and remain accessible on mobile viewports
- **FR-007**: The header MUST NOT interfere with the existing admin sidebar layout

### Key Entities

- **Admin Panel Header**: A horizontal bar at the top of the admin main content area containing the language switcher
- **LanguageSwitcher (Shared Component)**: Existing shared component that provides language selection (en/ja/my)
- **AdminDashboardShell**: The existing admin panel layout shell that will be modified to include the header

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Administrators can switch language from the admin panel without navigating to a different section
- **SC-002**: The admin panel header matches the visual style of non-admin panel headers
- **SC-003**: Language selection is consistent across all panels (admin and non-admin)

## Clarifications

### Session 2026-06-26

- Q: Should admin header include notification bell for visual consistency with non-admin Header? → A: LanguageSwitcher only (notification bell out of scope, no notification data available in admin context)

## Assumptions

- The shared LanguageSwitcher component requires no props and manages its own state via react-i18next
- The admin panel will NOT adopt the full DashboardLayout (which includes Sidebar, Header, Footer) — instead, a minimal header with LanguageSwitcher will be added to the existing AdminDashboardShell
- The existing admin sidebar and layout structure remain unchanged
- The header will be positioned at the top of the main content area, below the sidebar
- Notification bell is out of scope for this feature (language switcher only)
